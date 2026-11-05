import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NaoEncontrada() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-4 px-4 py-16 sm:px-8">
      <p className="text-sm text-muted-foreground">Erro 404</p>
      <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Essa página não existe.</h1>
      <p className="text-muted-foreground">O endereço pode ter sido digitado errado ou a página mudou de lugar.</p>
      <Button nativeButton={false} render={<Link href="/" />}>
        Voltar ao início
      </Button>
    </main>
  )
}
