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
import { agendarIdeia } from "@/app/ideias/acoes"
import { useFirebase } from "@/components/dados/provedor-firebase"
import { deteccao } from "@/components/quadro/deteccao"
import { FiltroPerfil } from "@/components/quadro/filtro-perfil"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { PERFIS, PERFIL_LABEL, PRIORIDADES, PRIORIDADE_LABEL, classeFundoPerfil, classePontoPerfil, type Perfil, type Prioridade } from "@/lib/conteudo"
import type { CartaoQuadro } from "@/lib/tipos-ideia"
import { cn } from "cn"

export function CalendarioEditorial({ ideias, hoje }: { ideias: CartaoQuadro[]; hoje: string }) {
  const nuvem = useFirebase()
  const [visao, setVisao] = useState<"semana" | "mes">("mes")
  const [ancora, setAncora] = useState(hoje)
  const [perfil, setPerfil] = useState<Perfil | "">("")
  const [prioridade, setPrioridade] = useState<Prioridade | "">("")
  const [serie, setSerie] = useState("")
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [busca, setBusca] = useState("")
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

  const semData = useMemo(() => visiveis.filter((ideia) => !ideia.dataPlanejada), [visiveis])
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
      await (nuvem?.agendarIdeia ?? agendarIdeia)(id, novaData)
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
            <h1 className="font-heading text-3xl leading-tight sm:text-4xl lg:text-5xl">Calendário</h1>
            <p className="mt-2 text-sm text-muted-foreground">Arraste uma ideia para o dia da postagem.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar ideia"
            aria-label="Buscar ideia"
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
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3">
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
          <p className="font-heading min-w-0 px-1 text-xl break-words sm:text-2xl">{titulo}</p>
        </div>
        <p className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {PERFIS.map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", classePontoPerfil(item))} /> {PERFIL_LABEL[item]}
            </span>
          ))}
        </p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[18rem_1fr]">
        <SemData ideias={semData} />
        {visao === "semana" ? (
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-7">
            {dias.map((dia) => (
              <Dia
                key={dia}
                iso={dia}
                hoje={hoje}
                  ideias={porDia.get(dia) ?? VAZIO}
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
                <p key={dia} className="truncate px-0.5 text-[10px] tracking-wide text-muted-foreground uppercase sm:px-1 sm:text-xs">
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
                  ideias={porDia.get(dia) ?? VAZIO}
                  fora={!mesmoMes(dia, ancora)}
                  compacto
                  interativo={telaLarga}
                  aberto={diaAberto === dia}
                  aoAbrir={() => setDiaAberto(dia)}
                />
              ))}
            </div>
            {telaLarga ? null : <DiaAberto iso={diaAberto} ideias={porDia.get(diaAberto) ?? VAZIO} />}
          </div>
        )}
      </div>
      <DragOverlay>{arrastando ? <Pílula ideia={arrastando} /> : null}</DragOverlay>
    </DndContext>
  )
}

const VAZIO: CartaoQuadro[] = []
const LOTE = 24

const SemData = memo(function SemData({ ideias }: { ideias: CartaoQuadro[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "sem-data" })
  const [busca, setBusca] = useState("")
  const [limite, setLimite] = useState(LOTE)
  const [aberto, setAberto] = useState(false)
  const [perfil, setPerfil] = useState<Perfil | "">("")
  const [serie, setSerie] = useState("")

  const series = useMemo(() => {
    const nomes = new Set<string>()
    for (const ideia of ideias) {
      if (ideia.serieNome) nomes.add(ideia.serieNome)
    }
    return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [ideias])

  const filtradas = useMemo(() => {
    const consulta = busca.trim().toLocaleLowerCase()
    return ideias.filter((ideia) => {
      if (perfil && ideia.perfil !== perfil) return false
      if (serie === "sem-serie" && ideia.serieNome) return false
      if (serie && serie !== "sem-serie" && ideia.serieNome !== serie) return false
      if (!consulta) return true
      return ideia.titulo.toLocaleLowerCase().includes(consulta)
    })
  }, [busca, ideias, perfil, serie])
  const ativo = Boolean(perfil || serie)
  const trecho = filtradas.length > limite ? filtradas.slice(0, limite) : filtradas

  useEffect(() => {
    setLimite(LOTE)
  }, [perfil, serie])

  function limpar() {
    setPerfil("")
    setSerie("")
  }

  return (
    <section
      ref={setNodeRef}
      className={cn("rounded-2xl bg-muted/50 p-3", isOver && "ring-2 ring-primary")}
    >
      <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">Sem data</h2>
      <div className="mt-1 mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{filtradas.length} ideias</p>
        <Button
          type="button"
          size="icon-sm"
          variant={aberto || ativo ? "default" : "ghost"}
          aria-expanded={aberto}
          aria-label={aberto ? "Fechar filtro de ideias sem data" : "Filtrar ideias sem data"}
          onClick={() => setAberto((atual) => !atual)}
        >
          <ListFilter />
        </Button>
      </div>
      {aberto ? (
        <div className="mb-3 flex flex-col gap-2 rounded-xl border bg-card p-2">
          <label className="grid gap-1 text-xs text-muted-foreground">
            Perfil
            <select
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={perfil}
              onChange={(evento) => setPerfil(evento.target.value as Perfil | "")}
            >
              <option value="">Todos</option>
              {PERFIS.map((item) => (
                <option key={item} value={item}>{PERFIL_LABEL[item]}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Série
            <select
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
          {ativo ? (
            <Button type="button" variant="ghost" size="xs" className="w-fit" onClick={limpar}>
              Limpar
            </Button>
          ) : null}
        </div>
      ) : null}
      <Input
        value={busca}
        onChange={(evento) => {
          setBusca(evento.target.value)
          setLimite(LOTE)
        }}
        placeholder="Buscar ideia"
        aria-label="Buscar ideia sem data"
        className="mb-3 bg-card"
      />
      <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto lg:max-h-[70vh]">
        {trecho.map((ideia) => (
          <ItemArrastavel key={ideia.id} ideia={ideia} />
        ))}
        {filtradas.length === 0 && (ativo || busca.trim()) ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">Nenhuma ideia com esse filtro.</p>
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
        "min-h-16 min-w-0 rounded-xl border bg-card p-1 sm:min-h-28 sm:p-1.5",
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
              className={cn("size-1.5 rounded-full", classePontoPerfil(ideia.perfil))}
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

const ItemArrastavel = memo(function ItemArrastavel({ ideia }: { ideia: CartaoQuadro }) {
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
})

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
        classeFundoPerfil(ideia.perfil),
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
