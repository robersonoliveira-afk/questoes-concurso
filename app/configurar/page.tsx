import { prisma } from '@/lib/prisma'
import { getUserId, garantirUsuario } from '@/lib/session'
import { calcularEstatisticaTopicos } from '@/lib/estatistica'
import DificuldadeSelector from '@/components/DificuldadeSelector'
import TempoSemanal from '@/components/TempoSemanal'

export const dynamic = 'force-dynamic'

function fmt1(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1).replace('.', ',')
}

export default async function Configurar() {
  const userId = await getUserId()
  await garantirUsuario(userId)

  const disciplinas = await prisma.disciplina.findMany({
    where: { topicos: { some: {} } },
    orderBy: { id: 'asc' },
  })
  const discIds = disciplinas.map(d => d.id)
  const stats = await calcularEstatisticaTopicos(discIds)
  const usuario = await prisma.user.findUnique({ where: { id: userId } })
  const progresso = await prisma.progresso.findMany({ where: { userId } })
  const dificuldadePorTopico = new Map(progresso.map(p => [p.topicoId, p.dificuldadeDeclarada]))

  const porDisciplina = new Map<string, typeof stats>()
  for (const s of stats) {
    if (!porDisciplina.has(s.disciplinaId)) porDisciplina.set(s.disciplinaId, [])
    porDisciplina.get(s.disciplinaId)!.push(s)
  }

  return (
    <div className="pb-6">
      <p className="font-mono text-xs uppercase tracking-widest text-inkfaint">Antes de começar</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Como você tá em cada assunto?</h1>
      <p className="mt-2 max-w-md text-sm text-inksoft">
        1 é "não sei nada", 10 é "manjo muito". Isso não trava nada — dá só o ponto de partida, a
        gente ajusta sozinho conforme você vai respondendo questões.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-surface px-5 py-4">
        <p className="mb-2 text-sm font-medium text-ink">Quanto tempo por semana você tem?</p>
        <TempoSemanal valorInicial={usuario?.horasSemana ?? 3} />
      </div>

      {[...porDisciplina.entries()].length === 0 ? (
        <p className="mt-8 text-sm text-inksoft">Ainda não tem tópico classificado pra ajustar.</p>
      ) : (
        [...porDisciplina.entries()].map(([discId, topicos]) => {
          const disc = disciplinas.find(d => d.id === discId)
          return (
            <section key={discId} className="mt-8">
              <h2 className="mb-3 font-display text-base font-semibold text-ink">{disc?.nome}</h2>
              <div className="flex flex-col gap-4">
                {topicos.map(t => (
                  <div key={t.topicoId} className="rounded-xl border border-line bg-surface px-4 py-3.5">
                    <div className="mb-2.5 flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-ink">{t.nome}</p>
                      <span className="whitespace-nowrap font-mono text-[11px] text-inkfaint">
                        ~{fmt1(t.esperado)} questões
                      </span>
                    </div>
                    <DificuldadeSelector
                      topicoId={t.topicoId}
                      valorInicial={dificuldadePorTopico.get(t.topicoId) ?? 5}
                    />
                  </div>
                ))}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
