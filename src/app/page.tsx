import Link from "next/link"
import { PERFIL_LABEL, STATUS, STATUS_LABEL, type Perfil, type StatusIdeia } from "@/lib/conteudo"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

async function carregarResumo() {
  const [series, ideias, roteiros, quadros, altas, porStatus, porPerfil] = await Promise.all([
    prisma.serie.count(),
    prisma.ideia.count(),
    prisma.roteiro.count(),
    prisma.serie.count({ where: { quadroFixo: true } }),
    prisma.ideia.count({ where: { prioridade: "ALTA" } }),
    prisma.ideia.groupBy({ by: ["status"], _count: true }),
    prisma.ideia.groupBy({ by: ["perfil"], _count: true }),
  ])

  const status = new Map(porStatus.map((item) => [item.status, item._count]))
  const perfil = new Map(porPerfil.map((item) => [item.perfil, item._count]))

  return { series, ideias, roteiros, quadros, altas, status, perfil }
}

export default async function Home() {
  const resumo = await carregarResumo()

  const totais = [
    { rotulo: "Séries", valor: resumo.series },
    { rotulo: "Ideias", valor: resumo.ideias },
    { rotulo: "Roteiros", valor: resumo.roteiros },
    { rotulo: "Quadros fixos", valor: resumo.quadros },
    { rotulo: "Prioridade alta", valor: resumo.altas },
  ]

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-5 py-8 sm:px-8 sm:py-12">
      <header className="max-w-xl space-y-3">
        <p className="text-sm tracking-[0.18em] text-muted-foreground uppercase">Produção de conteúdo</p>
        <h1 className="font-heading text-5xl leading-none font-medium text-balance sm:text-6xl">
          Carol e o casal
        </h1>
        <p className="text-lg text-muted-foreground">
          O banco de @carolalbas e @albascouple já está no seu computador. Dá para buscar, escrever roteiros, mover no kanban e marcar o dia no calendário.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/ideias"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Banco de ideias
          </Link>
          <Link
            href="/kanban"
            className="inline-flex h-9 items-center rounded-lg border bg-card px-3 text-sm font-medium"
          >
            Kanban
          </Link>
          <Link
            href="/calendario"
            className="inline-flex h-9 items-center rounded-lg border bg-card px-3 text-sm font-medium"
          >
            Calendário
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {totais.map((item) => (
          <article key={item.rotulo} className="rounded-2xl border bg-card px-4 py-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{item.rotulo}</p>
            <p className="font-heading mt-2 text-4xl">{item.valor}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {(["carolalbas", "albascouple"] as Perfil[]).map((perfil) => (
          <article key={perfil} className="rounded-2xl border bg-card px-5 py-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Perfil</p>
            <h2 className="font-heading mt-1 text-3xl">{PERFIL_LABEL[perfil]}</h2>
            <p className="mt-4 text-muted-foreground">
              <span className={perfil === "carolalbas" ? "text-carol" : "text-casal"}>
                {resumo.perfil.get(perfil) ?? 0}
              </span>{" "}
              ideias neste perfil
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border bg-card px-5 py-5 shadow-sm">
        <h2 className="font-heading text-3xl">Pipeline</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {STATUS.map((status) => (
            <li key={status} className="flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3">
              <span>{STATUS_LABEL[status as StatusIdeia]}</span>
              <span className="font-heading text-2xl">{resumo.status.get(status) ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
