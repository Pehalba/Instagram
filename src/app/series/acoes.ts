"use server"

import { redirect } from "next/navigation"
import { atualizarTelas } from "@/lib/atualizar-telas"
import { Prisma } from "@/generated/prisma/client"
import { ePerfil, normalizarTitulo } from "@/lib/conteudo"
import { prisma } from "@/lib/prisma"

export type EstadoSerie = {
  ok?: boolean
  erro?: string
}

export async function criarSerie(_estado: EstadoSerie, form: FormData): Promise<EstadoSerie> {
  const nome = String(form.get("nome") ?? "").trim()
  const perfil = String(form.get("perfil") ?? "")
  const descricao = String(form.get("descricao") ?? "").trim()
  const quadroFixo = form.get("quadroFixo") === "on"
  const nomeNormalizado = normalizarTitulo(nome)

  if (!nomeNormalizado) return { erro: "Dê um nome para a série." }
  if (!ePerfil(perfil)) return { erro: "Escolha o perfil." }

  try {
    const ultima = await prisma.serie.aggregate({ where: { perfil }, _max: { ordem: true } })
    await prisma.serie.create({
      data: {
        nome,
        nomeNormalizado,
        perfil,
        descricao: descricao || null,
        quadroFixo,
        ordem: (ultima._max.ordem ?? 0) + 1,
      },
    })
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      return { erro: "Já existe uma série com esse nome neste perfil." }
    }
    throw erro
  }

  atualizarTelas()
  return { ok: true }
}

export async function editarSerie(_estado: EstadoSerie, form: FormData): Promise<EstadoSerie> {
  const id = String(form.get("id") ?? "")
  const nome = String(form.get("nome") ?? "").trim()
  const descricao = String(form.get("descricao") ?? "").trim()
  const quadroFixo = form.get("quadroFixo") === "on"
  const nomeNormalizado = normalizarTitulo(nome)

  if (!id) return { erro: "Essa série não existe mais." }
  if (!nomeNormalizado) return { erro: "Dê um nome para a série." }

  const atual = await prisma.serie.findUnique({ where: { id }, select: { perfil: true } })
  if (!atual) return { erro: "Essa série não existe mais." }

  try {
    await prisma.serie.update({
      where: { id },
      data: {
        nome,
        nomeNormalizado,
        descricao: descricao || null,
        quadroFixo,
      },
    })
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      return { erro: "Já existe uma série com esse nome neste perfil." }
    }
    throw erro
  }

  atualizarTelas()
  return { ok: true }
}

export async function removerSerie(form: FormData) {
  const id = String(form.get("id") ?? "")
  if (!id || id.startsWith("sem-")) return

  try {
    await prisma.serie.delete({ where: { id } })
  } catch (erro) {
    if (!(erro instanceof Prisma.PrismaClientKnownRequestError) || erro.code !== "P2025") throw erro
  }

  atualizarTelas()
  if (form.get("voltar") === "1") redirect("/series")
}
