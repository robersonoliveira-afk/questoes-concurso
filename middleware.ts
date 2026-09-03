import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Sessão anônima: sem cadastro/login ainda (fica pra próxima fase), mas cada
// visitante precisa de uma identidade estável pra guardar dificuldade e
// progresso entre visitas. O cookie só carrega um ID aleatório — a linha
// User correspondente é criada sob demanda (lib/session.ts) na primeira
// escrita real, não aqui.
export function middleware(request: NextRequest) {
  if (request.cookies.get('uid')?.value) return NextResponse.next()

  const resposta = NextResponse.next()
  resposta.cookies.set('uid', crypto.randomUUID(), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return resposta
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
