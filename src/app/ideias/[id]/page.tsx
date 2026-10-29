import { notFound } from "next/navigation"
import { EditorRoteiro } from "@/components/banco/editor-roteiro"
import { comoTags, eFormato, ePerfil, eStatus, prioridadeSalva } from "@/lib/conteudo"
import { prisma } from "@/lib/prisma"
import type { IdeiaLista, RoteiroEditor } from "@/lib/tipos-ideia"

export const dynamic = "force-dynamic"

function iso(data: Date | null): string | null {
  if (!data) return null
  return data.toISOString().slice(0, 10)
}

function comoListaTexto(valor: unknown): string[] {
  return comoTags(valor)
}

export default async function PaginaRoteiro({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ideia = await prisma.ideia.findUnique({
    where: { id },
    include: { serie: true, roteiro: true },
  })
  const prioridade = ideia ? prioridadeSalva(ideia.prioridade) : undefined
  if (!ideia || !ePerfil(ideia.perfil) || !eStatus(ideia.status) || prioridade === undefined) {
    notFound()
  }

  const resumo: IdeiaLista = {
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
  }

  const roteiro: RoteiroEditor = {
    formatoDescricao: ideia.roteiro?.formatoDescricao ?? "",
    gancho: ideia.roteiro?.gancho ?? "",
    parte1Tensao: ideia.roteiro?.parte1Tensao ?? "",
    parte2Virada: ideia.roteiro?.parte2Virada ?? "",
    parte3Aplicacao: ideia.roteiro?.parte3Aplicacao ?? "",
    legenda: ideia.roteiro?.legenda ?? "",
    cta: ideia.roteiro?.cta ?? "",
    porQuePerform: ideia.roteiro?.porQuePerform ?? "",
    referenciasBiblicas: comoListaTexto(ideia.roteiro?.referenciasBiblicas),
    autoresCitados: comoListaTexto(ideia.roteiro?.autoresCitados),
  }

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col px-4 py-6 sm:px-8 sm:py-10">
      <EditorRoteiro ideia={resumo} roteiro={roteiro} />
    </main>
  )
}
