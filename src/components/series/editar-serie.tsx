"use client"

import { useActionState, useEffect, useState } from "react"
import { Pencil } from "lucide-react"
import { editarSerie, type EstadoSerie } from "@/app/series/acoes"
import { useFirebase } from "@/components/dados/provedor-firebase"
import { RemoverSerie } from "@/components/series/remover-serie"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PERFIL_LABEL, type Perfil } from "@/lib/conteudo"

export function EditarSerie({
  id,
  nome,
  perfil,
  descricao,
  quadroFixo,
  ideias,
}: {
  id: string
  nome: string
  perfil: Perfil
  descricao: string | null
  quadroFixo: boolean
  ideias: number
}) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="shrink-0"
        aria-label={`Editar ${nome}`}
        onClick={() => setAberto(true)}
      >
        <Pencil />
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          {aberto ? (
            <Formulario
              key={id}
              id={id}
              nome={nome}
              perfil={perfil}
              descricao={descricao}
              quadroFixo={quadroFixo}
              ideias={ideias}
              aoSalvar={() => setAberto(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Formulario({
  id,
  nome,
  perfil,
  descricao,
  quadroFixo,
  ideias,
  aoSalvar,
}: {
  id: string
  nome: string
  perfil: Perfil
  descricao: string | null
  quadroFixo: boolean
  ideias: number
  aoSalvar: () => void
}) {
  const nuvem = useFirebase()
  const [estado, acao, pendente] = useActionState<EstadoSerie, FormData>(nuvem?.editarSerie ?? editarSerie, {})

  useEffect(() => {
    if (estado.ok) aoSalvar()
  }, [aoSalvar, estado.ok])

  return (
    <>
      <DialogHeader>
        <DialogTitle className="pr-8 text-2xl">Editar série</DialogTitle>
        <DialogDescription>{PERFIL_LABEL[perfil]}</DialogDescription>
      </DialogHeader>
      <form action={acao} className="flex flex-col gap-3 px-4">
        <input type="hidden" name="id" value={id} />
        <label className="grid gap-1 text-xs text-muted-foreground">
          Nome
          <Input name="nome" required defaultValue={nome} className="bg-background" />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Descrição
          <Input name="descricao" defaultValue={descricao ?? ""} placeholder="Opcional" className="bg-background" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="quadroFixo" defaultChecked={quadroFixo} className="size-4 accent-foreground" />
          Quadro fixo
        </label>
        {estado.erro ? <p className="text-sm text-destructive">{estado.erro}</p> : null}
        <Button type="submit" disabled={pendente}>{pendente ? "Salvando…" : "Salvar"}</Button>
      </form>
      <div className="mt-auto border-t px-4 py-4">
        <RemoverSerie id={id} nome={nome} ideias={ideias} />
      </div>
    </>
  )
}
