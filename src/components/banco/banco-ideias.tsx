"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { ListFilter } from "lucide-react"
import { CartaoIdeia } from "@/components/banco/cartao-ideia"
import { DrawerIdeia } from "@/components/banco/drawer-ideia"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FORMATOS,
  FORMATO_LABEL,
  PERFIS,
  PERFIL_LABEL,
  PRIORIDADES,
  PRIORIDADE_LABEL,
  STATUS,
  STATUS_LABEL,
  normalizarTitulo,
  type Formato,
  type Perfil,
  type Prioridade,
  type StatusIdeia,
} from "@/lib/conteudo"
import type { IdeiaLista, SerieOpcao } from "@/lib/tipos-ideia"
import { cn } from "cn"

const selectClass =
  "h-9 w-full min-w-0 max-w-full rounded-lg border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

type Ordem = "titulo" | "prioridade" | "status" | "serie" | "recentes"

export function BancoIdeias({
  ideias,
  series,
  abrirId,
}: {
  ideias: IdeiaLista[]
  series: SerieOpcao[]
  abrirId?: string
}) {
  const [busca, setBusca] = useState("")
  const [perfil, setPerfil] = useState<Perfil>("carolalbas")
  const [serieId, setSerieId] = useState("")
  const [status, setStatus] = useState<StatusIdeia | "">("")
  const [formato, setFormato] = useState<Formato | "">("")
  const [prioridade, setPrioridade] = useState<Prioridade | "">("")
  const [tag, setTag] = useState("")
  const [ordem, setOrdem] = useState<Ordem>("titulo")
  const [quantidade, setQuantidade] = useState(24)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [alvo, setAlvo] = useState<IdeiaLista | "nova" | null>(null)
  const abriuPelaUrl = useRef(false)
  const fechar = useCallback(() => setAlvo(null), [])

  useEffect(() => {
    if (abriuPelaUrl.current || !abrirId) return
    abriuPelaUrl.current = true
    const encontrada = ideias.find((ideia) => ideia.id === abrirId)
    if (encontrada) setAlvo(encontrada)
  }, [abrirId, ideias])

  const tags = useMemo(() => {
    const conjunto = new Set<string>()
    for (const ideia of ideias) {
      for (const item of ideia.tags) conjunto.add(item)
    }
    return [...conjunto].sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [ideias])

  const seriesVisiveis = series.filter((serie) => !perfil || serie.perfil === perfil)

  const visiveis = useMemo(() => {
    const consulta = normalizarTitulo(busca)
    const filtradas = ideias.filter((ideia) => {
      if (perfil && ideia.perfil !== perfil) return false
      if (serieId && ideia.serieId !== serieId) return false
      if (status && ideia.status !== status) return false
      if (formato && ideia.formato !== formato) return false
      if (prioridade && ideia.prioridade !== prioridade) return false
      if (tag && !ideia.tags.includes(tag)) return false
      if (!consulta) return true
      const alvoBusca = normalizarTitulo(
        [ideia.titulo, ideia.serieNome ?? "", ideia.notas ?? "", ideia.notaOrigem ?? "", ideia.tags.join(" ")].join(" "),
      )
      return alvoBusca.includes(consulta)
    })

    const pesoPrioridade: Record<Prioridade, number> = { ALTA: 0, MEDIA: 1, BAIXA: 2 }
    const peso = (valor: Prioridade | null) => (valor ? pesoPrioridade[valor] : 3)
    const pesoStatus = Object.fromEntries(STATUS.map((item, indice) => [item, indice])) as Record<StatusIdeia, number>

    return filtradas.sort((a, b) => {
      if (ordem === "prioridade") return peso(a.prioridade) - peso(b.prioridade)
      if (ordem === "status") return pesoStatus[a.status] - pesoStatus[b.status]
      if (ordem === "serie") {
        return (
          a.perfil.localeCompare(b.perfil) ||
          a.ordemSerie - b.ordemSerie ||
          a.ordemNaSerie - b.ordemNaSerie ||
          a.titulo.localeCompare(b.titulo, "pt-BR")
        )
      }
      if (ordem === "recentes") return b.atualizadoEm.localeCompare(a.atualizadoEm)
      return a.titulo.localeCompare(b.titulo, "pt-BR")
    })
  }, [busca, formato, ideias, ordem, perfil, prioridade, serieId, status, tag])

  useEffect(() => {
    setQuantidade(24)
  }, [busca, formato, ordem, perfil, prioridade, serieId, status, tag])

  const mostradas = visiveis.slice(0, quantidade)

  const filtrosAtivos = Boolean(busca || serieId || status || formato || prioridade || tag || ordem !== "titulo")
  const filtrosEspecificos = filtrosAtivos

  function escolherPerfil(proximo: Perfil) {
    setPerfil(proximo)
    setSerieId("")
  }

  function limparFiltros() {
    setPerfil("carolalbas")
    setSerieId("")
    setStatus("")
    setFormato("")
    setPrioridade("")
    setTag("")
    setOrdem("titulo")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl leading-tight sm:text-4xl lg:text-5xl">Ideias</h1>
          <p className="mt-3 text-muted-foreground">
            {visiveis.length} {visiveis.length === 1 ? "ideia" : "ideias"}
            {filtrosAtivos ? " com esses filtros" : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Perfil">
            {PERFIS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={perfil === item}
                onClick={() => escolherPerfil(item)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  perfil === item ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
                )}
              >
                {PERFIL_LABEL[item]}
              </button>
            ))}
          </div>
        </div>
        <Button type="button" onClick={() => setAlvo("nova")}>
          Nova ideia
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-3">
        <div className="flex items-center gap-2">
          <Input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar título, série, tag ou nota"
            aria-label="Buscar"
            className="min-w-0 flex-1"
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
          <div className="mt-3 grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <SelectFiltro rotulo="Perfil" value={perfil} onChange={(valor) => escolherPerfil(valor as Perfil)}>
              {PERFIS.map((item) => (
                <option key={item} value={item}>{PERFIL_LABEL[item]}</option>
              ))}
            </SelectFiltro>
            <SelectFiltro rotulo="Série" value={serieId} onChange={setSerieId}>
              <option value="">Todas as séries</option>
              {seriesVisiveis.map((serie) => (
                <option key={serie.id} value={serie.id}>
                  {PERFIL_LABEL[serie.perfil]} · {serie.nome}
                </option>
              ))}
            </SelectFiltro>
            <SelectFiltro rotulo="Status" value={status} onChange={(valor) => setStatus(valor as StatusIdeia | "")}>
              <option value="">Todos os status</option>
              {STATUS.filter((item) => item !== "AGENDADO").map((item) => (
                <option key={item} value={item}>{STATUS_LABEL[item]}</option>
              ))}
            </SelectFiltro>
            <SelectFiltro rotulo="Formato" value={formato} onChange={(valor) => setFormato(valor as Formato | "")}>
              <option value="">Todos os formatos</option>
              {FORMATOS.map((item) => (
                <option key={item} value={item}>{FORMATO_LABEL[item]}</option>
              ))}
            </SelectFiltro>
            <SelectFiltro rotulo="Prioridade" value={prioridade} onChange={(valor) => setPrioridade(valor as Prioridade | "")}>
              <option value="">Todas as prioridades</option>
              {PRIORIDADES.map((item) => (
                <option key={item} value={item}>{PRIORIDADE_LABEL[item]}</option>
              ))}
            </SelectFiltro>
            <SelectFiltro rotulo="Tag" value={tag} onChange={setTag}>
              <option value="">Todas as tags</option>
              {tags.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </SelectFiltro>
            <SelectFiltro rotulo="Ordenar" value={ordem} onChange={(valor) => setOrdem(valor as Ordem)}>
              <option value="titulo">Título</option>
              <option value="serie">Série</option>
              <option value="prioridade">Prioridade</option>
              <option value="status">Status</option>
              <option value="recentes">Mais recentes</option>
            </SelectFiltro>
            {filtrosEspecificos ? (
              <Button type="button" variant="ghost" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {visiveis.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
          Nenhuma ideia com esses filtros.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mostradas.map((ideia) => (
            <CartaoIdeia key={ideia.id} ideia={ideia} onAbrir={() => setAlvo(ideia)} />
          ))}
        </ul>
      )}
      {visiveis.length > quantidade ? (
        <Button type="button" variant="outline" onClick={() => setQuantidade((atual) => atual + 24)}>
          Mostrar mais {visiveis.length - quantidade}
        </Button>
      ) : null}

      <DrawerIdeia
        aberto={alvo !== null}
        ideia={alvo === "nova" ? null : alvo}
        series={series}
        onFechar={fechar}
      />
    </div>
  )
}

function SelectFiltro({
  rotulo,
  value,
  onChange,
  children,
}: {
  rotulo: string
  value: string
  onChange: (valor: string) => void
  children: ReactNode
}) {
  return (
    <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">
      {rotulo}
      <select className={selectClass} value={value} onChange={(evento) => onChange(evento.target.value)}>
        {children}
      </select>
    </label>
  )
}
