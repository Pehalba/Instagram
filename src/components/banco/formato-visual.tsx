import { AtSign, Clapperboard, GalleryHorizontalEnd, Image, Smartphone, type LucideIcon } from "lucide-react"
import { FORMATO_LABEL, type Formato } from "@/lib/conteudo"
import { cn } from "cn"

export const ICONE_FORMATO: Record<Formato, LucideIcon> = {
  REELS: Clapperboard,
  FEED: Image,
  CARROSSEL: GalleryHorizontalEnd,
  STORIES: Smartphone,
  THREADS: AtSign,
}

export const ESTILO_FORMATO: Record<Formato, { selo: string; faixa: string }> = {
  REELS: {
    selo: "border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200",
    faixa: "bg-rose-50 dark:bg-rose-950/40",
  },
  FEED: {
    selo: "border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
    faixa: "bg-sky-50 dark:bg-sky-950/40",
  },
  CARROSSEL: {
    selo: "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
    faixa: "bg-amber-50 dark:bg-amber-950/40",
  },
  STORIES: {
    selo: "border-violet-300 bg-violet-100 text-violet-900 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200",
    faixa: "bg-violet-50 dark:bg-violet-950/40",
  },
  THREADS: {
    selo: "border-stone-300 bg-stone-100 text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200",
    faixa: "bg-stone-100 dark:bg-stone-900/60",
  },
}

export function SeloFormato({ formato, className }: { formato: Formato; className?: string }) {
  const Icone = ICONE_FORMATO[formato]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] leading-none font-medium",
        ESTILO_FORMATO[formato].selo,
        className,
      )}
    >
      <Icone className="size-3.5" aria-hidden />
      {FORMATO_LABEL[formato]}
    </span>
  )
}
