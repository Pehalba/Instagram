import { collection, deleteDoc, doc, setDoc, type Firestore } from "firebase/firestore"
import { ePerfil, type Perfil } from "@/lib/conteudo"

export const COLECAO_MENSAGENS_PARCERIA = "mensagensParceria"

export const OUTRA_CATEGORIA = "__outra"

export const CATEGORIAS_PARCERIA: { nome: string; emoji: string }[] = [
  { nome: "Hotéis e pousadas", emoji: "🏨" },
  { nome: "Restaurantes e cafés", emoji: "☕" },
  { nome: "Viagens e turismo", emoji: "✈️" },
  { nome: "Maquiagem", emoji: "💄" },
  { nome: "Skincare e cabelo", emoji: "🧴" },
  { nome: "Perfumes", emoji: "🌸" },
  { nome: "Moda e roupas", emoji: "👗" },
  { nome: "Moda modesta", emoji: "🧕" },
  { nome: "Acessórios e joias", emoji: "💍" },
  { nome: "Calçados e bolsas", emoji: "👜" },
  { nome: "Livrarias e editoras", emoji: "📚" },
  { nome: "Bíblias e papelaria", emoji: "📖" },
  { nome: "Eventos e conferências", emoji: "🎤" },
  { nome: "Igrejas e ministérios", emoji: "⛪" },
  { nome: "Música e louvor", emoji: "🎶" },
  { nome: "Retiros e acampamentos", emoji: "⛺" },
  { nome: "Casamento e noivas", emoji: "💒" },
  { nome: "Casa e decoração", emoji: "🏡" },
  { nome: "Alimentação e produtos", emoji: "🍯" },
  { nome: "Saúde e bem-estar", emoji: "🌿" },
  { nome: "Academia e fitness", emoji: "🏋️" },
  { nome: "Tecnologia e apps", emoji: "📱" },
  { nome: "Cursos e mentorias", emoji: "🎓" },
  { nome: "Fotografia e vídeo", emoji: "📷" },
  { nome: "Infantil e maternidade", emoji: "🧸" },
  { nome: "Presentes e personalizados", emoji: "🎁" },
  { nome: "Pets", emoji: "🐾" },
  { nome: "ONGs e causas sociais", emoji: "🤝" },
  { nome: "Bancos e finanças", emoji: "💳" },
  { nome: "Carros e mobilidade", emoji: "🚗" },
]

export function emojiDaCategoria(nome: string | null): string {
  return CATEGORIAS_PARCERIA.find((categoria) => categoria.nome === nome)?.emoji ?? "🏷️"
}

export type MensagemParceria = {
  id: string
  titulo: string
  texto: string
  categoria: string | null
  perfil: Perfil | null
  criadoEm: string
  atualizadoEm: string
}

export function mensagemDoDocumento(id: string, dados: Record<string, unknown>): MensagemParceria | null {
  const titulo = typeof dados.titulo === "string" ? dados.titulo : ""
  const texto = typeof dados.texto === "string" ? dados.texto : ""
  if (!titulo || !texto) return null
  const atualizadoEm = typeof dados.atualizadoEm === "string" ? dados.atualizadoEm : new Date(0).toISOString()
  return {
    id,
    titulo,
    texto,
    categoria: typeof dados.categoria === "string" && dados.categoria.trim() ? dados.categoria.trim() : null,
    perfil: typeof dados.perfil === "string" && ePerfil(dados.perfil) ? dados.perfil : null,
    criadoEm: typeof dados.criadoEm === "string" ? dados.criadoEm : atualizadoEm,
    atualizadoEm,
  }
}

export async function salvarMensagemParceria(
  db: Firestore,
  form: FormData,
  atual: MensagemParceria | null,
): Promise<string | null> {
  const titulo = String(form.get("titulo") ?? "").trim()
  const texto = String(form.get("texto") ?? "").replace(/\r\n/g, "\n").trim()
  const perfil = String(form.get("perfil") ?? "")
  const escolhida = String(form.get("categoria") ?? "").trim()
  const categoria = (escolhida === OUTRA_CATEGORIA ? String(form.get("categoriaNova") ?? "") : escolhida).trim().slice(0, 60)
  if (!titulo) return "Dê um título para a mensagem."
  if (!texto) return "Escreva a mensagem."
  if (escolhida === OUTRA_CATEGORIA && !categoria) return "Escreva o nome da categoria nova."
  const agora = new Date().toISOString()
  const referencia = atual ? doc(db, COLECAO_MENSAGENS_PARCERIA, atual.id) : doc(collection(db, COLECAO_MENSAGENS_PARCERIA))
  await setDoc(referencia, {
    titulo,
    texto,
    categoria: categoria || null,
    perfil: ePerfil(perfil) ? perfil : null,
    criadoEm: atual?.criadoEm ?? agora,
    atualizadoEm: agora,
  })
  return null
}

export async function removerMensagemParceria(db: Firestore, id: string) {
  await deleteDoc(doc(db, COLECAO_MENSAGENS_PARCERIA, id))
}
