"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Trash2 } from "lucide-react"
import { removerSerie } from "@/app/series/acoes"
import { useFirebase } from "@/components/dados/provedor-firebase"
import { Button } from "@/components/ui/button"

export function RemoverSerie({
  id,
  nome,
  ideias,
  voltar = false,
}: {
  id: string
  nome: string
  ideias: number
  voltar?: boolean
}) {
  const nuvem = useFirebase()
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const aviso = ideias === 0
    ? "Esta série não tem ideias."
    : `${ideias} ${ideias === 1 ? "ideia continua" : "ideias continuam"} no banco, em Sem série.`

  if (!aberto) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        aria-label={`Remover ${nome}`}
        onClick={() => setAberto(true)}
      >
        <Trash2 />
        Remover
      </Button>
    )
  }

  return (
    <form action={removerSerie} className="flex flex-col gap-2 rounded-xl border bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">Remover {nome}? {aviso}</p>
      <input type="hidden" name="id" value={id} />
      {voltar ? <input type="hidden" name="voltar" value="1" /> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="destructive" size="xs">Remover</Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => setAberto(false)}>Cancelar</Button>
      </div>
    </form>
  )
}
