import "dotenv/config"
import { readFileSync } from "node:fs"
import path from "node:path"
import { prisma } from "../src/lib/prisma"
import {
  estimarDuracaoSegundos,
  extrairAutores,
  extrairMarcadoresHistoria,
  extrairReferenciasBiblicas,
  formatoEnum,
  normalizarTitulo,
  separarTituloENota,
  type Formato,
  type Perfil,
  type Prioridade,
  type StatusIdeia,
} from "../src/lib/conteudo"

const ARQUIVO = path.join(process.cwd(), "data", "banco-de-ideias.md")

type CampoRoteiro =
  | "formatoDescricao"
  | "gancho"
  | "parte1"
  | "parte2"
  | "parte3"
  | "legenda"
  | "cta"
  | "porQuePerforma"

type RoteiroDraft = {
  titulo: string
  perfil: Perfil
  formatoDescricao: string
  gancho: string
  parte1: string
  parte2: string
  parte3: string
  legenda: string
  cta: string
  porQuePerforma: string
  linha: number
}

type SerieDraft = {
  nome: string
  perfil: Perfil
  quadroFixo: boolean
  ordem: number
}

type IdeiaDraft = {
  titulo: string
  nota: string | null
  perfil: Perfil
  serie: SerieDraft | null
  gravada: boolean
  ordemNaSerie: number
  prioridade: Prioridade
  tags: string[]
  roteiro: RoteiroDraft | null
  linha: number
}

const CAMPOS: Record<string, CampoRoteiro> = {
  formato: "formatoDescricao",
  gancho: "gancho",
  "parte 1": "parte1",
  "parte 2": "parte2",
  "parte 3": "parte3",
  legenda: "legenda",
  cta: "cta",
  "por que performa": "porQuePerforma",
}

function perfilDe(valor: string): Perfil | null {
  const limpo = valor.trim().replace(/^@/, "").toLowerCase()
  if (limpo === "carolalbas" || limpo === "albasfilms" || limpo === "albascouple") return limpo
  return null
}

function roteiroVazio(titulo: string, perfil: Perfil, linha: number): RoteiroDraft {
  return {
    titulo,
    perfil,
    formatoDescricao: "",
    gancho: "",
    parte1: "",
    parte2: "",
    parte3: "",
    legenda: "",
    cta: "",
    porQuePerforma: "",
    linha,
  }
}

function textoDoRoteiro(roteiro: RoteiroDraft): string {
  return [
    roteiro.gancho,
    roteiro.parte1,
    roteiro.parte2,
    roteiro.parte3,
    roteiro.legenda,
    roteiro.cta,
    roteiro.porQuePerforma,
  ].join("\n")
}

type ParseResult = {
  series: SerieDraft[]
  ideias: IdeiaDraft[]
  naoInterpretadas: string[]
}

