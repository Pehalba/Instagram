"use client"

import { useEffect, useState } from "react"
import { Pencil } from "lucide-react"
import { ESTILO_FORMATO, SeloFormato } from "@/components/banco/formato-visual"
import { useBanco } from "@/components/dados/provedor-firebase"
import { CamadaSelecao } from "@/components/selecao/selecao"
import { Button } from "@/components/ui/button"
import { PERFIL_LABEL, PRIORIDADE_LABEL, classeTextoPerfil, type StatusIdeia } from "@/lib/conteudo"
import type { IdeiaLista } from "@/lib/tipos-ideia"
import { cn } from "cn"

const MARCAS: { status: StatusIdeia; rotulo: string; sim: string; nao: string }[] = [
  { status: "IDEIA", rotulo: "Ideia", sim: "Ideia", nao: "Ideia" },
  { status: "ROTEIRIZANDO", rotulo: "Roteiro", sim: "Roteirizada", nao: "Não roteirizada" },
  { status: "PRONTO_PARA_GRAVAR", rotulo: "Pronta", sim: "Pronta para gravar", nao: "Não pronta" },
  { status: "GRAVADO", rotulo: "Gravado", sim: "Gravado", nao: "Não gravado" },
  { status: "EDITADO", rotulo: "Editado", sim: "Editado", nao: "Não editado" },
  { status: "POSTADO", rotulo: "Postado", sim: "Postado", nao: "Não postado" },
]

export function CartaoIdeia({
  ideia,
  onAbrir,
  selecao,
}: {
  ideia: IdeiaLista
  onAbrir: () => void
  selecao?: { marcado: boolean; alternar: () => void }
}) {
  const banco = useBanco()
  const [status, setStatus] = useState(ideia.status)
  const detalhes = [
    ideia.prioridade ? PRIORIDADE_LABEL[ideia.prioridade] : "Sem prioridade",
    ideia.temRoteiro ? "Com roteiro" : null,
    ...ideia.tags,
  ].filter((item): item is string => Boolean(item))

  useEffect(() => {
    setStatus(ideia.status)
  }, [ideia.status])

  async function alternar(alvo: StatusIdeia) {
    const anterior = status
    const proximo = status === alvo ? "IDEIA" : alvo
    setStatus(proximo)
    try {
      await banco.moverStatus(ideia.id, proximo)
    } catch {
      setStatus(anterior)
    }
  }

  return (
    <li className="min-w-0">
      <article className="relative flex h-44 flex-col overflow-hidden rounded-2xl border bg-card">
        {selecao ? <CamadaSelecao marcado={selecao.marcado} rotulo={ideia.titulo} onAlternar={selecao.alternar} /> : null}
        <div className={cn("flex items-center gap-2 border-b px-3 py-1.5", ideia.formato ? ESTILO_FORMATO[ideia.formato].faixa : "bg-muted/50", selecao && "pl-9")}>
          <span className={`truncate text-[11px] ${classeTextoPerfil(ideia.perfil)}`}>{PERFIL_LABEL[ideia.perfil]}</span>
          {ideia.formato ? <SeloFormato formato={ideia.formato} className="ml-auto" /> : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={ideia.formato ? undefined : "ml-auto"}
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
        <div className="flex flex-nowrap items-center justify-between gap-0.5 px-2 pb-2.5">
          {MARCAS.map((marca) => {
            const ativo = status === marca.status
            return (
              <button
                key={marca.status}
                type="button"
                aria-pressed={ativo}
                aria-label={ativo ? marca.sim : marca.nao}
                title={ativo ? marca.sim : marca.nao}
                onClick={() => alternar(marca.status)}
                className={cn(
                  "shrink-0 rounded-full px-0.5 py-1 text-[10px] leading-none tracking-tight whitespace-nowrap",
                  ativo ? "bg-foreground text-background" : "text-muted-foreground opacity-40 hover:opacity-100",
                )}
              >
                {marca.rotulo}
              </button>
            )
          })}
        </div>
      </article>
    </li>
  )
}