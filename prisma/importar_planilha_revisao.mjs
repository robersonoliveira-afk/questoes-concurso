// Importa as correções da planilha revisao_questoes.xlsx pro banco.
// Só toca nas linhas onde ENUNCIADO foi preenchido — roda quantas vezes
// quiser conforme o Róberson vai completando lotes.
//
//   node prisma/importar_planilha_revisao.mjs
//
// Depois de importar, as questões marcadas com figura='s' aparecem no
// relatório pra eu (Claude) recortar a imagem do PDF e anexar.

import { PrismaClient } from '@prisma/client'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import xlsx from 'xlsx'

const prisma = new PrismaClient()
const CAMINHO = path.resolve(
  process.cwd(),
  '..',
  'Teste_site_questões',
  'revisao_questoes.xlsx'
)

function limpa(v) {
  return v == null ? '' : String(v).trim()
}

async function main() {
  const buf = await readFile(CAMINHO)
  const wb = xlsx.read(buf, { type: 'buffer' })
  const rows = xlsx.utils.sheet_to_json(wb.Sheets['Revisar'], { defval: '' })

  let atualizadas = 0
  const semEnunciado = []
  const comFigura = []
  let textoBasePorBloco = new Map() // herda texto-base dentro do mesmo bloco

  for (const r of rows) {
    const id = limpa(r['id'])
    const enunciado = limpa(r['ENUNCIADO'])
    const bloco = limpa(r['bloco'])
    let textoBase = limpa(r['TEXTO-BASE'])

    if (textoBase && bloco) textoBasePorBloco.set(bloco, textoBase)
    if (!textoBase && bloco && textoBasePorBloco.has(bloco)) {
      textoBase = textoBasePorBloco.get(bloco)
    }

    if (!id) continue
    if (!enunciado) {
      semEnunciado.push(id)
      continue
    }

    const alternativas = {}
    for (const L of ['A', 'B', 'C', 'D', 'E']) {
      const t = limpa(r[L])
      if (t) alternativas[L] = t
    }

    const gabarito = limpa(r['gabarito']).toUpperCase().slice(0, 1) || null
    const temFigura = limpa(r['figura?']).toLowerCase().startsWith('s')

    await prisma.questao.update({
      where: { id },
      data: {
        enunciado,
        alternativas,
        textoBase: textoBase || null,
        ...(gabarito ? { gabarito } : {}),
      },
    })
    atualizadas++
    if (temFigura) comFigura.push(`${id}  (${limpa(r['ano'])} Q${limpa(r['numero'])})`)
  }

  console.log(`\n${atualizadas} questões atualizadas`)
  if (semEnunciado.length)
    console.log(`${semEnunciado.length} ainda em branco (ok, faz depois): ${semEnunciado.slice(0, 8).join(' ')}${semEnunciado.length > 8 ? ' …' : ''}`)
  if (comFigura.length) {
    console.log(`\n>>> ${comFigura.length} marcadas com FIGURA — recortar do PDF e anexar:`)
    comFigura.forEach(x => console.log('   ' + x))
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
