import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ListaIdeiasSerie } from "@/components/series/lista-ideias"
import { RemoverSerie } from "@/components/series/remover-serie"
import { Button } from "@/components/ui/button"
import { firebaseConfigurado } from "@/lib/firebase-config"
import {
  PERFIL_LABEL,
  classeTextoPerfil,
  comoTags,
  eFormato,
  ePerfil,
  eStatus,
  perfilSemSerie,
  prioridadeSalva,
  type Perfil,
} from "@/lib/conteudo"
import { prisma } from "@/lib/prisma"
import type { IdeiaLista, SerieOpcao } from "@/lib/tipos-ideia"

export const dynamic = "force-dynamic"

function iso(data: Date | null): string | null {
  if (!data) return null
  return data.toISOString().slice(0, 10)
}

export default async function PaginaSerie({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (firebaseConfigurado()) {
    const { PaginaSerieNuvem } = await import("@/components/nuvem/paginas")
    return <PaginaSerieNuvem id={id} />
  }
  const perfilSolto = perfilSemSerie(id)

  const [serie, seriesBrutas] = await Promise.all([
    perfilSolto ? Promise.resolve(null) : prisma.serie.findUnique({ where: { id } }),
    prisma.serie.findMany({ orderBy: [{ perfil: "asc" }, { ordem: "asc" }] }),
  ])

  if (!perfilSolto && (!serie || !ePerfil(serie.perfil))) notFound()

  const perfil = (perfilSolto ?? serie?.perfil) as Perfil
  const brutas = await prisma.ideia.findMany({
    where: perfilSolto ? { serieId: null, perfil } : { serieId: id },
    orderBy: [{ ordemNaSerie: "asc" }, { titulo: "asc" }],
    include: {
      serie: { select: { nome: true, quadroFixo: true, ordem: true } },
      roteiro: { select: { legenda: true, cta: true } },
    },
  })

  const ideias: IdeiaLista[] = brutas.flatMap((ideia) => {
    const prioridade = prioridadeSalva(ideia.prioridade)
    if (!ePerfil(ideia.perfil) || !eStatus(ideia.status) || prioridade === undefined) return []
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
      formato: ideia.formato && eFormato(ideia.formato) ? ideia.formato : null,
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

  const series: SerieOpcao[] = seriesBrutas.flatMap((item) => {
    if (!ePerfil(item.perfil)) return []
    return [{
      id: item.id,
      nome: item.nome,
      perfil: item.perfil,
      quadroFixo: item.quadroFixo,
      ordem: item.ordem,
    }]
  })

  const titulo = serie?.nome ?? "Sem série"

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-10">
      <header>
        <Button variant="outline" nativeButton={false} render={<Link href="/series" />}>
          <ArrowLeft />
          Voltar
        </Button>
        <h1 className="font-heading mt-2 text-3xl leading-tight break-words sm:text-4xl lg:text-5xl">
          {serie?.emoji ? <span className="mr-2">{serie.emoji}</span> : null}
          {titulo}
        </h1>
        <p className="mt-3 text-muted-foreground">
          <span className={classeTextoPerfil(perfil)}>{PERFIL_LABEL[perfil]}</span>
        </p>
        {serie ? (
          <div className="mt-4">
            <RemoverSerie id={serie.id} nome={serie.nome} ideias={ideias.length} voltar />
          </div>
        ) : null}
      </header>

      <ListaIdeiasSerie ideias={ideias} series={series} perfil={perfil} serieId={serie?.id ?? null} />
    </main>
  )
}
