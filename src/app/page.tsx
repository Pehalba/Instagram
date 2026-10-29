import { type CartaoInicio } from "@/components/inicio/cartoes"
import { Inicio } from "@/components/inicio/inicio"
import { type PerfilPainel } from "@/components/inicio/painel"
import { PERFIL_LABEL, STATUS, ePerfil, eStatus, type Perfil, type StatusIdeia } from "@/lib/conteudo"
import { hojeLocal, indiceSemana, tituloMes } from "@/lib/datas"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function limitesDoMes(iso: string) {
  const [ano, mes] = iso.split("-").map(Number)
  return {
    inicio: new Date(Date.UTC(ano, mes - 1, 1)),
    fim: new Date(Date.UTC(ano, mes, 1)),
  }
}

function semanasDoMes(iso: string, datas: string[]) {
  const [ano, mes] = iso.split("-").map(Number)
  const ultimoDia = new Date(ano, mes, 0).getDate()
  const semanas: { inicio: number; fim: number; valor: number }[] = []
  let dia = 1
  while (dia <= ultimoDia) {
    const isoDia = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
    const fim = Math.min(ultimoDia, dia + (6 - indiceSemana(isoDia)))
    semanas.push({ inicio: dia, fim, valor: 0 })
    dia = fim + 1
  }
  for (const data of datas) {
    const numero = Number(data.slice(8, 10))
    const semana = semanas.find((item) => numero >= item.inicio && numero <= item.fim)
    if (semana) semana.valor += 1
  }
  return semanas.map((semana, indice) => ({
    numero: indice + 1,
    inicio: semana.inicio,
    fim: semana.fim,
    valor: semana.valor,
  }))
}

function contarPerfil(
  grupos: { perfil: string; _count: { _all: number } }[],
  perfil: Perfil,
) {
  return grupos.find((grupo) => grupo.perfil === perfil)?._count._all ?? 0
}

