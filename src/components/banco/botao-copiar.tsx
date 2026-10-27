"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { textoParaCopiar } from "@/lib/texto-roteiro"

export function BotaoCopiar({
  legenda,
  cta,
  variante = "outline",
}: {
  legenda: string
  cta: string
  variante?: "outline" | "secondary"
}) {
  const [copiado, setCopiado] = useState(false)
  const texto = textoParaCopiar(legenda, cta)

  async function copiar() {
    if (!texto) return
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
    window.setTimeout(() => setCopiado(false), 1800)
  }

  return (
    <Button type="button" variant={variante} onClick={copiar} disabled={!texto}>
      {copiado ? "Copiado" : "Copiar legenda"}
    </Button>
  )
}
