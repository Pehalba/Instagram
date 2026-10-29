"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Columns3, House, Layers, Lightbulb, Menu, X, type LucideIcon } from "lucide-react"
import { AlternarTema } from "@/components/alternar-tema"
import { cn } from "cn"

const links: { href: string; rotulo: string; icone: LucideIcon }[] = [
  { href: "/", rotulo: "Início", icone: House },
  { href: "/series", rotulo: "Séries", icone: Layers },
  { href: "/ideias", rotulo: "Ideias", icone: Lightbulb },
  { href: "/planejamento", rotulo: "Planejamento", icone: Columns3 },
  { href: "/calendario", rotulo: "Calendário", icone: Calendar },
]

export function Cabecalho() {
  const caminho = usePathname()
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    setAberto(false)
  }, [caminho])

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur md:hidden">
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-lg border bg-card"
          aria-label="Abrir menu"
          onClick={() => setAberto(true)}
        >
          <Menu className="size-4" />
        </button>
        <Link href="/" className="font-heading text-2xl leading-none">
          Estúdio
        </Link>
      </div>
      {aberto ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          aria-label="Fechar menu"
          onClick={() => setAberto(false)}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 -translate-x-full flex-col border-r bg-background px-3 py-5 transition-transform md:sticky md:top-0 md:z-30 md:h-dvh md:w-56 md:shrink-0 md:translate-x-0",
          aberto && "translate-x-0",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="font-heading text-3xl leading-none">
            Estúdio
          </Link>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground md:hidden"
            aria-label="Fechar menu"
            onClick={() => setAberto(false)}
          >
            <X className="size-4" />
          </button>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {links.map((link) => {
            const ativo = link.href === "/" ? caminho === "/" : caminho.startsWith(link.href)
            const Icone = link.icone
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  ativo ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icone className="size-4 shrink-0" />
                {link.rotulo}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto pt-6">
          <AlternarTema />
        </div>
      </aside>
    </>
  )
}
