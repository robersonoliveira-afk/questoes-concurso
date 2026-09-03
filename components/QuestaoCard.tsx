'use client'

import { useState } from 'react'

const LETRAS = ['A', 'B', 'C', 'D', 'E']

export default function QuestaoCard({
  ano,
  numero,
  enunciado,
  alternativas,
  gabarito,
  caminho,
}: {
  ano: number
  numero: number
  enunciado: string
  alternativas: Record<string, string>
  gabarito: string | null
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
          <p className="text-sm leading-relaxed text-ink">{enunciado}</p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {LETRAS.filter(l => l in alternativas).map(l => (
              <li key={l} className={`flex gap-2 text-xs ${l === gabarito ? 'text-certo' : 'text-inksoft'}`}>
                <span className="font-mono font-semibold">
                  {l}
                  {l === gabarito ? ' ✓' : ''}
                </span>
                {alternativas[l]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
