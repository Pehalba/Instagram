import type { CartaoInicio } from "@/components/inicio/cartoes"
import type { PerfilPainel } from "@/components/inicio/painel"
import { PERFIS, PERFIL_LABEL, STATUS, ePerfil, type Perfil, type StatusIdeia } from "@/lib/conteudo"
import { hojeLocal, indiceSemana, tituloMes } from "@/lib/datas"
import type { IdeiaNuvem, SerieNuvem } from "@/lib/gravar-nuvem"
import { roteiroTemTexto } from "@/lib/gravar-nuvem"

type ResumoPerfil = {
  cartoes: CartaoInicio[]
  painel: {
    mes: string
    frase: string
    prontas: number
    editadas: number
    postadas: number
    marcadasNoMes: number
    publicadasNoMes: number
    semanas: { numero: number; inicio: number; fim: number; valor: number }[]
    etapas: { status: StatusIdeia; valor: number }[]
    perfis: PerfilPainel[]
  }
}

function limitesDoMes(iso: string) {
  const [ano, mes] = iso.split("-").map(Number)
  return {
    inicio: new Date(Date.UTC(ano, mes - 1, 1)),
    fim: new Date(Date.UTC(ano, mes, 1)),
  }
}

function noMes(iso: string | null, inicio: Date, fim: Date) {
  if (!iso) return false
  const data = new Date(`${iso}T12:00:00.000Z`)
  return data >= inicio && data < fim
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

function linhaPerfil(perfil: string, extra?: string | null) {
  const nome = ePerfil(perfil) ? PERFIL_LABEL[perfil] : perfil
  return extra ? `${nome} · ${extra}` : nome
}

export function resumosDaNuvem(ideias: IdeiaNuvem[], series: SerieNuvem[]): Record<Perfil, ResumoPerfil> {
  const isoHoje = hojeLocal()
  const { inicio, fim } = limitesDoMes(isoHoje)
  const prefixo = isoHoje.slice(0, 7)

  function montar(perfil: Perfil): ResumoPerfil {
    const doPerfil = ideias.filter((ideia) => ideia.perfil === perfil)
    const seriesDoPerfil = series.filter((serie) => serie.perfil === perfil)
    const contagem = new Map<StatusIdeia, number>()
    for (const status of STATUS) contagem.set(status, 0)
    for (const ideia of doPerfil) contagem.set(ideia.status, (contagem.get(ideia.status) ?? 0) + 1)
    const etapas = STATUS.filter((status) => status !== "AGENDADO").map((status) => ({ status, valor: contagem.get(status) ?? 0 }))
    const total = doPerfil.length
    const postadas = contagem.get("POSTADO") ?? 0
    const prontas = contagem.get("PRONTO_PARA_GRAVAR") ?? 0
    const editadas = contagem.get("EDITADO") ?? 0
    const roteiros = doPerfil.filter((ideia) => roteiroTemTexto(ideia.roteiro))
    const agendadas = doPerfil.filter((ideia) => ideia.dataPlanejada && ideia.status !== "POSTADO").length
    const altas = doPerfil.filter((ideia) => ideia.prioridade === "ALTA")
    const quadros = seriesDoPerfil.filter((serie) => serie.quadroFixo)
    const doMes = doPerfil.filter((ideia) => noMes(ideia.dataPlanejada, inicio, fim) || noMes(ideia.dataPostada, inicio, fim))
    const datasMarcadas = doMes
      .map((ideia) => ideia.dataPlanejada)
      .filter((dia): dia is string => Boolean(dia && dia.startsWith(prefixo)))
    const publicadasNoMes = doMes.filter((ideia) => {
      if (ideia.status !== "POSTADO") return false
      return Boolean(ideia.dataPostada?.startsWith(prefixo) || ideia.dataPlanejada?.startsWith(prefixo))
    }).length
    const nomeSerie = (serieId: string | null) => series.find((serie) => serie.id === serieId)?.nome ?? null
    const frase = datasMarcadas.length === 0
      ? prontas > 0
        ? `${prontas} ideias já estão prontas para gravar. Marque os dias no calendário para o mês aparecer aqui.`
        : `O banco tem ${total} ideias. Quando você marcar um dia, o progresso do mês aparece aqui.`
      : `${datasMarcadas.length} ideias marcadas em ${tituloMes(isoHoje).toLowerCase()}, ${publicadasNoMes} já publicadas.`

    return {
      cartoes: [
        { rotulo: "Séries", valor: seriesDoPerfil.length, href: "/series" },
        { rotulo: "Ideias", valor: total, href: "/ideias" },
        {
          rotulo: "Roteiros",
          valor: roteiros.length,
          descricao: "Ideias que já têm roteiro.",
          itens: roteiros.map((ideia) => ({
            href: `/ideias/${ideia.id}`,
            titulo: ideia.titulo,
            detalhe: linhaPerfil(ideia.perfil, nomeSerie(ideia.serieId)),
          })),
        },
        {
          rotulo: "Quadros fixos",
          valor: quadros.length,
          descricao: "Séries marcadas como quadro fixo.",
          itens: quadros.map((serie) => {
            const quantidade = doPerfil.filter((ideia) => ideia.serieId === serie.id).length
            return {
              href: `/series/${serie.id}`,
              titulo: serie.nome,
              detalhe: linhaPerfil(serie.perfil, `${quantidade} ${quantidade === 1 ? "ideia" : "ideias"}`),
            }
          }),
        },
        {
          rotulo: "Prioridade alta",
          valor: altas.length,
          descricao: "Ideias marcadas como prioridade alta.",
          itens: altas.map((ideia) => ({
            href: `/ideias?editar=${ideia.id}`,
            titulo: ideia.titulo,
            detalhe: linhaPerfil(ideia.perfil, nomeSerie(ideia.serieId)),
          })),
        },
      ],
      painel: {
        mes: tituloMes(isoHoje),
        frase,
        prontas,
        editadas,
        postadas,
        marcadasNoMes: datasMarcadas.length,
        publicadasNoMes,
        semanas: semanasDoMes(isoHoje, datasMarcadas),
        etapas,
        perfis: [{ perfil, ideias: total, roteiros: roteiros.length, agendadas }],
      },
    }
  }

  return Object.fromEntries(PERFIS.map((perfil) => [perfil, montar(perfil)])) as Record<Perfil, ResumoPerfil>
}
