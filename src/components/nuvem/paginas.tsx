"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Inicio } from "@/components/inicio/inicio"
import { BancoIdeias } from "@/components/banco/banco-ideias"
import { EditorRoteiro } from "@/components/banco/editor-roteiro"
import { useBanco } from "@/components/dados/provedor-firebase"
import { CalendarioEditorial } from "@/components/quadro/calendario"
import { QuadroKanban } from "@/components/quadro/kanban"
import { GradeSeries } from "@/components/series/grade-series"
import { ListaIdeiasSerie } from "@/components/series/lista-ideias"
import { RemoverSerie } from "@/components/series/remover-serie"
import type { CartaoSubserie } from "@/components/subseries/cartoes-subseries"
import { EditarSubserie } from "@/components/subseries/editar-subserie"
import { GradeSubseries } from "@/components/subseries/grade-subseries"
import { SecaoSubseries } from "@/components/subseries/secao-subseries"
import { Button } from "@/components/ui/button"
import { PERFIS, PERFIL_LABEL, classeTextoPerfil, ePerfil, perfilSemSerie, type Perfil } from "@/lib/conteudo"
import { hojeLocal } from "@/lib/datas"
import { paraLista, type IdeiaNuvem, type SubserieNuvem } from "@/lib/gravar-nuvem"
import { resumosDaNuvem } from "@/lib/resumo-inicio"
import type { CartaoQuadro } from "@/lib/tipos-ideia"

export function Espera({ texto = "Abrindo o banco na nuvem…" }: { texto?: string }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-16">
      <p className="text-sm text-muted-foreground">{texto}</p>
    </main>
  )
}

function useBancoPronto() {
  const banco = useBanco()
  if (banco.erro) return { banco, espera: banco.erro }
  if (!banco.pronto) return { banco, espera: "Abrindo o banco na nuvem…" }
  return { banco, espera: null }
}

export function PaginaInicioNuvem() {
  const { banco, espera } = useBancoPronto()
  if (espera) return <Espera texto={espera} />
  return <Inicio resumos={resumosDaNuvem(banco.ideiasCompletas, banco.seriesCompletas)} />
}

export function PaginaIdeiasNuvem() {
  const abrirId = useSearchParams().get("editar") ?? undefined
  const { banco, espera } = useBancoPronto()
  if (espera) return <Espera texto={espera} />
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col px-4 py-6 sm:px-8 sm:py-10">
      <BancoIdeias ideias={banco.ideias} series={banco.series} abrirId={abrirId} />
    </main>
  )
}

export function PaginaRoteiroNuvem() {
  const id = useSearchParams().get("id") ?? ""
  const { banco, espera } = useBancoPronto()
  if (espera) return <Espera texto={espera} />
  const ideia = banco.ideias.find((item) => item.id === id)
  if (!ideia) return <Espera texto="Essa ideia não está no Firebase." />
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col px-4 py-6 sm:px-8 sm:py-10">
      <EditorRoteiro ideia={ideia} roteiro={banco.roteiroDe(ideia.id)} />
    </main>
  )
}

