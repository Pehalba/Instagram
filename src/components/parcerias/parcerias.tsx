"use client"

import { collection, onSnapshot, type Firestore } from "firebase/firestore"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { Check, Copy, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PERFIS, PERFIL_LABEL, classeTextoPerfil, normalizarTitulo, type Perfil } from "@/lib/conteudo"
import { abrirFirestore } from "@/lib/firebase-cliente"
import {
  CATEGORIAS_PARCERIA,
  COLECAO_MENSAGENS_PARCERIA,
  OUTRA_CATEGORIA,
  emojiDaCategoria,
  mensagemDoDocumento,
  removerMensagemParceria,
  salvarMensagemParceria,
  type MensagemParceria,
} from "@/lib/mensagens-parceria"
import { cn } from "cn"

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function Parcerias() {
  const [db, setDb] = useState<Firestore | null>(null)
  const [mensagens, setMensagens] = useState<MensagemParceria[]>([])
  const [carregado, setCarregado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [perfil, setPerfil] = useState<Perfil | "">("")
  const [categoria, setCategoria] = useState("")
  const [busca, setBusca] = useState("")
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    let ativo = true
    let cancelar = () => {}
    abrirFirestore()
      .then((banco) => {
        if (!ativo) return
        setDb(banco)
        cancelar = onSnapshot(
          collection(banco, COLECAO_MENSAGENS_PARCERIA),
          (consulta) => {
            setMensagens(consulta.docs.flatMap((item) => {
              const mensagem = mensagemDoDocumento(item.id, item.data())
              return mensagem ? [mensagem] : []
            }))
            setCarregado(true)
          },
          () => setErro("Não consegui ler as mensagens no Firebase."),
        )
      })
      .catch(() => setErro("Não consegui abrir o Firebase."))
    return () => {
      ativo = false
      cancelar()
    }
  }, [])

  const doPerfil = useMemo(
    () => mensagens.filter((mensagem) => !perfil || mensagem.perfil === null || mensagem.perfil === perfil),
    [mensagens, perfil],
  )
  const extras = useMemo(() => categoriasPersonalizadas(mensagens), [mensagens])
  const emUso = useMemo(() => {
    const contagem = new Map<string, number>()
    for (const mensagem of doPerfil) {
      const chave = mensagem.categoria ?? SEM_CATEGORIA
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
    }
    return [...contagem.entries()].sort((a, b) => posicaoCategoria(a[0]) - posicaoCategoria(b[0]) || a[0].localeCompare(b[0], "pt-BR"))
  }, [doPerfil])

  const visiveis = useMemo(() => {
    const consulta = normalizarTitulo(busca)
    return doPerfil
      .filter((mensagem) => !categoria || (mensagem.categoria ?? SEM_CATEGORIA) === categoria)
      .filter((mensagem) => !consulta || normalizarTitulo(`${mensagem.titulo} ${mensagem.texto} ${mensagem.categoria ?? ""}`).includes(consulta))
      .sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"))
  }, [busca, categoria, doPerfil])

  const grupos = useMemo(() => {
    const mapa = new Map<string, MensagemParceria[]>()
    for (const mensagem of visiveis) {
      const chave = mensagem.categoria ?? SEM_CATEGORIA
      mapa.set(chave, [...(mapa.get(chave) ?? []), mensagem])
    }
    return [...mapa.entries()].sort((a, b) => posicaoCategoria(a[0]) - posicaoCategoria(b[0]) || a[0].localeCompare(b[0], "pt-BR"))
  }, [visiveis])

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl leading-tight sm:text-4xl lg:text-5xl">Parcerias</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Mensagens prontas para mandar para marcas e parceiros. Copie, ajuste o nome e envie.
          </p>
        </div>
        <Button type="button" variant={criando ? "default" : "outline"} disabled={!db} onClick={() => setCriando((aberto) => !aberto)}>
          Nova mensagem
        </Button>
      </header>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Perfil">
          {[{ valor: "" as const, rotulo: "Todos" }, ...PERFIS.map((item) => ({ valor: item, rotulo: PERFIL_LABEL[item] }))].map((item) => (
            <button
              key={item.valor || "todos"}
              type="button"
              aria-pressed={perfil === item.valor}
              onClick={() => {
                setPerfil(item.valor)
                setCategoria("")
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                perfil === item.valor ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
              )}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
        {emUso.length > 0 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Categoria">
            <button
              type="button"
              aria-pressed={categoria === ""}
              onClick={() => setCategoria("")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                categoria === "" ? "border-foreground bg-foreground/10 text-foreground" : "bg-card text-muted-foreground",
              )}
            >
              Todas as categorias
            </button>
            {emUso.map(([nome, total]) => (
              <button
                key={nome}
                type="button"
                aria-pressed={categoria === nome}
                onClick={() => setCategoria(categoria === nome ? "" : nome)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  categoria === nome ? "border-foreground bg-foreground/10 text-foreground" : "bg-card text-muted-foreground",
                )}
              >
                {rotuloCategoria(nome)} · {total}
              </button>
            ))}
          </div>
        ) : null}
        <Input
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Buscar mensagem"
          aria-label="Buscar mensagem"
        />
      </div>

      {criando && db ? (
        <FormularioMensagem
          db={db}
          atual={null}
          perfilPadrao={perfil}
          categoriaPadrao={categoria === SEM_CATEGORIA ? "" : categoria}
          extras={extras}
          aoFechar={() => setCriando(false)}
        />
      ) : null}

      {erro ? (
        <p className="text-sm text-destructive">{erro}</p>
      ) : !carregado ? (
        <p className="text-sm text-muted-foreground">Abrindo as mensagens…</p>
      ) : visiveis.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-muted-foreground">
          {mensagens.length === 0
            ? "Nenhuma mensagem salva ainda. Clique em Nova mensagem para guardar a primeira."
            : "Nenhuma mensagem com esse filtro."}
        </p>
      ) : (
        grupos.map(([nome, daCategoria]) => (
          <section key={nome} className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {rotuloCategoria(nome)} · {daCategoria.length}
            </h2>
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {daCategoria.map((mensagem) => (
                <CartaoMensagem key={mensagem.id} db={db} mensagem={mensagem} extras={extras} />
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  )
}

const SEM_CATEGORIA = "__sem"

function posicaoCategoria(nome: string) {
  if (nome === SEM_CATEGORIA) return 10_000
  const indice = CATEGORIAS_PARCERIA.findIndex((categoria) => categoria.nome === nome)
  return indice === -1 ? 5_000 : indice
}

function rotuloCategoria(nome: string) {
  if (nome === SEM_CATEGORIA) return "Sem categoria"
  return `${emojiDaCategoria(nome)} ${nome}`
}

function categoriasPersonalizadas(mensagens: MensagemParceria[]) {
  const prontas = new Set(CATEGORIAS_PARCERIA.map((categoria) => categoria.nome))
  const nomes = new Set<string>()
  for (const mensagem of mensagens) {
    if (mensagem.categoria && !prontas.has(mensagem.categoria)) nomes.add(mensagem.categoria)
  }
  return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"))
}

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    const area = document.createElement("textarea")
    area.value = texto
    area.setAttribute("readonly", "")
    area.style.position = "fixed"
    area.style.opacity = "0"
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand("copy")
    area.remove()
    return ok
  }
}

function CartaoMensagem({ db, mensagem, extras }: { db: Firestore | null; mensagem: MensagemParceria; extras: string[] }) {
  const [editando, setEditando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [copiada, setCopiada] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const corpo = useRef<HTMLParagraphElement>(null)

  async function copiar() {
    setErro(null)
    const ok = await copiarTexto(mensagem.texto)
    if (!ok) {
      if (corpo.current) window.getSelection()?.selectAllChildren(corpo.current)
      setErro("O navegador bloqueou a cópia automática. O texto já está selecionado: aperte Ctrl+C.")
      return
    }
    setCopiada(true)
    setTimeout(() => setCopiada(false), 2000)
  }

  async function remover() {
    if (!db) return
    try {
      await removerMensagemParceria(db, mensagem.id)
    } catch {
      setErro("Não consegui excluir. Tente de novo.")
    }
  }

  if (editando && db) {
    return (
      <li className="min-w-0">
        <FormularioMensagem
          db={db}
          atual={mensagem}
          perfilPadrao={mensagem.perfil ?? ""}
          categoriaPadrao={mensagem.categoria ?? ""}
          extras={extras}
          aoFechar={() => setEditando(false)}
        />
      </li>
    )
  }

  return (
    <li className="min-w-0">
      <article className="flex h-full flex-col gap-3 rounded-2xl border bg-card px-4 py-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium">{mensagem.titulo}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <span className={mensagem.perfil ? classeTextoPerfil(mensagem.perfil) : undefined}>
                {mensagem.perfil ? PERFIL_LABEL[mensagem.perfil] : "Todos os perfis"}
              </span>
              {mensagem.categoria ? ` · ${emojiDaCategoria(mensagem.categoria)} ${mensagem.categoria}` : ""}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Editar ${mensagem.titulo}`} onClick={() => setEditando(true)}>
            <Pencil />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Excluir ${mensagem.titulo}`} onClick={() => setConfirmando(true)}>
            <Trash2 />
          </Button>
        </div>
        <p ref={corpo} className="text-sm whitespace-pre-line text-muted-foreground">{mensagem.texto}</p>
        {erro ? <p className="text-xs text-destructive">{erro}</p> : null}
        <div className="mt-auto flex flex-wrap items-center gap-2">
          {confirmando ? (
            <>
              <span className="text-xs text-muted-foreground">Excluir esta mensagem?</span>
              <Button type="button" variant="destructive" size="sm" onClick={remover}>Excluir</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmando(false)}>Cancelar</Button>
            </>
          ) : (
            <Button type="button" variant={copiada ? "outline" : "default"} onClick={copiar}>
              {copiada ? <Check /> : <Copy />}
              {copiada ? "Copiada" : "Copiar mensagem"}
            </Button>
          )}
        </div>
      </article>
    </li>
  )
}

function FormularioMensagem({
  db,
  atual,
  perfilPadrao,
  categoriaPadrao,
  extras,
  aoFechar,
}: {
  db: Firestore
  atual: MensagemParceria | null
  perfilPadrao: Perfil | ""
  categoriaPadrao: string
  extras: string[]
  aoFechar: () => void
}) {
  const [erro, setErro] = useState<string | null>(null)
  const [pendente, iniciar] = useTransition()
  const [categoria, setCategoria] = useState(categoriaPadrao)

  return (
    <form
      action={(form) => {
        setErro(null)
        iniciar(async () => {
          try {
            const falha = await salvarMensagemParceria(db, form, atual)
            if (falha) setErro(falha)
            else aoFechar()
          } catch {
            setErro("Não consegui salvar no Firebase. Tente de novo.")
          }
        })
      }}
      className="flex flex-col gap-3 rounded-2xl border bg-card px-4 py-4"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_14rem]">
        <label className="grid gap-1 text-xs text-muted-foreground">
          Título
          <Input name="titulo" required defaultValue={atual?.titulo ?? ""} placeholder="Ex.: Primeiro contato com marca" className="bg-background" />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          Perfil
          <select name="perfil" defaultValue={perfilPadrao} className={selectClass}>
            <option value="">Todos os perfis</option>
            {PERFIS.map((item) => (
              <option key={item} value={item}>{PERFIL_LABEL[item]}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs text-muted-foreground">
          Categoria
          <select name="categoria" value={categoria} onChange={(evento) => setCategoria(evento.target.value)} className={selectClass}>
            <option value="">Sem categoria</option>
            {CATEGORIAS_PARCERIA.map((item) => (
              <option key={item.nome} value={item.nome}>{item.emoji} {item.nome}</option>
            ))}
            {extras.length > 0 ? (
              <optgroup label="Suas categorias">
                {extras.map((nome) => (
                  <option key={nome} value={nome}>🏷️ {nome}</option>
                ))}
              </optgroup>
            ) : null}
            <option value={OUTRA_CATEGORIA}>➕ Outra categoria…</option>
          </select>
        </label>
        {categoria === OUTRA_CATEGORIA ? (
          <label className="grid gap-1 text-xs text-muted-foreground">
            Nome da categoria nova
            <Input name="categoriaNova" required maxLength={60} autoFocus placeholder="Ex.: Óticas" className="bg-background" />
          </label>
        ) : null}
      </div>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Mensagem
        <Textarea
          name="texto"
          required
          defaultValue={atual?.texto ?? ""}
          placeholder="Olá, [nome da marca]! Tudo bem? ..."
          className="min-h-48 bg-background text-sm"
        />
      </label>
      {erro ? <p className="text-xs text-destructive">{erro}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pendente}>{pendente ? "Salvando…" : atual ? "Salvar alterações" : "Salvar mensagem"}</Button>
        <Button type="button" variant="ghost" disabled={pendente} onClick={aoFechar}>Cancelar</Button>
      </div>
    </form>
  )
}
