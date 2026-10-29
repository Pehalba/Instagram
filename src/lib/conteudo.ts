export const PERFIS = ["carolalbas", "albasfilms", "albascouple"] as const
export type Perfil = (typeof PERFIS)[number]

export const STATUS = [
  "PRONTO_PARA_GRAVAR",
  "GRAVADO",
  "POSTADO",
  "IDEIA",
  "ROTEIRIZANDO",
  "EDITADO",
  "AGENDADO",
] as const
export type StatusIdeia = (typeof STATUS)[number]

export const ORDEM_ETAPAS: StatusIdeia[] = [
  "IDEIA",
  "ROTEIRIZANDO",
  "PRONTO_PARA_GRAVAR",
  "GRAVADO",
  "EDITADO",
  "POSTADO",
]

export const STATUS_LABEL: Record<StatusIdeia, string> = {
  IDEIA: "Ideia",
  ROTEIRIZANDO: "Roteirizada",
  PRONTO_PARA_GRAVAR: "Pronto para gravar",
  GRAVADO: "Gravado",
  EDITADO: "Editado",
  AGENDADO: "Agendado",
  POSTADO: "Postado",
}

export const PRIORIDADES = ["ALTA", "MEDIA", "BAIXA"] as const
export type Prioridade = (typeof PRIORIDADES)[number]

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
}

export const FORMATOS = ["REELS", "CARROSSEL", "STORIES", "THREADS"] as const
export type Formato = (typeof FORMATOS)[number]

export const FORMATO_LABEL: Record<Formato, string> = {
  REELS: "Reels",
  CARROSSEL: "Carrossel",
  STORIES: "Stories",
  THREADS: "Threads",
}

export const PERFIL_LABEL: Record<Perfil, string> = {
  carolalbas: "@carolalbas",
  albasfilms: "@albasfilms",
  albascouple: "@albascouple",
}

