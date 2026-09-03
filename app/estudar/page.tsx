import { getUserId, garantirUsuario } from '@/lib/session'
import { disciplinasDisponiveis, filaPratica } from '@/lib/estatistica'
import EstudarClient from '@/components/EstudarClient'

export const dynamic = 'force-dynamic'

export default async function Estudar() {
  const userId = await getUserId()
  await garantirUsuario(userId)

  const disciplinas = await disciplinasDisponiveis()
  const fila = await filaPratica(userId, disciplinas.map(d => d.id))

  if (fila.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface px-5 py-6 text-sm text-inksoft">
        Ainda não tem questão pronta pra praticar aqui — só entram as que têm classificação
        confiável e gabarito confirmado no PDF da prova.
      </div>
    )
  }

  return <EstudarClient fila={fila} />
}
