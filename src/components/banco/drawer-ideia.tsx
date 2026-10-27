"use client"

import { useActionState, useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { salvarIdeia, type EstadoFormulario } from "@/app/ideias/acoes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  FORMATOS,
  FORMATO_LABEL,
  PERFIS,
  PERFIL_LABEL,
  PRIORIDADES,
  PRIORIDADE_LABEL,
  STATUS,
  STATUS_LABEL,
} from "@/lib/conteudo"
import type { IdeiaLista, SerieOpcao } from "@/lib/tipos-ideia"

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function DrawerIdeia({
  aberto,
  ideia,
  series,
  onFechar,
}: {
  aberto: boolean
  ideia: IdeiaLista | null
  series: SerieOpcao[]
  onFechar: () => void
}) {
  return (
    <Sheet open={aberto} onOpenChange={(abertoAgora) => !abertoAgora && onFechar()}>
      <SheetContent className="w-full! overflow-hidden sm:max-w-lg!">
        {aberto ? (
          <FormularioIdeia key={ideia?.id ?? "nova"} ideia={ideia} series={series} onSalvou={onFechar} />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function FormularioIdeia({
  ideia,
  series,
  onSalvou,
}: {
  ideia: IdeiaLista | null
  series: SerieOpcao[]
  onSalvou: () => void
}) {
  const [estado, acao, pendente] = useActionState<EstadoFormulario, FormData>(salvarIdeia, {})
  const [perfil, setPerfil] = useState(ideia?.perfil ?? "carolalbas")
  const [serieId, setSerieId] = useState(ideia?.serieId ?? "")
  const seriesDoPerfil = series.filter((serie) => serie.perfil === perfil)

  useEffect(() => {
    if (estado.ok) onSalvou()
  }, [estado, onSalvou])

  function aoMudarPerfil(valor: string) {
    setPerfil(valor === "albascouple" ? "albascouple" : "carolalbas")
    setSerieId("")
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-heading text-3xl">{ideia ? "Editar ideia" : "Nova ideia"}</SheetTitle>
        <SheetDescription>
          {ideia ? "Ajuste os dados sem sair da lista." : "Um título e o perfil já bastam para guardar."}
        </SheetDescription>
      </SheetHeader>
      <form action={acao} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
        {ideia ? <input type="hidden" name="id" value={ideia.id} /> : null}
        <Campo rotulo="Título" htmlFor="titulo">
          <Input id="titulo" name="titulo" defaultValue={ideia?.titulo ?? ""} required />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Perfil" htmlFor="perfil">
            <select
              id="perfil"
              name="perfil"
              className={selectClass}
              value={perfil}
              onChange={(evento) => aoMudarPerfil(evento.target.value)}
            >
              {PERFIS.map((item) => (
                <option key={item} value={item}>
                  {PERFIL_LABEL[item]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Série" htmlFor="serieId">
            <select
              id="serieId"
              name="serieId"
              className={selectClass}
              value={serieId}
              onChange={(evento) => setSerieId(evento.target.value)}
            >
              <option value="">Sem série</option>
              {seriesDoPerfil.map((serie) => (
                <option key={serie.id} value={serie.id}>
                  {serie.nome}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <Campo rotulo="Ou criar uma série nova" htmlFor="novaSerie">
          <Input id="novaSerie" name="novaSerie" placeholder="Nome da série" />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Status" htmlFor="status">
            <select id="status" name="status" className={selectClass} defaultValue={ideia?.status ?? "IDEIA"}>
              {STATUS.map((item) => (
                <option key={item} value={item}>
                  {STATUS_LABEL[item]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Prioridade" htmlFor="prioridade">
            <select
              id="prioridade"
              name="prioridade"
              className={selectClass}
              defaultValue={ideia?.prioridade ?? "MEDIA"}
            >
              {PRIORIDADES.map((item) => (
                <option key={item} value={item}>
                  {PRIORIDADE_LABEL[item]}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <Campo rotulo="Formato" htmlFor="formato">
          <select id="formato" name="formato" className={selectClass} defaultValue={ideia?.formato ?? ""}>
            <option value="">Sem formato</option>
            {FORMATOS.map((item) => (
              <option key={item} value={item}>
                {FORMATO_LABEL[item]}
              </option>
            ))}
          </select>
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Data planejada" htmlFor="dataPlanejada">
            <Input id="dataPlanejada" name="dataPlanejada" type="date" defaultValue={ideia?.dataPlanejada ?? ""} />
          </Campo>
          <Campo rotulo="Data postada" htmlFor="dataPostada">
            <Input id="dataPostada" name="dataPostada" type="date" defaultValue={ideia?.dataPostada ?? ""} />
          </Campo>
        </div>
        <Campo rotulo="Tags" htmlFor="tags">
          <Input
            id="tags"
            name="tags"
            defaultValue={ideia?.tags.join(", ") ?? ""}
            placeholder="Lote 2, devocional"
          />
        </Campo>
        <Campo rotulo="Notas" htmlFor="notas">
          <Textarea id="notas" name="notas" rows={3} defaultValue={ideia?.notas ?? ""} />
        </Campo>
        {ideia?.notaOrigem ? (
          <p className="text-sm text-muted-foreground">Nota do banco: {ideia.notaOrigem}</p>
        ) : null}
        {estado.erro ? <p className="text-sm text-destructive">{estado.erro}</p> : null}
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button type="submit" disabled={pendente}>
            {pendente ? "Salvando…" : "Salvar"}
          </Button>
          {ideia ? (
            <Button variant="outline" render={<Link href={`/ideias/${ideia.id}`} />}>
              Abrir roteiro
            </Button>
          ) : null}
        </div>
      </form>
    </>
  )
}

function Campo({
  rotulo,
  htmlFor,
  children,
}: {
  rotulo: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{rotulo}</Label>
      {children}
    </div>
  )
}
