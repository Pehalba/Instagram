"use client"

import { doc, onSnapshot, type Firestore } from "firebase/firestore"
import { useEffect, useRef, useState } from "react"
import { Download, FileText, RefreshCw, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PERFIL_LABEL, type Perfil } from "@/lib/conteudo"
import { abrirFirestore } from "@/lib/firebase-cliente"
import {
  COLECAO_MIDIA_KITS,
  baixarMidiaKit,
  enviarMidiaKit,
  midiaKitDoDocumento,
  removerMidiaKit,
  type MidiaKit,
} from "@/lib/midia-kit"

function tamanhoLegivel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`
}

export function MidiaKitPerfil({ perfil }: { perfil: Perfil }) {
  const [db, setDb] = useState<Firestore | null>(null)
  const [kit, setKit] = useState<MidiaKit | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [progresso, setProgresso] = useState<number | null>(null)
  const [baixando, setBaixando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const entrada = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let ativo = true
    let cancelar = () => {}
    abrirFirestore()
      .then((banco) => {
        if (!ativo) return
        setDb(banco)
        cancelar = onSnapshot(
          doc(banco, COLECAO_MIDIA_KITS, perfil),
          (documento) => {
            setKit(midiaKitDoDocumento(perfil, documento.data()))
            setCarregado(true)
          },
          () => setErro("Não consegui ler o mídia kit."),
        )
      })
      .catch(() => setErro("Não consegui abrir o Firebase."))
    return () => {
      ativo = false
      cancelar()
    }
  }, [perfil])

  async function enviar(arquivo: File | undefined) {
    if (!arquivo || !db) return
    setErro(null)
    setConfirmando(false)
    setProgresso(0)
    try {
      const falha = await enviarMidiaKit(db, perfil, arquivo, kit, setProgresso)
      if (falha) setErro(falha)
    } catch {
      setErro("O envio falhou. Tente de novo.")
    } finally {
      setProgresso(null)
      if (entrada.current) entrada.current.value = ""
    }
  }

  async function baixar() {
    if (!kit || !db) return
    setErro(null)
    setBaixando(true)
    try {
      const arquivo = await baixarMidiaKit(db, kit)
      const endereco = URL.createObjectURL(arquivo)
      const link = document.createElement("a")
      link.href = endereco
      link.download = kit.nome
      link.click()
      setTimeout(() => URL.revokeObjectURL(endereco), 10_000)
    } catch {
      setErro("Não consegui baixar o PDF. Tente de novo.")
    } finally {
      setBaixando(false)
    }
  }

  async function remover() {
    if (!kit || !db) return
    setErro(null)
    try {
      await removerMidiaKit(db, kit)
      setConfirmando(false)
    } catch {
      setErro("Não consegui remover. Tente de novo.")
    }
  }

  const enviando = progresso !== null

  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card px-4 py-4 sm:flex-row sm:items-center sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-medium">Mídia kit · {PERFIL_LABEL[perfil]}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {!carregado
              ? "Abrindo…"
              : enviando
                ? `Enviando… ${Math.round((progresso ?? 0) * 100)}%`
                : kit
                  ? `${kit.nome} · ${tamanhoLegivel(kit.tamanho)} · atualizado em ${new Date(kit.atualizadoEm).toLocaleDateString("pt-BR")}`
                  : "Nenhum PDF ainda. Envie o mídia kit para baixar quando precisar."}
          </p>
          {erro ? <p className="mt-1 text-xs text-destructive">{erro}</p> : null}
        </div>
      </div>
      <input
        ref={entrada}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(evento) => enviar(evento.target.files?.[0])}
      />
      {confirmando && kit ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Remover o PDF?</span>
          <Button type="button" variant="destructive" size="sm" onClick={remover}>Remover</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmando(false)}>Cancelar</Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {kit ? (
            <>
              <Button type="button" disabled={baixando || enviando} onClick={baixar}>
                <Download />
                {baixando ? "Baixando…" : "Baixar"}
              </Button>
              <Button type="button" variant="outline" disabled={!carregado || enviando} onClick={() => entrada.current?.click()}>
                <RefreshCw />
                Trocar PDF
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remover mídia kit"
                disabled={enviando}
                onClick={() => setConfirmando(true)}
              >
                <Trash2 />
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" disabled={!carregado || enviando} onClick={() => entrada.current?.click()}>
              <Upload />
              {enviando ? "Enviando…" : "Enviar PDF"}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
