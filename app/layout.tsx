import type { Metadata, Viewport } from 'next'
import { Fredoka, Lexend, JetBrains_Mono } from 'next/font/google'
import NavBar from '@/components/NavBar'
import './globals.css'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-fredoka',
})
const lexend = Lexend({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-lexend',
})
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Questões Concurso',
  description: 'Estuda pro Politécnico/CTISM sabendo o que mais cai — e o que você ainda não manda bem.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#100E1B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${lexend.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-bg font-body text-ink antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col pb-20 md:flex-row md:pb-0">
          <NavBar />
          <main className="flex-1 px-4 pt-6 md:px-8 md:pt-8">{children}</main>
        </div>
      </body>
    </html>
  )
}
