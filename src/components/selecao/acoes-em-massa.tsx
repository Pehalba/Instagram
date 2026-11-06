"use client"

import { useState, useTransition, type ReactNode } from "react"
import { FolderInput, Trash2 } from "lucide-react"
import { useBanco } from "@/components/dados/provedor-firebase"
import { EscolherDestino } from "@/components/selecao/escolher-destino"
import { Button } from "@/components/ui/button"
import type { Perfil } from "@/lib/conteudo"

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
  const [escolhendo, setEscolhendo] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const { erro, pendente, executar } = useAcao(terminar)
  const total = contagem(ids.length, "ideia", "ideias")

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
    <Linha erro={escolhendo ? null : erro}>
      <Button type="button" size="sm" disabled={pendente} onClick={() => setEscolhendo(true)}>
        <FolderInput />
        Mover para…
      </Button>
      <Button type="button" variant="destructive" size="sm" disabled={pendente} onClick={() => setConfirmando(true)}>
        <Trash2 />
        Excluir
      </Button>
      <EscolherDestino
        aberto={escolhendo}
        aoFechar={() => setEscolhendo(false)}
        titulo={`Mover ${total}`}
        perfil={perfil}
        comSubseries
        pendente={pendente}
        erro={erro}
        aoEscolher={(destino) => executar(() => banco.moverIdeias(ids, destino))}
      />
    </Linha>
  )
}

export function AcoesSubseries({ ids, perfil, terminar }: { ids: string[]; perfil: Perfil; terminar: () => void }) {
  const banco = useBanco()
  const [escolhendo, setEscolhendo] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const { erro, pendente, executar } = useAcao(terminar)
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
    <Linha erro={escolhendo ? null : erro}>
      <Button type="button" size="sm" disabled={pendente} onClick={() => setEscolhendo(true)}>
        <FolderInput />
        Mover para…
      </Button>
      <Button type="button" variant="destructive" size="sm" disabled={pendente} onClick={() => setConfirmando(true)}>
        <Trash2 />
        Remover
      </Button>
      <EscolherDestino
        aberto={escolhendo}
        aoFechar={() => setEscolhendo(false)}
        titulo={`Mover ${total}`}
        perfil={perfil}
        comSubseries={false}
        pendente={pendente}
        erro={erro}
        aoEscolher={(destino) => {
          if (destino.serieId) executar(() => banco.moverSubseries(ids, destino.serieId as string))
        }}
      />
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
