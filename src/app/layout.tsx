import type { Metadata } from "next"
import { Instrument_Serif, Inter } from "next/font/google"
import { cookies } from "next/headers"
import { Cabecalho } from "@/components/cabecalho"
import { ProvedorFirebase } from "@/components/dados/provedor-firebase"
import { firebaseConfigurado } from "@/lib/firebase-config"
import "./globals.css"

const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
})

export const metadata: Metadata = {
  title: "Estúdio · @carolalbas",
  description: "Produção de conteúdo de @carolalbas, @albasfilms e @albascouple.",
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const escuro = (await cookies()).get("tema")?.value === "escuro"
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${serif.variable} h-full antialiased${escuro ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col md:flex-row">
        <Cabecalho />
        <div className="flex min-w-0 flex-1 flex-col">
          {firebaseConfigurado() ? <ProvedorFirebase>{children}</ProvedorFirebase> : children}
        </div>
      </body>
    </html>
  )
}
