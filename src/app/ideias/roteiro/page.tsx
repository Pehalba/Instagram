import { Suspense } from "react"
import { Espera, PaginaRoteiroNuvem } from "@/components/nuvem/paginas"

export default function PaginaRoteiro() {
  return (
    <Suspense fallback={<Espera />}>
      <PaginaRoteiroNuvem />
    </Suspense>
  )
}
