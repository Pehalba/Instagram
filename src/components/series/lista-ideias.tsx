"use client"

import { useState } from "react"
import { CartaoIdeia } from "@/components/banco/cartao-ideia"
import { DrawerIdeia } from "@/components/banco/drawer-ideia"
import { Button } from "@/components/ui/button"
import type { Perfil } from "@/lib/conteudo"
import type { IdeiaLista, SerieOpcao } from "@/lib/tipos-ideia"

export function ListaIdeiasSerie({
  ideias,
  series,
  perfil,
  serieId,
}: {
  ideias: IdeiaLista[]
  series: SerieOpcao[]
  perfil: Perfil
  serieId: string | null
}) {
  const [alvo, setAlvo] = useState<IdeiaLista | null>(null)
  const [criando, setCriando] = useState(false)

  function fechar() {
    setAlvo(null)
    setCriando(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setCriando(true)}>
          Nova ideia
        </Button>
      </div>
      {ideias.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
          Nenhuma ideia nesta série.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ideias.map((ideia) => (
            <CartaoIdeia key={ideia.id} ideia={ideia} onAbrir={() => setAlvo(ideia)} />
          ))}
        </ul>
      )}
      <DrawerIdeia
        aberto={alvo !== null || criando}
        ideia={alvo}
        series={series}
        padrao={{ perfil, serieId }}
        onFechar={fechar}
      />
    </div>
  )
}
