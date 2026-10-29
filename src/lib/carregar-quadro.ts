import { ePerfil, eStatus, prioridadeSalva } from "@/lib/conteudo"
import { prisma } from "@/lib/prisma"
import type { CartaoQuadro } from "@/lib/tipos-ideia"

export async function carregarCartoes(): Promise<CartaoQuadro[]> {
  const ideias = await prisma.ideia.findMany({
    select: {
      id: true,
      titulo: true,
      perfil: true,
      status: true,
      prioridade: true,
      dataPlanejada: true,
      serie: { select: { nome: true } },
    },
    orderBy: { titulo: "asc" },
  })

  return ideias.flatMap((ideia) => {
    const prioridade = prioridadeSalva(ideia.prioridade)
    if (!ePerfil(ideia.perfil) || !eStatus(ideia.status) || prioridade === undefined) return []
    return [{
      id: ideia.id,
      titulo: ideia.titulo,
      perfil: ideia.perfil,
      status: ideia.status,
      prioridade,
      serieNome: ideia.serie?.nome ?? null,
      dataPlanejada: ideia.dataPlanejada ? ideia.dataPlanejada.toISOString().slice(0, 10) : null,
    }]
  })
}
