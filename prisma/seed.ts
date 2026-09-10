// Popula o banco com os dados reais já produzidos pelo pipeline em
// Teste_site_questões/pipeline (taxonomia do edital 2027, as 223 questões
// fatiadas das 6 provas 2020-2026, e as classificações manuais de Ciências
// Humanas, Língua Portuguesa e Ciências da Natureza). Idempotente — usa
// upsert, roda de novo sem duplicar.
//
// npm run db:seed

import { PrismaClient } from '@prisma/client'
import taxonomia from './seed-data/taxonomia.json'
import questoesRaw from './seed-data/questoes.json'
import classifCH from './seed-data/classificacao_ch.json'
import classifLP from './seed-data/classificacao_lp.json'
import classifCN from './seed-data/classificacao_cn.json'

const prisma = new PrismaClient()

type NoTaxonomia = {
  id: string
  nivel: 'topico' | 'subtopico'
  disciplina: string
  disciplina_nome: string
  n_questoes_disciplina: number
  topico: string
  subtopico: string | null
}

type QuestaoRaw = {
  id: string
  prova: string
  ano: number
  numero: number
  enunciado: string
  alternativas: Record<string, string>
  gabarito: string | null
}

type ClassificacaoRaw = {
  questao_id: string
  no_id: string | null
  confianca: number
  fora_do_programa: boolean
  justificativa: string
}

async function main() {
  const EDICAO_VIGENTE = 'POLI.2027'

  console.log('→ Concurso e edição vigente (2027, dona da árvore de tópicos)')
  await prisma.concurso.upsert({
    where: { id: 'POLI' },
    update: {},
    create: { id: 'POLI', nome: 'Politécnico / CTISM — UFSM', instituicao: 'UFSM' },
  })
  await prisma.edicao.upsert({
    where: { id: EDICAO_VIGENTE },
    update: {},
    create: {
      id: EDICAO_VIGENTE,
      concursoId: 'POLI',
      ano: 2027,
      rotulo: 'Ensino Médio 2027',
      vigente: true,
      nQuestoes: 50,
      temPesoPorQuestao: false,
      criterioDesempate: ['LP', 'MAT'],
    },
  })

  console.log('→ Disciplinas e tópicos (a partir do Anexo 3 do edital)')
  const nos = taxonomia.nos as NoTaxonomia[]
  const disciplinasVistas = new Map<string, NoTaxonomia>()
  for (const no of nos) if (!disciplinasVistas.has(no.disciplina)) disciplinasVistas.set(no.disciplina, no)

  for (const [sigla, no] of disciplinasVistas) {
    await prisma.disciplina.upsert({
      where: { id: sigla },
      update: {},
      create: {
        id: sigla,
        edicaoId: EDICAO_VIGENTE,
        nome: no.disciplina_nome,
        nQuestoes: no.n_questoes_disciplina,
      },
    })
  }

  // primeiro os tópicos (sem pai), depois os subtópicos (paiId aponta pro tópico)
  const topicos = nos.filter(n => n.nivel === 'topico')
  const subtopicos = nos.filter(n => n.nivel === 'subtopico')
  for (const t of topicos) {
    await prisma.topico.upsert({
      where: { id: t.id },
      update: {},
      create: { id: t.id, disciplinaId: t.disciplina, nome: t.topico, nivel: 'topico', paiId: null },
    })
  }
  for (const s of subtopicos) {
    const paiId = s.id.split('.').slice(0, 2).join('.')
    await prisma.topico.upsert({
      where: { id: s.id },
      update: {},
      create: { id: s.id, disciplinaId: s.disciplina, nome: s.subtopico!, nivel: 'subtopico', paiId },
    })
  }
  console.log(`   ${topicos.length} tópicos, ${subtopicos.length} subtópicos`)

  console.log('→ Edições históricas + questões das 6 provas')
  const questoes = questoesRaw as QuestaoRaw[]
  const anos = [...new Set(questoes.map(q => q.ano))].sort()
  for (const ano of anos) {
    const edicaoId = `POLI.${ano}`
    await prisma.edicao.upsert({
      where: { id: edicaoId },
      update: {},
      create: { id: edicaoId, concursoId: 'POLI', ano, nQuestoes: 50, vigente: false },
    })
  }
  for (const q of questoes) {
    // update com os mesmos campos: re-rodar o seed propaga gabarito/enunciado
    // novos do fatiador pras questões que já existem no banco.
    const dados = {
      edicaoId: `POLI.${q.ano}`,
      ano: q.ano,
      numero: q.numero,
      enunciado: q.enunciado,
      alternativas: q.alternativas,
      gabarito: q.gabarito,
      arquivoOrigem: q.prova,
    }
    await prisma.questao.upsert({
      where: { id: q.id },
      update: dados,
      create: { id: q.id, ...dados },
    })
  }
  console.log(`   ${questoes.length} questões em ${anos.length} edições (${anos.join(', ')})`)

  console.log('→ Classificação manual (Humanas + Língua Portuguesa + Ciências da Natureza)')
  const classif = [...classifCH, ...classifLP, ...classifCN] as ClassificacaoRaw[]
  for (const c of classif) {
    await prisma.classificacao.upsert({
      where: { questaoId: c.questao_id },
      update: {},
      create: {
        questaoId: c.questao_id,
        topicoId: c.no_id,
        confianca: c.confianca,
        foraDoPrograma: c.fora_do_programa,
        justificativa: c.justificativa,
        origem: 'manual',
      },
    })
  }
  console.log(`   ${classif.length} classificações`)

  console.log('\nSeed concluído.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
