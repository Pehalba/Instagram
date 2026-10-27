"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { moverStatus } from "@/app/ideias/acoes"
import { deteccao } from "@/components/quadro/deteccao"
import { FiltroPerfil } from "@/components/quadro/filtro-perfil"
import { PERFIL_LABEL, STATUS, STATUS_LABEL, eStatus, type Perfil } from "@/lib/conteudo"
import type { CartaoQuadro } from "@/lib/tipos-ideia"
import { cn } from "cn"

export function QuadroKanban({ ideias }: { ideias: CartaoQuadro[] }) {
  const [perfil, setPerfil] = useState<Perfil | "">("")
  const [itens, setItens] = useState(ideias)
  const [arrastando, setArrastando] = useState<CartaoQuadro | null>(null)
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => {
    setItens(ideias)
  }, [ideias])

  const visiveis = perfil ? itens.filter((ideia) => ideia.perfil === perfil) : itens

  function aoComecar(evento: DragStartEvent) {
    setArrastando(itens.find((ideia) => ideia.id === String(evento.active.id)) ?? null)
  }

  async function aoSoltar(evento: DragEndEvent) {
    setArrastando(null)
    const destino = evento.over ? String(evento.over.id) : ""
    const id = String(evento.active.id)
    if (!eStatus(destino)) return
    const atual = itens.find((ideia) => ideia.id === id)
    if (!atual || atual.status === destino) return

    const anterior = itens
    setItens((lista) => lista.map((ideia) => (ideia.id === id ? { ...ideia, status: destino } : ideia)))
    try {
      await moverStatus(id, destino)
    } catch {
      setItens(anterior)
    }
  }

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={deteccao}
      onDragStart={aoComecar}
      onDragEnd={aoSoltar}
      onDragCancel={() => setArrastando(null)}
    >
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-5xl leading-none">Kanban</h1>
          <p className="mt-2 text-sm text-muted-foreground">Arraste pelo ícone para mudar o status.</p>
        </div>
        <FiltroPerfil valor={perfil} aoMudar={setPerfil} />
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4">
        {STATUS.map((status) => (
          <Coluna key={status} status={status} ideias={visiveis.filter((ideia) => ideia.status === status)} />
        ))}
      </div>
      <DragOverlay>
        {arrastando ? <CartaoVisual ideia={arrastando} arrastando /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function Coluna({ status, ideias }: { status: (typeof STATUS)[number]; ideias: CartaoQuadro[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 snap-start flex-col rounded-2xl bg-muted/70 p-2",
        isOver && "ring-2 ring-primary",
      )}
    >
      <header className="flex items-baseline justify-between px-2 py-2">
        <h2 className="font-heading text-2xl leading-none">{STATUS_LABEL[status]}</h2>
        <span className="text-sm text-muted-foreground">{ideias.length}</span>
      </header>
      <div className="flex max-h-[calc(100vh-11rem)] min-h-48 flex-col gap-2 overflow-y-auto">
        {ideias.map((ideia) => (
          <Cartao key={ideia.id} ideia={ideia} />
        ))}
      </div>
    </section>
  )
}

function Cartao({ ideia }: { ideia: CartaoQuadro }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ideia.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: transform ? CSS.Translate.toString(transform) : undefined }}
      className={isDragging ? "opacity-40" : undefined}
    >
      <CartaoVisual ideia={ideia} alca={{ attributes, listeners }} />
    </div>
  )
}

function CartaoVisual({
  ideia,
  alca,
  arrastando = false,
}: {
  ideia: CartaoQuadro
  alca?: {
    attributes: ReturnType<typeof useDraggable>["attributes"]
    listeners: ReturnType<typeof useDraggable>["listeners"]
  }
  arrastando?: boolean
}) {
  return (
    <article
      className={cn(
        "rounded-xl border border-l-4 bg-card p-3 shadow-sm",
        ideia.perfil === "carolalbas" ? "border-l-carol" : "border-l-casal",
        arrastando && "shadow-lg",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          aria-label={`Arrastar ${ideia.titulo}`}
          {...alca?.attributes}
          {...alca?.listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0">
          <Link href={`/ideias/${ideia.id}`} className="font-heading text-xl leading-tight">
            {ideia.titulo}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {PERFIL_LABEL[ideia.perfil]}
            {ideia.serieNome ? ` · ${ideia.serieNome}` : ""}
          </p>
        </div>
      </div>
    </article>
  )
}
