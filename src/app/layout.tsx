import type { Metadata } from "next"
import { Cormorant_Garamond, Nunito_Sans } from "next/font/google"
import { Cabecalho } from "@/components/cabecalho"
import "./globals.css"

const sans = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
})

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('tema')==='escuro')document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Cabecalho />
        {children}
      </body>
    </html>
  )
}
