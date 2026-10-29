import type { Formato, Perfil, Prioridade, StatusIdeia } from "@/lib/conteudo"

export type SerieOpcao = {
  id: string
  nome: string
  perfil: Perfil
  quadroFixo: boolean
  ordem: number
}

export type IdeiaLista = {
  id: string
  titulo: string
  perfil: Perfil
  serieId: string | null
  serieNome: string | null
  quadroFixo: boolean
  ordemSerie: number
  ordemNaSerie: number
  status: StatusIdeia
  prioridade: Prioridade | null
  formato: Formato | null
  tags: string[]
  notas: string | null
  notaOrigem: string | null
  dataPlanejada: string | null
  dataPostada: string | null
  temRoteiro: boolean
  legenda: string
  cta: string
  atualizadoEm: string
}

export type CartaoQuadro = {
  id: string
  titulo: string
  perfil: Perfil
  status: StatusIdeia
  prioridade: Prioridade | null
  serieNome: string | null
  dataPlanejada: string | null
}

export type RoteiroEditor = {
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
}
