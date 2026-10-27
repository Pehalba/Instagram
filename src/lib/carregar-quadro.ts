import { ePerfil, ePrioridade, eStatus } from "@/lib/conteudo"
import { prisma } from "@/lib/prisma"
import type { CartaoQuadro } from "@/lib/tipos-ideia"

export async function carregarCartoes(): Promise<CartaoQuadro[]> {
  const ideias = await prisma.ideia.findMany({
    include: { serie: { select: { nome: true } } },
    orderBy: { titulo: "asc" },
  })

  return ideias.flatMap((ideia) => {
    if (!ePerfil(ideia.perfil) || !eStatus(ideia.status) || !ePrioridade(ideia.prioridade)) return []
    return [{
      id: ideia.id,
      titulo: ideia.titulo,
      perfil: ideia.perfil,
      status: ideia.status,
      prioridade: ideia.prioridade,
      serieNome: ideia.serie?.nome ?? null,
      dataPlanejada: ideia.dataPlanejada ? ideia.dataPlanejada.toISOString().slice(0, 10) : null,
    }]
  })
}
