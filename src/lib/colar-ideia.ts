import {
  estimarDuracaoSegundos,
  formatoEnum,
  normalizarTitulo,
  type Formato,
  type Perfil,
  type Prioridade,
  type StatusIdeia,
} from "@/lib/conteudo"

export type ColagemIdeia = {
  titulo: string
  perfil: Perfil | null
  serieNome: string
  status: StatusIdeia | null
  prioridade: Prioridade | null
  formato: Formato | null
  formatoDescricao: string
  duracaoEstimadaSeg: number | null
  tags: string
  notas: string
  dataPlanejada: string
  dataPostada: string
  gancho: string
  parte1: string
  parte2: string
  parte3: string
  legenda: string
  cta: string
  porQuePerform: string
  reconhecidos: string[]
  avisos: string[]
}

const ROTULOS: Record<string, string> = {
  perfil: "perfil",
  serie: "serieNome",
  titulo: "titulo",
  status: "status",
  prioridade: "prioridade",
  formato: "formatoCurto",
  "formato do roteiro": "formatoDescricao",
  tags: "tags",
  notas: "notas",
  "data planejada": "dataPlanejada",
  "data postada": "dataPostada",
  gancho: "gancho",
  "parte 1": "parte1",
  "parte 2": "parte2",
  "parte 3": "parte3",
  legenda: "legenda",
  cta: "cta",
  "por que performa": "porQuePerform",
}

const NOMES: Record<string, string> = {
  perfil: "perfil",
  serieNome: "série",
  titulo: "título",
  status: "status",
  prioridade: "prioridade",
  formatoDescricao: "formato",
  tags: "tags",
  notas: "notas",
  dataPlanejada: "data planejada",
  dataPostada: "data postada",
  gancho: "gancho",
  parte1: "parte 1",
  parte2: "parte 2",
  parte3: "parte 3",
  legenda: "legenda",
  cta: "CTA",
  porQuePerform: "por que performa",
}

export const MODELO_COLAGEM = `Perfil: @carolalbas
Série:
Título:
Status: Ideia
Prioridade: Média
Formato: Reels
Formato do roteiro: Reels, 45–60s
Tags:
Notas:

Gancho:

Parte 1:

Parte 2:

Parte 3:

Legenda:

CTA:

Por que performa:`

export const INSTRUCOES_COLAGEM = `Transforme a ideia em um texto para colar no estúdio de conteúdo. Responda só com o bloco, sem comentário antes ou depois e sem cerca de código. Preencha o que foi dito e deixe o rótulo vazio quando isso não foi falado. Não invente versículo, história pessoal nem dado novo. Onde a história pessoal ainda falta, escreva [sua história].

Perfil só pode ser @carolalbas ou @albascouple.
Status só pode ser Ideia, Roteirizada, Pronto para gravar, Gravado, Editado ou Postado.
Prioridade só pode ser Alta, Média ou Baixa.
Formato só pode ser Reels, Carrossel, Stories ou Threads.
Série é o nome exato, se existir. Se não existir, deixe vazio.
Tags separadas por vírgula.
Mantenha cada rótulo exatamente como está, com os dois-pontos. O texto de cada parte fica nas linhas de baixo, até o próximo rótulo.
Na voz de @carolalbas, fale no feminino, como a Carol. Em @albascouple, fale como o casal.

${MODELO_COLAGEM}`

