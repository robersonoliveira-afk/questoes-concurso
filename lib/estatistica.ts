// Porta pra TypeScript da mesma lógica do pipeline (pipeline/stats_ch.py),
// agora consultando o banco real em vez de um JSON estático — recalcula a
// cada carregamento, então cresce junto com o que Róberson for classificando.
// Nível TÓPICO, não subtópico (amostra pequena demais pra confiar no
// subtópico); encolhimento Dirichlet; peso por recência.
import { prisma } from './prisma'

const ANO_EDITAL_ALVO = 2027
const MEIA_VIDA_EDICOES = 2.5
const ALPHA_DIRICHLET = 1.0
const Z80 = 1.2816

export type TopicoStat = {
  topicoId: string
  nome: string
  disciplinaId: string
  disciplinaNome: string
  nQuestoesEdital: number
  esperado: number
  ic80Min: number
  ic80Max: number
}

export type ItemPlano = TopicoStat & { dificuldade: number; valor: number; horas: number }

function pesoRecencia(ano: number): number {
  const idadeEmEdicoes = ANO_EDITAL_ALVO - 1 - ano
  return Math.pow(0.5, idadeEmEdicoes / MEIA_VIDA_EDICOES)
}

/** Disciplinas com pelo menos uma classificação válida — só essas entram
 *  nas telas do usuário; o resto ainda não tem banco pra mostrar. */
export async function disciplinasDisponiveis() {
  const classificadas = await prisma.classificacao.findMany({
    where: { foraDoPrograma: false, topicoId: { not: null } },
    select: { topico: { select: { disciplinaId: true } } },
    distinct: ['topicoId'],
  })
  const ids = [...new Set(classificadas.map(c => c.topico?.disciplinaId).filter(Boolean))] as string[]
  if (ids.length === 0) return []
  return prisma.disciplina.findMany({ where: { id: { in: ids } }, orderBy: { id: 'asc' } })
}

export async function calcularEstatisticaTopicos(disciplinaIds: string[]): Promise<TopicoStat[]> {
  if (disciplinaIds.length === 0) return []

  const topicos = await prisma.topico.findMany({
    where: { nivel: 'topico', disciplinaId: { in: disciplinaIds } },
    include: { disciplina: true },
  })

  const classificacoes = await prisma.classificacao.findMany({
    where: { foraDoPrograma: false, topicoId: { not: null }, topico: { disciplinaId: { in: disciplinaIds } } },
    include: { questao: true, topico: true },
  })

  const pesoBrutoPorTopico = new Map<string, number>()
  const pesoTotalPorDisciplina = new Map<string, number>()

  for (const c of classificacoes) {
    if (!c.topico || !c.topicoId) continue
    const tid = c.topico.nivel === 'subtopico' ? c.topico.paiId! : c.topicoId
    const disc = c.topico.disciplinaId
    const w = (c.confianca ?? 0) * pesoRecencia(c.questao.ano)
    pesoBrutoPorTopico.set(tid, (pesoBrutoPorTopico.get(tid) ?? 0) + w)
    pesoTotalPorDisciplina.set(disc, (pesoTotalPorDisciplina.get(disc) ?? 0) + w)
  }

  const porDisciplina = new Map<string, typeof topicos>()
  for (const t of topicos) {
    if (!porDisciplina.has(t.disciplinaId)) porDisciplina.set(t.disciplinaId, [])
    porDisciplina.get(t.disciplinaId)!.push(t)
  }

  const resultado: TopicoStat[] = []
  for (const [discId, ts] of porDisciplina) {
    const k = ts.length
    const nq = ts[0].disciplina.nQuestoes
    const total = pesoTotalPorDisciplina.get(discId) ?? 0
    for (const t of ts) {
      const c = pesoBrutoPorTopico.get(t.id) ?? 0
      const p = (c + ALPHA_DIRICHLET) / (total + ALPHA_DIRICHLET * k)
      const esperado = p * nq
      const variancia = (p * (1 - p)) / (total + ALPHA_DIRICHLET * k + 1)
      const sd = Math.sqrt(Math.max(variancia, 0))
      resultado.push({
        topicoId: t.id,
        nome: t.nome,
        disciplinaId: discId,
        disciplinaNome: t.disciplina.nome,
        nQuestoesEdital: nq,
        esperado,
        ic80Min: Math.max(0, (p - Z80 * sd) * nq),
        ic80Max: Math.min(nq, (p + Z80 * sd) * nq),
      })
    }
  }
  return resultado.sort((a, b) => b.esperado - a.esperado)
}

