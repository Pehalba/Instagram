"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export type ItemCartao = {
  href: string
  titulo: string
  detalhe: string
}

export type CartaoInicio = {
  rotulo: string
  valor: number
  href?: string
  descricao?: string
  itens?: ItemCartao[]
}

const classeCartao =
  "min-w-0 rounded-2xl border bg-card px-4 py-4 text-left shadow-sm transition-colors hover:bg-muted/70 sm:py-5"

export function CartoesInicio({ cartoes }: { cartoes: CartaoInicio[] }) {
  const [aberto, setAberto] = useState<string | null>(null)
  const atual = cartoes.find((cartao) => cartao.rotulo === aberto && cartao.itens)

  return (
    <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cartoes.map((cartao) =>
          cartao.href ? (
            <Link key={cartao.rotulo} href={cartao.href} className={classeCartao}>
              <Conteudo rotulo={cartao.rotulo} valor={cartao.valor} />
            </Link>
          ) : (
            <button key={cartao.rotulo} type="button" className={classeCartao} onClick={() => setAberto(cartao.rotulo)}>
              <Conteudo rotulo={cartao.rotulo} valor={cartao.valor} />
            </button>
          ),
        )}
      </section>
      <Sheet open={Boolean(atual)} onOpenChange={(abertoAgora) => !abertoAgora && setAberto(null)}>
        <SheetContent className="w-full! overflow-hidden sm:max-w-md!">
          {atual ? (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">{atual.rotulo}</SheetTitle>
                <SheetDescription>{atual.descricao}</SheetDescription>
              </SheetHeader>
              <ul className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 pb-6">
                {atual.itens?.length ? (
                  atual.itens.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="block rounded-lg px-3 py-2 hover:bg-muted">
                        <span className="block text-sm">{item.titulo}</span>
                        <span className="text-xs text-muted-foreground">{item.detalhe}</span>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-sm text-muted-foreground">Nada por aqui.</li>
                )}
              </ul>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

function Conteudo({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <>
      <p className="text-sm text-muted-foreground">{rotulo}</p>
      <p className="font-heading mt-2 text-3xl sm:text-4xl">{valor}</p>
    </>
  )
}
