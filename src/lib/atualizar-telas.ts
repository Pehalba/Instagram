import { revalidatePath } from "next/cache"

/** Limpa o cache do cliente e de todas as páginas, para Ideias e a série mostrarem a mesma ideia. */
export function atualizarTelas(ideiaId?: string) {
  revalidatePath("/", "layout")
  if (ideiaId) revalidatePath(`/ideias/${ideiaId}`)
}
