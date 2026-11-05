import { Suspense } from "react"
import { Espera, PaginaIdeiasNuvem } from "@/components/nuvem/paginas"

export default function PaginaIdeias() {
  return (
    <Suspense fallback={<Espera />}>
      <PaginaIdeiasNuvem />
    </Suspense>
  )
}
