import { BancoIdeias } from "@/components/banco/banco-ideias"
import { firebaseConfigurado } from "@/lib/firebase-config"
import {
  comoTags,
  eFormato,
  ePerfil,
  eStatus,
  prioridadeSalva,
} from "@/lib/conteudo"
import { prisma } from "@/lib/prisma"
import type { IdeiaLista, SerieOpcao } from "@/lib/tipos-ideia"

export const dynamic = "force-dynamic"

function iso(data: Date | null): string | null {
  if (!data) return null
  return data.toISOString().slice(0, 10)
}

export default async function PaginaIdeias({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string }>
}) {
  const { editar } = await searchParams
  const [brutas, seriesBrutas] = await Promise.all([
    prisma.ideia.findMany({
      include: {
        serie: { select: { nome: true, quadroFixo: true, ordem: true } },
        roteiro: { select: { legenda: true, cta: true } },
      },
    }),
    prisma.serie.findMany({ orderBy: [{ perfil: "asc" }, { ordem: "asc" }] }),
  ])

  const ideias: IdeiaLista[] = brutas.flatMap((ideia) => {
    const prioridade = prioridadeSalva(ideia.prioridade)
    if (!ePerfil(ideia.perfil) || !eStatus(ideia.status) || prioridade === undefined) return []
    const formato = ideia.formato && eFormato(ideia.formato) ? ideia.formato : null
    return [{
      id: ideia.id,
      titulo: ideia.titulo,
      perfil: ideia.perfil,
      serieId: ideia.serieId,
      serieNome: ideia.serie?.nome ?? null,
      quadroFixo: ideia.serie?.quadroFixo ?? false,
      ordemSerie: ideia.serie?.ordem ?? 9999,
      ordemNaSerie: ideia.ordemNaSerie,
      status: ideia.status,
      prioridade,
      formato,
      tags: comoTags(ideia.tags),
      notas: ideia.notas,
      notaOrigem: ideia.notaOrigem,
      dataPlanejada: iso(ideia.dataPlanejada),
      dataPostada: iso(ideia.dataPostada),
      temRoteiro: Boolean(ideia.roteiro),
      legenda: ideia.roteiro?.legenda ?? "",
      cta: ideia.roteiro?.cta ?? "",
      atualizadoEm: ideia.updatedAt.toISOString(),
    }]
  })

  const series: SerieOpcao[] = seriesBrutas.flatMap((serie) => {
    if (!ePerfil(serie.perfil)) return []
    return [{
      id: serie.id,
      nome: serie.nome,
      perfil: serie.perfil,
      quadroFixo: serie.quadroFixo,
      ordem: serie.ordem,
    }]
  })

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col px-4 py-6 sm:px-8 sm:py-10">
      <BancoIdeias ideias={ideias} series={series} abrirId={editar} />
    </main>
  )
}
