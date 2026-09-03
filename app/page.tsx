import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const disciplinas = await prisma.disciplina.findMany({
    include: { _count: { select: { topicos: true } } },
    orderBy: { id: 'asc' },
  })
  const totalQuestoes = await prisma.questao.count()
  const totalClassificadas = await prisma.classificacao.count()

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-gray-400">protótipo</p>
      <h1 className="mt-1 text-3xl font-semibold">Questões Concurso</h1>
      <p className="mt-2 text-sm text-gray-500">
        Banco lido direto do Supabase — {totalQuestoes} questões, {totalClassificadas} classificadas.
      </p>

      <ul className="mt-8 divide-y divide-gray-200 rounded border border-gray-200">
        {disciplinas.map(d => (
          <li key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-medium">{d.nome}</span>
            <span className="font-mono text-gray-400">
              {d.nQuestoes} questões · {d._count.topicos} tópicos
            </span>
          </li>
        ))}
      </ul>
    </main>
  )
}
