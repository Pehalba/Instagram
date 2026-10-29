import type { Metadata } from "next"
import { Instrument_Serif, Inter } from "next/font/google"
import Script from "next/script"
import { Cabecalho } from "@/components/cabecalho"
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
  description: "Produção de conteúdo de @carolalbas e @albascouple.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col md:flex-row">
        <Script id="tema" strategy="beforeInteractive">
          {`try{if(localStorage.getItem('tema')==='escuro')document.documentElement.classList.add('dark')}catch(e){}`}
        </Script>
        <Cabecalho />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </body>
    </html>
  )
}
