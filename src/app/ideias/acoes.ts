"use server"

import { atualizarTelas } from "@/lib/atualizar-telas"
import { Prisma } from "@/generated/prisma/client"
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
} from "@/lib/conteudo"
import { prisma } from "@/lib/prisma"

export type EstadoFormulario = {
  ok?: boolean
  erro?: string
}

function texto(form: FormData, campo: string): string {
  return String(form.get(campo) ?? "").trim()
}

function textoLongo(form: FormData, campo: string): string {
  return String(form.get(campo) ?? "").replace(/\r\n/g, "\n").trim()
}

function dataDoFormulario(valor: string): Date | null {
  if (!valor) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null
  return new Date(`${valor}T12:00:00.000Z`)
}

function tagsDoFormulario(valor: string): string[] {
  const tags = valor
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
  return [...new Set(tags)]
}

function erroConhecido(erro: unknown): EstadoFormulario | null {
  if (!(erro instanceof Prisma.PrismaClientKnownRequestError)) return null
  if (erro.code === "P2002") return { erro: "Já existe uma ideia com esse título neste perfil." }
  if (erro.code === "P2025") return { erro: "Essa ideia não existe mais." }
  return null
}

export async function moverStatus(id: string, status: string) {
  if (!eStatus(status)) return
  await prisma.ideia.update({ where: { id }, data: { status } })
  atualizarTelas(id)
}

