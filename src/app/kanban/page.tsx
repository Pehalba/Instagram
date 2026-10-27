import { QuadroKanban } from "@/components/quadro/kanban"
import { carregarCartoes } from "@/lib/carregar-quadro"

export const dynamic = "force-dynamic"

export default async function PaginaKanban() {
  const ideias = await carregarCartoes()

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-[90rem] flex-1 flex-col px-4 py-6 sm:px-6">
      <QuadroKanban ideias={ideias} />
    </main>
  )
}