async function carregarResumo() {
  const isoHoje = hojeLocal()
  const { inicio, fim } = limitesDoMes(isoHoje)

  const [
    seriesPorPerfil,
    quadrosPorPerfil,
    porStatus,
    roteirosPorPerfil,
    agendadasPorPerfil,
    altasPorPerfil,
    doMes,
    listaRoteiros,
    listaQuadros,
    listaAltas,
  ] = await Promise.all([
    prisma.serie.groupBy({ by: ["perfil"], _count: { _all: true } }),
    prisma.serie.groupBy({ by: ["perfil"], where: { quadroFixo: true }, _count: { _all: true } }),
    prisma.ideia.groupBy({ by: ["perfil", "status"], _count: { _all: true } }),
    prisma.ideia.groupBy({ by: ["perfil"], where: { roteiro: { isNot: null } }, _count: { _all: true } }),
    prisma.ideia.groupBy({
      by: ["perfil"],
      where: { dataPlanejada: { not: null }, status: { not: "POSTADO" } },
      _count: { _all: true },
    }),
    prisma.ideia.groupBy({ by: ["perfil"], where: { prioridade: "ALTA" }, _count: { _all: true } }),
    prisma.ideia.findMany({
      where: {
        OR: [
          { dataPlanejada: { gte: inicio, lt: fim } },
          { dataPostada: { gte: inicio, lt: fim } },
        ],
      },
      select: { perfil: true, status: true, dataPlanejada: true, dataPostada: true },
    }),
    prisma.ideia.findMany({
      where: { roteiro: { isNot: null } },
      select: { id: true, titulo: true, perfil: true, serie: { select: { nome: true } } },
      orderBy: { titulo: "asc" },
    }),
    prisma.serie.findMany({
      where: { quadroFixo: true },
      select: { id: true, nome: true, perfil: true, _count: { select: { ideias: true } } },
      orderBy: [{ perfil: "asc" }, { ordem: "asc" }],
    }),
    prisma.ideia.findMany({
      where: { prioridade: "ALTA" },
      select: { id: true, titulo: true, perfil: true, serie: { select: { nome: true } } },
      orderBy: { titulo: "asc" },
    }),
  ])

  function montar(perfil: Perfil) {
    const doPerfil = porStatus.filter((grupo) => grupo.perfil === perfil)
    const contagem = new Map<StatusIdeia, number>()
    for (const grupo of doPerfil) {
      if (eStatus(grupo.status)) contagem.set(grupo.status, grupo._count._all)
    }
    const etapas = STATUS.filter((status) => status !== "AGENDADO").map((status) => ({ status, valor: contagem.get(status) ?? 0 }))
    const ideias = etapas.reduce((soma, etapa) => soma + etapa.valor, 0)
    const postadas = contagem.get("POSTADO") ?? 0
    const prontas = contagem.get("PRONTO_PARA_GRAVAR") ?? 0
    const mesDeste = doMes.filter((ideia) => ideia.perfil === perfil)
    const datasMarcadas = mesDeste
      .map((ideia) => ideia.dataPlanejada?.toISOString().slice(0, 10))
      .filter((dia): dia is string => dia !== undefined && dia.startsWith(isoHoje.slice(0, 7)))
    const publicadasNoMes = mesDeste.filter((ideia) => {
      if (ideia.status !== "POSTADO") return false
      const publicada = ideia.dataPostada?.toISOString().slice(0, 10)
      const marcada = ideia.dataPlanejada?.toISOString().slice(0, 10)
      const prefixo = isoHoje.slice(0, 7)
      return Boolean(publicada?.startsWith(prefixo) || marcada?.startsWith(prefixo))
    }).length
    const perfis: PerfilPainel[] = [{
      perfil,
      ideias,
      roteiros: contarPerfil(roteirosPorPerfil, perfil),
      agendadas: contarPerfil(agendadasPorPerfil, perfil),
    }]
    const frase =
      datasMarcadas.length === 0
        ? prontas > 0
          ? `${prontas} ideias já estão prontas para gravar. Marque os dias no calendário para o mês aparecer aqui.`
          : `O banco tem ${ideias} ideias. Quando você marcar um dia, o progresso do mês aparece aqui.`
        : `${datasMarcadas.length} ideias marcadas em ${tituloMes(isoHoje).toLowerCase()}, ${publicadasNoMes} já publicadas.`

    const cartoes: CartaoInicio[] = [
      { rotulo: "Séries", valor: contarPerfil(seriesPorPerfil, perfil), href: "/series" },
      { rotulo: "Ideias", valor: ideias, href: "/ideias" },
      {
        rotulo: "Roteiros",
        valor: contarPerfil(roteirosPorPerfil, perfil),
        descricao: "Ideias que já têm roteiro.",
        itens: listaRoteiros.flatMap((ideia) => ideia.perfil === perfil ? [{
          href: `/ideias/${ideia.id}`,
          titulo: ideia.titulo,
          detalhe: linhaPerfil(ideia.perfil, ideia.serie?.nome),
        }] : []),
      },
      {
        rotulo: "Quadros fixos",
        valor: contarPerfil(quadrosPorPerfil, perfil),
        descricao: "Séries marcadas como quadro fixo.",
        itens: listaQuadros.flatMap((serie) => serie.perfil === perfil ? [{
          href: `/series/${serie.id}`,
          titulo: serie.nome,
          detalhe: linhaPerfil(serie.perfil, `${serie._count.ideias} ${serie._count.ideias === 1 ? "ideia" : "ideias"}`),
        }] : []),
      },
      {
        rotulo: "Prioridade alta",
        valor: contarPerfil(altasPorPerfil, perfil),
        descricao: "Ideias marcadas como prioridade alta.",
        itens: listaAltas.flatMap((ideia) => ideia.perfil === perfil ? [{
          href: `/ideias?editar=${ideia.id}`,
          titulo: ideia.titulo,
          detalhe: linhaPerfil(ideia.perfil, ideia.serie?.nome),
        }] : []),
      },
    ]

    return {
      cartoes,
      painel: {
        mes: tituloMes(isoHoje),
        frase,
        postadas,
        agendadas: contarPerfil(agendadasPorPerfil, perfil),
        prontas,
        marcadasNoMes: datasMarcadas.length,
        publicadasNoMes,
        semanas: semanasDoMes(isoHoje, datasMarcadas),
        etapas,
        perfis,
      },
    }
  }

  return {
    carolalbas: montar("carolalbas"),
    albascouple: montar("albascouple"),
  }
}

function linhaPerfil(perfil: string, extra?: string | null) {
  const nome = ePerfil(perfil) ? PERFIL_LABEL[perfil] : perfil
  return extra ? `${nome} · ${extra}` : nome
}

export default async function Home() {
  const resumos = await carregarResumo()
  return <Inicio resumos={resumos} />
}
