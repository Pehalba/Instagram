function marcador() {
  return /(\[[^\]]*sua hist[oó]ria[^\]]*\])/gi
}

export const PALAVRAS_POR_MINUTO = 150
export const LIMITE_LEGENDA = 2200

export function temMarcadorAberto(texto: string): boolean {
  return /sua hist[oó]ria/i.test(texto)
}

export function partesComMarcador(texto: string): { texto: string; marcador: boolean }[] {
  return texto
    .split(marcador())
    .filter((parte) => parte.length > 0)
    .map((parte) => ({ texto: parte, marcador: temMarcadorAberto(parte) }))
}

/** Duração falada sem contar o placeholder [sua história], que ainda não é texto. */
export function estimarFala(texto: string): { palavras: number; segundos: number } {
  const semMarcador = texto.replace(marcador(), " ")
  const palavras = semMarcador.trim() ? semMarcador.trim().split(/\s+/).length : 0
  return { palavras, segundos: Math.round((palavras / PALAVRAS_POR_MINUTO) * 60) }
}

export function fraseDuracao(texto: string): string {
  const { palavras, segundos } = estimarFala(texto)
  if (palavras === 0) return "Sem texto falado ainda."
  const minutos = Math.floor(segundos / 60)
  const resto = segundos % 60
  const tempo = minutos === 0 ? `${resto}s` : `${minutos} min ${resto.toString().padStart(2, "0")}s`
  return `Cerca de ${tempo} falados · ${palavras} ${palavras === 1 ? "palavra" : "palavras"}`
}

export function textoParaCopiar(legenda: string, cta: string): string {
  return [legenda.trim(), cta.trim()].filter(Boolean).join("\n\n")
}

export function formatarData(iso: string | null): string | null {
  if (!iso) return null
  const [ano, mes, dia] = iso.split("-")
  if (!ano || !mes || !dia) return null
  return `${dia}/${mes}/${ano}`
}
