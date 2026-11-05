"use client"

import { useCallback, useState, type ReactNode } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

export type Selecao = {
  ativa: boolean
  marcados: Set<string>
  ligar: () => void
  sair: () => void
  alternar: (id: string) => void
  marcarTodos: (ids: string[]) => void
  limpar: () => void
}

export function useSelecao(): Selecao {
  const [ativa, setAtiva] = useState(false)
  const [marcados, setMarcados] = useState<Set<string>>(() => new Set())
  const limpar = useCallback(() => setMarcados(new Set()), [])
  const sair = useCallback(() => {
    setAtiva(false)
    setMarcados(new Set())
  }, [])
  const alternar = useCallback((id: string) => {
    setMarcados((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }, [])
  const marcarTodos = useCallback((ids: string[]) => setMarcados(new Set(ids)), [])
  return { ativa, marcados, ligar: () => setAtiva(true), sair, alternar, marcarTodos, limpar }
}

export function BotaoSelecionar({ selecao }: { selecao: Selecao }) {
  return (
    <Button type="button" variant={selecao.ativa ? "default" : "outline"} onClick={selecao.ativa ? selecao.sair : selecao.ligar}>
      {selecao.ativa ? "Cancelar seleção" : "Selecionar"}
    </Button>
  )
}

export function CamadaSelecao({
  marcado,
  rotulo,
  onAlternar,
}: {
  marcado: boolean
  rotulo: string
  onAlternar: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={marcado}
      aria-label={`${marcado ? "Desmarcar" : "Marcar"} ${rotulo}`}
      onClick={onAlternar}
      className={cn(
        "absolute inset-0 z-10 rounded-[inherit] text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        marcado ? "bg-primary/5 ring-2 ring-primary ring-inset" : "hover:bg-foreground/5",
      )}
    >
      <span
        className={cn(
          "absolute top-2 left-2 flex size-5 items-center justify-center rounded-md border",
          marcado ? "border-primary bg-primary text-primary-foreground" : "border-foreground/30 bg-background",
        )}
      >
        {marcado ? <Check className="size-3.5" /> : null}
      </span>
    </button>
  )
}

export function BarraSelecao({
  selecao,
  ids,
  singular,
  plural,
  children,
}: {
  selecao: Selecao
  ids: string[]
  singular: string
  plural: string
  children: (marcados: string[], terminar: () => void) => ReactNode
}) {
  if (!selecao.ativa) return null
  const marcados = ids.filter((id) => selecao.marcados.has(id))
  const todos = ids.length > 0 && marcados.length === ids.length

  return (
    <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border bg-popover p-3 shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">
          {marcados.length} {marcados.length === 1 ? singular : plural}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={() => (todos ? selecao.limpar() : selecao.marcarTodos(ids))}>
          {todos ? "Desmarcar todas" : `Marcar todas (${ids.length})`}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={selecao.sair}>
          Concluir
        </Button>
      </div>
      {marcados.length > 0 ? children(marcados, selecao.sair) : (
        <p className="text-xs text-muted-foreground">Toque nos cartões para marcar.</p>
      )}
    </div>
  )
}
