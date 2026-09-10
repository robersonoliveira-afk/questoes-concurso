'use client'

import { useMemo, useState, useTransition } from 'react'
import { registrarTentativa } from '@/app/actions'
import RichConteudo from '@/components/RichConteudo'
import type { QuestaoPratica } from '@/lib/estatistica'

const LETRAS = ['A', 'B', 'C', 'D', 'E']

export default function EstudarClient({ fila }: { fila: QuestaoPratica[] }) {
  const [indice, setIndice] = useState(0)
  const [revelada, setRevelada] = useState(false)
  const [, startTransition] = useTransition()

  const q = fila[indice % fila.length]

  const marcadores = useMemo(() => {
    const entradas = Object.entries(q.alternativas)
    // ordena A,B,C,D,E mesmo que o objeto venha fora de ordem
    return LETRAS.filter(l => l in q.alternativas).map(l => [l, q.alternativas[l]] as const)
  }, [q])

  function avancar() {
    setIndice(i => (i + 1) % fila.length)
    setRevelada(false)
  }

  function marcar(acertou: boolean) {
    startTransition(() => {
      registrarTentativa(q.id, q.topicoId, acertou)
    })
    avancar()
  }

  return (
    <div className="pb-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-xs text-inkfaint">
          {indice + 1} de {fila.length}
        </span>
        <span className="font-mono text-xs text-inkfaint">
          {q.disciplinaNome} · {q.topicoNome}
        </span>
      </div>
      <div className="barra-fila mb-6">
        <i style={{ width: `${(100 * (indice + 1)) / fila.length}%` }} />
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 md:p-7">
        <p className="font-mono text-[11px] text-inkfaint">
          {q.ano} · questão {q.numero}
        </p>
        {(q.textoBase || q.figuras.length > 0) && (
          <div className="mt-3 rounded-xl border border-line bg-surface2/60 p-4">
            {q.textoBase && (
              <RichConteudo texto={q.textoBase} className="text-[13.5px] leading-relaxed text-inksoft" />
            )}
            {q.figuras.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`Figura da questão ${q.numero}`}
                className={`max-w-full rounded-lg border border-line bg-white ${q.textoBase ? 'mt-3' : ''}`}
              />
            ))}
          </div>
        )}

        <RichConteudo texto={q.enunciado} className="mt-4 text-[15px] leading-relaxed text-ink md:text-base" />

        <div className="mt-5 flex flex-col gap-2.5">
          {marcadores.map(([letra, texto]) => {
            const correta = revelada && letra === q.gabarito
            return (
              <div
                key={letra}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  correta ? 'border-certo bg-certo-soft text-ink' : 'border-line text-inksoft'
                }`}
              >
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full font-mono text-xs font-semibold ${
                    correta ? 'bg-certo text-[#08211D]' : 'bg-surface2 text-inkfaint'
                  }`}
                >
                  {letra}
                </span>
                <RichConteudo texto={texto} className="pt-0.5" />
              </div>
            )
          })}
        </div>

        {!revelada ? (
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setRevelada(true)}
              className="flex-1 rounded-xl bg-brand py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 active:scale-[0.98]"
            >
              Ver resposta
            </button>
            <button
              type="button"
              onClick={avancar}
              className="rounded-xl border border-line px-5 py-3.5 text-sm font-medium text-inksoft"
            >
              Pular
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <p className="mb-2.5 text-center text-sm text-inksoft">Você acertou?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => marcar(true)}
                className="flex-1 rounded-xl bg-certo py-3.5 text-sm font-semibold text-[#08211D] active:scale-[0.98]"
              >
                Acertei
              </button>
              <button
                type="button"
                onClick={() => marcar(false)}
                className="flex-1 rounded-xl bg-errado py-3.5 text-sm font-semibold text-[#3A0A0A] active:scale-[0.98]"
              >
                Errei
              </button>
            </div>
            {q.justificativa && (
              <p className="mt-4 rounded-xl bg-surface2 px-4 py-3 text-xs text-inksoft">
                <span className="font-medium text-ink">Tópico: </span>
                {q.justificativa}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
