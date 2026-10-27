"use client"

import { useEffect, useMemo, useState } from "react"
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
import { agendarIdeia } from "@/app/ideias/acoes"
import { deteccao } from "@/components/quadro/deteccao"
import { FiltroPerfil } from "@/components/quadro/filtro-perfil"
import { Button } from "@/components/ui/button"
import {
  DIAS_CURTOS,
  diasDaSemana,
  gradeDoMes,
  inicioDaSemana,
  mesmoMes,
  mesAnterior,
  mesSeguinte,
  indiceSemana,
  numeroDia,
  rotuloDia,
  somarDias,
  tituloMes,
} from "@/lib/datas"
import { PERFIL_LABEL, type Perfil } from "@/lib/conteudo"
import type { CartaoQuadro } from "@/lib/tipos-ideia"
import { cn } from "cn"

export function CalendarioEditorial({ ideias, hoje }: { ideias: CartaoQuadro[]; hoje: string }) {
  const [visao, setVisao] = useState<"semana" | "mes">("semana")
  const [ancora, setAncora] = useState(hoje)
  const [perfil, setPerfil] = useState<Perfil | "">("")
  const [itens, setItens] = useState(ideias)
  const [diaAberto, setDiaAberto] = useState(hoje)
  const [arrastando, setArrastando] = useState<CartaoQuadro | null>(null)
  const [telaLarga, setTelaLarga] = useState(false)
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => {
    const consulta = window.matchMedia("(min-width: 640px)")
    const atualizar = () => setTelaLarga(consulta.matches)
    atualizar()
    consulta.addEventListener("change", atualizar)
    return () => consulta.removeEventListener("change", atualizar)
  }, [])

  useEffect(() => {
    setItens(ideias)
  }, [ideias])

  const visiveis = perfil ? itens.filter((ideia) => ideia.perfil === perfil) : itens
  const semData = visiveis.filter((ideia) => !ideia.dataPlanejada)
  const dias = visao === "semana" ? diasDaSemana(ancora) : gradeDoMes(ancora)
  const porDia = useMemo(() => {
    const mapa = new Map<string, CartaoQuadro[]>()
    for (const ideia of visiveis) {
      if (!ideia.dataPlanejada) continue
      const lista = mapa.get(ideia.dataPlanejada) ?? []
      lista.push(ideia)
      mapa.set(ideia.dataPlanejada, lista)
    }
    return mapa
  }, [visiveis])

  const titulo =
    visao === "mes"
      ? tituloMes(ancora)
      : `${rotuloDia(inicioDaSemana(ancora))} – ${rotuloDia(somarDias(inicioDaSemana(ancora), 6))}`

  function aoComecar(evento: DragStartEvent) {
    setArrastando(itens.find((ideia) => ideia.id === String(evento.active.id)) ?? null)
  }

  async function aoSoltar(evento: DragEndEvent) {
    setArrastando(null)
    if (!evento.over) return
    const destino = String(evento.over.id)
    const id = String(evento.active.id)
    const atual = itens.find((ideia) => ideia.id === id)
    if (!atual) return

    const novaData = destino === "sem-data" ? null : destino.startsWith("dia:") ? destino.slice(4) : undefined
    if (novaData === undefined || novaData === atual.dataPlanejada) return

    const anterior = itens
    setItens((lista) => lista.map((ideia) => (ideia.id === id ? { ...ideia, dataPlanejada: novaData } : ideia)))
    if (novaData) setDiaAberto(novaData)
    try {
      await agendarIdeia(id, novaData)
    } catch {
      setItens(anterior)
    }
  }

  function anterior() {
    setAncora(visao === "semana" ? somarDias(ancora, -7) : mesAnterior(ancora))
  }

  function proximo() {
    setAncora(visao === "semana" ? somarDias(ancora, 7) : mesSeguinte(ancora))
  }

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={deteccao}
      onDragStart={aoComecar}
      onDragEnd={aoSoltar}
      onDragCancel={() => setArrastando(null)}
    >
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-5xl leading-none">Calendário</h1>
            <p className="mt-2 text-sm text-muted-foreground">Arraste uma ideia para o dia da postagem.</p>
          </div>
          <FiltroPerfil valor={perfil} aoMudar={setPerfil} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant={visao === "semana" ? "default" : "outline"} onClick={() => setVisao("semana")}>
            Semana
          </Button>
          <Button type="button" variant={visao === "mes" ? "default" : "outline"} onClick={() => setVisao("mes")}>
            Mês
          </Button>
          <Button type="button" variant="outline" onClick={anterior}>
            Anterior
          </Button>
          <Button type="button" variant="ghost" onClick={() => { setAncora(hoje); setDiaAberto(hoje) }}>
            Hoje
          </Button>
          <Button type="button" variant="outline" onClick={proximo}>
            Próximo
          </Button>
          <p className="font-heading px-1 text-2xl">{titulo}</p>
        </div>
        <p className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-carol" /> @carolalbas
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-casal" /> @albascouple
          </span>
        </p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[18rem_1fr]">
        <SemData ideias={semData} />
        {visao === "semana" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
            {dias.map((dia) => (
              <Dia
                key={dia}
                iso={dia}
                hoje={hoje}
                ideias={porDia.get(dia) ?? []}
                mostrarNome
                interativo
                aberto={diaAberto === dia}
                aoAbrir={() => setDiaAberto(dia)}
              />
            ))}
          </div>
        ) : (
          <div>
            <div className="mb-1 grid grid-cols-7 gap-1">
              {DIAS_CURTOS.map((dia) => (
                <p key={dia} className="px-1 text-xs tracking-wide text-muted-foreground uppercase">
                  {dia}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {dias.map((dia) => (
                <Dia
                  key={dia}
                  iso={dia}
                  hoje={hoje}
                  ideias={porDia.get(dia) ?? []}
                  fora={!mesmoMes(dia, ancora)}
                  compacto
                  interativo={telaLarga}
                  aberto={diaAberto === dia}
                  aoAbrir={() => setDiaAberto(dia)}
                />
              ))}
            </div>
            {telaLarga ? null : <DiaAberto iso={diaAberto} ideias={porDia.get(diaAberto) ?? []} />}
          </div>
        )}
      </div>
      <DragOverlay>{arrastando ? <Pílula ideia={arrastando} /> : null}</DragOverlay>
    </DndContext>
  )
}