function parseMarkdown(markdown: string): ParseResult {
  const linhas = markdown.split(/\r?\n/)
  const series: SerieDraft[] = []
  const ideias: IdeiaDraft[] = []
  const roteiros: RoteiroDraft[] = []
  const naoInterpretadas: string[] = []

  let secao: "nenhuma" | "lote1" | "banco" | "proximos" = "nenhuma"
  let perfilBanco: Perfil | null = null
  let serieAtual: SerieDraft | null = null
  let ordemSerie = 0
  let ordemIdeia = 0
  let roteiroAtual: RoteiroDraft | null = null
  let campoAtual: CampoRoteiro | null = null
  let loteAtual: { numero: number; perfil: Perfil } | null = null
  const lotes: { numero: number; perfil: Perfil; titulo: string; linha: number }[] = []
  const chavesVistas = new Set<string>()

  function fecharRoteiro() {
    if (!roteiroAtual) return
    roteiros.push(roteiroAtual)
    roteiroAtual = null
    campoAtual = null
  }

  function anexarCampo(trecho: string) {
    if (!roteiroAtual || !campoAtual) return
    const atual = roteiroAtual[campoAtual]
    roteiroAtual[campoAtual] = atual ? `${atual}\n${trecho}` : trecho
  }

  for (let indice = 0; indice < linhas.length; indice++) {
    const linhaNumero = indice + 1
    const bruta = linhas[indice]
    const linha = bruta.trim()

    const continuacaoDeCampo =
      campoAtual !== null &&
      roteiroAtual !== null &&
      linha !== "" &&
      !linha.startsWith("**") &&
      !linha.startsWith("#")

    if (continuacaoDeCampo) {
      anexarCampo(linha)
      continue
    }

    if (linha.startsWith("**") || linha.startsWith("#")) campoAtual = null
    if (linha === "") continue

    const secaoLote = linha.match(/^##\s+Lote\s+1\s*$/i)
    const secaoBanco = linha.match(/^##\s+Banco de ideias\s+[—–-]\s+@(\S+)\s*$/i)
    const secaoProximos = linha.match(/^##\s+Próximos lotes\s*$/i)
    if (secaoLote || secaoBanco || secaoProximos) {
      fecharRoteiro()
      serieAtual = null
      loteAtual = null
      if (secaoLote) {
        secao = "lote1"
        perfilBanco = null
      } else if (secaoBanco) {
        secao = "banco"
        perfilBanco = perfilDe(secaoBanco[1])
        ordemSerie = 0
        if (!perfilBanco) {
          naoInterpretadas.push(`${linhaNumero}: perfil desconhecido em "${linha}"`)
        }
      } else {
        secao = "proximos"
        perfilBanco = null
      }
      continue
    }

    if (secao === "lote1" && linha.startsWith("###")) {
      fecharRoteiro()
      const corpo = linha.replace(/^###\s+/, "")
      const separador = corpo.lastIndexOf(" — ")
      if (separador === -1) {
        naoInterpretadas.push(`${linhaNumero}: heading de roteiro sem perfil: "${linha}"`)
        continue
      }
      const titulo = corpo
        .slice(0, separador)
        .replace(/^\d+\.\s+/, "")
        .trim()
      const perfil = perfilDe(corpo.slice(separador + 3))
      if (!titulo || !perfil) {
        naoInterpretadas.push(`${linhaNumero}: não entendi o roteiro "${linha}"`)
        continue
      }
      roteiroAtual = roteiroVazio(titulo, perfil, linhaNumero)
      continue
    }

    if (secao === "banco" && linha.startsWith("###")) {
      if (!perfilBanco) {
        naoInterpretadas.push(`${linhaNumero}: série fora de um perfil: "${linha}"`)
        continue
      }
      ordemSerie += 1
      ordemIdeia = 0
      serieAtual = {
        nome: linha.replace(/^###\s+/, "").trim(),
        perfil: perfilBanco,
        quadroFixo: false,
        ordem: ordemSerie,
      }
      series.push(serieAtual)
      continue
    }

    if (secao === "proximos" && linha.startsWith("###")) {
      const lote = linha.match(/^###\s+Lote\s+(\d+)\s+[—–-]\s+@(\S+)\s*$/i)
      if (!lote) {
        naoInterpretadas.push(`${linhaNumero}: heading de lote inesperado: "${linha}"`)
        loteAtual = null
        continue
      }
      const perfil = perfilDe(lote[2])
      if (!perfil) {
        naoInterpretadas.push(`${linhaNumero}: perfil desconhecido em "${linha}"`)
        loteAtual = null
        continue
      }
      loteAtual = { numero: Number(lote[1]), perfil }
      continue
    }

    const quadro = linha.match(/^Quadro fixo:\s*(sim|não|nao)\s*$/i)
    if (quadro) {
      if (secao === "banco" && serieAtual && ordemIdeia === 0) {
        serieAtual.quadroFixo = quadro[1].toLowerCase() === "sim"
      } else {
        naoInterpretadas.push(`${linhaNumero}: "Quadro fixo" fora de uma série: "${linha}"`)
      }
      continue
    }

    const campo = linha.match(/^\*\*([^*]+):\*\*\s*(.*)$/)
    if (campo && secao === "lote1" && roteiroAtual) {
      const nome = campo[1].trim().toLowerCase()
      const destino = CAMPOS[nome]
      if (!destino) {
        naoInterpretadas.push(`${linhaNumero}: campo desconhecido "${campo[1]}"`)
        continue
      }
      campoAtual = destino
      if (campo[2].trim()) anexarCampo(campo[2].trim())
      continue
    }

    const item = linha.match(/^[-*]\s+(?:\[([ xX])\]\s+)?(.+)$/)
    if (item && secao === "banco" && perfilBanco) {
      if (!serieAtual) {
        naoInterpretadas.push(`${linhaNumero}: ideia sem série: "${linha}"`)
        continue
      }
      const { titulo, nota } = separarTituloENota(item[2])
      if (!titulo) {
        naoInterpretadas.push(`${linhaNumero}: ideia sem título: "${linha}"`)
        continue
      }
      const chave = `${perfilBanco}::${normalizarTitulo(titulo)}`
      if (chavesVistas.has(chave)) {
        naoInterpretadas.push(`${linhaNumero}: título repetido no mesmo perfil: "${titulo}"`)
        continue
      }
      chavesVistas.add(chave)
      ordemIdeia += 1
      ideias.push({
        titulo,
        nota,
        perfil: perfilBanco,
        serie: serieAtual,
        gravada: (item[1] ?? " ").toLowerCase() === "x",
        ordemNaSerie: ordemIdeia,
        prioridade: "MEDIA",
        tags: [],
        roteiro: null,
        linha: linhaNumero,
      })
      continue
    }

    if (item && secao === "proximos") {
      if (!loteAtual) {
        naoInterpretadas.push(`${linhaNumero}: item de lote sem heading: "${linha}"`)
        continue
      }
      const { titulo } = separarTituloENota(item[2])
      lotes.push({ numero: loteAtual.numero, perfil: loteAtual.perfil, titulo, linha: linhaNumero })
      continue
    }

    if (secao === "lote1") {
      naoInterpretadas.push(`${linhaNumero}: ${linha}`)
    }
  }

  fecharRoteiro()

  const roteiroPorChave = new Map<string, RoteiroDraft>()
  for (const roteiro of roteiros) {
    const chave = `${roteiro.perfil}::${normalizarTitulo(roteiro.titulo)}`
    if (roteiroPorChave.has(chave)) {
      naoInterpretadas.push(`${roteiro.linha}: roteiro repetido "${roteiro.titulo}"`)
      continue
    }
    roteiroPorChave.set(chave, roteiro)
  }

  const ideiaPorChave = new Map(ideias.map((ideia) => [`${ideia.perfil}::${normalizarTitulo(ideia.titulo)}`, ideia]))
  const roteirosUsados = new Set<string>()

  for (const ideia of ideias) {
    const citaRoteiro = (ideia.nota ?? "").toLowerCase() === "roteiro no lote 1"
    if (!citaRoteiro) continue
    const chave = `${ideia.perfil}::${normalizarTitulo(ideia.titulo)}`
    const roteiro = roteiroPorChave.get(chave)
    if (!roteiro) {
      naoInterpretadas.push(
        `${ideia.linha}: "${ideia.titulo}" cita roteiro no Lote 1, mas não há roteiro com esse título em @${ideia.perfil}`,
      )
      continue
    }
    ideia.roteiro = roteiro
    roteirosUsados.add(chave)
  }

  for (const [chave, roteiro] of roteiroPorChave) {
    if (roteirosUsados.has(chave)) continue
    if (ideiaPorChave.has(chave)) {
      naoInterpretadas.push(
        `${roteiro.linha}: roteiro "${roteiro.titulo}" existe no banco sem a nota "(roteiro no Lote 1)" — não dupliquei`,
      )
      continue
    }
    const ideia: IdeiaDraft = {
      titulo: roteiro.titulo,
      nota: null,
      perfil: roteiro.perfil,
      serie: null,
      gravada: false,
      ordemNaSerie: 0,
      prioridade: "MEDIA",
      tags: [],
      roteiro,
      linha: roteiro.linha,
    }
    ideias.push(ideia)
    ideiaPorChave.set(chave, ideia)
    naoInterpretadas.push(
      `${roteiro.linha}: roteiro "${roteiro.titulo}" não estava no banco; criei a ideia sem série`,
    )
  }

  for (const lote of lotes) {
    const chave = `${lote.perfil}::${normalizarTitulo(lote.titulo)}`
    const ideia = ideiaPorChave.get(chave)
    if (!ideia) {
      naoInterpretadas.push(
        `${lote.linha}: Lote ${lote.numero} não achou "${lote.titulo}" em @${lote.perfil}`,
      )
      continue
    }
    ideia.prioridade = "ALTA"
    const tag = `Lote ${lote.numero}`
    if (!ideia.tags.includes(tag)) ideia.tags.push(tag)
  }

  return { series, ideias, naoInterpretadas }
}

function statusInicial(ideia: IdeiaDraft): StatusIdeia {
  if (ideia.gravada) return "GRAVADO"
  if (ideia.roteiro) return "PRONTO_PARA_GRAVAR"
  return "IDEIA"
}

async function main() {
  const markdown = readFileSync(ARQUIVO, "utf8")
  const { series, ideias, naoInterpretadas } = parseMarkdown(markdown)

  const resumo = {
    seriesNovas: 0,
    seriesAtualizadas: 0,
    ideiasNovas: 0,
    ideiasAtualizadas: 0,
    roteirosNovos: 0,
    roteirosAtualizados: 0,
  }

  await prisma.$transaction(
    async (tx) => {
      const serieId = new Map<string, string>()

      for (const serie of series) {
        const nomeNormalizado = normalizarTitulo(serie.nome)
        const onde = { perfil_nomeNormalizado: { perfil: serie.perfil, nomeNormalizado } }
        const existente = await tx.serie.findUnique({ where: onde })
        const salva = existente
          ? await tx.serie.update({
              where: { id: existente.id },
              data: { nome: serie.nome, quadroFixo: serie.quadroFixo, ordem: serie.ordem },
            })
          : await tx.serie.create({
              data: {
                nome: serie.nome,
                nomeNormalizado,
                perfil: serie.perfil,
                quadroFixo: serie.quadroFixo,
                ordem: serie.ordem,
              },
            })
        if (existente) resumo.seriesAtualizadas += 1
        else resumo.seriesNovas += 1
        serieId.set(`${serie.perfil}::${nomeNormalizado}`, salva.id)
      }

      for (const ideia of ideias) {
        const tituloNormalizado = normalizarTitulo(ideia.titulo)
        const onde = { perfil_tituloNormalizado: { perfil: ideia.perfil, tituloNormalizado } }
        const serieKey = ideia.serie
          ? `${ideia.serie.perfil}::${normalizarTitulo(ideia.serie.nome)}`
          : null
        const formato: Formato | null = ideia.roteiro ? formatoEnum(ideia.roteiro.formatoDescricao) : null
        const duracao = ideia.roteiro ? estimarDuracaoSegundos(ideia.roteiro.formatoDescricao) : null
        const existente = await tx.ideia.findUnique({ where: onde })

        let salvaId: string
        if (!existente) {
          const criada = await tx.ideia.create({
            data: {
              titulo: ideia.titulo,
              tituloNormalizado,
              perfil: ideia.perfil,
              serieId: serieKey ? serieId.get(serieKey) : null,
              status: statusInicial(ideia),
              prioridade: ideia.prioridade,
              formato,
              duracaoEstimadaSeg: duracao,
              tags: ideia.tags,
              notaOrigem: ideia.nota,
              ordemNaSerie: ideia.ordemNaSerie,
            },
          })
          salvaId = criada.id
          resumo.ideiasNovas += 1
        } else {
          const tagsAtuais = Array.isArray(existente.tags)
            ? existente.tags.filter((tag): tag is string => typeof tag === "string")
            : []
          const tags = [...tagsAtuais]
          for (const tag of ideia.tags) {
            if (!tags.includes(tag)) tags.push(tag)
          }
          let status = existente.status
          if (
            ideia.gravada &&
            (status === "IDEIA" || status === "ROTEIRIZANDO" || status === "PRONTO_PARA_GRAVAR")
          ) {
            status = "GRAVADO"
          }
          const atualizada = await tx.ideia.update({
            where: { id: existente.id },
            data: {
              titulo: ideia.titulo,
              serieId: serieKey ? serieId.get(serieKey) : existente.serieId,
              status,
              prioridade: ideia.prioridade === "ALTA" ? "ALTA" : existente.prioridade,
              formato: formato ?? existente.formato,
              duracaoEstimadaSeg: duracao ?? existente.duracaoEstimadaSeg,
              tags,
              notaOrigem: ideia.nota,
              ordemNaSerie: ideia.ordemNaSerie,
            },
          })
          salvaId = atualizada.id
          resumo.ideiasAtualizadas += 1
        }

        if (!ideia.roteiro) continue
        const texto = textoDoRoteiro(ideia.roteiro)
        const dadosRoteiro = {
          formatoDescricao: ideia.roteiro.formatoDescricao,
          gancho: ideia.roteiro.gancho,
          parte1Tensao: ideia.roteiro.parte1,
          parte2Virada: ideia.roteiro.parte2,
          parte3Aplicacao: ideia.roteiro.parte3,
          legenda: ideia.roteiro.legenda,
          cta: ideia.roteiro.cta,
          porQuePerform: ideia.roteiro.porQuePerforma,
          referenciasBiblicas: extrairReferenciasBiblicas(texto),
          autoresCitados: extrairAutores(texto),
          marcadoresHistoria: extrairMarcadoresHistoria(texto),
        }
        const roteiroExistente = await tx.roteiro.findUnique({ where: { ideiaId: salvaId } })
        if (roteiroExistente) {
          await tx.roteiro.update({ where: { id: roteiroExistente.id }, data: dadosRoteiro })
          resumo.roteirosAtualizados += 1
        } else {
          await tx.roteiro.create({ data: { ideiaId: salvaId, ...dadosRoteiro } })
          resumo.roteirosNovos += 1
        }
      }
    },
    { timeout: 120_000 },
  )

  const totalSeries = resumo.seriesNovas + resumo.seriesAtualizadas
  const totalIdeias = resumo.ideiasNovas + resumo.ideiasAtualizadas
  const totalRoteiros = resumo.roteirosNovos + resumo.roteirosAtualizados

  console.log("")
  console.log("Importação concluída")
  console.log(
    `Séries: ${totalSeries} (${resumo.seriesNovas} novas, ${resumo.seriesAtualizadas} já existiam)`,
  )
  console.log(
    `Ideias: ${totalIdeias} (${resumo.ideiasNovas} novas, ${resumo.ideiasAtualizadas} já existiam)`,
  )
  console.log(
    `Roteiros: ${totalRoteiros} (${resumo.roteirosNovos} novos, ${resumo.roteirosAtualizados} já existiam)`,
  )
  if (naoInterpretadas.length === 0) {
    console.log("Linhas não interpretadas: nenhuma")
  } else {
    console.log(`Linhas não interpretadas: ${naoInterpretadas.length}`)
    for (const aviso of naoInterpretadas) console.log(`  - ${aviso}`)
  }
  console.log("")
}

main()
  .catch((erro: unknown) => {
    console.error(erro)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