const PONTUACAO_FINAL = /[\s.?!:;…,"""''«»]+$/u

/**
 * Casa títulos na importação: sem acento, minúsculo, sem pontuação só no fim.
 * Pontuação no meio do título (vírgulas, dois-pontos, "ep. 1") permanece.
 */
export function normalizarTitulo(valor: string): string {
  const semAcento = valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  let texto = semAcento.toLowerCase().replace(/\s+/g, " ").trim()
  let anterior = ""
  while (texto !== anterior) {
    anterior = texto
    texto = texto.replace(PONTUACAO_FINAL, "").trim()
  }
  return texto
}

/**
 * Parênteses no fim do item são nota, não título.
 * "Zelo ou controle? (roteiro no Lote 1)" → título + nota.
 */
export function separarTituloENota(bruto: string): { titulo: string; nota: string | null } {
  const texto = bruto.trim()
  const match = texto.match(/^(.*\S)\s*\(([^()]*)\)\s*$/)
  if (!match) return { titulo: texto, nota: null }
  return { titulo: match[1].trim(), nota: match[2].trim() }
}

export function chaveConteudo(perfil: string, titulo: string): string {
  return `${perfil}::${normalizarTitulo(titulo)}`
}

const LIVROS =
  "Isaías|Isaias|Salmos?|Coríntios|Corintios|Jeremias|Provérbios|Proverbios|Lucas|Mateus|João|Joao|Efésios|Efesios|Gálatas|Galatas|Gênesis|Genesis|Êxodo|Exodo|Marcos|Atos|Romanos|Tiago|Pedro|Apocalipse|Deuteronômio|Deuteronomio|Hebreus|Filipenses|Colossenses|Tessalonicenses|Timóteo|Timoteo|Tito|Filemom|Josué|Josue|Juízes|Juizes|Rute|Samuel|Reis|Crônicas|Cronicas|Esdras|Neemias|Ester|Jó|Jo|Eclesiastes|Cânticos|Canticos|Ezequiel|Daniel|Oséias|Oseias|Joel|Amós|Amos|Obadias|Jonas|Miquéias|Miqueias|Naum|Habacuque|Sofonias|Ageu|Zacarias|Malaquias|Judas"

const REFERENCIA = new RegExp(
  `\\b((?:[123]\\s+)?(?:${LIVROS}))\\s+(\\d+)(?::(\\d+)(?:\\s*[–\\-]\\s*(\\d+))?)?`,
  "gi",
)

export function extrairReferenciasBiblicas(texto: string): string[] {
  const vistas = new Set<string>()
  const saida: string[] = []
  for (const match of texto.matchAll(REFERENCIA)) {
    const livro = match[1].replace(/\s+/g, " ")
    const capitulo = match[2]
    const versiculo = match[3]
    const versiculoFim = match[4]
    let ref = `${livro} ${capitulo}`
    if (versiculo) {
      ref += `:${versiculo}`
      if (versiculoFim) ref += `–${versiculoFim}`
    }
    const chave = normalizarTitulo(ref)
    if (vistas.has(chave)) continue
    vistas.add(chave)
    saida.push(ref)
  }
  return saida
}

const AUTORES_CONHECIDOS = [
  "C. S. Lewis",
  "Tim Keller",
  "Dallas Willard",
  "Emerson Eggerichs",
  "Elisabeth Elliot",
  "Agostinho",
]

export function extrairAutores(texto: string): string[] {
  return AUTORES_CONHECIDOS.filter((autor) => texto.includes(autor))
}

/** Marcadores que a Carol ainda precisa preencher com história pessoal. */
export function extrairMarcadoresHistoria(texto: string): string[] {
  const encontrados = texto.match(/\[[^\]]+\]/g) ?? []
  return encontrados.filter((trecho) => /sua hist[oó]ria/i.test(trecho))
}

export function estimarDuracaoSegundos(formato: string): number | null {
  const faixa = formato.match(/(\d+)\s*[–-]\s*(\d+)\s*s/i)
  if (faixa) {
    const inicio = Number(faixa[1])
    const fim = Number(faixa[2])
    return Math.round((inicio + fim) / 2)
  }
  const unico = formato.match(/(\d+)\s*s/i)
  if (unico) return Number(unico[1])
  return null
}

export function formatoEnum(descricao: string): Formato | null {
  const texto = descricao.toLowerCase()
  // "Reels" vem antes de "carrossel": vários roteiros são Reels com uma versão em carrossel.
  if (texto.includes("reel")) return "REELS"
  if (texto.includes("carrossel")) return "CARROSSEL"
  if (texto.includes("stories")) return "STORIES"
  if (texto.includes("thread")) return "THREADS"
  // Vídeo curto sem a palavra Reels (jogo de veredito, episódio de série) entra como Reels.
  if (/\d+\s*[–-]?\s*\d*\s*s\b/i.test(descricao)) return "REELS"
  return null
}

export function ePerfil(valor: string): valor is Perfil {
  return (PERFIS as readonly string[]).includes(valor)
}

export function eStatus(valor: string): valor is StatusIdeia {
  return (STATUS as readonly string[]).includes(valor)
}

export function ePrioridade(valor: string): valor is Prioridade {
  return (PRIORIDADES as readonly string[]).includes(valor)
}

/** `null` é sem prioridade. `undefined` é um valor inválido. */
export function prioridadeSalva(valor: string | null): Prioridade | null | undefined {
  if (!valor) return null
  return ePrioridade(valor) ? valor : undefined
}

export function eFormato(valor: string): valor is Formato {
  return (FORMATOS as readonly string[]).includes(valor)
}

export function comoTags(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  return valor.filter((item): item is string => typeof item === "string")
}

const APARENCIA: Record<Perfil, { texto: string; borda: string; ponto: string; fundo: string }> = {
  carolalbas: { texto: "text-carol", borda: "border-carol", ponto: "bg-carol", fundo: "bg-carol/10" },
  albasfilms: { texto: "text-films", borda: "border-films", ponto: "bg-films", fundo: "bg-films/10" },
  albascouple: { texto: "text-casal", borda: "border-casal", ponto: "bg-casal", fundo: "bg-casal/10" },
}

export function classeTextoPerfil(perfil: Perfil) {
  return APARENCIA[perfil].texto
}

export function classeBordaPerfil(perfil: Perfil) {
  return APARENCIA[perfil].borda
}

export function classePontoPerfil(perfil: Perfil) {
  return APARENCIA[perfil].ponto
}

export function classeFundoPerfil(perfil: Perfil) {
  return APARENCIA[perfil].fundo
}

export function perfilSemSerie(id: string): Perfil | null {
  if (!id.startsWith("sem-")) return null
  const perfil = id.slice(4)
  return ePerfil(perfil) ? perfil : null
}
