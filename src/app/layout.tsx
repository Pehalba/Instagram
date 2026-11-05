import type { Metadata } from "next"
import { Instrument_Serif, Inter } from "next/font/google"
import { Cabecalho } from "@/components/cabecalho"
import { ProvedorFirebase } from "@/components/dados/provedor-firebase"
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

const TEMA_SALVO = `try{if(localStorage.getItem("tema")==="escuro")document.documentElement.classList.add("dark")}catch(e){}`

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_SALVO }} />
      </head>
      <body className="flex min-h-dvh flex-col md:flex-row">
        <Cabecalho />
        <div className="flex min-w-0 flex-1 flex-col">
          <ProvedorFirebase>{children}</ProvedorFirebase>
        </div>
      </body>
    </html>
  )
}