/** Prioridade = esperado × (1 + α·dificuldade/10). O que o aluno já domina
 *  cai no ranking mesmo valendo muitas questões — é o que diferencia isso
 *  de um "ranking do que mais cai" genérico e igual pra todo mundo. */
export async function calcularPlano(
  userId: string,
  disciplinaIds: string[],
  horasSemana: number
): Promise<ItemPlano[]> {
  const ALPHA_PRIORIDADE = 0.15
  const stats = await calcularEstatisticaTopicos(disciplinaIds)
  if (stats.length === 0) return []

  const progresso = await prisma.progresso.findMany({
    where: { userId, topicoId: { in: stats.map(s => s.topicoId) } },
  })
  const dificuldadePorTopico = new Map(progresso.map(p => [p.topicoId, p.dificuldadeDeclarada]))

  const itens = stats.map(s => {
    const dificuldade = dificuldadePorTopico.get(s.topicoId) ?? 5
    const valor = s.esperado * (1 + ALPHA_PRIORIDADE * dificuldade)
    return { ...s, dificuldade, valor }
  })
  const totalValor = itens.reduce((a, i) => a + i.valor, 0) || 1
  return itens
    .map(i => ({ ...i, horas: horasSemana * (i.valor / totalValor) }))
    .sort((a, b) => b.valor - a.valor)
}

export type QuestaoPratica = {
  id: string
  ano: number
  numero: number
  textoBase: string | null
  enunciado: string
  alternativas: Record<string, string>
  gabarito: string
  figuras: string[]
  topicoId: string
  topicoNome: string
  disciplinaNome: string
  justificativa: string | null
}

/** Fila de prática: só questões com classificação confiável E gabarito
 *  confirmado no PDF (sem isso não dá pra corrigir de verdade), na mesma
 *  ordem de prioridade do plano. */
export async function filaPratica(userId: string, disciplinaIds: string[]): Promise<QuestaoPratica[]> {
  if (disciplinaIds.length === 0) return []

  const plano = await calcularPlano(userId, disciplinaIds, 1)
  const ordemTopico = new Map(plano.map((p, i) => [p.topicoId, i]))

  const questoes = await prisma.questao.findMany({
    where: {
      gabarito: { not: null },
      classificacao: {
        is: {
          foraDoPrograma: false,
          confianca: { gte: 0.6 },
          topico: { disciplinaId: { in: disciplinaIds } },
        },
      },
    },
    include: { classificacao: { include: { topico: { include: { disciplina: true } } } } },
  })

  const comTopico = questoes
    .filter(q => q.classificacao?.topico)
    .map(q => {
      const topico = q.classificacao!.topico!
      const topicoDeRef = topico.nivel === 'subtopico' ? topico.paiId! : topico.id
      return { q, topicoDeRef, topico }
    })

  comTopico.sort((a, b) => {
    const pa = ordemTopico.get(a.topicoDeRef) ?? 999
    const pb = ordemTopico.get(b.topicoDeRef) ?? 999
    return pa !== pb ? pa - pb : b.q.ano - a.q.ano
  })

  return comTopico.map(({ q, topicoDeRef, topico }) => ({
    id: q.id,
    ano: q.ano,
    numero: q.numero,
    textoBase: q.textoBase,
    enunciado: q.enunciado,
    alternativas: q.alternativas as Record<string, string>,
    gabarito: q.gabarito!,
    figuras: q.figuras,
    topicoId: topicoDeRef,
    topicoNome: plano.find(p => p.topicoId === topicoDeRef)?.nome ?? topico.nome,
    disciplinaNome: topico.disciplina.nome,
    justificativa: q.classificacao!.justificativa,
  }))
}
