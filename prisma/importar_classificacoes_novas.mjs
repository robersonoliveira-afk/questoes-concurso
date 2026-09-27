import { PrismaClient } from '@prisma/client'
import classifMat from './seed-data/classificacao_mat.json' with { type: 'json' }
import classifLp from './seed-data/classificacao_lp_novas.json' with { type: 'json' }
import classifCh from './seed-data/classificacao_ch_novas.json' with { type: 'json' }
import classifCn from './seed-data/classificacao_cn_novas.json' with { type: 'json' }

const prisma = new PrismaClient()

async function main() {
  const todas = [...classifMat, ...classifLp, ...classifCh, ...classifCn]
  let criadas = 0
  let stubsPreenchidos = 0
  let jaClassificadas = 0
  let semQuestao = 0

  for (const c of todas) {
    const existente = await prisma.classificacao.findUnique({ where: { questaoId: c.questao_id } })

    const dados = {
      topicoId: c.no_id,
      confianca: c.confianca,
      foraDoPrograma: c.fora_do_programa,
      justificativa: c.justificativa,
      origem: 'manual',
    }

    if (!existente) {
      const questao = await prisma.questao.findUnique({ where: { id: c.questao_id } })
      if (!questao) {
        semQuestao++
        console.log('  sem questão correspondente:', c.questao_id)
        continue
      }
      await prisma.classificacao.create({ data: { questaoId: c.questao_id, ...dados } })
      criadas++
      continue
    }

    // stub criado pelo import do banco revisado (sem classificação real ainda) — preenche.
    // classificação real já existente (de sessão anterior) — nunca sobrescreve.
    if (existente.topicoId === null && existente.justificativa === 'pendente de classificação') {
      await prisma.classificacao.update({ where: { questaoId: c.questao_id }, data: dados })
      stubsPreenchidos++
    } else {
      jaClassificadas++
    }
  }

  console.log(`\n${criadas} classificações criadas`)
  console.log(`${stubsPreenchidos} stubs pendentes preenchidos`)
  console.log(`${jaClassificadas} já tinham classificação real (não sobrescritas)`)
  console.log(`${semQuestao} sem questão correspondente no banco`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
