"use client"

import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FORMATO_LABEL, PERFIL_LABEL, PRIORIDADE_LABEL, STATUS_LABEL } from "@/lib/conteudo"
import type { IdeiaLista } from "@/lib/tipos-ideia"

export function CartaoIdeia({ ideia, onAbrir }: { ideia: IdeiaLista; onAbrir: () => void }) {
  const detalhes = [
    ideia.prioridade ? PRIORIDADE_LABEL[ideia.prioridade] : "Sem prioridade",
    ideia.formato ? FORMATO_LABEL[ideia.formato] : null,
    ideia.temRoteiro ? "Com roteiro" : null,
    ...ideia.tags,
  ].filter((item): item is string => Boolean(item))

  return (
    <li className="min-w-0">
      <article className="flex h-40 flex-col overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-1.5">
          <span className="truncate text-xs font-medium">{STATUS_LABEL[ideia.status]}</span>
          <span className={`ml-auto shrink-0 text-[11px] ${ideia.perfil === "carolalbas" ? "text-carol" : "text-casal"}`}>
            {PERFIL_LABEL[ideia.perfil]}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Editar ${ideia.titulo}`}
            onClick={onAbrir}
          >
            <Pencil />
          </Button>
        </div>
        <button type="button" className="flex min-h-0 flex-1 flex-col px-3 py-2.5 text-left" onClick={onAbrir}>
          <span className="line-clamp-2 text-sm leading-snug font-medium">{ideia.titulo}</span>
          <span className="mt-auto line-clamp-1 pt-2 text-xs text-muted-foreground">{detalhes.join(" · ")}</span>
        </button>
      </article>
    </li>
  )
}
