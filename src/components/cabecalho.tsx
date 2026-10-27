"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AlternarTema } from "@/components/alternar-tema"
import { cn } from "cn"

const links = [
  { href: "/", rotulo: "Início" },
  { href: "/ideias", rotulo: "Ideias" },
  { href: "/kanban", rotulo: "Kanban" },
  { href: "/calendario", rotulo: "Calendário" },
]

export function Cabecalho() {
  const caminho = usePathname()

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-6">
        <Link href="/" className="font-heading mr-auto text-2xl leading-none sm:mr-0">
          Estúdio
        </Link>
        <nav className="order-3 flex w-full items-center gap-1 sm:order-2 sm:ml-auto sm:w-auto">
          {links.map((link) => {
            const ativo = link.href === "/" ? caminho === "/" : caminho.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1.5 text-sm",
                  ativo ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {link.rotulo}
              </Link>
            )
          })}
        </nav>
        <div className="order-2 sm:order-3">
          <AlternarTema />
        </div>
      </div>
    </header>
  )
}