export async function agendarIdeia(id: string, iso: string | null) {
  if (iso !== null && !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return
  await prisma.ideia.update({
    where: { id },
    data: { dataPlanejada: iso ? new Date(`${iso}T12:00:00.000Z`) : null },
  })
  atualizarTelas(id)
}

export async function lerRoteiro(ideiaId: string) {
  const roteiro = await prisma.roteiro.findUnique({ where: { ideiaId } })
  if (!roteiro) return null
  return {
    formatoDescricao: roteiro.formatoDescricao,
    gancho: roteiro.gancho,
    parte1: roteiro.parte1Tensao,
    parte2: roteiro.parte2Virada,
    parte3: roteiro.parte3Aplicacao,
    legenda: roteiro.legenda,
    cta: roteiro.cta,
    porQuePerform: roteiro.porQuePerform,
  }
}

export async function salvarIdeia(_estado: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const id = texto(form, "id") || null
  const titulo = texto(form, "titulo")
  const perfil = texto(form, "perfil")
  const status = texto(form, "status")
  const prioridadeBruta = texto(form, "prioridade")
  const formato = texto(form, "formato")
  const serieId = texto(form, "serieId") || null
  const gancho = textoLongo(form, "gancho")
  const parte1 = textoLongo(form, "parte1")
  const parte2 = textoLongo(form, "parte2")
  const parte3 = textoLongo(form, "parte3")
  const legenda = textoLongo(form, "legenda")
  const cta = textoLongo(form, "cta")
  const porQue = textoLongo(form, "porQuePerform")
  const formatoDescricao = textoLongo(form, "formatoDescricao")

  if (!titulo) return { erro: "Dê um título para a ideia." }
  if (!ePerfil(perfil)) return { erro: "Escolha o perfil." }
  if (!eStatus(status)) return { erro: "Escolha um status." }
  if (prioridadeBruta && !ePrioridade(prioridadeBruta)) return { erro: "Escolha a prioridade." }
  if (formato && !eFormato(formato)) return { erro: "Escolha um formato." }
  if (!normalizarTitulo(titulo)) return { erro: "O título precisa ter alguma letra ou número." }
  const prioridade = prioridadeBruta && ePrioridade(prioridadeBruta) ? prioridadeBruta : null

  if (serieId) {
    const serie = await prisma.serie.findUnique({ where: { id: serieId } })
    if (!serie || serie.perfil !== perfil) {
      return { erro: "Essa série não é deste perfil." }
    }
  }

  const temRoteiro = [
    gancho,
    parte1,
    parte2,
    parte3,
    legenda,
    cta,
    porQue,
    formatoDescricao,
  ].some(Boolean)
  const statusSalvo = temRoteiro && status === "IDEIA" ? "ROTEIRIZANDO" : status
  const duracao = estimarDuracaoSegundos(formatoDescricao)

  const dados = {
    titulo,
    tituloNormalizado: normalizarTitulo(titulo),
    perfil,
    status: statusSalvo,
    prioridade,
    formato: formato || null,
    tags: tagsDoFormulario(texto(form, "tags")),
    notas: texto(form, "notas") || null,
    dataPlanejada: dataDoFormulario(texto(form, "dataPlanejada")),
    dataPostada: dataDoFormulario(texto(form, "dataPostada")),
    ...(duracao ? { duracaoEstimadaSeg: duracao } : {}),
  }

  let ideiaId = id
  try {
    if (id) {
      const atual = await prisma.ideia.findUnique({ where: { id } })
      if (!atual) return { erro: "Essa ideia não existe mais." }
      const mudouSerie = atual.serieId !== serieId
      const ordemNaSerie = mudouSerie ? await proximaOrdem(serieId) : atual.ordemNaSerie
      const ligacao = serieId
        ? { serie: { connect: { id: serieId } } }
        : atual.serieId
          ? { serie: { disconnect: true } }
          : {}
      await prisma.ideia.update({ where: { id }, data: { ...dados, ordemNaSerie, ...ligacao } })
    } else {
      const criada = await prisma.ideia.create({
        data: {
          ...dados,
          ordemNaSerie: await proximaOrdem(serieId),
          ...(serieId ? { serie: { connect: { id: serieId } } } : {}),
        },
      })
      ideiaId = criada.id
    }
    if (temRoteiro && ideiaId) {
      const campos = {
        formatoDescricao,
        gancho,
        parte1Tensao: parte1,
        parte2Virada: parte2,
        parte3Aplicacao: parte3,
        legenda,
        cta,
        porQuePerform: porQue,
      }
      const junto = Object.values(campos).join("\n")
      await prisma.roteiro.upsert({
        where: { ideiaId },
        create: {
          ideiaId,
          ...campos,
          referenciasBiblicas: extrairReferenciasBiblicas(junto),
          autoresCitados: extrairAutores(junto),
          marcadoresHistoria: extrairMarcadoresHistoria(junto),
        },
        update: {
          ...campos,
          referenciasBiblicas: extrairReferenciasBiblicas(junto),
          autoresCitados: extrairAutores(junto),
          marcadoresHistoria: extrairMarcadoresHistoria(junto),
        },
      })
    }
  } catch (erro) {
    const conhecido = erroConhecido(erro)
    if (conhecido) return conhecido
    throw erro
  }

  atualizarTelas(ideiaId ?? undefined)
  return { ok: true }
}

export async function excluirIdeia(form: FormData) {
  const id = texto(form, "id")
  if (!id) return
  try {
    await prisma.ideia.delete({ where: { id } })
  } catch (erro) {
    if (!(erro instanceof Prisma.PrismaClientKnownRequestError) || erro.code !== "P2025") throw erro
  }
  atualizarTelas(id)
}

async function proximaOrdem(serieId: string | null): Promise<number> {
  if (!serieId) return 0
  const agregado = await prisma.ideia.aggregate({
    where: { serieId },
    _max: { ordemNaSerie: true },
  })
  return (agregado._max.ordemNaSerie ?? 0) + 1
}

export async function salvarRoteiro(
  _estado: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  const ideiaId = texto(form, "ideiaId")
  const ideia = await prisma.ideia.findUnique({ where: { id: ideiaId } })
  if (!ideia) return { erro: "Essa ideia não existe mais." }

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

  const dados = {
    ...campos,
    referenciasBiblicas: extrairReferenciasBiblicas(junto),
    autoresCitados: extrairAutores(junto),
    marcadoresHistoria: extrairMarcadoresHistoria(junto),
  }

  try {
    await prisma.roteiro.upsert({
      where: { ideiaId },
      create: { ideiaId, ...dados },
      update: dados,
    })
  } catch (erro) {
    const conhecido = erroConhecido(erro)
    if (conhecido) return conhecido
    throw erro
  }

  atualizarTelas(ideiaId)
  return { ok: true }
}
