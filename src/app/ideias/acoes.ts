"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Prisma } from "@/generated/prisma/client"
import {
  eFormato,
  ePerfil,
  ePrioridade,
  eStatus,
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

function atualizarTelas(ideiaId?: string) {
  revalidatePath("/")
  revalidatePath("/ideias")
  revalidatePath("/kanban")
  revalidatePath("/calendario")
  if (ideiaId) revalidatePath(`/ideias/${ideiaId}`)
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

export async function salvarIdeia(_estado: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const id = texto(form, "id") || null
  const titulo = texto(form, "titulo")
  const perfil = texto(form, "perfil")
  const status = texto(form, "status")
  const prioridade = texto(form, "prioridade")
  const formato = texto(form, "formato")
  const novaSerie = texto(form, "novaSerie")
  let serieId = texto(form, "serieId") || null

  if (!titulo) return { erro: "Dê um título para a ideia." }
  if (!ePerfil(perfil)) return { erro: "Escolha o perfil." }
  if (!eStatus(status)) return { erro: "Escolha um status." }
  if (!ePrioridade(prioridade)) return { erro: "Escolha a prioridade." }
  if (formato && !eFormato(formato)) return { erro: "Escolha um formato." }
  if (!normalizarTitulo(titulo)) return { erro: "O título precisa ter alguma letra ou número." }

  if (novaSerie) {
    const nomeNormalizado = normalizarTitulo(novaSerie)
    const total = await prisma.serie.count({ where: { perfil } })
    const serie = await prisma.serie.upsert({
      where: { perfil_nomeNormalizado: { perfil, nomeNormalizado } },
      create: { nome: novaSerie, nomeNormalizado, perfil, ordem: total + 1 },
      update: {},
    })
    serieId = serie.id
  } else if (serieId) {
    const serie = await prisma.serie.findUnique({ where: { id: serieId } })
    if (!serie || serie.perfil !== perfil) {
      return { erro: "Essa série não é deste perfil." }
    }
  }

  const dados = {
    titulo,
    tituloNormalizado: normalizarTitulo(titulo),
    perfil,
    serieId,
    status,
    prioridade,
    formato: formato || null,
    tags: tagsDoFormulario(texto(form, "tags")),
    notas: texto(form, "notas") || null,
    dataPlanejada: dataDoFormulario(texto(form, "dataPlanejada")),
    dataPostada: dataDoFormulario(texto(form, "dataPostada")),
  }

  try {
    if (id) {
      const atual = await prisma.ideia.findUnique({ where: { id } })
      if (!atual) return { erro: "Essa ideia não existe mais." }
      const mudouSerie = atual.serieId !== serieId
      const ordemNaSerie = mudouSerie
        ? (await proximaOrdem(serieId))
        : atual.ordemNaSerie
      await prisma.ideia.update({ where: { id }, data: { ...dados, ordemNaSerie } })
    } else {
      await prisma.ideia.create({
        data: { ...dados, ordemNaSerie: await proximaOrdem(serieId) },
      })
    }
  } catch (erro) {
    const conhecido = erroConhecido(erro)
    if (conhecido) return conhecido
    throw erro
  }

  atualizarTelas(id ?? undefined)
  return { ok: true }
}

async function proximaOrdem(serieId: string | null): Promise<number> {
  if (!serieId) return 0
  const agregado = await prisma.ideia.aggregate({
    where: { serieId },
    _max: { ordemNaSerie: true },
  })
  return (agregado._max.ordemNaSerie ?? 0) + 1
}

export async function duplicarIdeia(form: FormData) {
  const id = texto(form, "id")
  const origem = await prisma.ideia.findUnique({
    where: { id },
    include: { roteiro: true },
  })
  if (!origem) redirect("/ideias")

  let titulo = ""
  for (let parte = 2; parte < 40; parte++) {
    const candidato = `${origem.titulo} — parte ${parte}`
    const existe = await prisma.ideia.findUnique({
      where: {
        perfil_tituloNormalizado: {
          perfil: origem.perfil,
          tituloNormalizado: normalizarTitulo(candidato),
        },
      },
    })
    if (!existe) {
      titulo = candidato
      break
    }
  }
  if (!titulo) throw new Error("Não encontrei um título livre para a cópia.")

  const criada = await prisma.ideia.create({
    data: {
      titulo,
      tituloNormalizado: normalizarTitulo(titulo),
      perfil: origem.perfil,
      serieId: origem.serieId,
      status: "IDEIA",
      prioridade: origem.prioridade,
      formato: origem.formato,
      duracaoEstimadaSeg: origem.duracaoEstimadaSeg,
      tags: origem.tags ?? [],
      notas: origem.notas,
      ordemNaSerie: await proximaOrdem(origem.serieId),
      roteiro: origem.roteiro
        ? {
            create: {
              formatoDescricao: origem.roteiro.formatoDescricao,
              gancho: origem.roteiro.gancho,
              parte1Tensao: origem.roteiro.parte1Tensao,
              parte2Virada: origem.roteiro.parte2Virada,
              parte3Aplicacao: origem.roteiro.parte3Aplicacao,
              legenda: origem.roteiro.legenda,
              cta: origem.roteiro.cta,
              porQuePerform: origem.roteiro.porQuePerform,
              referenciasBiblicas: origem.roteiro.referenciasBiblicas ?? [],
              autoresCitados: origem.roteiro.autoresCitados ?? [],
              marcadoresHistoria: origem.roteiro.marcadoresHistoria ?? [],
            },
          }
        : undefined,
    },
  })

  atualizarTelas(criada.id)
  redirect(`/ideias/${criada.id}`)
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
