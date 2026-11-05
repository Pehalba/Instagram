"use client"

import { useState } from "react"
import { CartaoIdeia } from "@/components/banco/cartao-ideia"
import { DrawerIdeia } from "@/components/banco/drawer-ideia"
import { AcoesIdeias } from "@/components/selecao/acoes-em-massa"
import { BarraSelecao, BotaoSelecionar, useSelecao } from "@/components/selecao/selecao"
import { Button } from "@/components/ui/button"
import type { Perfil } from "@/lib/conteudo"
import type { IdeiaLista, SerieOpcao } from "@/lib/tipos-ideia"

export function ListaIdeiasSerie({
  ideias,
  series,
  perfil,
  serieId,
  subserieId = null,
  vazio = "Nenhuma ideia nesta série.",
}: {
  ideias: IdeiaLista[]
  series: SerieOpcao[]
  perfil: Perfil
  serieId: string | null
  subserieId?: string | null
  vazio?: string
}) {
  const [alvo, setAlvo] = useState<IdeiaLista | null>(null)
  const [criando, setCriando] = useState(false)
  const selecao = useSelecao()

  function fechar() {
    setAlvo(null)
    setCriando(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        {ideias.length > 0 ? <BotaoSelecionar selecao={selecao} /> : null}
        <Button type="button" onClick={() => setCriando(true)}>
          Nova ideia
        </Button>
      </div>
      {ideias.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
          {vazio}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ideias.map((ideia) => (
            <CartaoIdeia
              key={ideia.id}
              ideia={ideia}
              onAbrir={() => setAlvo(ideia)}
              selecao={selecao.ativa ? { marcado: selecao.marcados.has(ideia.id), alternar: () => selecao.alternar(ideia.id) } : undefined}
            />
          ))}
        </ul>
      )}
      <BarraSelecao selecao={selecao} ids={ideias.map((ideia) => ideia.id)} singular="ideia marcada" plural="ideias marcadas">
        {(marcados, terminar) => <AcoesIdeias ids={marcados} perfil={perfil} terminar={terminar} />}
      </BarraSelecao>
      <DrawerIdeia
        aberto={alvo !== null || criando}
        ideia={alvo}
        series={series}
        padrao={{ perfil, serieId, subserieId }}
        onFechar={fechar}
      />
    </div>
  )
}
