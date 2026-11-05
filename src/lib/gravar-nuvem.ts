import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  type Firestore,
  type WriteBatch,
} from "firebase/firestore"
import {
  eFormato,
  ePerfil,
  ePrioridade,
  eStatus,
  estimarDuracaoSegundos,
  extrairAutores,
  extrairMarcadoresHistoria,
  extrairReferenciasBiblicas,
  normalizarTitulo,
  prioridadeSalva,
  type Formato,
  type Perfil,
  type Prioridade,
  type StatusIdeia,
} from "@/lib/conteudo"
import { corSalva, emojiSalvo } from "@/lib/aparencia-serie"
import type { IdeiaLista, RoteiroEditor, SerieOpcao, SubserieOpcao } from "@/lib/tipos-ideia"

export const COLECAO_SERIES = "series"
export const COLECAO_SUBSERIES = "subseries"
export const COLECAO_IDEIAS = "ideias"

export type EstadoGravacao = {
  ok?: boolean
  erro?: string
}

export type RoteiroNuvem = {
  formatoDescricao: string
  gancho: string
  parte1Tensao: string
  parte2Virada: string
  parte3Aplicacao: string
  legenda: string
  cta: string
  porQuePerform: string
  referenciasBiblicas: string[]
  autoresCitados: string[]
  marcadoresHistoria: string[]
}

export type SerieNuvem = {
  id: string
  nome: string
  nomeNormalizado: string
  perfil: Perfil
  descricao: string | null
  quadroFixo: boolean
  cor: string | null
  emoji: string | null
  ordem: number
}

export type SubserieNuvem = {
  id: string
  nome: string
  nomeNormalizado: string
  serieId: string
  perfil: Perfil
  descricao: string | null
  cor: string | null
  emoji: string | null
  ordem: number
}

export type IdeiaNuvem = {
  id: string
  titulo: string
  tituloNormalizado: string
  perfil: Perfil
  serieId: string | null
  subserieId: string | null
  status: StatusIdeia
  prioridade: Prioridade | null
  formato: Formato | null
  duracaoEstimadaSeg: number | null
  tags: string[]
  notaOrigem: string | null
  notas: string | null
  dataPlanejada: string | null
  dataPostada: string | null
  ordemNaSerie: number
  roteiro: RoteiroNuvem | null
  criadoEm: string
  atualizadoEm: string
}

function texto(form: FormData, campo: string): string {
  return String(form.get(campo) ?? "").trim()
}

function textoLongo(form: FormData, campo: string): string {
  return String(form.get(campo) ?? "").replace(/\r\n/g, "\n").trim()
}

function dataDoFormulario(valor: string): string | null {
  if (!valor) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null
  return valor
}

function tagsDoFormulario(valor: string): string[] {
  return [...new Set(valor.split(",").map((tag) => tag.trim()).filter(Boolean))]
}

function listaTexto(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  return valor.filter((item): item is string => typeof item === "string")
}

function roteiroVazio(): RoteiroNuvem {
  return {
    formatoDescricao: "",
    gancho: "",
    parte1Tensao: "",
    parte2Virada: "",
    parte3Aplicacao: "",
    legenda: "",
    cta: "",
    porQuePerform: "",
    referenciasBiblicas: [],
    autoresCitados: [],
    marcadoresHistoria: [],
  }
}

export function roteiroTemTexto(roteiro: RoteiroNuvem | null): boolean {
  if (!roteiro) return false
  return [
    roteiro.formatoDescricao,
    roteiro.gancho,
    roteiro.parte1Tensao,
    roteiro.parte2Virada,
    roteiro.parte3Aplicacao,
    roteiro.legenda,
    roteiro.cta,
    roteiro.porQuePerform,
  ].some((campo) => campo.trim())
}

