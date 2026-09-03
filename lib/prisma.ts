import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// O schema declara datasource url/directUrl via env(). Se as duas variáveis
// estiverem totalmente ausentes (deploy sem Supabase configurado ainda), o
// próprio construtor do PrismaClient pode lançar erro síncrono — antes de
// qualquer try/catch em volta de uma query ter chance de agir. Um valor
// placeholder sintaticamente válido evita isso: a conexão real falha do
// mesmo jeito na hora da consulta (aí sim capturada em app/page.tsx), mas
// o app sobe.
const urlValida = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder'

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: urlValida })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
