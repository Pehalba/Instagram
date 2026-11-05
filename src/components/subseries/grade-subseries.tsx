"use client"

import Link from "next/link"
import { useState } from "react"
import { AcoesSubseries } from "@/components/selecao/acoes-em-massa"
import { BarraSelecao, BotaoSelecionar, useSelecao } from "@/components/selecao/selecao"
import { CartoesSubseries, type CartaoSubserie } from "@/components/subseries/cartoes-subseries"
import { FormularioSubserie } from "@/components/subseries/formulario-subserie"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PERFIS, PERFIL_LABEL, type Perfil } from "@/lib/conteudo"
import type { SerieNuvem } from "@/lib/gravar-nuvem"
import { cn } from "cn"

export function GradeSubseries({ series, subseries }: { series: SerieNuvem[]; subseries: CartaoSubserie[] }) {
  const [perfil, setPerfil] = useState<Perfil>("carolalbas")
  const [busca, setBusca] = useState("")
  const [criando, setCriando] = useState(false)
  const selecao = useSelecao()
  const consulta = busca.trim().toLocaleLowerCase()

  const seriesDoPerfil = series
    .filter((serie) => serie.perfil === perfil)
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"))
  const grupos = seriesDoPerfil.flatMap((serie) => {
    const daSerie = subseries.filter((subserie) => {
      if (subserie.serieId !== serie.id) return false
      if (!consulta) return true
      return [subserie.nome, subserie.descricao ?? "", serie.nome].join(" ").toLocaleLowerCase().includes(consulta)
    })
    return daSerie.length > 0 ? [{ serie, subseries: daSerie }] : []
  })
  const total = subseries.filter((subserie) => subserie.perfil === perfil).length
  const idsVisiveis = grupos.flatMap((grupo) => grupo.subseries.map((subserie) => subserie.id))

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Perfil">
          {PERFIS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={perfil === item}
              onClick={() => {
                setPerfil(item)
                selecao.limpar()
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                perfil === item ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
              )}
            >
              {PERFIL_LABEL[item]}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "subsérie" : "subséries"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar subsérie"
            aria-label="Buscar subsérie"
            className="min-w-0 flex-1"
          />
          {idsVisiveis.length > 0 ? <BotaoSelecionar selecao={selecao} /> : null}
          <Button
            type="button"
            variant={criando ? "default" : "outline"}
            disabled={seriesDoPerfil.length === 0}
            onClick={() => setCriando((aberto) => !aberto)}
          >
            Nova subsérie
          </Button>
        </div>
      </div>
      {criando ? (
        <FormularioSubserie key={perfil} series={seriesDoPerfil} aoFechar={() => setCriando(false)} />
      ) : null}
      {grupos.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
          {consulta
            ? "Nenhuma subsérie com esse nome."
            : seriesDoPerfil.length === 0
              ? `${PERFIL_LABEL[perfil]} ainda não tem séries. Crie uma série antes.`
              : `${PERFIL_LABEL[perfil]} ainda não tem subséries.`}
        </p>
      ) : (
        grupos.map(({ serie, subseries: daSerie }) => (
          <section key={serie.id} className="flex flex-col gap-3">
            <Link href={`/series/ver?id=${serie.id}`} className="text-sm font-medium hover:underline">
              {serie.emoji ? <span className="mr-1">{serie.emoji}</span> : null}
              {serie.nome}
            </Link>
            <CartoesSubseries subseries={daSerie} serieNome={serie.nome} corDaSeriePai={serie.cor} selecao={selecao} />
          </section>
        ))
      )}
      <BarraSelecao selecao={selecao} ids={idsVisiveis} singular="subsérie marcada" plural="subséries marcadas">
        {(marcados, terminar) => <AcoesSubseries ids={marcados} perfil={perfil} terminar={terminar} />}
      </BarraSelecao>
    </div>
  )
}