export function PaginaSeriesNuvem() {
  const { banco, espera } = useBancoPronto()
  if (espera) return <Espera texto={espera} />
  const series = banco.seriesCompletas.map((serie) => ({
    id: serie.id,
    nome: serie.nome,
    perfil: serie.perfil,
    quadroFixo: serie.quadroFixo,
    descricao: serie.descricao,
    cor: serie.cor,
    emoji: serie.emoji,
    ideias: banco.ideiasCompletas.filter((ideia) => ideia.serieId === serie.id).length,
  }))
  const semSerie = PERFIS.flatMap((perfil) => {
    const total = banco.ideiasCompletas.filter((ideia) => ideia.perfil === perfil && !ideia.serieId).length
    return total > 0 ? [{ perfil, total }] : []
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

export function PaginaSerieNuvem() {
  const parametros = useSearchParams()
  const id = parametros.get("id") ?? ""
  const verSoltas = parametros.get("soltas") === "1"
  const { banco, espera } = useBancoPronto()
  if (espera) return <Espera texto={espera} />
  const perfilSolto = perfilSemSerie(id)
  const serie = perfilSolto ? null : banco.seriesCompletas.find((item) => item.id === id) ?? null
  if (!perfilSolto && !serie) return <Espera texto="Essa série não está no Firebase." />
  const perfil = (perfilSolto ?? serie?.perfil) as Perfil
  if (!ePerfil(perfil)) return <Espera texto="Essa série não está no Firebase." />
  const ideias = banco.ideiasCompletas
    .filter((ideia) => perfilSolto ? ideia.serieId === null && ideia.perfil === perfil : ideia.serieId === id)
    .sort((a, b) => a.ordemNaSerie - b.ordemNaSerie || a.titulo.localeCompare(b.titulo, "pt-BR"))
    .map((ideia) => paraLista(ideia, banco.seriesCompletas, banco.subseriesCompletas))
  const subseries = serie ? subseriesComContagem(banco.subseriesCompletas, banco.ideiasCompletas, serie.id) : []
  const soltas = subseries.length > 0 ? ideias.filter((ideia) => !ideia.subserieId) : ideias
  const titulo = serie?.nome ?? "Sem série"

  if (serie && verSoltas) {
    return (
      <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-10">
        <header>
          <Button variant="outline" render={<Link href={`/series/ver?id=${serie.id}`} />} nativeButton={false}>
            <ArrowLeft />
            {serie.nome}
          </Button>
          <h1 className="font-heading mt-2 text-3xl leading-tight break-words sm:text-4xl lg:text-5xl">Ideias sem subsérie</h1>
          <p className="mt-3 text-muted-foreground">
            <span className={classeTextoPerfil(perfil)}>{PERFIL_LABEL[perfil]}</span>
            {` · ${serie.emoji ? `${serie.emoji} ` : ""}${serie.nome}`}
            {` · ${soltas.length} ${soltas.length === 1 ? "ideia" : "ideias"}`}
          </p>
        </header>
        <ListaIdeiasSerie
          ideias={soltas}
          series={banco.series}
          perfil={perfil}
          serieId={serie.id}
          vazio="Todas as ideias desta série estão em subséries."
        />
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-10">
      <header>
        <Button variant="outline" render={<Link href="/series" />} nativeButton={false}>
          <ArrowLeft />
          Voltar
        </Button>
        <h1 className="font-heading mt-2 text-3xl leading-tight break-words sm:text-4xl lg:text-5xl">
          {serie?.emoji ? <span className="mr-2">{serie.emoji}</span> : null}
          {titulo}
        </h1>
        <p className="mt-3 text-muted-foreground">
          <span className={classeTextoPerfil(perfil)}>{PERFIL_LABEL[perfil]}</span>
          {serie?.quadroFixo ? " · quadro fixo" : ""}
          {` · ${ideias.length} ${ideias.length === 1 ? "ideia" : "ideias"}`}
        </p>
        {serie?.descricao ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{serie.descricao}</p> : null}
        {serie ? (
          <div className="mt-4">
            <RemoverSerie id={serie.id} nome={serie.nome} ideias={ideias.length} subseries={subseries.length} voltar />
          </div>
        ) : null}
      </header>
      {serie ? <SecaoSubseries serie={serie} subseries={subseries} soltas={soltas.length} /> : null}
      {subseries.length === 0 ? (
        <ListaIdeiasSerie ideias={soltas} series={banco.series} perfil={perfil} serieId={serie?.id ?? null} />
      ) : null}
    </main>
  )
}

function subseriesComContagem(subseries: SubserieNuvem[], ideias: IdeiaNuvem[], serieId: string): CartaoSubserie[] {
  return subseries
    .filter((subserie) => subserie.serieId === serieId)
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"))
    .map((subserie) => ({ ...subserie, ideias: ideias.filter((ideia) => ideia.subserieId === subserie.id).length }))
}

export function PaginaSubseriesNuvem() {
  const { banco, espera } = useBancoPronto()
  if (espera) return <Espera texto={espera} />
  const subseries = banco.seriesCompletas.flatMap((serie) =>
    subseriesComContagem(banco.subseriesCompletas, banco.ideiasCompletas, serie.id),
  )
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-10">
      <header>
        <h1 className="font-heading text-3xl leading-tight sm:text-4xl lg:text-5xl">Subséries</h1>
        <p className="mt-2 text-sm text-muted-foreground">Grupos dentro de uma série. Uma ideia pode ficar numa subsérie ou direto na série.</p>
      </header>
      <GradeSubseries series={banco.seriesCompletas} subseries={subseries} />
    </main>
  )
}

export function PaginaSubserieNuvem() {
  const id = useSearchParams().get("id") ?? ""
  const { banco, espera } = useBancoPronto()
  if (espera) return <Espera texto={espera} />
  const subserie = banco.subseriesCompletas.find((item) => item.id === id)
  if (!subserie) return <Espera texto="Essa subsérie não está no Firebase." />
  const serie = banco.seriesCompletas.find((item) => item.id === subserie.serieId)
  if (!serie) return <Espera texto="A série desta subsérie não está no Firebase." />
  const ideias = banco.ideiasCompletas
    .filter((ideia) => ideia.subserieId === subserie.id)
    .sort((a, b) => a.ordemNaSerie - b.ordemNaSerie || a.titulo.localeCompare(b.titulo, "pt-BR"))
    .map((ideia) => paraLista(ideia, banco.seriesCompletas, banco.subseriesCompletas))
  const voltar = `/series/ver?id=${serie.id}`

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-10">
      <header>
        <Button variant="outline" render={<Link href={voltar} />} nativeButton={false}>
          <ArrowLeft />
          {serie.nome}
        </Button>
        <h1 className="font-heading mt-2 text-3xl leading-tight break-words sm:text-4xl lg:text-5xl">
          {subserie.emoji ? <span className="mr-2">{subserie.emoji}</span> : null}
          {subserie.nome}
        </h1>
        <p className="mt-3 text-muted-foreground">
          <span className={classeTextoPerfil(subserie.perfil)}>{PERFIL_LABEL[subserie.perfil]}</span>
          {` · ${serie.emoji ? `${serie.emoji} ` : ""}${serie.nome}`}
          {` · ${ideias.length} ${ideias.length === 1 ? "ideia" : "ideias"}`}
        </p>
        {subserie.descricao ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subserie.descricao}</p> : null}
        <div className="mt-4 flex items-center gap-2">
          <EditarSubserie subserie={subserie} serieNome={serie.nome} ideias={ideias.length} voltarPara={voltar} />
          <span className="text-sm text-muted-foreground">Editar ou remover</span>
        </div>
      </header>
      <ListaIdeiasSerie
        ideias={ideias}
        series={banco.series}
        perfil={subserie.perfil}
        serieId={serie.id}
        subserieId={subserie.id}
        vazio="Nenhuma ideia nesta subsérie ainda."
      />
    </main>
  )
}

function cartoes(ideias: CartaoQuadro[]): CartaoQuadro[] {
  return [...ideias].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"))
}

export function PaginaPlanejamentoNuvem() {
  const { banco, espera } = useBancoPronto()
  if (espera) return <Espera texto={espera} />
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-[90rem] flex-1 flex-col px-4 py-6 sm:px-6">
      <QuadroKanban ideias={cartoes(banco.ideias)} />
    </main>
  )
}

export function PaginaCalendarioNuvem() {
  const { banco, espera } = useBancoPronto()
  if (espera) return <Espera texto={espera} />
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-[90rem] flex-1 flex-col px-4 py-6 sm:px-6">
      <CalendarioEditorial ideias={cartoes(banco.ideias)} hoje={hojeLocal()} />
    </main>
  )
}
