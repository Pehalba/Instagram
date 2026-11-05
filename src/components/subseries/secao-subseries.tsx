"use client"

import { useState } from "react"
import { AcoesSubseries } from "@/components/selecao/acoes-em-massa"
import { BarraSelecao, BotaoSelecionar, useSelecao } from "@/components/selecao/selecao"
import { CartoesSubseries, type CartaoSubserie } from "@/components/subseries/cartoes-subseries"
import { FormularioSubserie } from "@/components/subseries/formulario-subserie"
import { Button } from "@/components/ui/button"
import type { SerieNuvem } from "@/lib/gravar-nuvem"

export function SecaoSubseries({
  serie,
  subseries,
  soltas = 0,
}: {
  serie: SerieNuvem
  subseries: CartaoSubserie[]
  soltas?: number
}) {
  const [criando, setCriando] = useState(false)
  const selecao = useSelecao()

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Subséries {subseries.length > 0 ? `· ${subseries.length}` : ""}
        </h2>
        <div className="flex gap-2">
          {subseries.length > 0 ? <BotaoSelecionar selecao={selecao} /> : null}
          <Button type="button" variant={criando ? "default" : "outline"} onClick={() => setCriando((aberto) => !aberto)}>
            Nova subsérie
          </Button>
        </div>
      </div>
      {criando ? (
        <FormularioSubserie series={[serie]} serieFixa={serie.id} aoFechar={() => setCriando(false)} />
      ) : null}
      {subseries.length > 0 ? (
        <CartoesSubseries
          subseries={subseries}
          serieNome={serie.nome}
          corDaSeriePai={serie.cor}
          soltas={{ href: `/series/ver?id=${serie.id}&soltas=1`, total: soltas }}
          selecao={selecao}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Esta série ainda não tem subséries.</p>
      )}
      <BarraSelecao selecao={selecao} ids={subseries.map((subserie) => subserie.id)} singular="subsérie marcada" plural="subséries marcadas">
        {(marcados, terminar) => <AcoesSubseries ids={marcados} perfil={serie.perfil} terminar={terminar} />}
      </BarraSelecao>
    </section>
  )
}
