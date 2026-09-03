import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/session'
import { disciplinasDisponiveis, calcularPlano } from '@/lib/estatistica'

export const dynamic = 'force-dynamic'

async function carregar() {
  try {
    const userId = await getUserId()
    const disciplinas = await disciplinasDisponiveis()
    const discIds = disciplinas.map(d => d.id)
    const usuario = await prisma.user.findUnique({ where: { id: userId } })
    const horasSemana = usuario?.horasSemana ?? 3
    const plano = await calcularPlano(userId, discIds, horasSemana)
    const totalQuestoes = await prisma.questao.count()
    const totalClassificadas = await prisma.classificacao.count({ where: { foraDoPrograma: false } })
    return { ok: true as const, disciplinas, plano, horasSemana, totalQuestoes, totalClassificadas }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[Início] falha ao carregar:', msg.replace(/:\/\/[^@]+@/, '://***:***@'))
    return { ok: false as const }
  }
}

function fmt1(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1).replace('.', ',')
}

export default async function Inicio() {
  const dados = await carregar()

  if (!dados.ok) {
    return (
      <div className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-inksoft">
        App no ar, banco ainda não respondeu. Tenta atualizar em alguns segundos.
      </div>
    )
  }

  const { plano, horasSemana, totalQuestoes, totalClassificadas } = dados
  const top3 = plano.slice(0, 3)

  return (
    <div className="pb-6">
      <p className="font-mono text-xs uppercase tracking-widest text-inkfaint">Politécnico / CTISM</p>
      <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-ink md:text-4xl">
        Bora estudar?
      </h1>
      <p className="mt-2 max-w-md text-sm text-inksoft">
        {totalQuestoes} questões de provas de verdade já no banco, prontas pra treinar.
      </p>

      {plano.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-inksoft">
          Ainda não tem estatística pra mostrar — nenhuma disciplina com questões classificadas.
        </div>
      ) : (
        <>
          <Link
            href="/estudar"
            className="mt-8 flex items-center justify-between rounded-2xl bg-brand px-6 py-5 shadow-lg shadow-brand/20 transition-transform active:scale-[0.98]"
          >
            <div>
              <p className="font-display text-lg font-semibold text-white">Continuar estudando</p>
              <p className="mt-0.5 text-sm text-white/80">
                Prioridade agora: <span className="font-medium">{top3[0]?.nome}</span>
              </p>
            </div>
            <Zap />
          </Link>

          <section className="mt-8">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-base font-semibold text-ink">O que estudar primeiro</h2>
              <span className="font-mono text-xs text-inkfaint">{fmt1(horasSemana)} h/sem</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {plano.map((item, i) => (
                <div
                  key={item.topicoId}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
                >
                  <span className="font-mono text-xs text-inkfaint">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{item.nome}</p>
                    <p className="text-xs text-inksoft">
                      {item.disciplinaNome} · {fmt1(item.esperado)} questões esperadas
                    </p>
                  </div>
                  <span className="whitespace-nowrap font-mono text-xs font-semibold text-xp">
                    {fmt1(item.horas)}h
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {dados.disciplinas.map(d => (
              <div key={d.id} className="rounded-xl border border-line bg-surface2 px-4 py-3">
                <p className="text-sm font-medium text-ink">{d.nome}</p>
                <p className="mt-0.5 font-mono text-xs text-inkfaint">{d.nQuestoes} questões no edital</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Zap() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="flex-none text-white">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" />
    </svg>
  )
}
