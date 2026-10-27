import { CalendarioEditorial } from "@/components/quadro/calendario"
import { carregarCartoes } from "@/lib/carregar-quadro"
import { hojeLocal } from "@/lib/datas"

export const dynamic = "force-dynamic"

export default async function PaginaCalendario() {
  const ideias = await carregarCartoes()

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-[90rem] flex-1 flex-col px-4 py-6 sm:px-6">
      <CalendarioEditorial ideias={ideias} hoje={hojeLocal()} />
    </main>
  )
}
