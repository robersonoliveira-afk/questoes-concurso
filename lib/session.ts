import { cookies } from 'next/headers'
import { prisma } from './prisma'

/** ID do visitante (cookie definido pelo middleware). */
export async function getUserId(): Promise<string> {
  const store = await cookies()
  const uid = store.get('uid')?.value
  if (!uid) throw new Error('sessão não inicializada — middleware não rodou nesta rota?')
  return uid
}

/** Garante que existe uma linha User pro cookie atual antes de gravar algo
 *  que dependa dela (Progresso, Tentativa). Idempotente. */
export async function garantirUsuario(userId: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: `${userId}@convidado.local` },
  })
}
