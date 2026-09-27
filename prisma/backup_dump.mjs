// Backup de segurança: dump de todas as tabelas em JSON antes de uma migração
// grande. Não é para restaurar automaticamente (não há script de restore),
// é para ter os dados salvos caso algo dê errado e precise reconstruir na mão.
//
//   node prisma/backup_dump.mjs

import { PrismaClient } from '@prisma/client'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const prisma = new PrismaClient()

async function main() {
  const carimbo = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = path.resolve('backups')
  await mkdir(dir, { recursive: true })

  const dump = {
    carimbo,
    concurso: await prisma.concurso.findMany(),
    edicao: await prisma.edicao.findMany(),
    disciplina: await prisma.disciplina.findMany(),
    topico: await prisma.topico.findMany(),
    questao: await prisma.questao.findMany(),
    classificacao: await prisma.classificacao.findMany(),
    user: await prisma.user.findMany(),
    progresso: await prisma.progresso.findMany(),
    tentativa: await prisma.tentativa.findMany(),
  }

  const destino = path.join(dir, `backup_${carimbo}.json`)
  await writeFile(destino, JSON.stringify(dump, null, 1), 'utf-8')

  console.log(`Backup salvo em ${destino}`)
  for (const [tabela, linhas] of Object.entries(dump)) {
    if (Array.isArray(linhas)) console.log(`  ${tabela}: ${linhas.length}`)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
