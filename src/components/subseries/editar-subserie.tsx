"use client"

import { useActionState, useEffect, useState } from "react"
import { Pencil } from "lucide-react"
import { useBanco } from "@/components/dados/provedor-firebase"
import { EscolhaAparencia } from "@/components/series/escolha-aparencia"
import { RemoverSubserie } from "@/components/subseries/remover-subserie"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { EstadoGravacao, SubserieNuvem } from "@/lib/gravar-nuvem"

export function EditarSubserie({
  subserie,
  serieNome,
  ideias,
  voltarPara,
}: {
  subserie: SubserieNuvem
  serieNome: string
  ideias: number
  voltarPara?: string
}) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="shrink-0"
        aria-label={`Editar ${subserie.nome}`}
        onClick={() => setAberto(true)}
      >
        <Pencil />
      </Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          {aberto ? (
            <Formulario
              key={subserie.id}
              subserie={subserie}
              serieNome={serieNome}
              ideias={ideias}
              voltarPara={voltarPara}
              aoSalvar={() => setAberto(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Formulario({
  subserie,
  serieNome,
  ideias,
  voltarPara,
  aoSalvar,
}: {
  subserie: SubserieNuvem
  serieNome: string
  ideias: number
  voltarPara?: string
  aoSalvar: () => void
}) {
  const banco = useBanco()
  const [estado, acao, pendente] = useActionState<EstadoGravacao, FormData>(banco.editarSubserie, {})

  useEffect(() => {
    if (estado.ok) aoSalvar()
  }, [aoSalvar, estado.ok])

  return (
    <>
      <DialogHeader>
        <DialogTitle className="pr-8 text-2xl">Editar subsérie</DialogTitle>
        <DialogDescription>Dentro de {serieNome}</DialogDescription>
      </DialogHeader>
      <form action={acao} className="flex flex-col gap-3 px-4">
        <input type="hidden" name="id" value={subserie.id} />
        <label className="grid gap-1 text-xs text-muted-foreground">
          Nome
          <Input name="nome" required defaultValue={subserie.nome} className="bg-background" />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Descrição
          <Input name="descricao" defaultValue={subserie.descricao ?? ""} placeholder="Opcional" className="bg-background" />
        </label>
        <EscolhaAparencia corInicial={subserie.cor} emojiInicial={subserie.emoji} />
        {estado.erro ? <p className="text-sm text-destructive">{estado.erro}</p> : null}
        <Button type="submit" disabled={pendente}>{pendente ? "Salvando…" : "Salvar"}</Button>
      </form>
      <div className="mt-auto border-t px-4 py-4">
        <RemoverSubserie id={subserie.id} nome={subserie.nome} ideias={ideias} voltarPara={voltarPara} />
      </div>
    </>
  )
}
