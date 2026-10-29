"use client"

import { useActionState, useEffect, useState, type ReactNode } from "react"
import { ClipboardPaste } from "lucide-react"
import { lerRoteiro, salvarIdeia, type EstadoFormulario } from "@/app/ideias/acoes"
import { ExcluirIdeia } from "@/components/banco/excluir-ideia"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  eStatus,
  type Perfil,
  type StatusIdeia,
} from "@/lib/conteudo"
import { INSTRUCOES_COLAGEM, lerColagem, seriePeloNome, type ColagemIdeia } from "@/lib/colar-ideia"
import type { IdeiaLista, SerieOpcao } from "@/lib/tipos-ideia"
import { cn } from "cn"

type CamposRoteiro = {
  formatoDescricao: string
  gancho: string
  parte1: string
  parte2: string
  parte3: string
  legenda: string
  cta: string
  porQuePerform: string
}

const roteiroVazio: CamposRoteiro = {
  formatoDescricao: "",
  gancho: "",
  parte1: "",
  parte2: "",
  parte3: "",
  legenda: "",
  cta: "",
  porQuePerform: "",
}

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function DrawerIdeia({
  aberto,
  ideia,
  series,
  onFechar,
  padrao,
}: {
  aberto: boolean
  ideia: IdeiaLista | null
  series: SerieOpcao[]
  onFechar: () => void
  padrao?: { perfil: Perfil; serieId: string | null }
}) {
  return (
    <Dialog open={aberto} onOpenChange={(abertoAgora) => !abertoAgora && onFechar()}>
      <DialogContent>
        {aberto ? (
          <FormularioIdeia
            key={ideia?.id ?? `nova-${padrao?.serieId ?? "solta"}`}
            ideia={ideia}
            series={series}
            padrao={padrao}
            onSalvou={onFechar}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function FormularioIdeia({
  ideia,
  series,
  padrao,
  onSalvou,
}: {
  ideia: IdeiaLista | null
  series: SerieOpcao[]
  padrao?: { perfil: Perfil; serieId: string | null }
  onSalvou: () => void
}) {
  const [estado, acao, pendente] = useActionState<EstadoFormulario, FormData>(salvarIdeia, {})
  const [perfil, setPerfil] = useState(ideia?.perfil ?? padrao?.perfil ?? "carolalbas")
  const [serieId, setSerieId] = useState(ideia ? (ideia.serieId ?? "") : (padrao?.serieId ?? ""))
  const [preenchido, setPreenchido] = useState<ColagemIdeia | null>(null)
  const [versao, setVersao] = useState(0)
  const [colarAberto, setColarAberto] = useState(false)
  const [textoColado, setTextoColado] = useState("")
  const [avisos, setAvisos] = useState<string[]>([])
  const [copiado, setCopiado] = useState(false)
  const [roteiroAberto, setRoteiroAberto] = useState(false)
  const [roteiroPronto, setRoteiroPronto] = useState(false)
  const [roteiro, setRoteiro] = useState<CamposRoteiro>(roteiroVazio)
  const [status, setStatus] = useState<StatusIdeia>(ideia?.status ?? "IDEIA")
  const seriesDoPerfil = series.filter((serie) => serie.perfil === perfil)

  useEffect(() => {
    if (estado.ok) onSalvou()
  }, [estado, onSalvou])

  function aoMudarPerfil(valor: string) {
    setPerfil(valor === "albascouple" ? "albascouple" : "carolalbas")
    setSerieId("")
  }

  function aplicarColagem() {
    const lido = lerColagem(textoColado)
    if (!lido.titulo && lido.reconhecidos.length === 0) {
      setPreenchido(null)
      setAvisos(["Não reconheci o texto. Cole o bloco com Título:, Gancho:, Parte 1: e os outros rótulos."])
      return
    }
    const perfilAlvo = lido.perfil ?? perfil
    const serieEncontrada = lido.serieNome ? seriePeloNome(lido.serieNome, perfilAlvo, series) : ""
    if (lido.perfil) setPerfil(lido.perfil)
    setSerieId(serieEncontrada)
    if (!serieEncontrada && lido.serieNome) {
      lido.avisos.push(`Não encontrei a série “${lido.serieNome}”. A ideia fica sem série.`)
    }
    const camposRoteiro = {
      formatoDescricao: lido.formatoDescricao,
      gancho: lido.gancho,
      parte1: lido.parte1,
      parte2: lido.parte2,
      parte3: lido.parte3,
      legenda: lido.legenda,
      cta: lido.cta,
      porQuePerform: lido.porQuePerform,
    }
    const temTextoRoteiro = Object.values(camposRoteiro).some(Boolean)
    if (temTextoRoteiro) {
      setRoteiro(camposRoteiro)
      setRoteiroAberto(true)
      setRoteiroPronto(true)
    }
    if (lido.status) setStatus(lido.status)
    setPreenchido(lido)
    setAvisos(lido.avisos)
    setVersao((atual) => atual + 1)
  }

  async function abrirRoteiro() {
    setRoteiroAberto(true)
    if (!ideia || roteiroPronto || !ideia.temRoteiro) return
    const lido = await lerRoteiro(ideia.id)
    setRoteiroPronto(true)
    if (lido) setRoteiro(lido)
  }

  async function copiarInstrucoes() {
    await navigator.clipboard.writeText(INSTRUCOES_COLAGEM)
    setCopiado(true)
  }

  function temTextoDeRoteiro() {
    return Object.values(roteiro).some((valor) => valor.trim()) || Boolean(ideia?.temRoteiro)
  }

  function aoDesmarcar(alvo: StatusIdeia) {
    if (status !== alvo) return
    if (alvo === "ROTEIRIZANDO") {
      setStatus("IDEIA")
      return
    }
    setStatus(temTextoDeRoteiro() ? "ROTEIRIZANDO" : "IDEIA")
  }

  const temRoteiro = Boolean(
    preenchido &&
      [preenchido.gancho, preenchido.parte1, preenchido.parte2, preenchido.parte3, preenchido.legenda, preenchido.cta, preenchido.porQuePerform, preenchido.formatoDescricao].some(Boolean),
  )

  return (
    <>
      <DialogHeader>
        <DialogTitle className="pr-8 text-2xl sm:text-3xl">{ideia ? "Editar ideia" : "Nova ideia"}</DialogTitle>
        <DialogDescription>
          {ideia
            ? "Ajuste os dados sem sair da lista."
            : "Um título e o perfil já bastam. Ou cole o texto que a outra IA montou."}
        </DialogDescription>
      </DialogHeader>
      <form action={acao} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
        {ideia ? <input type="hidden" name="id" value={ideia.id} /> : null}
        {!ideia ? (
          <div className="flex flex-col gap-2 rounded-2xl border bg-muted/40 p-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={colarAberto ? "default" : "outline"} size="sm" onClick={() => setColarAberto((aberto) => !aberto)}>
                <ClipboardPaste />
                Colar texto
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={copiarInstrucoes}>
                {copiado ? "Instruções copiadas" : "Copiar modelo para a IA"}
              </Button>
            </div>
            {colarAberto ? (
              <>
                <Textarea
                  value={textoColado}
                  onChange={(evento) => setTextoColado(evento.target.value)}
                  rows={8}
                  placeholder={"Título: ...\nGancho:\n...\nParte 1:\n..."}
                  aria-label="Texto colado da outra IA"
                />
                <Button type="button" size="sm" onClick={aplicarColagem}>Preencher campos</Button>
              </>
            ) : null}
            {preenchido ? (
              <p className="text-xs text-muted-foreground">
                Preenchido: {preenchido.reconhecidos.join(", ")}.
                {temRoteiro && roteiroAberto ? " O roteiro entra junto ao salvar." : ""}
              </p>
            ) : null}
            {avisos.map((aviso) => (
              <p key={aviso} className="text-xs text-destructive">{aviso}</p>
            ))}
          </div>
        ) : null}
        <Campo rotulo="Título" htmlFor="titulo">
          <Input key={`titulo-${versao}`} id="titulo" name="titulo" defaultValue={preenchido?.titulo || ideia?.titulo || ""} required />
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Status" htmlFor="status">
            <select
              id="status"
              name="status"
              className={selectClass}
              value={status}
              onChange={(evento) => {
                if (eStatus(evento.target.value)) setStatus(evento.target.value)
              }}
            >
              {STATUS.filter((item) => item !== "AGENDADO").map((item) => (
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
              key={`prioridade-${versao}`}
              defaultValue={preenchido ? (preenchido.prioridade ?? "") : (ideia?.prioridade ?? "")}
            >
              <option value="">Sem prioridade</option>
              {PRIORIDADES.map((item) => (
                <option key={item} value={item}>
                  {PRIORIDADE_LABEL[item]}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <div className="grid gap-3">
          <Escolha
            grupo="Para gravar"
            nao="Não pronta"
            sim="Pronta para gravar"
            ativo={status === "PRONTO_PARA_GRAVAR"}
            onNao={() => aoDesmarcar("PRONTO_PARA_GRAVAR")}
            onSim={() => setStatus("PRONTO_PARA_GRAVAR")}
          />
          <Escolha
            grupo="Gravação"
            nao="Não gravado"
            sim="Gravado"
            ativo={status === "GRAVADO"}
            onNao={() => aoDesmarcar("GRAVADO")}
            onSim={() => setStatus("GRAVADO")}
          />
          <Escolha
            grupo="Publicação"
            nao="Não postado"
            sim="Postado"
            ativo={status === "POSTADO"}
            onNao={() => aoDesmarcar("POSTADO")}
            onSim={() => setStatus("POSTADO")}
          />
          <Escolha
            grupo="Roteiro"
            nao="Não roteirizada"
            sim="Roteirizada"
            ativo={status === "ROTEIRIZANDO"}
            onNao={() => aoDesmarcar("ROTEIRIZANDO")}
            onSim={() => setStatus("ROTEIRIZANDO")}
          />
          <Escolha
            grupo="Edição"
            nao="Não editado"
            sim="Editado"
            ativo={status === "EDITADO"}
            onNao={() => aoDesmarcar("EDITADO")}
            onSim={() => setStatus("EDITADO")}
          />
        </div>
        <Campo rotulo="Formato" htmlFor="formato">
          <select id="formato" name="formato" className={selectClass} key={`formato-${versao}`} defaultValue={preenchido?.formato ?? ideia?.formato ?? ""}>
            <option value="">Sem formato</option>
            {FORMATOS.map((item) => (
              <option key={item} value={item}>
                {FORMATO_LABEL[item]}
              </option>
            ))}
          </select>
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Data planejada (opcional)" htmlFor="dataPlanejada">
            <Input key={`planejada-${versao}`} id="dataPlanejada" name="dataPlanejada" type="date" defaultValue={preenchido?.dataPlanejada || ideia?.dataPlanejada || ""} />
          </Campo>
          <Campo rotulo="Data postada (opcional)" htmlFor="dataPostada">
            <Input key={`postada-${versao}`} id="dataPostada" name="dataPostada" type="date" defaultValue={preenchido?.dataPostada || ideia?.dataPostada || ""} />
          </Campo>
        </div>
        <Campo rotulo="Tags" htmlFor="tags">
          <Input
            id="tags"
            name="tags"
            key={`tags-${versao}`}
            defaultValue={preenchido?.tags || ideia?.tags.join(", ") || ""}
            placeholder="Lote 2, devocional"
          />
        </Campo>
        <Campo rotulo="Notas" htmlFor="notas">
          <Textarea key={`notas-${versao}`} id="notas" name="notas" rows={3} defaultValue={preenchido?.notas || ideia?.notas || ""} />
        </Campo>
        {ideia?.notaOrigem ? (
          <p className="text-sm text-muted-foreground">Nota do banco: {ideia.notaOrigem}</p>
        ) : null}
        <div className="grid gap-2">
          <span className="text-sm font-medium">Roteiro</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Roteiro">
            <button
              type="button"
              aria-pressed={!roteiroAberto}
              onClick={() => setRoteiroAberto(false)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                !roteiroAberto ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
              )}
            >
              Não
            </button>
            <button
              type="button"
              aria-pressed={roteiroAberto}
              onClick={() => void abrirRoteiro()}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                roteiroAberto ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
              )}
            >
              {ideia?.temRoteiro ? "Abrir" : "Adicionar"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Ao salvar com roteiro, a ideia fica roteirizada.</p>
          {roteiroAberto ? (
            <div className="grid gap-4 rounded-2xl border p-3">
              <Campo rotulo="Formato do roteiro" htmlFor="formatoDescricao">
                <Input
                  id="formatoDescricao"
                  name="formatoDescricao"
                  value={roteiro.formatoDescricao}
                  onChange={(evento) => setRoteiro((atual) => ({ ...atual, formatoDescricao: evento.target.value }))}
                  placeholder="Reels, 45–60s"
                />
              </Campo>
              <CampoRoteiro nome="gancho" rotulo="Gancho" valor={roteiro.gancho} aoMudar={(valor) => setRoteiro((atual) => ({ ...atual, gancho: valor }))} />
              <CampoRoteiro nome="parte1" rotulo="Parte 1" valor={roteiro.parte1} aoMudar={(valor) => setRoteiro((atual) => ({ ...atual, parte1: valor }))} />
              <CampoRoteiro nome="parte2" rotulo="Parte 2" valor={roteiro.parte2} aoMudar={(valor) => setRoteiro((atual) => ({ ...atual, parte2: valor }))} />
              <CampoRoteiro nome="parte3" rotulo="Parte 3" valor={roteiro.parte3} aoMudar={(valor) => setRoteiro((atual) => ({ ...atual, parte3: valor }))} />
              <CampoRoteiro nome="legenda" rotulo="Legenda" valor={roteiro.legenda} aoMudar={(valor) => setRoteiro((atual) => ({ ...atual, legenda: valor }))} />
              <CampoRoteiro nome="cta" rotulo="CTA" valor={roteiro.cta} aoMudar={(valor) => setRoteiro((atual) => ({ ...atual, cta: valor }))} />
              <CampoRoteiro nome="porQuePerform" rotulo="Por que performa" valor={roteiro.porQuePerform} aoMudar={(valor) => setRoteiro((atual) => ({ ...atual, porQuePerform: valor }))} />
            </div>
          ) : null}
        </div>
        {estado.erro ? <p className="text-sm text-destructive">{estado.erro}</p> : null}
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button type="submit" disabled={pendente}>
            {pendente ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
      {ideia ? (
        <div className="px-4 pb-6">
          <ExcluirIdeia id={ideia.id} titulo={ideia.titulo} temRoteiro={ideia.temRoteiro} onExcluiu={onSalvou} />
        </div>
      ) : null}
    </>
  )
}

function Escolha({
  grupo,
  nao,
  sim,
  ativo,
  onNao,
  onSim,
}: {
  grupo: string
  nao: string
  sim: string
  ativo: boolean
  onNao: () => void
  onSim: () => void
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{grupo}</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label={grupo}>
        <button
          type="button"
          aria-pressed={!ativo}
          onClick={onNao}
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            !ativo ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
          )}
        >
          {nao}
        </button>
        <button
          type="button"
          aria-pressed={ativo}
          onClick={onSim}
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            ativo ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
          )}
        >
          {sim}
        </button>
      </div>
    </div>
  )
}

function CampoRoteiro({
  nome,
  rotulo,
  valor,
  aoMudar,
}: {
  nome: string
  rotulo: string
  valor: string
  aoMudar: (valor: string) => void
}) {
  return (
    <Campo rotulo={rotulo} htmlFor={nome}>
      <Textarea id={nome} name={nome} rows={3} value={valor} onChange={(evento) => aoMudar(evento.target.value)} />
    </Campo>
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
