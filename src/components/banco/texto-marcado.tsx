import { partesComMarcador, temMarcadorAberto } from "@/lib/texto-roteiro"

export function TextoMarcado({ texto }: { texto: string }) {
  if (!temMarcadorAberto(texto)) return null

  return (
    <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-amber-950 dark:bg-amber-300/10 dark:text-amber-100">
      {partesComMarcador(texto).map((parte, indice) =>
        parte.marcador ? (
          <mark
            key={indice}
            className="rounded bg-amber-200 px-1 text-amber-950 dark:bg-amber-300/30 dark:text-amber-50"
          >
            {parte.texto}
          </mark>
        ) : (
          <span key={indice}>{parte.texto}</span>
        ),
      )}
    </p>
  )
}