export function serieDoDocumento(id: string, dados: Record<string, unknown>): SerieNuvem | null {
  const nome = typeof dados.nome === "string" ? dados.nome : ""
  const perfil = typeof dados.perfil === "string" ? dados.perfil : ""
  if (!nome || !ePerfil(perfil)) return null
  return {
    id,
    nome,
    nomeNormalizado: typeof dados.nomeNormalizado === "string" ? dados.nomeNormalizado : normalizarTitulo(nome),
    perfil,
    descricao: typeof dados.descricao === "string" && dados.descricao ? dados.descricao : null,
    cor: typeof dados.cor === "string" ? dados.cor : null,
    emoji: typeof dados.emoji === "string" ? dados.emoji : null,
    quadroFixo: dados.quadroFixo === true,
    ordem: typeof dados.ordem === "number" ? dados.ordem : 0,
  }
}

export function subserieDoDocumento(id: string, dados: Record<string, unknown>): SubserieNuvem | null {
  const nome = typeof dados.nome === "string" ? dados.nome : ""
  const perfil = typeof dados.perfil === "string" ? dados.perfil : ""
  const serieId = typeof dados.serieId === "string" ? dados.serieId : ""
  if (!nome || !serieId || !ePerfil(perfil)) return null
  return {
    id,
    nome,
    nomeNormalizado: typeof dados.nomeNormalizado === "string" ? dados.nomeNormalizado : normalizarTitulo(nome),
    serieId,
    perfil,
    descricao: typeof dados.descricao === "string" && dados.descricao ? dados.descricao : null,
    cor: typeof dados.cor === "string" ? dados.cor : null,
    emoji: typeof dados.emoji === "string" ? dados.emoji : null,
    ordem: typeof dados.ordem === "number" ? dados.ordem : 0,
  }
}

export function ideiaDoDocumento(id: string, dados: Record<string, unknown>): IdeiaNuvem | null {
  const titulo = typeof dados.titulo === "string" ? dados.titulo : ""
  const perfil = typeof dados.perfil === "string" ? dados.perfil : ""
  const status = typeof dados.status === "string" ? dados.status : ""
  const prioridade = prioridadeSalva(typeof dados.prioridade === "string" ? dados.prioridade : null)
  if (!titulo || !ePerfil(perfil) || !eStatus(status) || prioridade === undefined) return null
  const formato = typeof dados.formato === "string" && eFormato(dados.formato) ? dados.formato : null
  const bruto = dados.roteiro
  const roteiro = bruto && typeof bruto === "object" ? roteiroDoCampo(bruto as Record<string, unknown>) : null
  const atualizadoEm = typeof dados.atualizadoEm === "string" ? dados.atualizadoEm : new Date(0).toISOString()
  return {
    id,
    titulo,
    tituloNormalizado: typeof dados.tituloNormalizado === "string" ? dados.tituloNormalizado : normalizarTitulo(titulo),
    perfil,
    serieId: typeof dados.serieId === "string" && dados.serieId ? dados.serieId : null,
    subserieId: typeof dados.subserieId === "string" && dados.subserieId ? dados.subserieId : null,
    status,
    prioridade,
    formato,
    duracaoEstimadaSeg: typeof dados.duracaoEstimadaSeg === "number" ? dados.duracaoEstimadaSeg : null,
    tags: listaTexto(dados.tags),
    notaOrigem: typeof dados.notaOrigem === "string" && dados.notaOrigem ? dados.notaOrigem : null,
    notas: typeof dados.notas === "string" && dados.notas ? dados.notas : null,
    dataPlanejada: typeof dados.dataPlanejada === "string" && dados.dataPlanejada ? dados.dataPlanejada : null,
    dataPostada: typeof dados.dataPostada === "string" && dados.dataPostada ? dados.dataPostada : null,
    ordemNaSerie: typeof dados.ordemNaSerie === "number" ? dados.ordemNaSerie : 0,
    roteiro: roteiroTemTexto(roteiro) ? roteiro : null,
    criadoEm: typeof dados.criadoEm === "string" ? dados.criadoEm : atualizadoEm,
    atualizadoEm,
  }
}

