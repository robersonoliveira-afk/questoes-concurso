// Prova de conceito: 3 questões de Matemática de 2026 transcritas à mão
// (leitura da página renderizada, não pdftotext) — com tabela markdown,
// LaTeX e figura recortada. Roda uma vez: node prisma/seed-poc-figuras.mjs
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const POC = [
  {
    id: 'POLI.2026.Q13',
    numero: 13,
    enunciado: `Uma turma de 40 estudantes encomendou salgados e bebida para a confraternização de final de ano. Os preços unitários e quantidades encomendadas são mostrados no quadro a seguir.

| Produto | Quantidade | Preço Unitário (R$) |
| --- | --- | --- |
| Cachorro-quente | 150 | 3,50 |
| Empada | 50 | 2,80 |
| Pastel | 80 | 2,50 |
| Suco | 10 | 12,50 |

Foi dado um desconto de 10% sobre o valor total da encomenda e o valor final foi repartido igualmente entre os 40 estudantes.

Qual foi o valor aproximado pago por cada estudante?`,
    alternativas: { A: 'R$ 20,03', B: 'R$ 21,58', C: 'R$ 22,28', D: 'R$ 23,65', E: 'R$ 24,75' },
    gabarito: 'C',
    figuras: [],
    no_id: 'MAT.T01.S09',
    confianca: 0.7,
    justificativa: 'Valor total da compra menos desconto de 10%, dividido igualmente',
  },
  {
    id: 'POLI.2026.Q14',
    numero: 14,
    enunciado: `Uma área de interesse dos matemáticos é o estudo de conjuntos numéricos. Nesse campo, destaca-se o conjunto dos números reais ($\\mathbb{R}$), formado pela união do conjunto dos números racionais ($\\mathbb{Q}$) e do conjunto dos números irracionais ($\\mathbb{Q}'$).

Em relação a alguns números reais, assinale V (verdadeiro) ou F (falso) em cada afirmativa a seguir.

( ) $\\sqrt{21}$ é maior que $\\dfrac{16}{3}$.
( ) $-2\\pi + 3$ é um número racional.
( ) $-\\dfrac{1}{2}$ é uma raiz real da equação $2x^{3} + 4x^{2} - \\dfrac{3}{4} = 0$.

A sequência correta é`,
    alternativas: {
      A: 'V – V – V.',
      B: 'F – F – V.',
      C: 'F – V – V.',
      D: 'V – F – F.',
      E: 'F – F – F.',
    },
    gabarito: 'B',
    figuras: [],
    no_id: 'MAT.T01.S01',
    confianca: 0.85,
    justificativa: 'Conjuntos numéricos: racional × irracional, e verificação de raiz',
  },
  {
    id: 'POLI.2026.Q15',
    numero: 15,
    enunciado: `Os carros atuais geralmente apresentam painéis digitais. Para indicar a quantidade de combustível disponível no tanque, um modelo usado é o de uma "pilha" de retângulos. A quantidade total de retângulos representa a capacidade, em litros, do tanque. Cada retângulo representa igual fração dessa quantidade total e cada retângulo iluminado uma fração do combustível disponível no tanque.

Quando estacionou num posto de combustíveis, Carlos percebeu que a luminosidade de um dos retângulos apagou-se, restando apenas três retângulos iluminados. Dessa forma, Carlos solicitou ao frentista que "completasse" o tanque, interrompendo o abastecimento no exato momento do preenchimento dos doze retângulos do indicador, conforme ilustração a seguir.

Considerando que o tanque completo do carro de Carlos possui capacidade de 45 litros de combustível e que o preço cobrado pelo litro de combustível foi de R$ 5,95, qual o valor total pago por Carlos pelo abastecimento do seu carro?`,
    alternativas: { A: 'R$ 66,94', B: 'R$ 156,19', C: 'R$ 178,50', D: 'R$ 200,81', E: 'R$ 267,75' },
    gabarito: 'D',
    figuras: ['/figuras/POLI.2026.Q15.png'],
    no_id: 'MAT.T01.S08',
    confianca: 0.7,
    justificativa: 'Fração do tanque por retângulo (45/12) e regra de três',
  },
]

async function main() {
  for (const q of POC) {
    const dados = {
      edicaoId: 'POLI.2026',
      ano: 2026,
      numero: q.numero,
      enunciado: q.enunciado,
      alternativas: q.alternativas,
      gabarito: q.gabarito,
      figuras: q.figuras,
      arquivoOrigem: 'PROVA-COLEGIO-ENSINO-MEDIO_2026.pdf (transcrição manual — POC figuras)',
    }
    await prisma.questao.upsert({ where: { id: q.id }, update: dados, create: { id: q.id, ...dados } })
    await prisma.classificacao.upsert({
      where: { questaoId: q.id },
      update: { topicoId: q.no_id, confianca: q.confianca, foraDoPrograma: false, justificativa: q.justificativa },
      create: {
        questaoId: q.id,
        topicoId: q.no_id,
        confianca: q.confianca,
        foraDoPrograma: false,
        justificativa: q.justificativa,
        origem: 'manual',
      },
    })
    console.log('ok', q.id, '->', q.no_id)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
