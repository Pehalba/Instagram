"use client"

import Link from "next/link"
import { CamadaSelecao, type Selecao } from "@/components/selecao/selecao"
import { EditarSubserie } from "@/components/subseries/editar-subserie"
import { corDaSerie } from "@/lib/aparencia-serie"
import { classeBordaPerfil } from "@/lib/conteudo"
import type { SubserieNuvem } from "@/lib/gravar-nuvem"
import { cn } from "cn"

export type CartaoSubserie = SubserieNuvem & { ideias: number }

export function CartoesSubseries({
  subseries,
  serieNome,
  corDaSeriePai,
  soltas,
  selecao,
}: {
  subseries: CartaoSubserie[]
  serieNome: string
  corDaSeriePai: string | null
  soltas?: { href: string; total: number }
  selecao?: Selecao
}) {
  const selecionando = Boolean(selecao?.ativa)

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {subseries.map((subserie) => {
        const cor = corDaSerie(subserie.cor) ?? corDaSerie(corDaSeriePai)
        return (
          <li key={subserie.id} className="min-w-0">
            <div
              className={cn("relative flex h-full min-h-28 flex-col rounded-xl border border-l-4 bg-card", !cor && classeBordaPerfil(subserie.perfil))}
              style={cor ? { borderLeftColor: cor } : undefined}
            >
              {selecao && selecionando ? (
                <CamadaSelecao
                  marcado={selecao.marcados.has(subserie.id)}
                  rotulo={subserie.nome}
                  onAlternar={() => selecao.alternar(subserie.id)}
                />
              ) : null}
              <Link href={`/subseries/ver?id=${subserie.id}`} className={cn("flex h-full flex-col px-3 py-3 pr-12", selecionando && "pl-9")}>
                <span className="line-clamp-2 text-sm leading-snug font-medium">
                  {subserie.emoji ? <span className="mr-1">{subserie.emoji}</span> : null}
                  {subserie.nome}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {subserie.ideias} {subserie.ideias === 1 ? "ideia" : "ideias"}
                </span>
                {subserie.descricao ? (
                  <span className="mt-2 line-clamp-2 text-xs text-muted-foreground">{subserie.descricao}</span>
                ) : null}
              </Link>
              {selecionando ? null : (
                <div className="absolute top-2 right-2">
                  <EditarSubserie subserie={subserie} serieNome={serieNome} ideias={subserie.ideias} />
                </div>
              )}
            </div>
          </li>
        )
      })}
      {soltas && soltas.total > 0 && !selecionando ? (
        <li className="min-w-0">
          <Link
            href={soltas.href}
            className="flex h-full min-h-28 flex-col rounded-xl border border-dashed bg-card/60 px-3 py-3 transition-colors hover:bg-card"
          >
            <span className="text-sm leading-snug font-medium">Ideias sem subsérie</span>
            <span className="mt-1 text-xs text-muted-foreground">
              {soltas.total} {soltas.total === 1 ? "ideia" : "ideias"} direto na série
            </span>
          </Link>
        </li>
      ) : null}
    </ul>
  )
}
