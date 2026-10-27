"use client"

import { PERFIS, PERFIL_LABEL, type Perfil } from "@/lib/conteudo"
import { cn } from "cn"

export function FiltroPerfil({
  valor,
  aoMudar,
}: {
  valor: Perfil | ""
  aoMudar: (perfil: Perfil | "") => void
}) {
  const opcoes: { id: Perfil | ""; rotulo: string }[] = [
    { id: "", rotulo: "Os dois" },
    ...PERFIS.map((perfil) => ({ id: perfil, rotulo: PERFIL_LABEL[perfil] })),
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((opcao) => (
        <button
          key={opcao.id || "todos"}
          type="button"
          onClick={() => aoMudar(opcao.id)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            valor === opcao.id ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
          )}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  )
}
