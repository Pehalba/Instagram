const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

export const DIAS_CURTOS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"]

export function isoLocal(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

export function hojeLocal(): string {
  return isoLocal(new Date())
}

function dataDeIso(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number)
  return new Date(ano, (mes ?? 1) - 1, dia ?? 1)
}

export function somarDias(iso: string, dias: number): string {
  const data = dataDeIso(iso)
  data.setDate(data.getDate() + dias)
  return isoLocal(data)
}

/** Semana começa na segunda, como no calendário do Brasil. */
export function inicioDaSemana(iso: string): string {
  const data = dataDeIso(iso)
  const dia = data.getDay()
  const voltar = dia === 0 ? 6 : dia - 1
  return somarDias(iso, -voltar)
}

export function diasDaSemana(iso: string): string[] {
  const inicio = inicioDaSemana(iso)
  return Array.from({ length: 7 }, (_, indice) => somarDias(inicio, indice))
}

export function gradeDoMes(iso: string): string[] {
  const data = dataDeIso(iso)
  const primeiro = isoLocal(new Date(data.getFullYear(), data.getMonth(), 1))
  const ultimo = isoLocal(new Date(data.getFullYear(), data.getMonth() + 1, 0))
  const inicio = inicioDaSemana(primeiro)
  const fim = somarDias(inicioDaSemana(ultimo), 6)
  const dias: string[] = []
  let cursor = inicio
  while (cursor <= fim) {
    dias.push(cursor)
    cursor = somarDias(cursor, 1)
  }
  return dias
}

export function mesAnterior(iso: string): string {
  const data = dataDeIso(iso)
  return isoLocal(new Date(data.getFullYear(), data.getMonth() - 1, 1))
}

export function mesSeguinte(iso: string): string {
  const data = dataDeIso(iso)
  return isoLocal(new Date(data.getFullYear(), data.getMonth() + 1, 1))
}

export function tituloMes(iso: string): string {
  const data = dataDeIso(iso)
  const nome = MESES[data.getMonth()] ?? ""
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${data.getFullYear()}`
}

export function rotuloDia(iso: string): string {
  const data = dataDeIso(iso)
  return `${data.getDate()} ${MESES[data.getMonth()]?.slice(0, 3) ?? ""}`
}

export function numeroDia(iso: string): number {
  return dataDeIso(iso).getDate()
}

/** 0 = segunda, 6 = domingo. */
export function indiceSemana(iso: string): number {
  const dia = dataDeIso(iso).getDay()
  return dia === 0 ? 6 : dia - 1
}

export function mesmoMes(iso: string, referencia: string): boolean {
  return iso.slice(0, 7) === referencia.slice(0, 7)
}
