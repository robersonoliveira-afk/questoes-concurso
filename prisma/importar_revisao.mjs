// Importa as correções manuais do Róberson pro banco.
//
// Formato da planilha (uma aba por ano, nome da aba = ano, ex "2026"):
//   Questão | Disciplina | Orientação | Imagem orientação | Enunciado | Alternativas | Gabarito
//   - Orientação: texto de leitura compartilhado (cola o texto inteiro) OU
//     a instrução, quando o compartilhado é uma imagem
//   - Alternativas: as 5 numa célula só, uma por linha, prefixadas "A ", "B "...
//
// Figuras: pasta ../Teste_site_questões/figuras_manuais/
//   - da questão:        2026_Q15.png
//   - de um bloco:       2026_Q01-12.png   (espalha pra Q01..Q12)
//   (também lê imagens embutidas na planilha, pela linha da âncora)
//
//   node prisma/importar_revisao.mjs [caminho-da-planilha]
//   (default: ../Teste_site_questões/2026_ex.xlsx)

import { PrismaClient } from '@prisma/client'
import { readFile, readdir, copyFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import xlsx from 'xlsx'

const prisma = new PrismaClient()
const raizTeste = path.resolve(process.cwd(), '..', 'Teste_site_questões')
const planilha = process.argv[2] || path.join(raizTeste, '2026_ex.xlsx')
const dirFiguras = path.join(raizTeste, 'figuras_manuais')
const dirPublic = path.resolve(process.cwd(), 'public', 'figuras')

// limpa artefatos de hifenização de PDF (hífen suave U+00AD, "¬" U+00AC no
// meio de palavra) e normaliza espaços
const s = v =>
  v == null
    ? ''
    : String(v)
        .replace(/[­¬]/g, '')
        .replace(/ /g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .trim()

/** "A texto\nB texto\n..." -> { A: "texto", ... } */
function parseAlternativas(bloco) {
  const out = {}
  for (const linha of s(bloco).split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Ea-e])[)\.\s]\s*(.+)$/)
    if (m) out[m[1].toUpperCase()] = m[2].trim()
  }
  return out
}

/** casa arquivos da pasta figuras_manuais a números de questão */
async function mapaFiguras(ano) {
  const mapa = new Map() // numero -> [urls]
  if (!existsSync(dirFiguras)) return mapa
  await mkdir(dirPublic, { recursive: true })
  for (const arq of await readdir(dirFiguras)) {
    const m = arq.match(new RegExp(`^${ano}_Q0*(\\d+)(?:-0*(\\d+))?\\.(png|jpg|jpeg|webp)$`, 'i'))
    if (!m) continue
    const ini = +m[1]
    const fim = m[2] ? +m[2] : ini
    const url = `/figuras/${arq}`
    await copyFile(path.join(dirFiguras, arq), path.join(dirPublic, arq))
    for (let n = ini; n <= fim; n++) {
      if (!mapa.has(n)) mapa.set(n, [])
      mapa.get(n).push(url)
    }
  }
  return mapa
}

async function main() {
  const wb = xlsx.read(await readFile(planilha), { type: 'buffer' })
  let total = 0
  const semFigura = []
  const novasSemClassif = []

  for (const nomeAba of wb.SheetNames) {
    const ano = parseInt(nomeAba, 10)
    if (!ano || ano < 2000 || ano > 2100) continue
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[nomeAba], { defval: '' })
    const figs = await mapaFiguras(ano)

    for (const r of rows) {
      const numero = parseInt(s(r['Questão'] ?? r['Questao'] ?? r['nº'] ?? r['numero']), 10)
      const enunciado = s(r['Enunciado'])
      const gabaritoSo = s(r['Gabarito']).toUpperCase().slice(0, 1) || null

      // linha só com gabarito (ele preencheu o gabarito antes do texto): só atualiza o gabarito
      if (numero && !enunciado && gabaritoSo) {
        await prisma.questao.update({
          where: { id: `POLI.${ano}.Q${String(numero).padStart(2, '0')}` },
          data: { gabarito: gabaritoSo },
        }).then(() => total++).catch(() => {})
        continue
      }
      if (!numero || !enunciado) continue

      // texto-base: só o que está na própria linha (Orientação). O contexto
      // compartilhado de um bloco vem da imagem, casada por nome de arquivo.
      const orient = s(r['Orientação'] ?? r['Orientacao'])

      const alternativas = parseAlternativas(r['Alternativas'])
      const gabarito = s(r['Gabarito']).toUpperCase().slice(0, 1) || null
      const figuras = figs.get(numero) || []
      if (figuras.length === 0 && s(r['Imagem orientação'] ?? r['Imagem orientacao'])) {
        semFigura.push(`${ano} Q${numero} — planilha diz que tem imagem, mas não achei ${ano}_Q${numero}.png na pasta`)
      }

      const id = `POLI.${ano}.Q${String(numero).padStart(2, '0')}`
      const disc = s(r['Disciplina'])
      const dados = {
        enunciado,
        alternativas,
        textoBase: orient || null,
        figuras,
        ...(gabarito ? { gabarito } : {}),
      }
      await prisma.edicao.upsert({
        where: { id: `POLI.${ano}` },
        update: {},
        create: { id: `POLI.${ano}`, concursoId: 'POLI', ano, nQuestoes: 50, vigente: false },
      })
      const existente = await prisma.questao.findUnique({ where: { id }, select: { classificacao: true } })
      await prisma.questao.upsert({
        where: { id },
        update: dados,
        create: { id, edicaoId: `POLI.${ano}`, ano, numero, arquivoOrigem: 'transcrição manual', ...dados },
      })
      // questão nova (nunca foi fatiada): stub de classificação pra ela
      // aparecer no banco; eu classifico depois.
      if (!existente?.classificacao) {
        novasSemClassif.push(`${ano} Q${numero} — ${disc}`)
        await prisma.classificacao.upsert({
          where: { questaoId: id },
          update: {},
          create: { questaoId: id, topicoId: null, confianca: null, foraDoPrograma: false,
            origem: 'manual', justificativa: 'pendente de classificação' },
        })
      }
      total++
    }
  }

  console.log(`\n${total} questões atualizadas`)
  if (novasSemClassif.length) {
    console.log(`\n>>> ${novasSemClassif.length} questões novas (nunca fatiadas) — falta classificar:`)
    novasSemClassif.forEach(a => console.log('  ' + a))
  }
  if (semFigura.length) {
    console.log('\nAVISOS:')
    semFigura.forEach(a => console.log('  ' + a))
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
