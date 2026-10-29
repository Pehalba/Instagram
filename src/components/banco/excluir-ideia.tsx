"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { excluirIdeia } from "@/app/ideias/acoes"
import { Button } from "@/components/ui/button"

export function ExcluirIdeia({
  id,
  titulo,
  temRoteiro,
  onExcluiu,
}: {
  id: string
  titulo: string
  temRoteiro?: boolean
  onExcluiu?: () => void
}) {
  const [aberto, setAberto] = useState(false)
  const aviso = temRoteiro ? "O roteiro sai junto." : "Essa ação não volta atrás."

  if (!aberto) {
    return (
      <Button type="button" variant="ghost" size="xs" aria-label={`Excluir ${titulo}`} onClick={() => setAberto(true)}>
        <Trash2 />
        Excluir
      </Button>
    )
  }

  return (
    <form
      action={async (form) => {
        await excluirIdeia(form)
        onExcluiu?.()
      }}
      className="flex flex-col gap-2 rounded-xl border bg-card px-3 py-2"
    >
      <p className="text-xs text-muted-foreground">Excluir {titulo}? {aviso}</p>
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="destructive" size="xs">Excluir</Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => setAberto(false)}>Cancelar</Button>
      </div>
    </form>
  )
}
