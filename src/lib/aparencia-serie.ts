export const CORES_SERIE = [
  { id: "oliva", rotulo: "Oliva", cor: "oklch(0.46 0.07 145)" },
  { id: "musgo", rotulo: "Musgo", cor: "oklch(0.40 0.06 155)" },
  { id: "cedro", rotulo: "Cedro", cor: "oklch(0.48 0.06 75)" },
  { id: "argila", rotulo: "Argila", cor: "oklch(0.50 0.07 45)" },
  { id: "vinho", rotulo: "Vinho", cor: "oklch(0.42 0.07 20)" },
  { id: "ouro", rotulo: "Ouro", cor: "oklch(0.58 0.09 90)" },
  { id: "noite", rotulo: "Noite", cor: "oklch(0.38 0.04 250)" },
  { id: "pedra", rotulo: "Pedra", cor: "oklch(0.52 0.02 80)" },
  { id: "grafite", rotulo: "Grafite", cor: "oklch(0.35 0.01 70)" },
  { id: "ameixa", rotulo: "Ameixa", cor: "oklch(0.42 0.06 330)" },
] as const

export const EMOJIS_SERIE = [
  { emoji: "📖", rotulo: "Bíblia" },
  { emoji: "✝️", rotulo: "Cruz" },
  { emoji: "🕊️", rotulo: "Pomba" },
  { emoji: "🙏", rotulo: "Oração" },
  { emoji: "💒", rotulo: "Casamento" },
  { emoji: "👑", rotulo: "Coroa" },
  { emoji: "🌿", rotulo: "Ramo" },
  { emoji: "✨", rotulo: "Brilho" },
  { emoji: "🔥", rotulo: "Fogo" },
  { emoji: "⭐", rotulo: "Estrela" },
  { emoji: "💡", rotulo: "Ideia" },
  { emoji: "🎬", rotulo: "Filme" },
  { emoji: "🎥", rotulo: "Câmera" },
  { emoji: "🎵", rotulo: "Música" },
  { emoji: "💬", rotulo: "Conversa" },
  { emoji: "❤️", rotulo: "Coração" },
  { emoji: "📝", rotulo: "Nota" },
  { emoji: "🎯", rotulo: "Foco" },
  { emoji: "🌙", rotulo: "Lua" },
  { emoji: "☀️", rotulo: "Sol" },
] as const

export type CorSerie = (typeof CORES_SERIE)[number]["id"]

export function eCorSerie(valor: string): valor is CorSerie {
  return CORES_SERIE.some((item) => item.id === valor)
}

export function eEmojiSerie(valor: string): boolean {
  return EMOJIS_SERIE.some((item) => item.emoji === valor)
}

export function corDaSerie(id: string | null | undefined): string | null {
  return CORES_SERIE.find((item) => item.id === id)?.cor ?? null
}

export function corSalva(valor: string): string | null {
  return eCorSerie(valor) ? valor : null
}

export function emojiSalvo(valor: string): string | null {
  return eEmojiSerie(valor) ? valor : null
}
