'use client'

import { useState, useTransition } from 'react'
import { salvarHorasSemana } from '@/app/actions'

const PRESETS = [1.5, 3, 5, 8]

export default function TempoSemanal({ valorInicial }: { valorInicial: number }) {
  const [valor, setValor] = useState(valorInicial)
  const [, startTransition] = useTransition()

  function escolher(h: number) {
    setValor(h)
    startTransition(() => {
      salvarHorasSemana(h)
    })
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(h => (
          <button
            key={h}
            type="button"
            onClick={() => escolher(h)}
            className={`chip-tempo ${
              valor === h ? 'border-brand bg-brand-soft text-ink' : 'border-line text-inksoft'
            }`}
          >
            {h}h/sem
          </button>
        ))}
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs text-inkfaint">
        outro valor:
        <input
          type="number"
          min={0.5}
          max={40}
          step={0.5}
          value={valor}
          onChange={e => escolher(Math.max(0, Number(e.target.value) || 0))}
          className="w-16 rounded-lg border border-line bg-surface2 px-2 py-1 font-mono text-sm text-ink"
        />
        h
      </label>
    </div>
  )
}