function roteiroDoCampo(dados: Record<string, unknown>): RoteiroNuvem {
  const base = roteiroVazio()
  const textoCampo = (campo: keyof RoteiroNuvem) => (typeof dados[campo] === "string" ? dados[campo] : "")
  return {
    ...base,
    formatoDescricao: textoCampo("formatoDescricao"),
    gancho: textoCampo("gancho"),
    parte1Tensao: textoCampo("parte1Tensao"),
    parte2Virada: textoCampo("parte2Virada"),
    parte3Aplicacao: textoCampo("parte3Aplicacao"),
    legenda: textoCampo("legenda"),
    cta: textoCampo("cta"),
    porQuePerform: textoCampo("porQuePerform"),
    referenciasBiblicas: listaTexto(dados.referenciasBiblicas),
    autoresCitados: listaTexto(dados.autoresCitados),
    marcadoresHistoria: listaTexto(dados.marcadoresHistoria),
  }
}

export function paraLista(ideia: IdeiaNuvem, series: SerieNuvem[], subseries: SubserieNuvem[] = []): IdeiaLista {
  const serie = series.find((item) => item.id === ideia.serieId) ?? null
  const subserie = ideia.subserieId ? subseries.find((item) => item.id === ideia.subserieId) ?? null : null
  return {
    id: ideia.id,
    titulo: ideia.titulo,
    perfil: ideia.perfil,
    serieId: ideia.serieId,
    serieNome: serie?.nome ?? null,
    subserieId: subserie?.id ?? null,
    subserieNome: subserie?.nome ?? null,
    quadroFixo: serie?.quadroFixo ?? false,
    ordemSerie: serie?.ordem ?? 9999,
    ordemNaSerie: ideia.ordemNaSerie,
    status: ideia.status,
    prioridade: ideia.prioridade,
    formato: ideia.formato,
    tags: ideia.tags,
    notas: ideia.notas,
    notaOrigem: ideia.notaOrigem,
    dataPlanejada: ideia.dataPlanejada,
    dataPostada: ideia.dataPostada,
    temRoteiro: roteiroTemTexto(ideia.roteiro),
    legenda: ideia.roteiro?.legenda ?? "",
    cta: ideia.roteiro?.cta ?? "",
    criadoEm: ideia.criadoEm,
    atualizadoEm: ideia.atualizadoEm,
  }
}

export function paraSerieOpcao(serie: SerieNuvem): SerieOpcao {
  return {
    id: serie.id,
    nome: serie.nome,
    perfil: serie.perfil,
    quadroFixo: serie.quadroFixo,
    ordem: serie.ordem,
  }
}

export function paraSubserieOpcao(subserie: SubserieNuvem): SubserieOpcao {
  return {
    id: subserie.id,
    nome: subserie.nome,
    serieId: subserie.serieId,
    perfil: subserie.perfil,
    ordem: subserie.ordem,
  }
}

export function paraRoteiroEditor(roteiro: RoteiroNuvem | null): RoteiroEditor {
  return {
    formatoDescricao: roteiro?.formatoDescricao ?? "",
    gancho: roteiro?.gancho ?? "",
    parte1Tensao: roteiro?.parte1Tensao ?? "",
    parte2Virada: roteiro?.parte2Virada ?? "",
    parte3Aplicacao: roteiro?.parte3Aplicacao ?? "",
    legenda: roteiro?.legenda ?? "",
    cta: roteiro?.cta ?? "",
    porQuePerform: roteiro?.porQuePerform ?? "",
    referenciasBiblicas: roteiro?.referenciasBiblicas ?? [],
    autoresCitados: roteiro?.autoresCitados ?? [],
  }
}

