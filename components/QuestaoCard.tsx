'use client'

import { useState } from 'react'
import RichConteudo from '@/components/RichConteudo'

const LETRAS = ['A', 'B', 'C', 'D', 'E']

export default function QuestaoCard({
  ano,
  numero,
  textoBase = null,
  enunciado,
  alternativas,
  gabarito,
  figuras = [],
  caminho,
}: {
  ano: number
  numero: number
  textoBase?: string | null
  enunciado: string
  alternativas: Record<string, string>
  gabarito: string | null
  figuras?: string[]
  caminho: string
}) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setAberto(v => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="font-mono text-xs text-inkfaint">
          {ano} · Q{String(numero).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-inksoft">{caminho}</span>
        <span className={`text-inkfaint transition-transform ${aberto ? 'rotate-90' : ''}`}>›</span>
      </button>
      {aberto && (
        <div className="border-t border-line px-4 py-4">
          {(textoBase || figuras.length > 0) && (
            <div className="mb-3 rounded-lg border border-line bg-surface2/60 p-3">
              {textoBase && <RichConteudo texto={textoBase} className="text-xs leading-relaxed text-inksoft" />}
              {figuras.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`Figura da questão ${numero}`}
                  className={`max-w-full rounded border border-line bg-white ${textoBase ? 'mt-2' : ''}`}
                />
              ))}
            </div>
          )}
          <RichConteudo texto={enunciado} className="text-sm leading-relaxed text-ink" />
          <ul className="mt-3 flex flex-col gap-1.5">
            {LETRAS.filter(l => l in alternativas).map(l => {
              const correta = l === gabarito
              return (
                <li
                  key={l}
                  className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-xs ${
                    correta ? 'border-certo bg-certo-soft text-ink' : 'border-transparent text-inksoft'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 flex-none items-center justify-center rounded-full font-mono font-semibold ${
                      correta ? 'bg-certo text-[#08211D]' : 'bg-surface2 text-inkfaint'
                    }`}
                  >
                    {l}
                  </span>
                  <RichConteudo texto={alternativas[l]} className="pt-0.5" />
                </li>
              )
            })}
          </ul>
          {!gabarito && (
            <p className="mt-3 rounded-lg bg-surface2 px-3 py-2 text-xs text-inkfaint">
              Gabarito não disponível — essa prova não trouxe a tabela de respostas no PDF.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
