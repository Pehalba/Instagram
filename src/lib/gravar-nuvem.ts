import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  type Firestore,
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
import type { IdeiaLista, RoteiroEditor, SerieOpcao } from "@/lib/tipos-ideia"

export const COLECAO_SERIES = "series"
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
  ordem: number
}

export type IdeiaNuvem = {
  id: string
  titulo: string
  tituloNormalizado: string
  perfil: Perfil
  serieId: string | null
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
    quadroFixo: dados.quadroFixo === true,
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
  return {
    id,
    titulo,
    tituloNormalizado: typeof dados.tituloNormalizado === "string" ? dados.tituloNormalizado : normalizarTitulo(titulo),
    perfil,
    serieId: typeof dados.serieId === "string" && dados.serieId ? dados.serieId : null,
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
    atualizadoEm: typeof dados.atualizadoEm === "string" ? dados.atualizadoEm : new Date(0).toISOString(),
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

export function paraLista(ideia: IdeiaNuvem, series: SerieNuvem[]): IdeiaLista {
  const serie = series.find((item) => item.id === ideia.serieId) ?? null
  return {
    id: ideia.id,
    titulo: ideia.titulo,
    perfil: ideia.perfil,
    serieId: ideia.serieId,
    serieNome: serie?.nome ?? null,
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
): Promise<EstadoGravacao> {
  const id = texto(form, "id") || null
  const titulo = texto(form, "titulo")
  const perfil = texto(form, "perfil")
  const status = texto(form, "status")
  const prioridadeBruta = texto(form, "prioridade")
  const formato = texto(form, "formato")
  const serieId = texto(form, "serieId") || null

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
  const gravacao = writeBatch(db)
  gravacao.set(doc(db, COLECAO_IDEIAS, ideiaId), {
    titulo,
    tituloNormalizado,
    perfil,
    serieId,
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
    atualizadoEm: agora(),
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
    quadroFixo,
    atualizadoEm: agora(),
  })
  await gravacao.commit()
  return { ok: true }
}

export async function removerSerieNuvem(db: Firestore, id: string, ideias: IdeiaNuvem[]) {
  if (!id || id.startsWith("sem-")) return
  const gravacao = writeBatch(db)
  gravacao.delete(doc(db, COLECAO_SERIES, id))
  const agoraIso = agora()
  for (const ideia of ideias) {
    if (ideia.serieId === id) {
      gravacao.update(doc(db, COLECAO_IDEIAS, ideia.id), { serieId: null, atualizadoEm: agoraIso })
    }
  }
  await gravacao.commit()
}

export async function lerColecao(db: Firestore, nome: string) {
  const consulta = await getDocs(collection(db, nome))
  return consulta.docs.map((item) => ({ id: item.id, dados: item.data() as Record<string, unknown> }))
}