function proximaOrdem(ideias: IdeiaNuvem[], serieId: string | null): number {
  if (!serieId) return 0
  const maior = ideias.reduce((maximo, ideia) => (ideia.serieId === serieId ? Math.max(maximo, ideia.ordemNaSerie) : maximo), 0)
  return maior + 1
}

function agora(): string {
  return new Date().toISOString()
}

export async function salvarIdeiaNuvem(
  db: Firestore,
  form: FormData,
  ideias: IdeiaNuvem[],
  series: SerieNuvem[],
  subseries: SubserieNuvem[],
): Promise<EstadoGravacao> {
  const id = texto(form, "id") || null
  const titulo = texto(form, "titulo")
  const perfil = texto(form, "perfil")
  const status = texto(form, "status")
  const prioridadeBruta = texto(form, "prioridade")
  const formato = texto(form, "formato")
  const serieId = texto(form, "serieId") || null
  const subserieId = serieId ? texto(form, "subserieId") || null : null

  if (!titulo) return { erro: "Dê um título para a ideia." }
  if (!ePerfil(perfil)) return { erro: "Escolha o perfil." }
  if (!eStatus(status)) return { erro: "Escolha um status." }
  if (prioridadeBruta && !ePrioridade(prioridadeBruta)) return { erro: "Escolha a prioridade." }
  if (formato && !eFormato(formato)) return { erro: "Escolha um formato." }
  const tituloNormalizado = normalizarTitulo(titulo)
  if (!tituloNormalizado) return { erro: "O título precisa ter alguma letra ou número." }
  if (serieId && !series.some((serie) => serie.id === serieId && serie.perfil === perfil)) {
    return { erro: "Essa série não é deste perfil." }
  }
  if (subserieId && !subseries.some((subserie) => subserie.id === subserieId && subserie.serieId === serieId)) {
    return { erro: "Essa subsérie não é desta série." }
  }
  if (ideias.some((ideia) => ideia.id !== id && ideia.perfil === perfil && ideia.tituloNormalizado === tituloNormalizado)) {
    return { erro: "Já existe uma ideia com esse título neste perfil." }
  }

  const formatoDescricao = textoLongo(form, "formatoDescricao")
  const gancho = textoLongo(form, "gancho")
  const parte1 = textoLongo(form, "parte1")
  const parte2 = textoLongo(form, "parte2")
  const parte3 = textoLongo(form, "parte3")
  const legenda = textoLongo(form, "legenda")
  const cta = textoLongo(form, "cta")
  const porQue = textoLongo(form, "porQuePerform")
  const camposRoteiro = [gancho, parte1, parte2, parte3, legenda, cta, porQue, formatoDescricao]
  const temRoteiro = camposRoteiro.some(Boolean)
  const statusSalvo = temRoteiro && status === "IDEIA" ? "ROTEIRIZANDO" : status
  const atual = id ? ideias.find((ideia) => ideia.id === id) : undefined
  if (id && !atual) return { erro: "Essa ideia não existe mais." }

  const mudouSerie = atual ? atual.serieId !== serieId : true
  const junto = camposRoteiro.join("\n")
  const roteiro: RoteiroNuvem | null = temRoteiro
    ? {
        formatoDescricao,
        gancho,
        parte1Tensao: parte1,
        parte2Virada: parte2,
        parte3Aplicacao: parte3,
        legenda,
        cta,
        porQuePerform: porQue,
        referenciasBiblicas: extrairReferenciasBiblicas(junto),
        autoresCitados: extrairAutores(junto),
        marcadoresHistoria: extrairMarcadoresHistoria(junto),
      }
    : atual?.roteiro ?? null

  const referencia = doc(collection(db, COLECAO_IDEIAS))
  const ideiaId = id ?? referencia.id
  const agoraIso = agora()
  const gravacao = writeBatch(db)
  gravacao.set(doc(db, COLECAO_IDEIAS, ideiaId), {
    titulo,
    tituloNormalizado,
    perfil,
    serieId,
    subserieId,
    status: statusSalvo,
    prioridade: prioridadeBruta && ePrioridade(prioridadeBruta) ? prioridadeBruta : null,
    formato: formato && eFormato(formato) ? formato : null,
    duracaoEstimadaSeg: estimarDuracaoSegundos(formatoDescricao),
    tags: tagsDoFormulario(texto(form, "tags")),
    notaOrigem: atual?.notaOrigem ?? null,
    notas: texto(form, "notas") || null,
    dataPlanejada: dataDoFormulario(texto(form, "dataPlanejada")),
    dataPostada: dataDoFormulario(texto(form, "dataPostada")),
    ordemNaSerie: mudouSerie ? proximaOrdem(ideias, serieId) : atual?.ordemNaSerie ?? 0,
    roteiro,
    criadoEm: atual?.criadoEm ?? agoraIso,
    atualizadoEm: agoraIso,
  })
  await gravacao.commit()
  return { ok: true }
}

