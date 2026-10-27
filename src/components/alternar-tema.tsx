"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function AlternarTema() {
  const [escuro, setEscuro] = useState(false)

  useEffect(() => {
    setEscuro(document.documentElement.classList.contains("dark"))
  }, [])

  function alternar() {
    const proximo = !document.documentElement.classList.contains("dark")
    document.documentElement.classList.toggle("dark", proximo)
    localStorage.setItem("tema", proximo ? "escuro" : "claro")
    setEscuro(proximo)
  }

  return (
    <Button variant="outline" onClick={alternar}>
      {escuro ? "Modo claro" : "Modo escuro"}
    </Button>
  )
}