function semAcento(valor: string): string {
  return valor.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

function limparBloco(bruto: string): string {
  return bruto
    .replace(/\r\n/g, "\n")
    .replace(/^\s*```[a-z]*\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim()
}

function rotuloDaLinha(linha: string): { campo: string; resto: string } | null {
  const limpa = linha.trim().replace(/^\s*[-*]\s*/, "").replace(/\*\*/g, "")
  const match = semAcento(limpa).match(/^([a-z0-9][a-z0-9 ]{0,40}?)\s*:\s*(.*)$/)
  if (!match) return null
  const nome = match[1].replace(/\s+/g, " ").replace(/^parte\s+[123]\b.*/, (texto) => texto.slice(0, 7))
  const campo = ROTULOS[nome]
  if (!campo) return null
  const original = limpa.match(/^[^:]+:\s*(.*)$/)
  return { campo, resto: (original?.[1] ?? match[2]).trim() }
}

function perfilDe(valor: string): Perfil | null {
  const texto = semAcento(valor).replace("@", "").trim()
  if (texto === "carolalbas" || texto === "carol") return "carolalbas"
  if (texto === "albascouple" || texto === "casal") return "albascouple"
  return null
}

function statusDe(valor: string): StatusIdeia | null {
  const texto = semAcento(valor).trim()
  const mapa: Record<string, StatusIdeia> = {
    ideia: "IDEIA",
    roteirizando: "ROTEIRIZANDO",
    roteirizada: "ROTEIRIZANDO",
    "pronto para gravar": "PRONTO_PARA_GRAVAR",
    gravado: "GRAVADO",
    editado: "EDITADO",
    agendado: "AGENDADO",
    postado: "POSTADO",
  }
  return mapa[texto] ?? null
}

function prioridadeDe(valor: string): Prioridade | null {
  const texto = semAcento(valor).trim()
  if (texto === "alta") return "ALTA"
  if (texto === "media") return "MEDIA"
  if (texto === "baixa") return "BAIXA"
  return null
}

function dataDe(valor: string): string | null {
  const match = valor.match(/\d{4}-\d{2}-\d{2}/)
  return match?.[0] ?? null
}

export function lerColagem(bruto: string): ColagemIdeia {
  const resultado: ColagemIdeia = {
    titulo: "",
    perfil: null,
    serieNome: "",
    status: null,
    prioridade: null,
    formato: null,
    formatoDescricao: "",
    duracaoEstimadaSeg: null,
    tags: "",
    notas: "",
    dataPlanejada: "",
    dataPostada: "",
    gancho: "",
    parte1: "",
    parte2: "",
    parte3: "",
    legenda: "",
    cta: "",
    porQuePerform: "",
    reconhecidos: [],
    avisos: [],
  }

  const linhas = limparBloco(bruto).split("\n")
  let campo = ""
  const blocos = new Map<string, string[]>()

  for (const linha of linhas) {
    const rotulo = rotuloDaLinha(linha)
    if (rotulo) {
      campo = rotulo.campo
      const atual = blocos.get(campo) ?? []
      if (rotulo.resto) atual.push(rotulo.resto)
      blocos.set(campo, atual)
      continue
    }
    if (!campo || !linha.trim()) {
      if (campo && linha.trim() === "") blocos.get(campo)?.push("")
      continue
    }
    blocos.get(campo)?.push(linha.trim())
  }

  function textoDo(nome: string): string {
    return (blocos.get(nome) ?? []).join("\n").trim()
  }

  resultado.titulo = textoDo("titulo")
  resultado.serieNome = textoDo("serieNome").replace(/^sem s[eé]rie$/i, "")
  resultado.tags = textoDo("tags")
  resultado.notas = textoDo("notas")
  resultado.gancho = textoDo("gancho")
  resultado.parte1 = textoDo("parte1")
  resultado.parte2 = textoDo("parte2")
  resultado.parte3 = textoDo("parte3")
  resultado.legenda = textoDo("legenda")
  resultado.cta = textoDo("cta")
  resultado.porQuePerform = textoDo("porQuePerform")
  resultado.formatoDescricao = textoDo("formatoDescricao") || textoDo("formatoCurto")

  const perfilBruto = textoDo("perfil")
  if (perfilBruto) {
    resultado.perfil = perfilDe(perfilBruto)
    if (!resultado.perfil) resultado.avisos.push("Perfil não reconhecido. Use @carolalbas ou @albascouple.")
  }

  const statusBruto = textoDo("status")
  if (statusBruto) {
    resultado.status = statusDe(statusBruto)
    if (!resultado.status) resultado.avisos.push("Status não reconhecido. Ele ficou como Ideia.")
  }

  const prioridadeBruta = textoDo("prioridade")
  if (prioridadeBruta) {
    resultado.prioridade = prioridadeDe(prioridadeBruta)
    if (!resultado.prioridade && !["sem prioridade", "nenhuma", "sem"].includes(semAcento(prioridadeBruta))) {
      resultado.avisos.push("Prioridade não reconhecida. Ela ficou sem prioridade.")
    }
  }

  resultado.formato = formatoEnum(resultado.formatoDescricao)
  resultado.duracaoEstimadaSeg = estimarDuracaoSegundos(resultado.formatoDescricao)
  if (resultado.formatoDescricao && !resultado.formato) {
    resultado.avisos.push("Formato não reconhecido. Use Reels, Carrossel, Stories ou Threads.")
  }

  for (const campoData of ["dataPlanejada", "dataPostada"] as const) {
    const brutoData = textoDo(campoData)
    if (!brutoData) continue
    const data = dataDe(brutoData)
    if (data) resultado[campoData] = data
    else resultado.avisos.push(`A ${NOMES[campoData]} precisa estar como 2026-10-29.`)
  }

  const temRoteiro = [resultado.gancho, resultado.parte1, resultado.parte2, resultado.parte3, resultado.legenda, resultado.cta, resultado.porQuePerform].some(Boolean)
  if (!resultado.status && temRoteiro) resultado.status = "PRONTO_PARA_GRAVAR"

  for (const [campo, nome] of Object.entries(NOMES)) {
    const valor = resultado[campo as keyof ColagemIdeia]
    if (typeof valor === "string" ? valor : valor) resultado.reconhecidos.push(nome)
  }
  if (!resultado.titulo) resultado.avisos.unshift("Não achei o título. A linha precisa ser Título: o nome da ideia.")

  return resultado
}

export function seriePeloNome(nome: string, perfil: Perfil, series: { id: string; nome: string; perfil: Perfil }[]): string {
  const chave = normalizarTitulo(nome)
  if (!chave) return ""
  return series.find((serie) => serie.perfil === perfil && normalizarTitulo(serie.nome) === chave)?.id ?? ""
}
