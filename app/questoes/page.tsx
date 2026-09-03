import { prisma } from '@/lib/prisma'
import QuestaoCard from '@/components/QuestaoCard'

export const dynamic = 'force-dynamic'

export default async function Questoes() {
  const questoes = await prisma.questao.findMany({
    where: { classificacao: { is: { foraDoPrograma: false, topicoId: { not: null } } } },
    include: { classificacao: { include: { topico: { include: { disciplina: true } } } } },
    orderBy: [{ ano: 'desc' }, { numero: 'asc' }],
  })

  return (
    <div className="pb-6">
      <p className="font-mono text-xs uppercase tracking-widest text-inkfaint">Banco</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{questoes.length} questões</h1>
      <p className="mt-2 max-w-md text-sm text-inksoft">
        Todas já classificadas contra o edital. Toca pra abrir e ver a resposta.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {questoes.map(q => {
          const topico = q.classificacao?.topico
          const caminho = topico
            ? `${topico.disciplina.nome} › ${topico.nivel === 'subtopico' ? '… › ' : ''}${topico.nome}`
            : 'sem classificação'
          return (
            <QuestaoCard
              key={q.id}
              ano={q.ano}
              numero={q.numero}
              enunciado={q.enunciado}
              alternativas={q.alternativas as Record<string, string>}
              gabarito={q.gabarito}
              caminho={caminho}
            />
          )
        })}
      </div>
    </div>
  )
}
