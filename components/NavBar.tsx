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

/** O símbolo da marca: anel aberto (85°) com haste a 45°, lido como Q e como
 *  medidor de progresso. Nunca gire nem preencha o miolo — ver marca/identidade-visual.html. */
function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Questa" className="flex-none">
      <circle
        cx="50" cy="50" r="33" fill="none" stroke="currentColor" strokeWidth="13"
        strokeLinecap="round" strokeDasharray="158.4 48.9" transform="rotate(87.5 50 50)"
        className="text-brand-bright"
      />
      <path d="M70 70 L86 86" fill="none" stroke="currentColor" strokeWidth="13" strokeLinecap="round" className="text-brand-bright" />
    </svg>
  )
}

export default function NavBar() {
  const pathname = usePathname()

  return (
    <>
      {/* mobile: cabeçalho com a marca, depois a barra fixa embaixo */}
      <header className="flex items-center gap-2.5 px-4 pt-5 md:hidden">
        <Logo size={26} />
        <span className="font-display text-lg font-semibold tracking-tight text-ink">questa</span>
      </header>
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
        <Link href="/" className="mb-10 flex items-center gap-2.5 px-2">
          <Logo size={30} />
          <span className="font-display text-xl font-semibold tracking-tight text-ink">questa</span>
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
