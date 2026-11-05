"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Trash2 } from "lucide-react"
import { useBanco } from "@/components/dados/provedor-firebase"
import { Button } from "@/components/ui/button"

export function RemoverSerie({
  id,
  nome,
  ideias,
  subseries = 0,
  voltar = false,
}: {
  id: string
  nome: string
  ideias: number
  subseries?: number
  voltar?: boolean
}) {
  const banco = useBanco()
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const avisoIdeias = ideias === 0
    ? "Esta série não tem ideias."
    : `${ideias} ${ideias === 1 ? "ideia continua" : "ideias continuam"} no banco, em Sem série.`
  const aviso = subseries > 0
    ? `${avisoIdeias} ${subseries === 1 ? "A subsérie dela também sai." : `As ${subseries} subséries dela também saem.`}`
    : avisoIdeias

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
    <form
      action={async (form) => {
        await banco.removerSerie(form)
        if (voltar) router.push("/series")
      }}
      className="flex flex-col gap-2 rounded-xl border bg-card px-3 py-2"
    >
      <p className="text-xs text-muted-foreground">Remover {nome}? {aviso}</p>
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="destructive" size="xs">Remover</Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => setAberto(false)}>Cancelar</Button>
      </div>
    </form>
  )
}