export async function excluirIdeiaNuvem(db: Firestore, id: string) {
  if (!id) return
  await deleteDoc(doc(db, COLECAO_IDEIAS, id))
}

export async function moverStatusNuvem(db: Firestore, id: string, status: string) {
  if (!eStatus(status)) return
  const gravacao = writeBatch(db)
  gravacao.update(doc(db, COLECAO_IDEIAS, id), { status, atualizadoEm: agora() })
  await gravacao.commit()
}

export async function agendarIdeiaNuvem(db: Firestore, id: string, iso: string | null) {
  if (iso !== null && !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return
  const gravacao = writeBatch(db)
  gravacao.update(doc(db, COLECAO_IDEIAS, id), { dataPlanejada: iso, atualizadoEm: agora() })
  await gravacao.commit()
}

export async function salvarRoteiroNuvem(
  db: Firestore,
  form: FormData,
  ideias: IdeiaNuvem[],
): Promise<EstadoGravacao> {
  const ideiaId = texto(form, "ideiaId")
  const atual = ideias.find((ideia) => ideia.id === ideiaId)
  if (!atual) return { erro: "Essa ideia não existe mais." }
  const campos = {
    gancho: textoLongo(form, "gancho"),
    parte1Tensao: textoLongo(form, "parte1"),
    parte2Virada: textoLongo(form, "parte2"),
    parte3Aplicacao: textoLongo(form, "parte3"),
    legenda: textoLongo(form, "legenda"),
    cta: textoLongo(form, "cta"),
    porQuePerform: textoLongo(form, "porQuePerform"),
  }
  const junto = Object.values(campos).join("\n")
  const roteiro: RoteiroNuvem = {
    formatoDescricao: atual.roteiro?.formatoDescricao ?? "",
    ...campos,
    referenciasBiblicas: extrairReferenciasBiblicas(junto),
    autoresCitados: extrairAutores(junto),
    marcadoresHistoria: extrairMarcadoresHistoria(junto),
  }
  const gravacao = writeBatch(db)
  gravacao.update(doc(db, COLECAO_IDEIAS, ideiaId), { roteiro, atualizadoEm: agora() })
  await gravacao.commit()
  return { ok: true }
}

export async function criarSerieNuvem(
  db: Firestore,
  form: FormData,
  series: SerieNuvem[],
): Promise<EstadoGravacao> {
  const nome = texto(form, "nome")
  const perfil = texto(form, "perfil")
  const descricao = texto(form, "descricao")
  const quadroFixo = form.get("quadroFixo") === "on"
  const nomeNormalizado = normalizarTitulo(nome)
  if (!nomeNormalizado) return { erro: "Dê um nome para a série." }
  if (!ePerfil(perfil)) return { erro: "Escolha o perfil." }
  if (series.some((serie) => serie.perfil === perfil && serie.nomeNormalizado === nomeNormalizado)) {
    return { erro: "Já existe uma série com esse nome neste perfil." }
  }
  const ordem = series.reduce((maximo, serie) => (serie.perfil === perfil ? Math.max(maximo, serie.ordem) : maximo), 0) + 1
  const referencia = doc(collection(db, COLECAO_SERIES))
  const gravacao = writeBatch(db)
  gravacao.set(referencia, {
    nome,
    nomeNormalizado,
    perfil,
    descricao: descricao || null,
    cor: corSalva(texto(form, "cor")),
    emoji: emojiSalvo(texto(form, "emoji")),
    quadroFixo,
    ordem,
    atualizadoEm: agora(),
  })
  await gravacao.commit()
  return { ok: true }
}

export async function editarSerieNuvem(
  db: Firestore,
  form: FormData,
  series: SerieNuvem[],
): Promise<EstadoGravacao> {
  const id = texto(form, "id")
  const nome = texto(form, "nome")
  const descricao = texto(form, "descricao")
  const quadroFixo = form.get("quadroFixo") === "on"
  const nomeNormalizado = normalizarTitulo(nome)
  const atual = series.find((serie) => serie.id === id)
  if (!atual) return { erro: "Essa série não existe mais." }
  if (!nomeNormalizado) return { erro: "Dê um nome para a série." }
  if (series.some((serie) => serie.id !== id && serie.perfil === atual.perfil && serie.nomeNormalizado === nomeNormalizado)) {
    return { erro: "Já existe uma série com esse nome neste perfil." }
  }
  const gravacao = writeBatch(db)
  gravacao.update(doc(db, COLECAO_SERIES, id), {
    nome,
    nomeNormalizado,
    descricao: descricao || null,
    cor: corSalva(texto(form, "cor")),
    emoji: emojiSalvo(texto(form, "emoji")),
    quadroFixo,
    atualizadoEm: agora(),
  })
  await gravacao.commit()
  return { ok: true }
}

type Operacao = (lote: WriteBatch) => void

const OPERACOES_POR_LOTE = 450

async function gravarEmLotes(db: Firestore, operacoes: Operacao[]) {
  for (let inicio = 0; inicio < operacoes.length; inicio += OPERACOES_POR_LOTE) {
    const lote = writeBatch(db)
    for (const operacao of operacoes.slice(inicio, inicio + OPERACOES_POR_LOTE)) operacao(lote)
    await lote.commit()
  }
}

export async function removerSerieNuvem(db: Firestore, id: string, ideias: IdeiaNuvem[], subseries: SubserieNuvem[]) {
  if (!id || id.startsWith("sem-")) return
  await removerSeriesNuvem(db, [id], ideias, subseries)
}

export async function removerSeriesNuvem(db: Firestore, ids: string[], ideias: IdeiaNuvem[], subseries: SubserieNuvem[]) {
  const alvo = new Set(ids.filter((id) => id && !id.startsWith("sem-")))
  if (alvo.size === 0) return
  const agoraIso = agora()
  const operacoes: Operacao[] = [
    ...[...alvo].map((id): Operacao => (lote) => lote.delete(doc(db, COLECAO_SERIES, id))),
    ...subseries
      .filter((subserie) => alvo.has(subserie.serieId))
      .map((subserie): Operacao => (lote) => lote.delete(doc(db, COLECAO_SUBSERIES, subserie.id))),
    ...ideias
      .filter((ideia) => ideia.serieId && alvo.has(ideia.serieId))
      .map((ideia): Operacao => (lote) =>
        lote.update(doc(db, COLECAO_IDEIAS, ideia.id), { serieId: null, subserieId: null, atualizadoEm: agoraIso }),
      ),
  ]
  await gravarEmLotes(db, operacoes)
}

export async function excluirIdeiasNuvem(db: Firestore, ids: string[]) {
  await gravarEmLotes(db, ids.filter(Boolean).map((id): Operacao => (lote) => lote.delete(doc(db, COLECAO_IDEIAS, id))))
}

export async function moverIdeiasNuvem(
  db: Firestore,
  ids: string[],
  destino: { serieId: string | null; subserieId: string | null },
  ideias: IdeiaNuvem[],
  series: SerieNuvem[],
  subseries: SubserieNuvem[],
): Promise<EstadoGravacao> {
  const selecionados = new Set(ids)
  const alvo = ideias.filter((ideia) => selecionados.has(ideia.id))
  if (alvo.length === 0) return { erro: "Nenhuma ideia selecionada." }
  const subserie = destino.subserieId ? subseries.find((item) => item.id === destino.subserieId) : null
  if (destino.subserieId && !subserie) return { erro: "Essa subsérie não existe mais." }
  const serieId = subserie?.serieId ?? destino.serieId
  const serie = serieId ? series.find((item) => item.id === serieId) : null
  if (serieId && !serie) return { erro: "Essa série não existe mais." }
  if (serie && alvo.some((ideia) => ideia.perfil !== serie.perfil)) {
    return { erro: "Só dá para mover para uma série do mesmo perfil das ideias." }
  }
  const subserieId = subserie?.id ?? null
  let ordem = proximaOrdem(ideias, serieId)
  const agoraIso = agora()
  const operacoes = alvo
    .filter((ideia) => ideia.serieId !== serieId || ideia.subserieId !== subserieId)
    .map((ideia): Operacao => {
      const ordemNaSerie = ideia.serieId === serieId ? ideia.ordemNaSerie : serieId ? ordem++ : 0
      return (lote) =>
        lote.update(doc(db, COLECAO_IDEIAS, ideia.id), { serieId, subserieId, ordemNaSerie, atualizadoEm: agoraIso })
    })
  await gravarEmLotes(db, operacoes)
  return { ok: true }
}

export async function moverSubseriesNuvem(
  db: Firestore,
  ids: string[],
  serieId: string,
  subseries: SubserieNuvem[],
  series: SerieNuvem[],
  ideias: IdeiaNuvem[],
): Promise<EstadoGravacao> {
  const serie = series.find((item) => item.id === serieId)
  if (!serie) return { erro: "Escolha a série." }
  const selecionadas = new Set(ids)
  const alvo = subseries.filter((subserie) => selecionadas.has(subserie.id) && subserie.serieId !== serieId)
  if (alvo.length === 0) return { ok: true }
  if (alvo.some((subserie) => subserie.perfil !== serie.perfil)) {
    return { erro: "Só dá para mover para uma série do mesmo perfil das subséries." }
  }
  const nomes = new Set(subseries.filter((item) => item.serieId === serieId).map((item) => item.nomeNormalizado))
  for (const subserie of alvo) {
    if (nomes.has(subserie.nomeNormalizado)) {
      return { erro: `${serie.nome} já tem uma subsérie chamada ${subserie.nome}.` }
    }
    nomes.add(subserie.nomeNormalizado)
  }
  let ordemSubserie = subseries.reduce((maximo, item) => (item.serieId === serieId ? Math.max(maximo, item.ordem) : maximo), 0) + 1
  let ordemIdeia = proximaOrdem(ideias, serieId)
  const movidas = new Set(alvo.map((subserie) => subserie.id))
  const agoraIso = agora()
  const operacoes: Operacao[] = [
    ...alvo.map((subserie): Operacao => {
      const ordem = ordemSubserie++
      return (lote) => lote.update(doc(db, COLECAO_SUBSERIES, subserie.id), { serieId, ordem, atualizadoEm: agoraIso })
    }),
    ...ideias
      .filter((ideia) => ideia.subserieId && movidas.has(ideia.subserieId))
      .map((ideia): Operacao => {
        const ordemNaSerie = ordemIdeia++
        return (lote) => lote.update(doc(db, COLECAO_IDEIAS, ideia.id), { serieId, ordemNaSerie, atualizadoEm: agoraIso })
      }),
  ]
  await gravarEmLotes(db, operacoes)
  return { ok: true }
}

export async function criarSubserieNuvem(
  db: Firestore,
  form: FormData,
  subseries: SubserieNuvem[],
  series: SerieNuvem[],
): Promise<EstadoGravacao> {
  const nome = texto(form, "nome")
  const serieId = texto(form, "serieId")
  const descricao = texto(form, "descricao")
  const nomeNormalizado = normalizarTitulo(nome)
  const serie = series.find((item) => item.id === serieId)
  if (!serie) return { erro: "Escolha a série." }
  if (!nomeNormalizado) return { erro: "Dê um nome para a subsérie." }
  if (subseries.some((item) => item.serieId === serieId && item.nomeNormalizado === nomeNormalizado)) {
    return { erro: "Já existe uma subsérie com esse nome nesta série." }
  }
  const ordem = subseries.reduce((maximo, item) => (item.serieId === serieId ? Math.max(maximo, item.ordem) : maximo), 0) + 1
  const gravacao = writeBatch(db)
  gravacao.set(doc(collection(db, COLECAO_SUBSERIES)), {
    nome,
    nomeNormalizado,
    serieId,
    perfil: serie.perfil,
    descricao: descricao || null,
    cor: corSalva(texto(form, "cor")),
    emoji: emojiSalvo(texto(form, "emoji")),
    ordem,
    atualizadoEm: agora(),
  })
  await gravacao.commit()
  return { ok: true }
}

export async function editarSubserieNuvem(
  db: Firestore,
  form: FormData,
  subseries: SubserieNuvem[],
): Promise<EstadoGravacao> {
  const id = texto(form, "id")
  const nome = texto(form, "nome")
  const descricao = texto(form, "descricao")
  const nomeNormalizado = normalizarTitulo(nome)
  const atual = subseries.find((item) => item.id === id)
  if (!atual) return { erro: "Essa subsérie não existe mais." }
  if (!nomeNormalizado) return { erro: "Dê um nome para a subsérie." }
  if (subseries.some((item) => item.id !== id && item.serieId === atual.serieId && item.nomeNormalizado === nomeNormalizado)) {
    return { erro: "Já existe uma subsérie com esse nome nesta série." }
  }
  const gravacao = writeBatch(db)
  gravacao.update(doc(db, COLECAO_SUBSERIES, id), {
    nome,
    nomeNormalizado,
    descricao: descricao || null,
    cor: corSalva(texto(form, "cor")),
    emoji: emojiSalvo(texto(form, "emoji")),
    atualizadoEm: agora(),
  })
  await gravacao.commit()
  return { ok: true }
}

export async function removerSubserieNuvem(db: Firestore, id: string, ideias: IdeiaNuvem[]) {
  if (!id) return
  await removerSubseriesNuvem(db, [id], ideias)
}

export async function removerSubseriesNuvem(db: Firestore, ids: string[], ideias: IdeiaNuvem[]) {
  const alvo = new Set(ids.filter(Boolean))
  if (alvo.size === 0) return
  const agoraIso = agora()
  await gravarEmLotes(db, [
    ...[...alvo].map((id): Operacao => (lote) => lote.delete(doc(db, COLECAO_SUBSERIES, id))),
    ...ideias
      .filter((ideia) => ideia.subserieId && alvo.has(ideia.subserieId))
      .map((ideia): Operacao => (lote) =>
        lote.update(doc(db, COLECAO_IDEIAS, ideia.id), { subserieId: null, atualizadoEm: agoraIso }),
      ),
  ])
}

export async function lerColecao(db: Firestore, nome: string) {
  const consulta = await getDocs(collection(db, nome))
  return consulta.docs.map((item) => ({ id: item.id, dados: item.data() as Record<string, unknown> }))
}
