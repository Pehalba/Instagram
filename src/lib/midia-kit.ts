import { Bytes, doc, getDoc, writeBatch, type Firestore } from "firebase/firestore"
import { ePerfil, type Perfil } from "@/lib/conteudo"

export const COLECAO_MIDIA_KITS = "midiakits"
export const LIMITE_MIDIA_KIT = 20 * 1024 * 1024

// Um documento do Firestore aceita até 1 MiB, então o PDF vai em pedaços menores.
const TAMANHO_PARTE = 700 * 1024
const PARTES_POR_LOTE = 8

export type MidiaKit = {
  perfil: Perfil
  nome: string
  tamanho: number
  partes: number
  versao: string
  atualizadoEm: string
}

export function midiaKitDoDocumento(perfil: string, dados: Record<string, unknown> | undefined): MidiaKit | null {
  if (!dados || !ePerfil(perfil)) return null
  const { nome, tamanho, partes, versao, atualizadoEm } = dados
  if (typeof nome !== "string" || typeof tamanho !== "number" || typeof partes !== "number" || typeof versao !== "string") {
    return null
  }
  return {
    perfil,
    nome,
    tamanho,
    partes,
    versao,
    atualizadoEm: typeof atualizadoEm === "string" ? atualizadoEm : new Date(0).toISOString(),
  }
}

function referenciaParte(db: Firestore, perfil: Perfil, versao: string, indice: number) {
  return doc(db, COLECAO_MIDIA_KITS, perfil, "partes", `${versao}-${indice}`)
}

export async function enviarMidiaKit(
  db: Firestore,
  perfil: Perfil,
  arquivo: File,
  anterior: MidiaKit | null,
  aoProgredir: (fracao: number) => void,
): Promise<string | null> {
  const pdf = arquivo.type === "application/pdf" || arquivo.name.toLowerCase().endsWith(".pdf")
  if (!pdf) return "Escolha um arquivo PDF."
  if (arquivo.size === 0) return "Esse arquivo está vazio."
  if (arquivo.size > LIMITE_MIDIA_KIT) return "O PDF passa de 20 MB. Exporte uma versão mais leve."

  const bytes = new Uint8Array(await arquivo.arrayBuffer())
  const versao = Date.now().toString(36)
  const partes = Math.ceil(bytes.length / TAMANHO_PARTE)

  for (let inicio = 0; inicio < partes; inicio += PARTES_POR_LOTE) {
    const lote = writeBatch(db)
    for (let indice = inicio; indice < Math.min(partes, inicio + PARTES_POR_LOTE); indice++) {
      const trecho = bytes.subarray(indice * TAMANHO_PARTE, (indice + 1) * TAMANHO_PARTE)
      lote.set(referenciaParte(db, perfil, versao, indice), { dados: Bytes.fromUint8Array(trecho) })
    }
    await lote.commit()
    aoProgredir(Math.min(partes, inicio + PARTES_POR_LOTE) / partes)
  }

  const final = writeBatch(db)
  final.set(doc(db, COLECAO_MIDIA_KITS, perfil), {
    nome: arquivo.name,
    tamanho: arquivo.size,
    partes,
    versao,
    atualizadoEm: new Date().toISOString(),
  })
  if (anterior) {
    for (let indice = 0; indice < anterior.partes; indice++) {
      final.delete(referenciaParte(db, perfil, anterior.versao, indice))
    }
  }
  await final.commit()
  return null
}

export async function baixarMidiaKit(db: Firestore, kit: MidiaKit): Promise<Blob> {
  const partes = await Promise.all(
    Array.from({ length: kit.partes }, async (_, indice) => {
      const parte = await getDoc(referenciaParte(db, kit.perfil, kit.versao, indice))
      const dados = parte.data()?.dados
      if (!(dados instanceof Bytes)) throw new Error("Parte do mídia kit faltando.")
      return dados.toUint8Array()
    }),
  )
  return new Blob(partes as BlobPart[], { type: "application/pdf" })
}

export async function removerMidiaKit(db: Firestore, kit: MidiaKit) {
  const lote = writeBatch(db)
  lote.delete(doc(db, COLECAO_MIDIA_KITS, kit.perfil))
  for (let indice = 0; indice < kit.partes; indice++) {
    lote.delete(referenciaParte(db, kit.perfil, kit.versao, indice))
  }
  await lote.commit()
}
