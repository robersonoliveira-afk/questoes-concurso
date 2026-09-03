import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function carregarDados() {
  try {
    const disciplinas = await prisma.disciplina.findMany({
      include: { _count: { select: { topicos: true } } },
      orderBy: { id: 'asc' },
    })
    const totalQuestoes = await prisma.questao.count()
    const totalClassificadas = await prisma.classificacao.count()
    return { ok: true as const, disciplinas, totalQuestoes, totalClassificadas }
  } catch (e) {
    // banco ainda não conectado (Supabase não configurado, ou schema não populado) —
    // a página sobe do mesmo jeito em vez de derrubar o deploy inteiro. Loga o motivo
    // real nos logs do servidor (nunca na tela) — sem isso não dá pra diagnosticar de
    // fora. Tira qualquer trecho "usuário:senha@" antes de logar, por segurança.
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[carregarDados] falha ao consultar o banco:', msg.replace(/:\/\/[^@]+@/, '://***:***@'))
    return { ok: false as const }
  }
}

export default async function Home() {
  const dados = await carregarDados()

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-gray-400">protótipo</p>
      <h1 className="mt-1 text-3xl font-semibold">Questões Concurso</h1>

      {!dados.ok ? (
        <div className="mt-6 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          App no ar, banco ainda não conectado. Defina <code className="font-mono">DATABASE_URL</code> e{' '}
          <code className="font-mono">DIRECT_URL</code> e rode <code className="font-mono">npm run db:push && npm run db:seed</code>.
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-gray-500">
            Banco lido direto do Supabase — {dados.totalQuestoes} questões, {dados.totalClassificadas} classificadas.
          </p>
          <ul className="mt-8 divide-y divide-gray-200 rounded border border-gray-200">
            {dados.disciplinas.map(d => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-medium">{d.nome}</span>
                <span className="font-mono text-gray-400">
                  {d.nQuestoes} questões · {d._count.topicos} tópicos
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
