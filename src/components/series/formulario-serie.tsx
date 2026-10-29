"use client"

import { useActionState, useEffect } from "react"
import { criarSerie, type EstadoSerie } from "@/app/series/acoes"
import { useFirebase } from "@/components/dados/provedor-firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PERFIS, PERFIL_LABEL } from "@/lib/conteudo"

export function FormularioSerie({ aoFechar }: { aoFechar: () => void }) {
  const nuvem = useFirebase()
  const [estado, acao, pendente] = useActionState<EstadoSerie, FormData>(nuvem?.criarSerie ?? criarSerie, {})

  useEffect(() => {
    if (estado.ok) aoFechar()
  }, [aoFechar, estado.ok])

  return (
    <form action={acao} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <label className="grid gap-1 text-xs text-muted-foreground">
        Nome
        <Input name="nome" required placeholder="Nome da série" className="bg-background" />
      </label>
      <label className="grid max-w-sm gap-1 text-xs text-muted-foreground">
        Perfil
        <select
          name="perfil"
          defaultValue="carolalbas"
          className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {PERFIS.map((perfil) => (
            <option key={perfil} value={perfil}>{PERFIL_LABEL[perfil]}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Descrição
        <Input name="descricao" placeholder="Opcional" className="bg-background" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="quadroFixo" className="size-4 accent-foreground" />
        Quadro fixo
      </label>
      {estado.erro ? <p className="text-sm text-destructive">{estado.erro}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pendente}>{pendente ? "Criando…" : "Criar série"}</Button>
        <Button type="button" variant="ghost" onClick={aoFechar}>Cancelar</Button>
      </div>
    </form>
  )
}
