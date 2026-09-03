'use client'

import { useState, useTransition } from 'react'
import { salvarDificuldade } from '@/app/actions'

const NIVEIS = Array.from({ length: 10 }, (_, i) => i + 1)

function corDoNivel(n: number, ativo: boolean) {
  if (!ativo) return 'bg-surface2 text-inkfaint'
  if (n <= 3) return 'bg-certo text-[#08211D]'
  if (n <= 6) return 'bg-xp text-[#2A1F00]'
  return 'bg-errado text-[#3A0A0A]'
}

export default function DificuldadeSelector({
  topicoId,
  valorInicial,
}: {
  topicoId: string
  valorInicial: number
}) {
  const [valor, setValor] = useState(valorInicial)
  const [, startTransition] = useTransition()

  function escolher(n: number) {
    setValor(n)
    startTransition(() => {
      salvarDificuldade(topicoId, n)
    })
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {NIVEIS.map(n => (
        <button
          key={n}
          type="button"
          onClick={() => escolher(n)}
          aria-pressed={n === valor}
          className={`tap-dificuldade ${corDoNivel(n, n === valor)}`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
