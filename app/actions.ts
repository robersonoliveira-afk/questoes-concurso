'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUserId, garantirUsuario } from '@/lib/session'

export async function salvarDificuldade(topicoId: string, dificuldade: number) {
  const userId = await getUserId()
  await garantirUsuario(userId)
  await prisma.progresso.upsert({
    where: { userId_topicoId: { userId, topicoId } },
    update: { dificuldadeDeclarada: dificuldade },
    create: { userId, topicoId, dificuldadeDeclarada: dificuldade },
  })
  revalidatePath('/')
  revalidatePath('/estudar')
}

export async function salvarHorasSemana(horas: number) {
  const userId = await getUserId()
  await garantirUsuario(userId)
  await prisma.user.update({ where: { id: userId }, data: { horasSemana: Math.max(0, horas) } })
  revalidatePath('/')
  revalidatePath('/estudar')
}

export async function registrarTentativa(questaoId: string, topicoId: string, acertou: boolean) {
  const userId = await getUserId()
  await garantirUsuario(userId)

  await prisma.tentativa.create({ data: { userId, questaoId, acertou } })

  const atual = await prisma.progresso.findUnique({ where: { userId_topicoId: { userId, topicoId } } })
  await prisma.progresso.upsert({
    where: { userId_topicoId: { userId, topicoId } },
    update: {
      acertos: (atual?.acertos ?? 0) + (acertou ? 1 : 0),
      tentativasN: (atual?.tentativasN ?? 0) + 1,
    },
    create: { userId, topicoId, acertos: acertou ? 1 : 0, tentativasN: 1 },
  })
  revalidatePath('/')
}
