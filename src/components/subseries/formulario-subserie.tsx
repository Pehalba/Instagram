"use client"

import { useActionState, useEffect } from "react"
import { useBanco } from "@/components/dados/provedor-firebase"
import { EscolhaAparencia } from "@/components/series/escolha-aparencia"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { EstadoGravacao } from "@/lib/gravar-nuvem"

export function FormularioSubserie({
  series,
  serieFixa,
  aoFechar,
}: {
  series: { id: string; nome: string }[]
  serieFixa?: string
  aoFechar: () => void
}) {
  const banco = useBanco()
  const [estado, acao, pendente] = useActionState<EstadoGravacao, FormData>(banco.criarSubserie, {})

  useEffect(() => {
    if (estado.ok) aoFechar()
  }, [aoFechar, estado.ok])

  return (
    <form action={acao} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <label className="grid gap-1 text-xs text-muted-foreground">
        Nome
        <Input name="nome" required placeholder="Nome da subsérie" className="bg-background" />
      </label>
      {serieFixa ? (
        <input type="hidden" name="serieId" value={serieFixa} />
      ) : (
        <label className="grid max-w-sm gap-1 text-xs text-muted-foreground">
          Série
          <select
            name="serieId"
            required
            defaultValue=""
            className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>Escolha a série</option>
            {series.map((serie) => (
              <option key={serie.id} value={serie.id}>{serie.nome}</option>
            ))}
          </select>
        </label>
      )}
      <label className="grid gap-1 text-xs text-muted-foreground">
        Descrição
        <Input name="descricao" placeholder="Opcional" className="bg-background" />
      </label>
      <EscolhaAparencia />
      {estado.erro ? <p className="text-sm text-destructive">{estado.erro}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pendente}>{pendente ? "Criando…" : "Criar subsérie"}</Button>
        <Button type="button" variant="ghost" onClick={aoFechar}>Cancelar</Button>
      </div>
    </form>
  )
}
