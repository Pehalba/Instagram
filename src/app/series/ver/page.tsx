import { Suspense } from "react"
import { Espera, PaginaSerieNuvem } from "@/components/nuvem/paginas"

export default function PaginaSerie() {
  return (
    <Suspense fallback={<Espera />}>
      <PaginaSerieNuvem />
    </Suspense>
  )
}