function SemData({ ideias }: { ideias: CartaoQuadro[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "sem-data" })

  return (
    <section
      ref={setNodeRef}
      className={cn("rounded-2xl bg-muted/70 p-3", isOver && "ring-2 ring-primary")}
    >
      <h2 className="font-heading text-2xl">Sem data</h2>
      <p className="mb-3 text-sm text-muted-foreground">{ideias.length} ideias</p>
      <div className="flex max-h-80 flex-col gap-2 overflow-y-auto lg:max-h-[70vh]">
        {ideias.map((ideia) => (
          <ItemArrastavel key={ideia.id} ideia={ideia} />
        ))}
      </div>
    </section>
  )
}

function Dia({
  iso,
  hoje,
  ideias,
  mostrarNome = false,
  compacto = false,
  interativo = true,
  fora = false,
  aberto,
  aoAbrir,
}: {
  iso: string
  hoje: string
  ideias: CartaoQuadro[]
  mostrarNome?: boolean
  compacto?: boolean
  interativo?: boolean
  fora?: boolean
  aberto: boolean
  aoAbrir: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `dia:${iso}` })
  const indice = indiceSemana(iso)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-28 min-w-0 rounded-xl border bg-card p-1.5",
        iso === hoje && "border-primary",
        aberto && compacto && "ring-2 ring-primary/50",
        isOver && "bg-primary/10 ring-2 ring-primary",
        fora && "opacity-45",
      )}
    >
      <button type="button" onClick={aoAbrir} className="mb-1 block w-full text-left">
        {mostrarNome ? (
          <span className="text-xs tracking-wide text-muted-foreground uppercase">{DIAS_CURTOS[indice]}</span>
        ) : null}
        <span className={cn("block text-sm", iso === hoje && "font-medium text-primary")}>{numeroDia(iso)}</span>
      </button>
      {interativo ? (
        <div className="flex flex-col gap-1">
          {ideias.slice(0, compacto ? 3 : 8).map((ideia) => (
            <ItemArrastavel key={ideia.id} ideia={ideia} />
          ))}
          {ideias.length > (compacto ? 3 : 8) ? (
            <span className="px-1 text-xs text-muted-foreground">+{ideias.length - (compacto ? 3 : 8)}</span>
          ) : null}
        </div>
      ) : ideias.length > 0 ? (
        <div className="flex gap-1">
          {ideias.slice(0, 3).map((ideia) => (
            <span
              key={ideia.id}
              className={cn("size-1.5 rounded-full", ideia.perfil === "carolalbas" ? "bg-carol" : "bg-casal")}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function DiaAberto({ iso, ideias }: { iso: string; ideias: CartaoQuadro[] }) {
  return (
    <section className="mt-3 rounded-2xl border bg-card p-3 sm:hidden">
      <h2 className="font-heading text-2xl">{rotuloDia(iso)}</h2>
      {ideias.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nada neste dia.</p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {ideias.map((ideia) => (
            <ItemArrastavel key={ideia.id} ideia={ideia} />
          ))}
        </div>
      )}
    </section>
  )
}

function ItemArrastavel({ ideia }: { ideia: CartaoQuadro }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ideia.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: transform ? CSS.Translate.toString(transform) : undefined }}
      className={isDragging ? "opacity-40" : undefined}
    >
      <Pílula ideia={ideia} alca={{ attributes, listeners }} />
    </div>
  )
}

function Pílula({
  ideia,
  alca,
}: {
  ideia: CartaoQuadro
  alca?: {
    attributes: ReturnType<typeof useDraggable>["attributes"]
    listeners: ReturnType<typeof useDraggable>["listeners"]
  }
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-1 rounded-lg border px-1.5 py-1",
        ideia.perfil === "carolalbas" ? "border-carol/40 bg-carol/15" : "border-casal/40 bg-casal/15",
      )}
    >
      <button
        type="button"
        className="mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label={`Arrastar ${ideia.titulo}`}
        {...alca?.attributes}
        {...alca?.listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <Link href={`/ideias/${ideia.id}`} className="min-w-0 text-xs leading-snug">
        <span className="line-clamp-3">{ideia.titulo}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">{PERFIL_LABEL[ideia.perfil]}</span>
      </Link>
    </div>
  )
}
