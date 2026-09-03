'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, SlidersHorizontal, Zap, Layers, type LucideIcon } from 'lucide-react'

const ITENS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/configurar', label: 'Ajustar', icon: SlidersHorizontal },
  { href: '/estudar', label: 'Estudar', icon: Zap },
  { href: '/questoes', label: 'Questões', icon: Layers },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <>
      {/* mobile: barra fixa embaixo, pra não brigar com o polegar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface/95 backdrop-blur md:hidden">
        {ITENS.map(item => {
          const ativo = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              <Icon size={22} strokeWidth={ativo ? 2.4 : 1.8} className={ativo ? 'text-brand-bright' : 'text-inkfaint'} />
              <span className={`text-[11px] font-medium ${ativo ? 'text-ink' : 'text-inkfaint'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* desktop: trilha lateral */}
      <aside className="hidden w-56 flex-none border-r border-line px-4 py-8 md:block">
        <Link href="/" className="mb-10 block px-2">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            Questões<span className="text-brand-bright">+</span>
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {ITENS.map(item => {
            const ativo = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  ativo ? 'bg-brand-soft text-ink' : 'text-inksoft hover:bg-white/5 hover:text-ink'
                }`}
              >
                <Icon size={19} strokeWidth={ativo ? 2.3 : 1.8} className={ativo ? 'text-brand-bright' : ''} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
