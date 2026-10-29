"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Inicio } from "@/components/inicio/inicio"
import { BancoIdeias } from "@/components/banco/banco-ideias"
import { EditorRoteiro } from "@/components/banco/editor-roteiro"
import { useFirebase } from "@/components/dados/provedor-firebase"
import { CalendarioEditorial } from "@/components/quadro/calendario"
import { QuadroKanban } from "@/components/quadro/kanban"
import { GradeSeries } from "@/components/series/grade-series"
import { ListaIdeiasSerie } from "@/components/series/lista-ideias"
import { RemoverSerie } from "@/components/series/remover-serie"
import { Button } from "@/components/ui/button"
import { PERFIS, PERFIL_LABEL, classeTextoPerfil, ePerfil, perfilSemSerie, type Perfil } from "@/lib/conteudo"
import { hojeLocal } from "@/lib/datas"
import { paraLista } from "@/lib/gravar-nuvem"
import { resumosDaNuvem } from "@/lib/resumo-inicio"
import type { CartaoQuadro } from "@/lib/tipos-ideia"

function Espera({ texto }: { texto: string }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-16">
      <p className="text-sm text-muted-foreground">{texto}</p>
    </main>
  )
}

function useBancoPronto() {
  const banco = useFirebase()
  if (!banco) return { banco: null, espera: "O Firebase não está configurado." }
  if (banco.erro) return { banco, espera: banco.erro }
  if (!banco.pronto) return { banco, espera: "Abrindo o banco na nuvem…" }
  return { banco, espera: null }
}

export function PaginaInicioNuvem() {
  const { banco, espera } = useBancoPronto()
  if (!banco || espera) return <Espera texto={espera ?? "Abrindo o banco na nuvem…"} />
  return <Inicio resumos={resumosDaNuvem(banco.ideiasCompletas, banco.seriesCompletas)} />
}

export function PaginaIdeiasNuvem({ abrirId }: { abrirId?: string }) {
  const { banco, espera } = useBancoPronto()
  if (!banco || espera) return <Espera texto={espera ?? "Abrindo o banco na nuvem…"} />
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col px-4 py-6 sm:px-8 sm:py-10">
      <BancoIdeias ideias={banco.ideias} series={banco.series} abrirId={abrirId} />
    </main>
  )
}

export function PaginaRoteiroNuvem({ id }: { id: string }) {
  const { banco, espera } = useBancoPronto()
  if (!banco || espera) return <Espera texto={espera ?? "Abrindo o banco na nuvem…"} />
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
  if (!banco || espera) return <Espera texto={espera ?? "Abrindo o banco na nuvem…"} />
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

export function PaginaSerieNuvem({ id }: { id: string }) {
  const { banco, espera } = useBancoPronto()
  if (!banco || espera) return <Espera texto={espera ?? "Abrindo o banco na nuvem…"} />
  const perfilSolto = perfilSemSerie(id)
  const serie = perfilSolto ? null : banco.seriesCompletas.find((item) => item.id === id) ?? null
  if (!perfilSolto && !serie) return <Espera texto="Essa série não está no Firebase." />
  const perfil = (perfilSolto ?? serie?.perfil) as Perfil
  if (!ePerfil(perfil)) return <Espera texto="Essa série não está no Firebase." />
  const ideias = banco.ideiasCompletas
    .filter((ideia) => perfilSolto ? ideia.serieId === null && ideia.perfil === perfil : ideia.serieId === id)
    .sort((a, b) => a.ordemNaSerie - b.ordemNaSerie || a.titulo.localeCompare(b.titulo, "pt-BR"))
    .map((ideia) => paraLista(ideia, banco.seriesCompletas))
  const titulo = serie?.nome ?? "Sem série"

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
            <RemoverSerie id={serie.id} nome={serie.nome} ideias={ideias.length} voltar />
          </div>
        ) : null}
      </header>
      <ListaIdeiasSerie ideias={ideias} series={banco.series} perfil={perfil} serieId={serie?.id ?? null} />
    </main>
  )
}

function cartoes(ideias: { id: string; titulo: string; perfil: CartaoQuadro["perfil"]; status: CartaoQuadro["status"]; prioridade: CartaoQuadro["prioridade"]; serieNome: string | null; dataPlanejada: string | null }[]): CartaoQuadro[] {
  return [...ideias].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"))
}

export function PaginaPlanejamentoNuvem() {
  const { banco, espera } = useBancoPronto()
  if (!banco || espera) return <Espera texto={espera ?? "Abrindo o banco na nuvem…"} />
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-[90rem] flex-1 flex-col px-4 py-6 sm:px-6">
      <QuadroKanban ideias={cartoes(banco.ideias)} />
    </main>
  )
}

export function PaginaCalendarioNuvem() {
  const { banco, espera } = useBancoPronto()
  if (!banco || espera) return <Espera texto={espera ?? "Abrindo o banco na nuvem…"} />
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-[90rem] flex-1 flex-col px-4 py-6 sm:px-6">
      <CalendarioEditorial ideias={cartoes(banco.ideias)} hoje={hojeLocal()} />
    </main>
  )
}
