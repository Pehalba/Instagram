"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { EditarSerie } from "@/components/series/editar-serie"
import { FormularioSerie } from "@/components/series/formulario-serie"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PERFIS, PERFIL_LABEL, type Perfil } from "@/lib/conteudo"
import { cn } from "cn"

export type CartaoSerie = {
  id: string
  nome: string
  perfil: Perfil
  quadroFixo: boolean
  descricao: string | null
  ideias: number
}

type OrdemSerie = "padrao" | "az" | "za" | "mais" | "menos"

function compararNome(a: CartaoSerie, b: CartaoSerie) {
  return a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
}

function ordenarSeries(series: CartaoSerie[], ordem: OrdemSerie) {
  if (ordem === "padrao") return series
  return [...series].sort((a, b) => {
    if (ordem === "az") return compararNome(a, b)
    if (ordem === "za") return compararNome(b, a)
    const porIdeias = ordem === "mais" ? b.ideias - a.ideias : a.ideias - b.ideias
    return porIdeias || compararNome(a, b)
  })
}

export function GradeSeries({
  series,
  semSerie,
}: {
  series: CartaoSerie[]
  semSerie: { perfil: Perfil; total: number }[]
}) {
  const [busca, setBusca] = useState("")
  const [perfil, setPerfil] = useState<Perfil>("carolalbas")
  const [ordem, setOrdem] = useState<OrdemSerie>("padrao")
  const [criando, setCriando] = useState(false)
  const consulta = busca.trim().toLocaleLowerCase()

  const visiveis = useMemo(() => {
    const filtradas = !consulta
      ? series
      : series.filter((serie) =>
          [serie.nome, serie.descricao ?? "", PERFIL_LABEL[serie.perfil]].join(" ").toLocaleLowerCase().includes(consulta),
        )
    return ordenarSeries(filtradas, ordem)
  }, [consulta, ordem, series])

  const semVisiveis = consulta && !"sem série".includes(consulta) ? [] : semSerie.filter((item) => item.total > 0 && item.perfil === perfil)
  const doPerfil = visiveis.filter((serie) => serie.perfil === perfil)
  const totalDoPerfil = series.filter((serie) => serie.perfil === perfil).length

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Perfil">
          {PERFIS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={perfil === item}
              onClick={() => setPerfil(item)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                perfil === item ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
              )}
            >
              {PERFIL_LABEL[item]}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {totalDoPerfil} {totalDoPerfil === 1 ? "série" : "séries"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar série"
            aria-label="Buscar série"
            className="min-w-0 flex-1"
          />
          <select
            value={ordem}
            onChange={(evento) => setOrdem(evento.target.value as OrdemSerie)}
            aria-label="Organizar séries"
            className="h-9 shrink-0 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="padrao">Ordem atual</option>
            <option value="az">A–Z</option>
            <option value="za">Z–A</option>
            <option value="mais">Mais ideias</option>
            <option value="menos">Menos ideias</option>
          </select>
          <Button type="button" variant={criando ? "default" : "outline"} onClick={() => setCriando((aberto) => !aberto)}>
            Nova série
          </Button>
        </div>
      </div>
      {criando ? <FormularioSerie aoFechar={() => setCriando(false)} /> : null}
      {doPerfil.length === 0 && semVisiveis.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
          Nenhuma série com esse nome.
        </p>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className={perfil === "carolalbas" ? "text-sm text-carol" : "text-sm text-casal"}>
            {PERFIL_LABEL[perfil]}
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {doPerfil.map((serie) => (
              <li key={serie.id} className="min-w-0">
                <div className={`relative flex h-full min-h-32 flex-col rounded-xl border border-l-4 bg-card ${serie.perfil === "carolalbas" ? "border-l-carol" : "border-l-casal"}`}>
                  <Cartao
                    href={`/series/${serie.id}`}
                    titulo={serie.nome}
                    detalhe={`${serie.ideias} ${serie.ideias === 1 ? "ideia" : "ideias"}`}
                    descricao={serie.descricao}
                    quadroFixo={serie.quadroFixo}
                  />
                  <div className="absolute top-2 right-2">
                    <EditarSerie
                      id={serie.id}
                      nome={serie.nome}
                      perfil={serie.perfil}
                      descricao={serie.descricao}
                      quadroFixo={serie.quadroFixo}
                      ideias={serie.ideias}
                    />
                  </div>
                </div>
              </li>
            ))}
            {semVisiveis.map((soltas) => (
              <li key={soltas.perfil} className="min-w-0">
                <div className={`flex h-full min-h-32 flex-col rounded-xl border border-l-4 bg-card ${perfil === "carolalbas" ? "border-l-carol" : "border-l-casal"}`}>
                  <Cartao
                    href={`/series/sem-${perfil}`}
                    titulo="Sem série"
                    detalhe={`${soltas.total} ${soltas.total === 1 ? "ideia" : "ideias"}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Cartao({
  href,
  titulo,
  detalhe,
  descricao,
  quadroFixo = false,
}: {
  href: string
  titulo: string
  detalhe: string
  descricao?: string | null
  quadroFixo?: boolean
}) {
  return (
    <Link href={href} className="flex h-full flex-col px-3 py-3 pr-12">
      <span className="line-clamp-2 text-sm leading-snug font-medium">{titulo}</span>
      <span className="mt-1 text-xs text-muted-foreground">{detalhe}</span>
      {descricao ? <span className="mt-2 line-clamp-2 text-xs text-muted-foreground">{descricao}</span> : null}
      {quadroFixo ? (
        <span className="mt-auto pt-2">
          <Badge variant="outline">Quadro fixo</Badge>
        </span>
      ) : null}
    </Link>
  )
}
