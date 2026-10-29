"use client"

import { memo, useEffect, useMemo, useState } from "react"
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
import { GripVertical, ListFilter } from "lucide-react"
import { moverStatus } from "@/app/ideias/acoes"
import { useFirebase } from "@/components/dados/provedor-firebase"
import { deteccao } from "@/components/quadro/deteccao"
import { FiltroPerfil } from "@/components/quadro/filtro-perfil"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  PERFIS,
  PERFIL_LABEL,
  PRIORIDADES,
  PRIORIDADE_LABEL,
  STATUS,
  STATUS_LABEL,
  classeBordaPerfil,
  eStatus,
  type Perfil,
  type Prioridade,
} from "@/lib/conteudo"
import type { CartaoQuadro } from "@/lib/tipos-ideia"
import { cn } from "cn"

const LOTE = 24

export function QuadroKanban({ ideias }: { ideias: CartaoQuadro[] }) {
  const nuvem = useFirebase()
  const [perfil, setPerfil] = useState<Perfil | "">("")
  const [prioridade, setPrioridade] = useState<Prioridade | "">("")
  const [serie, setSerie] = useState("")
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [busca, setBusca] = useState("")
  const [itens, setItens] = useState(ideias)
  const [arrastando, setArrastando] = useState<CartaoQuadro | null>(null)
  const sensores = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => {
    setItens(ideias)
  }, [ideias])

  const series = useMemo(() => {
    const nomes = new Set<string>()
    for (const ideia of itens) {
      if (ideia.serieNome) nomes.add(ideia.serieNome)
    }
    return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [itens])

  const visiveis = useMemo(() => {
    const consulta = busca.trim().toLocaleLowerCase()
    return itens.filter((ideia) => {
      if (perfil && ideia.perfil !== perfil) return false
      if (prioridade && ideia.prioridade !== prioridade) return false
      if (serie === "sem-serie" && ideia.serieNome) return false
      if (serie && serie !== "sem-serie" && ideia.serieNome !== serie) return false
      if (!consulta) return true
      return ideia.titulo.toLocaleLowerCase().includes(consulta) || (ideia.serieNome ?? "").toLocaleLowerCase().includes(consulta)
    })
  }, [busca, itens, perfil, prioridade, serie])

  const filtrosEspecificos = Boolean(perfil || prioridade || serie)

  function limparFiltros() {
    setPerfil("")
    setPrioridade("")
    setSerie("")
  }

  const porStatus = useMemo(() => {
    const mapa = new Map<(typeof COLUNAS)[number], CartaoQuadro[]>()
    for (const status of COLUNAS) mapa.set(status, [])
    for (const ideia of visiveis) {
      if (ideia.status === "AGENDADO") continue
      mapa.get(ideia.status)?.push(ideia)
    }
    return mapa
  }, [visiveis])

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
      await (nuvem?.moverStatus ?? moverStatus)(id, destino)
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
      <div className="mb-4">
        <h1 className="font-heading text-3xl leading-tight sm:text-4xl lg:text-5xl">Planejamento</h1>
        <p className="mt-2 text-sm text-muted-foreground">Arraste pelo ícone para mudar o status.</p>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <Input
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Buscar no quadro"
          aria-label="Buscar no quadro"
          className="min-w-0 flex-1 bg-card sm:max-w-sm"
        />
        <Button
          type="button"
          size="icon"
          variant={filtrosAbertos || filtrosEspecificos ? "default" : "outline"}
          aria-expanded={filtrosAbertos}
          aria-label={filtrosAbertos ? "Fechar filtros" : "Abrir filtros"}
          onClick={() => setFiltrosAbertos((aberto) => !aberto)}
        >
          <ListFilter />
        </Button>
      </div>
      {filtrosAbertos ? (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border bg-card p-3">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Perfil</p>
            <FiltroPerfil valor={perfil} aoMudar={setPerfil} />
          </div>
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Prioridade</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPrioridade("")}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  prioridade === "" ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground",
                )}
              >
                Todas
              </button>
              {PRIORIDADES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPrioridade(item)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm",
                    prioridade === item ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground",
                  )}
                >
                  {PRIORIDADE_LABEL[item]}
                </button>
              ))}
            </div>
          </div>
          <label className="grid max-w-sm gap-1 text-xs text-muted-foreground">
            Série
            <select
              className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={serie}
              onChange={(evento) => setSerie(evento.target.value)}
            >
              <option value="">Todas as séries</option>
              <option value="sem-serie">Sem série</option>
              {series.map((nome) => (
                <option key={nome} value={nome}>{nome}</option>
              ))}
            </select>
          </label>
          {filtrosEspecificos ? (
            <Button type="button" variant="ghost" className="w-fit" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="flex w-full min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto pb-4 xl:grid xl:grid-cols-6 xl:overflow-visible">
        {COLUNAS.map((status) => (
          <Coluna key={status} status={status} ideias={porStatus.get(status) ?? VAZIO} />
        ))}
      </div>
      <DragOverlay>
        {arrastando ? <CartaoVisual ideia={arrastando} arrastando /> : null}
      </DragOverlay>
    </DndContext>
  )
}

