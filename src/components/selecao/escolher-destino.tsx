"use client"

import { useState, type CSSProperties, type ReactNode } from "react"
import { ArrowLeft, Inbox } from "lucide-react"
import { useBanco } from "@/components/dados/provedor-firebase"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { corDaSerie } from "@/lib/aparencia-serie"
import { normalizarTitulo, type Perfil } from "@/lib/conteudo"
import type { SerieNuvem } from "@/lib/gravar-nuvem"
import { cn } from "cn"

export type Destino = { serieId: string | null; subserieId: string | null }

export function EscolherDestino({
  aberto,
  aoFechar,
  titulo,
  perfil,
  comSubseries,
  pendente,
  erro,
  aoEscolher,
}: {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  perfil: Perfil
  comSubseries: boolean
  pendente: boolean
  erro: string | null
  aoEscolher: (destino: Destino) => void
}) {
  const banco = useBanco()
  const [serie, setSerie] = useState<SerieNuvem | null>(null)
  const [busca, setBusca] = useState("")

  const series = banco.seriesCompletas
    .filter((item) => item.perfil === perfil)
    .filter((item) => !busca.trim() || normalizarTitulo(item.nome).includes(normalizarTitulo(busca)))
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"))
  const subseriesDe = (serieId: string) =>
    banco.subseriesCompletas
      .filter((item) => item.serieId === serieId)
      .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"))
  const ideiasEm = (filtro: (ideia: (typeof banco.ideiasCompletas)[number]) => boolean) =>
    banco.ideiasCompletas.filter(filtro).length

  function fechar() {
    setSerie(null)
    setBusca("")
    aoFechar()
  }

  function escolherSerie(alvo: SerieNuvem) {
    if (comSubseries && subseriesDe(alvo.id).length > 0) {
      setSerie(alvo)
      return
    }
    aoEscolher({ serieId: alvo.id, subserieId: null })
  }

  const subseries = serie ? subseriesDe(serie.id) : []

  return (
    <Dialog open={aberto} onOpenChange={(abrir) => (abrir ? undefined : fechar())}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="pb-0">
          <DialogTitle className="pr-8 text-2xl">{titulo}</DialogTitle>
          <DialogDescription>
            {serie
              ? `Escolha onde dentro de ${serie.nome}.`
              : comSubseries
                ? "Escolha a série. Se ela tiver subséries, você escolhe uma em seguida."
                : "Escolha a série de destino."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-4 pb-4">
          {serie ? (
            <>
              <Button type="button" variant="outline" className="w-fit" disabled={pendente} onClick={() => setSerie(null)}>
                <ArrowLeft />
                Séries
              </Button>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Cartao
                  titulo="Direto na série"
                  detalhe={`${serie.emoji ? `${serie.emoji} ` : ""}${serie.nome}, sem subsérie`}
                  tracejado
                  pendente={pendente}
                  onClick={() => aoEscolher({ serieId: serie.id, subserieId: null })}
                />
                {subseries.map((subserie) => {
                  const total = ideiasEm((ideia) => ideia.subserieId === subserie.id)
                  return (
                    <Cartao
                      key={subserie.id}
                      titulo={subserie.nome}
                      emoji={subserie.emoji}
                      detalhe={`${total} ${total === 1 ? "ideia" : "ideias"}`}
                      estilo={estiloBorda(corDaSerie(subserie.cor) ?? corDaSerie(serie.cor))}
                      classeBorda={corDaSerie(subserie.cor) ?? corDaSerie(serie.cor) ? undefined : BORDA_ESQUERDA_PERFIL[perfil]}
                      pendente={pendente}
                      onClick={() => aoEscolher({ serieId: serie.id, subserieId: subserie.id })}
                    />
                  )
                })}
              </ul>
            </>
          ) : (
            <>
              <Input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar série"
                aria-label="Buscar série"
              />
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {comSubseries && !busca.trim() ? (
                  <Cartao
                    titulo="Sem série"
                    icone={<Inbox className="size-4" />}
                    detalhe="Tira da série e da subsérie"
                    tracejado
                    pendente={pendente}
                    onClick={() => aoEscolher({ serieId: null, subserieId: null })}
                  />
                ) : null}
                {series.map((item) => {
                  const total = ideiasEm((ideia) => ideia.serieId === item.id)
                  const quantasSubseries = subseriesDe(item.id).length
                  const cor = corDaSerie(item.cor)
                  return (
                    <Cartao
                      key={item.id}
                      titulo={item.nome}
                      emoji={item.emoji}
                      detalhe={[
                        `${total} ${total === 1 ? "ideia" : "ideias"}`,
                        quantasSubseries > 0 ? `${quantasSubseries} ${quantasSubseries === 1 ? "subsérie" : "subséries"}` : null,
                      ].filter(Boolean).join(" · ")}
                      estilo={estiloBorda(cor)}
                      classeBorda={cor ? undefined : BORDA_ESQUERDA_PERFIL[perfil]}
                      seta={comSubseries && quantasSubseries > 0}
                      pendente={pendente}
                      onClick={() => escolherSerie(item)}
                    />
                  )
                })}
              </ul>
              {series.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {busca.trim() ? "Nenhuma série com esse nome." : "Este perfil ainda não tem séries."}
                </p>
              ) : null}
            </>
          )}
          {pendente ? <p className="text-sm text-muted-foreground">Movendo…</p> : null}
          {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const BORDA_ESQUERDA_PERFIL: Record<Perfil, string> = {
  carolalbas: "border-l-carol",
  albasfilms: "border-l-films",
  albascouple: "border-l-casal",
}

function estiloBorda(cor: string | null): CSSProperties | undefined {
  return cor ? { borderLeftColor: cor } : undefined
}

function Cartao({
  titulo,
  detalhe,
  emoji = null,
  icone,
  estilo,
  classeBorda,
  tracejado = false,
  seta = false,
  pendente,
  onClick,
}: {
  titulo: string
  detalhe: string
  emoji?: string | null
  icone?: ReactNode
  estilo?: CSSProperties
  classeBorda?: string
  tracejado?: boolean
  seta?: boolean
  pendente: boolean
  onClick: () => void
}) {
  return (
    <li className="min-w-0">
      <button
        type="button"
        disabled={pendente}
        onClick={onClick}
        style={estilo}
        className={cn(
          "flex h-full min-h-16 w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-muted/60 disabled:opacity-50",
          tracejado ? "border-dashed bg-card/60" : cn("border-l-4 bg-card", classeBorda),
        )}
      >
        {icone ? <span className="text-muted-foreground">{icone}</span> : null}
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm leading-snug font-medium">
            {emoji ? <span className="mr-1">{emoji}</span> : null}
            {titulo}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{detalhe}</span>
        </span>
        {seta ? <span className="text-muted-foreground" aria-hidden>›</span> : null}
      </button>
    </li>
  )
}
