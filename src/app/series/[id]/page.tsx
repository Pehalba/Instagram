import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ListaIdeiasSerie } from "@/components/series/lista-ideias"
import { RemoverSerie } from "@/components/series/remover-serie"
import { Button } from "@/components/ui/button"
import {
  PERFIL_LABEL,
  comoTags,
  eFormato,
  ePerfil,
  eStatus,
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
  const semPerfil = id.match(/^sem-(carolalbas|albascouple)$/)
  const perfilSolto = semPerfil?.[1]

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
        <Button variant="outline" render={<Link href="/series" />}>
          <ArrowLeft />
          Voltar
        </Button>
        <h1 className="font-heading mt-2 text-3xl leading-tight break-words sm:text-4xl lg:text-5xl">{titulo}</h1>
        <p className="mt-3 text-muted-foreground">
          <span className={perfil === "carolalbas" ? "text-carol" : "text-casal"}>{PERFIL_LABEL[perfil]}</span>
          {serie?.quadroFixo ? " · quadro fixo" : ""}
          {` · ${ideias.length} ${ideias.length === 1 ? "ideia" : "ideias"}`}
        </p>
        {serie?.descricao ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{serie.descricao}</p> : null}
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
