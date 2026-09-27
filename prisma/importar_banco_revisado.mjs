// Importa as 650 questões revisadas visualmente contra o PDF/scan original
// (../Teste_site_questões/pipeline/out/banco_poli.json, 13 provas 2013-2026)
// pro banco de produção. Upsert por ID (mesmo esquema "POLI.{ano}.Q{nn}" já
// usado pelo seed original), então:
//   - questão já existente: texto/gabarito são ATUALIZADOS (a revisão é mais
//     fiel que o fatiador simples que gerou o seed original); Classificacao
//     existente NUNCA é tocada aqui.
//   - questão nova: cria com stub de Classificacao (topicoId: null), pra
//     aparecer no banco marcada como "pendente de classificação".
//
// Figuras: as 13 provas revisadas não têm PNG separado por questão — quando
// há figura essencial, ela está descrita entre colchetes dentro do próprio
// enunciado (ex: "[Figura: ...]"), que o RichConteudo já renderiza como texto.
// Por isso `figuras` fica [] aqui; não mexe nas figuras manuais (2026) que
// vieram por outro caminho (importar_revisao.mjs + figuras_manuais/).
//
//   node prisma/importar_banco_revisado.mjs

import { PrismaClient } from '@prisma/client'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const prisma = new PrismaClient()
const caminhoBanco = path.resolve(
  process.cwd(), '..', 'Teste_site_questões', 'pipeline', 'out', 'banco_poli.json'
)

async function main() {
  const banco = JSON.parse(await readFile(caminhoBanco, 'utf-8'))
  const textosBase = new Map(banco.textos_base.map(t => [t.id, t.texto]))

  let atualizadas = 0
  let criadas = 0
  let novasSemClassif = []
  let anuladas = 0

  const anos = [...new Set(banco.questoes.map(q => q.ano))].sort()
  for (const ano of anos) {
    await prisma.edicao.upsert({
      where: { id: `POLI.${ano}` },
      update: {},
      create: { id: `POLI.${ano}`, concursoId: 'POLI', ano, nQuestoes: 50, vigente: false },
    })
  }

  for (const q of banco.questoes) {
    if (q.anulada) { anuladas++; continue }  // sem gabarito de verdade, não entra no banco de prática

    const textoBase = q.texto_base ? (textosBase.get(q.texto_base) ?? null) : null
    const dados = {
      edicaoId: `POLI.${q.ano}`,
      ano: q.ano,
      numero: q.numero,
      textoBase,
      enunciado: q.enunciado,
      alternativas: q.alternativas,
      gabarito: q.gabarito ?? null,
      figuras: [],
      arquivoOrigem: 'pipeline/extrair_poli.py (revisão visual 25-26/09/2026)',
    }

    const existente = await prisma.questao.findUnique({
      where: { id: q.id },
      select: { classificacao: true },
    })

    await prisma.questao.upsert({
      where: { id: q.id },
      update: dados,
      create: { id: q.id, ...dados },
    })

    if (existente) {
      atualizadas++
    } else {
      criadas++
      novasSemClassif.push(q.id)
    }

    if (!existente?.classificacao) {
      await prisma.classificacao.upsert({
        where: { questaoId: q.id },
        update: {},
        create: {
          questaoId: q.id, topicoId: null, confianca: null, foraDoPrograma: false,
          origem: 'manual', justificativa: 'pendente de classificação',
        },
      })
    }
  }

  console.log(`\n${atualizadas} questões atualizadas (texto/gabarito revisado)`)
  console.log(`${criadas} questões novas criadas`)
  console.log(`${anuladas} questões anuladas puladas (sem gabarito confiável)`)
  console.log(`${novasSemClassif.length} precisam de classificação`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
