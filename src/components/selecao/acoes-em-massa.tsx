"use client"

import { useState, useTransition, type ReactNode } from "react"
import { FolderInput, Trash2 } from "lucide-react"
import { useBanco } from "@/components/dados/provedor-firebase"
import { Button } from "@/components/ui/button"
import type { Perfil } from "@/lib/conteudo"

const selectClass =
  "h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:max-w-xs"

function contagem(total: number, singular: string, plural: string) {
  return `${total} ${total === 1 ? singular : plural}`
}

function useAcao(terminar: () => void) {
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()
  function executar(acao: () => Promise<{ erro?: string } | void>) {
    setErro(null)
    iniciar(async () => {
      try {
        const resultado = await acao()
        if (resultado && resultado.erro) setErro(resultado.erro)
        else terminar()
      } catch {
        setErro("Não consegui gravar no Firebase. Tente de novo.")
      }
    })
  }
  return { erro, pendente, executar }
}

function Confirmar({
  texto,
  rotulo,
  pendente,
  onConfirmar,
  onCancelar,
}: {
  texto: string
  rotulo: string
  pendente: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2">
      <p className="text-xs">{texto}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="destructive" size="sm" disabled={pendente} onClick={onConfirmar}>
          {pendente ? "Apagando…" : rotulo}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={pendente} onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

function Linha({ children, erro }: { children: ReactNode; erro: string | null }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {erro ? <p className="text-xs text-destructive">{erro}</p> : null}
    </div>
  )
}

export function AcoesIdeias({ ids, perfil, terminar }: { ids: string[]; perfil: Perfil; terminar: () => void }) {
  const banco = useBanco()
  const [destino, setDestino] = useState("")
  const [confirmando, setConfirmando] = useState(false)
  const { erro, pendente, executar } = useAcao(terminar)
  const series = banco.seriesCompletas
    .filter((serie) => serie.perfil === perfil)
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"))
  const total = contagem(ids.length, "ideia", "ideias")

  function mover() {
    const [tipo, id] = destino.split(":")
    executar(() =>
      banco.moverIdeias(ids, {
        serieId: tipo === "serie" ? id : null,
        subserieId: tipo === "subserie" ? id : null,
      }),
    )
  }

  if (confirmando) {
    return (
      <Confirmar
        texto={`Excluir ${total}? Os roteiros delas também somem. Não dá para desfazer.`}
        rotulo={`Excluir ${total}`}
        pendente={pendente}
        onConfirmar={() => executar(() => banco.excluirIdeias(ids))}
        onCancelar={() => setConfirmando(false)}
      />
    )
  }

  return (
    <Linha erro={erro}>
      <select value={destino} onChange={(evento) => setDestino(evento.target.value)} aria-label="Mover para" className={selectClass}>
        <option value="">Mover para…</option>
        <option value="sem:">Sem série</option>
        {series.map((serie) => {
          const subseries = banco.subseriesCompletas
            .filter((subserie) => subserie.serieId === serie.id)
            .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"))
          return (
            <optgroup key={serie.id} label={serie.nome}>
              <option value={`serie:${serie.id}`}>{serie.nome} (direto na série)</option>
              {subseries.map((subserie) => (
                <option key={subserie.id} value={`subserie:${subserie.id}`}>
                  {serie.nome} › {subserie.nome}
                </option>
              ))}
            </optgroup>
          )
        })}
      </select>
      <Button type="button" size="sm" disabled={!destino || pendente} onClick={mover}>
        <FolderInput />
        {pendente ? "Movendo…" : "Mover"}
      </Button>
      <Button type="button" variant="destructive" size="sm" disabled={pendente} onClick={() => setConfirmando(true)}>
        <Trash2 />
        Excluir
      </Button>
    </Linha>
  )
}

export function AcoesSubseries({ ids, perfil, terminar }: { ids: string[]; perfil: Perfil; terminar: () => void }) {
  const banco = useBanco()
  const [serieId, setSerieId] = useState("")
  const [confirmando, setConfirmando] = useState(false)
  const { erro, pendente, executar } = useAcao(terminar)
  const series = banco.seriesCompletas
    .filter((serie) => serie.perfil === perfil)
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"))
  const marcadas = new Set(ids)
  const ideias = banco.ideiasCompletas.filter((ideia) => ideia.subserieId && marcadas.has(ideia.subserieId)).length
  const total = contagem(ids.length, "subsérie", "subséries")

  if (confirmando) {
    const aviso = ideias === 0
      ? "Elas não têm ideias."
      : `${contagem(ideias, "ideia continua", "ideias continuam")} na série, sem subsérie.`
    return (
      <Confirmar
        texto={`Remover ${total}? ${aviso}`}
        rotulo={`Remover ${total}`}
        pendente={pendente}
        onConfirmar={() => executar(() => banco.removerSubseries(ids))}
        onCancelar={() => setConfirmando(false)}
      />
    )
  }

  return (
    <Linha erro={erro}>
      <select value={serieId} onChange={(evento) => setSerieId(evento.target.value)} aria-label="Mover para a série" className={selectClass}>
        <option value="">Mover para a série…</option>
        {series.map((serie) => (
          <option key={serie.id} value={serie.id}>{serie.nome}</option>
        ))}
      </select>
      <Button type="button" size="sm" disabled={!serieId || pendente} onClick={() => executar(() => banco.moverSubseries(ids, serieId))}>
        <FolderInput />
        {pendente ? "Movendo…" : "Mover"}
      </Button>
      <Button type="button" variant="destructive" size="sm" disabled={pendente} onClick={() => setConfirmando(true)}>
        <Trash2 />
        Remover
      </Button>
    </Linha>
  )
}

export function AcoesSeries({ ids, terminar }: { ids: string[]; terminar: () => void }) {
  const banco = useBanco()
  const [confirmando, setConfirmando] = useState(false)
  const { erro, pendente, executar } = useAcao(terminar)
  const marcadas = new Set(ids)
  const ideias = banco.ideiasCompletas.filter((ideia) => ideia.serieId && marcadas.has(ideia.serieId)).length
  const subseries = banco.subseriesCompletas.filter((subserie) => marcadas.has(subserie.serieId)).length
  const total = contagem(ids.length, "série", "séries")

  if (confirmando) {
    const avisoIdeias = ideias === 0
      ? "Elas não têm ideias."
      : `${contagem(ideias, "ideia continua", "ideias continuam")} no banco, em Sem série.`
    const avisoSubseries = subseries === 0 ? "" : ` ${contagem(subseries, "subsérie também sai", "subséries também saem")}.`
    return (
      <Confirmar
        texto={`Remover ${total}? ${avisoIdeias}${avisoSubseries}`}
        rotulo={`Remover ${total}`}
        pendente={pendente}
        onConfirmar={() => executar(() => banco.removerSeries(ids))}
        onCancelar={() => setConfirmando(false)}
      />
    )
  }

  return (
    <Linha erro={erro}>
      <Button type="button" variant="destructive" size="sm" disabled={pendente} onClick={() => setConfirmando(true)}>
        <Trash2 />
        Remover
      </Button>
    </Linha>
  )
}
