import { GradeSeries, type CartaoSerie } from "@/components/series/grade-series"
import { ePerfil, type Perfil } from "@/lib/conteudo"
import { firebaseConfigurado } from "@/lib/firebase-config"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function PaginaSeries() {
  const [brutas, soltas] = await Promise.all([
    prisma.serie.findMany({
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
      include: { _count: { select: { ideias: true } } },
    }),
    prisma.ideia.groupBy({
      by: ["perfil"],
      where: { serieId: null },
      _count: { _all: true },
    }),
  ])

  const series: CartaoSerie[] = brutas.flatMap((serie) => {
    if (!ePerfil(serie.perfil)) return []
    return [{
      id: serie.id,
      nome: serie.nome,
      perfil: serie.perfil,
      quadroFixo: serie.quadroFixo,
      descricao: serie.descricao,
      cor: serie.cor,
      emoji: serie.emoji,
      ideias: serie._count.ideias,
    }]
  })

  const semSerie = soltas.flatMap((item) => {
    if (!ePerfil(item.perfil)) return []
    return [{ perfil: item.perfil, total: item._count._all }]
  })

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-10">
      <header>
        <h1 className="font-heading text-3xl leading-tight sm:text-4xl lg:text-5xl">Séries</h1>
      </header>
      <GradeSeries series={series} semSerie={semSerie} />
    </main>
  )
}