const COLUNAS = STATUS.filter((status) => status !== "AGENDADO")
const VAZIO: CartaoQuadro[] = []

const selectColuna =
  "h-8 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const Coluna = memo(function Coluna({ status, ideias }: { status: (typeof COLUNAS)[number]; ideias: CartaoQuadro[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const [limite, setLimite] = useState(LOTE)
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState("")
  const [perfil, setPerfil] = useState<Perfil | "">("")
  const [serie, setSerie] = useState("")
  const rotulo = STATUS_LABEL[status]

  const series = useMemo(() => {
    const nomes = new Set<string>()
    for (const ideia of ideias) {
      if (ideia.serieNome) nomes.add(ideia.serieNome)
    }
    return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [ideias])

  const filtradas = useMemo(() => {
    const consulta = nome.trim().toLocaleLowerCase()
    return ideias.filter((ideia) => {
      if (perfil && ideia.perfil !== perfil) return false
      if (serie === "sem-serie" && ideia.serieNome) return false
      if (serie && serie !== "sem-serie" && ideia.serieNome !== serie) return false
      if (!consulta) return true
      return ideia.titulo.toLocaleLowerCase().includes(consulta)
    })
  }, [ideias, nome, perfil, serie])

  const ativo = Boolean(nome.trim() || perfil || serie)
  const trecho = filtradas.length > limite ? filtradas.slice(0, limite) : filtradas

  useEffect(() => {
    setLimite(LOTE)
  }, [nome, perfil, serie])

  function limpar() {
    setNome("")
    setPerfil("")
    setSerie("")
  }

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[min(18rem,82vw)] shrink-0 snap-start flex-col rounded-2xl bg-muted/50 p-2 xl:w-auto xl:min-w-0",
        isOver && "ring-2 ring-primary",
      )}
    >
      <header className="flex items-start justify-between gap-1 px-1 py-2">
        <h2 className="min-w-0 flex-1 text-xs leading-snug font-medium tracking-wide text-muted-foreground uppercase sm:text-sm">{rotulo}</h2>
        <div className="flex shrink-0 items-center gap-0.5">
          <span className="px-1 text-sm text-muted-foreground">{filtradas.length}</span>
          <Button
            type="button"
            size="icon-sm"
            variant={aberto || ativo ? "default" : "ghost"}
            aria-expanded={aberto}
            aria-label={aberto ? `Fechar filtro de ${rotulo}` : `Filtrar ${rotulo}`}
            onClick={() => setAberto((atual) => !atual)}
          >
            <ListFilter />
          </Button>
        </div>
      </header>
      {aberto ? (
        <div className="mb-2 flex flex-col gap-2 rounded-xl border bg-card p-2">
          <Input
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            placeholder="Nome"
            aria-label={`Nome em ${rotulo}`}
            className="h-8 bg-background"
          />
          <label className="grid gap-1 text-xs text-muted-foreground">
            Perfil
            <select className={selectColuna} value={perfil} onChange={(evento) => setPerfil(evento.target.value as Perfil | "")}>
              <option value="">Todos</option>
              {PERFIS.map((item) => (
                <option key={item} value={item}>{PERFIL_LABEL[item]}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Série
            <select className={selectColuna} value={serie} onChange={(evento) => setSerie(evento.target.value)}>
              <option value="">Todas as séries</option>
              <option value="sem-serie">Sem série</option>
              {series.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          {ativo ? (
            <Button type="button" variant="ghost" size="xs" className="w-fit" onClick={limpar}>
              Limpar
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="flex max-h-[calc(100vh-13rem)] min-h-40 flex-col gap-1.5 overflow-y-auto">
        {trecho.map((ideia) => (
          <Cartao key={ideia.id} ideia={ideia} />
        ))}
        {filtradas.length === 0 && ativo ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Nenhuma ideia com esse filtro.</p>
        ) : null}
        {filtradas.length > limite ? (
          <button
            type="button"
            className="rounded-lg px-2 py-2 text-left text-sm text-muted-foreground hover:bg-card"
            onClick={() => setLimite((atual) => atual + LOTE)}
          >
            Mostrar mais {filtradas.length - limite}
          </button>
        ) : null}
      </div>
    </section>
  )
})

const Cartao = memo(function Cartao({ ideia }: { ideia: CartaoQuadro }) {
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
})

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
        "rounded-lg border border-l-4 bg-card px-2.5 py-2",
        classeBordaPerfil(ideia.perfil),
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
          <Link href={`/ideias/${ideia.id}`} className="text-sm leading-snug">
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
