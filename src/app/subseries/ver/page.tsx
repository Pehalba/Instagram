import { Suspense } from "react"
import { Espera, PaginaSubserieNuvem } from "@/components/nuvem/paginas"

export default function PaginaSubserie() {
  return (
    <Suspense fallback={<Espera />}>
      <PaginaSubserieNuvem />
    </Suspense>
  )
}
