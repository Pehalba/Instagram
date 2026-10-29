"use client"

import { useState, type ComponentProps } from "react"
import { CartoesInicio, type CartaoInicio } from "@/components/inicio/cartoes"
import { PainelInicio } from "@/components/inicio/painel"
import { PERFIS, PERFIL_LABEL, type Perfil } from "@/lib/conteudo"
import { cn } from "cn"

type Painel = ComponentProps<typeof PainelInicio>

export function Inicio({
  resumos,
}: {
  resumos: Record<Perfil, { cartoes: CartaoInicio[]; painel: Painel }>
}) {
  const [perfil, setPerfil] = useState<Perfil>("carolalbas")
  const atual = resumos[perfil]

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-1 flex-col gap-8 px-4 py-6 sm:gap-10 sm:px-8 sm:py-12">
      <header>
        <p className="text-sm tracking-[0.18em] text-muted-foreground uppercase">Produção de conteúdo</p>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Perfil">
          {PERFIS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={perfil === item}
              onClick={() => setPerfil(item)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                perfil === item ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
              )}
            >
              {PERFIL_LABEL[item]}
            </button>
          ))}
        </div>
      </header>

      <CartoesInicio key={perfil} cartoes={atual.cartoes} />
      <PainelInicio {...atual.painel} />
    </main>
  )
}
