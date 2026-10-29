import "dotenv/config"
import path from "node:path"
import Database from "better-sqlite3"
import { doc, writeBatch } from "firebase/firestore"
import { abrirFirestore } from "../src/lib/firebase-cliente"
import { COLECAO_IDEIAS, COLECAO_SERIES } from "../src/lib/gravar-nuvem"
import { configFirebase } from "../src/lib/firebase-config"

type Linha = Record<string, unknown>

function jsonLista(valor: unknown): string[] {
  if (Array.isArray(valor)) return valor.filter((item): item is string => typeof item === "string")
  if (typeof valor !== "string" || !valor) return []
  try {
    const lido = JSON.parse(valor) as unknown
    return Array.isArray(lido) ? lido.filter((item): item is string => typeof item === "string") : []
  } catch {
    return []
  }
}

function dia(valor: unknown): string | null {
  if (valor == null || valor === "") return null
  if (typeof valor === "number") return new Date(valor).toISOString().slice(0, 10)
  const texto = String(valor)
  const direto = texto.match(/^(\d{4}-\d{2}-\d{2})/)
  if (direto) return direto[1]
  const numero = Number(texto)
  if (!Number.isNaN(numero)) return new Date(numero).toISOString().slice(0, 10)
  return null
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : ""
}

async function gravarLotes(
  db: Awaited<ReturnType<typeof abrirFirestore>>,
  colecao: string,
  itens: { id: string; dados: Record<string, unknown> }[],
) {
  for (let inicio = 0; inicio < itens.length; inicio += 400) {
    const lote = writeBatch(db)
    for (const item of itens.slice(inicio, inicio + 400)) {
      lote.set(doc(db, colecao, item.id), item.dados)
    }
    await lote.commit()
  }
}

async function main() {
  if (!configFirebase()) {
    console.error("Preencha as chaves NEXT_PUBLIC_FIREBASE_* no arquivo .env antes de enviar.")
    process.exit(1)
  }

  const arquivo = path.join(process.cwd(), "prisma", "dev.db")
  const sqlite = new Database(arquivo, { readonly: true })
  const series = sqlite.prepare("select * from Serie").all() as Linha[]
  const ideias = sqlite.prepare("select * from Ideia").all() as Linha[]
  const roteiros = sqlite.prepare("select * from Roteiro").all() as Linha[]
  sqlite.close()

  const roteiroPorIdeia = new Map(roteiros.map((roteiro) => [String(roteiro.ideiaId), roteiro]))
  const agora = new Date().toISOString()

  const banco = await abrirFirestore()
  await gravarLotes(banco, COLECAO_SERIES, series.map((serie) => ({
    id: String(serie.id),
    dados: {
      nome: texto(serie.nome),
      nomeNormalizado: texto(serie.nomeNormalizado),
      perfil: texto(serie.perfil),
      descricao: texto(serie.descricao) || null,
      quadroFixo: serie.quadroFixo === 1 || serie.quadroFixo === true,
      ordem: Number(serie.ordem ?? 0),
      atualizadoEm: agora,
    },
  })))

  await gravarLotes(banco, COLECAO_IDEIAS, ideias.map((ideia) => {
    const roteiro = roteiroPorIdeia.get(String(ideia.id))
    return {
      id: String(ideia.id),
      dados: {
        titulo: texto(ideia.titulo),
        tituloNormalizado: texto(ideia.tituloNormalizado),
        perfil: texto(ideia.perfil),
        serieId: ideia.serieId ? String(ideia.serieId) : null,
        status: texto(ideia.status) || "IDEIA",
        prioridade: texto(ideia.prioridade) || null,
        formato: texto(ideia.formato) || null,
        duracaoEstimadaSeg: ideia.duracaoEstimadaSeg == null ? null : Number(ideia.duracaoEstimadaSeg),
        tags: jsonLista(ideia.tags),
        notaOrigem: texto(ideia.notaOrigem) || null,
        notas: texto(ideia.notas) || null,
        dataPlanejada: dia(ideia.dataPlanejada),
        dataPostada: dia(ideia.dataPostada),
        ordemNaSerie: Number(ideia.ordemNaSerie ?? 0),
        roteiro: roteiro
          ? {
              formatoDescricao: texto(roteiro.formatoDescricao),
              gancho: texto(roteiro.gancho),
              parte1Tensao: texto(roteiro.parte1Tensao),
              parte2Virada: texto(roteiro.parte2Virada),
              parte3Aplicacao: texto(roteiro.parte3Aplicacao),
              legenda: texto(roteiro.legenda),
              cta: texto(roteiro.cta),
              porQuePerform: texto(roteiro.porQuePerform),
              referenciasBiblicas: jsonLista(roteiro.referenciasBiblicas),
              autoresCitados: jsonLista(roteiro.autoresCitados),
              marcadoresHistoria: jsonLista(roteiro.marcadoresHistoria),
            }
          : null,
        atualizadoEm: agora,
      },
    }
  }))

  console.log(`Enviei ${series.length} séries e ${ideias.length} ideias para o Firebase.`)
}

main().catch((erro: unknown) => {
  console.error(erro instanceof Error ? erro.message : erro)
  process.exit(1)
})
