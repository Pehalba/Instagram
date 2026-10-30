"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

function gravarTema(escuro: boolean) {
  document.cookie = `tema=${escuro ? "escuro" : "claro"}; path=/; max-age=31536000; samesite=lax`
}

export function AlternarTema() {
  const [escuro, setEscuro] = useState(false)

  useEffect(() => {
    let atual = document.documentElement.classList.contains("dark")
    const antigo = localStorage.getItem("tema")
    if (antigo && !document.cookie.includes("tema=")) {
      atual = antigo === "escuro"
      document.documentElement.classList.toggle("dark", atual)
      gravarTema(atual)
    }
    setEscuro(atual)
  }, [])

  function alternar() {
    const proximo = !document.documentElement.classList.contains("dark")
    document.documentElement.classList.toggle("dark", proximo)
    gravarTema(proximo)
    localStorage.setItem("tema", proximo ? "escuro" : "claro")
    setEscuro(proximo)
  }

  return (
    <Button variant="outline" size="lg" className="w-full" onClick={alternar}>
      {escuro ? <Sun /> : <Moon />}
      {escuro ? "Modo claro" : "Modo escuro"}
    </Button>
  )
}
