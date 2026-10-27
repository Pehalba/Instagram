"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { duplicarIdeia, salvarRoteiro, type EstadoFormulario } from "@/app/ideias/acoes"
import { BotaoCopiar } from "@/components/banco/botao-copiar"
import { TextoMarcado } from "@/components/banco/texto-marcado"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FORMATO_LABEL, PERFIL_LABEL, STATUS_LABEL } from "@/lib/conteudo"
import {
  LIMITE_LEGENDA,
  fraseDuracao,
  temMarcadorAberto,
} from "@/lib/texto-roteiro"
import { extrairAutores, extrairReferenciasBiblicas } from "@/lib/conteudo"
import type { IdeiaLista, RoteiroEditor } from "@/lib/tipos-ideia"

export function EditorRoteiro({ ideia, roteiro }: { ideia: IdeiaLista; roteiro: RoteiroEditor }) {
  const [estado, acao, pendente] = useActionState<EstadoFormulario, FormData>(salvarRoteiro, {})
  const [gancho, setGancho] = useState(roteiro.gancho)
  const [parte1, setParte1] = useState(roteiro.parte1Tensao)
  const [parte2, setParte2] = useState(roteiro.parte2Virada)
  const [parte3, setParte3] = useState(roteiro.parte3Aplicacao)
  const [legenda, setLegenda] = useState(roteiro.legenda)
  const [cta, setCta] = useState(roteiro.cta)
  const [porQue, setPorQue] = useState(roteiro.porQuePerform)

  const falado = [gancho, parte1, parte2, parte3].join("\n")
  const tudo = [falado, legenda, cta, porQue].join("\n")
  const marcadorAberto = temMarcadorAberto(tudo)
  const referencias = extrairReferenciasBiblicas(tudo)
  const autores = extrairAutores(tudo)
  const pertoDoLimite = legenda.length > LIMITE_LEGENDA - 200

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <Link href="/ideias" className="text-sm text-muted-foreground hover:text-foreground">
            Voltar ao banco
          </Link>
          <h1 className="font-heading mt-2 text-4xl leading-tight sm:text-5xl">{ideia.titulo}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className={ideia.perfil === "carolalbas" ? "text-carol" : "text-casal"}>
              {PERFIL_LABEL[ideia.perfil]}
            </span>
            {ideia.serieNome ? ` · ${ideia.serieNome}` : ""}
            {ideia.formato ? ` · ${FORMATO_LABEL[ideia.formato]}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href={`/ideias?editar=${ideia.id}`} />}>
            Editar dados
          </Button>
          <form action={duplicarIdeia}>
            <input type="hidden" name="id" value={ideia.id} />
            <Button type="submit" variant="outline">
              Duplicar
            </Button>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{STATUS_LABEL[ideia.status]}</Badge>
        {ideia.notaOrigem ? <Badge variant="outline">{ideia.notaOrigem}</Badge> : null}
      </div>

      {roteiro.formatoDescricao ? (
        <p className="rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
          {roteiro.formatoDescricao}
        </p>
      ) : null}

      {marcadorAberto ? (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100">
          Ainda tem um trecho [sua história] sem preencher. Ele fica marcado em amarelo.
        </p>
      ) : null}

      <form action={acao} className="grid gap-5">
        <input type="hidden" name="ideiaId" value={ideia.id} />
        <Campo nome="gancho" rotulo="Gancho" valor={gancho} aoMudar={setGancho} linhas={3} />
        <Campo nome="parte1" rotulo="Parte 1 · tensão" valor={parte1} aoMudar={setParte1} linhas={5} />
        <Campo nome="parte2" rotulo="Parte 2 · virada" valor={parte2} aoMudar={setParte2} linhas={6} />
        <Campo nome="parte3" rotulo="Parte 3 · aplicação" valor={parte3} aoMudar={setParte3} linhas={5} />

        <p className="rounded-2xl border bg-card px-4 py-3 text-sm">
          {fraseDuracao(falado)}
          {temMarcadorAberto(falado) ? " O trecho [sua história] não entra nessa conta." : ""}
          <span className="mt-1 block text-muted-foreground">Estimativa em 150 palavras por minuto.</span>
        </p>

        <div className="grid gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="legenda">Legenda</Label>
            <span className={pertoDoLimite ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
              {legenda.length}/{LIMITE_LEGENDA}
            </span>
          </div>
          <Textarea id="legenda" name="legenda" rows={4} value={legenda} onChange={(evento) => setLegenda(evento.target.value)} />
          <TextoMarcado texto={legenda} />
        </div>

        <Campo nome="cta" rotulo="CTA" valor={cta} aoMudar={setCta} linhas={3} />
        <Campo nome="porQuePerform" rotulo="Por que performa" valor={porQue} aoMudar={setPorQue} linhas={3} />

        {referencias.length > 0 || autores.length > 0 ? (
          <div className="flex flex-col gap-2">
            {referencias.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {referencias.map((ref) => (
                  <Badge key={ref} variant="secondary">{ref}</Badge>
                ))}
              </div>
            ) : null}
            {autores.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {autores.map((autor) => (
                  <Badge key={autor} variant="outline">{autor}</Badge>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {estado.erro ? <p className="text-sm text-destructive">{estado.erro}</p> : null}
        {estado.ok ? <p className="text-sm text-carol">Roteiro salvo.</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pendente}>
            {pendente ? "Salvando…" : "Salvar roteiro"}
          </Button>
          <BotaoCopiar legenda={legenda} cta={cta} variante="secondary" />
        </div>
      </form>
    </div>
  )
}

function Campo({
  nome,
  rotulo,
  valor,
  aoMudar,
  linhas,
}: {
  nome: string
  rotulo: string
  valor: string
  aoMudar: (valor: string) => void
  linhas: number
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={nome}>{rotulo}</Label>
      <Textarea id={nome} name={nome} rows={linhas} value={valor} onChange={(evento) => aoMudar(evento.target.value)} />
      <TextoMarcado texto={valor} />
    </div>
  )
}
