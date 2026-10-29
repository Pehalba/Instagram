import { PERFIL_LABEL, STATUS_LABEL, type Perfil, type StatusIdeia } from "@/lib/conteudo"

export type EtapaPainel = { status: StatusIdeia; valor: number }
export type PerfilPainel = { perfil: Perfil; ideias: number; roteiros: number; agendadas: number }
export type SemanaPainel = { numero: number; inicio: number; fim: number; valor: number }

export function PainelInicio({
  mes,
  frase,
  postadas,
  agendadas,
  prontas,
  marcadasNoMes,
  publicadasNoMes,
  semanas,
  etapas,
  perfis,
}: {
  mes: string
  frase: string
  postadas: number
  agendadas: number
  prontas: number
  marcadasNoMes: number
  publicadasNoMes: number
  semanas: SemanaPainel[]
  etapas: EtapaPainel[]
  perfis: PerfilPainel[]
}) {
  const baseMes = Math.max(marcadasNoMes, publicadasNoMes)
  const progresso = baseMes === 0 ? 0 : Math.round((publicadasNoMes / baseMes) * 100)
  const picoSemana = Math.max(1, ...semanas.map((semana) => semana.valor))
  const picoEtapa = Math.max(1, ...etapas.map((etapa) => etapa.valor))
  const picoPerfil = Math.max(1, ...perfis.map((perfil) => perfil.ideias))

  const andamento = [
    { rotulo: "Postadas", valor: postadas, detalhe: "já publicadas" },
    { rotulo: "Agendadas", valor: agendadas, detalhe: "com dia, ainda não publicadas" },
    { rotulo: "Prontas para gravar", valor: prontas, detalhe: "roteiro fechado" },
  ]

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-3xl leading-tight sm:text-4xl">Andamento</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{frase}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {andamento.map((item) => (
          <article key={item.rotulo} className="min-w-0 rounded-2xl border bg-card px-4 py-4">
            <p className="text-sm text-muted-foreground">{item.rotulo}</p>
            <p className="font-heading mt-2 text-3xl sm:text-4xl">{item.valor}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detalhe}</p>
          </article>
        ))}
      </div>

      <article className="rounded-2xl border bg-card px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm text-muted-foreground">{mes}</h3>
            <p className="font-heading mt-1 text-2xl">
              {baseMes === 0 ? "Nada marcado" : `${publicadasNoMes} de ${baseMes}`}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{baseMes === 0 ? "Marque um dia para medir" : `${progresso}% publicado`}</p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${progresso}% do mês publicado`}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${progresso}%` }} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {baseMes === 0
            ? "Quando uma ideia ganha dia no calendário, a barra deste mês começa a encher."
            : "A barra compara o que foi publicado com o que está marcado neste mês."}
        </p>
        <ul className="mt-5 flex flex-col gap-2 sm:hidden">
          {semanas.map((semana) => (
            <li key={semana.numero} className="flex items-baseline justify-between gap-3 text-sm">
              <span>{rotuloSemana(semana)}</span>
              <span className="tabular-nums text-muted-foreground">{semana.valor}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 hidden items-end gap-2 sm:flex">
          {semanas.map((semana) => (
            <div key={semana.numero} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-xs tabular-nums text-muted-foreground">{semana.valor}</span>
              <div className="flex h-16 w-full items-end justify-center">
                <div
                  className="w-full max-w-8 rounded-t-md bg-primary"
                  style={{ height: semana.valor === 0 ? "6px" : `${Math.max(20, Math.round((semana.valor / picoSemana) * 100))}%` }}
                />
              </div>
              <span className="text-center text-[11px] leading-snug text-muted-foreground">
                Semana {semana.numero}
                <span className="mt-0.5 block">{intervaloDaSemana(semana)}</span>
              </span>
            </div>
          ))}
        </div>
      </article>

      <div className="grid items-start gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border bg-card px-4 py-4 sm:px-5">
          <h3 className="text-sm text-muted-foreground">Onde está cada ideia</h3>
          <ul className="mt-4 flex flex-col gap-3">
            {etapas.map((etapa) => (
              <li key={etapa.status}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span>{STATUS_LABEL[etapa.status]}</span>
                  <span className="tabular-nums text-muted-foreground">{etapa.valor}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(etapa.valor / picoEtapa) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border bg-card px-4 py-4 sm:px-5">
          <h3 className="text-sm text-muted-foreground">
            {perfis.length === 1 ? PERFIL_LABEL[perfis[0].perfil] : "Os dois perfis"}
          </h3>
          <ul className="mt-4 flex flex-col gap-5">
            {perfis.map((perfil) => (
              <li key={perfil.perfil}>
                <p className="mb-2 text-sm">{PERFIL_LABEL[perfil.perfil]}</p>
                <BarrasPerfil perfil={perfil} pico={picoPerfil} />
              </li>
            ))}
          </ul>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-foreground" /> Ideias</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-foreground/45" /> Com roteiro</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-casal" /> Agendadas</span>
          </p>
        </article>
      </div>
    </section>
  )
}

function rotuloSemana(semana: SemanaPainel) {
  return `Semana ${semana.numero} ${intervaloDaSemana(semana)}`
}

function intervaloDaSemana(semana: SemanaPainel) {
  return semana.inicio === semana.fim ? `(dia ${semana.inicio})` : `(dia ${semana.inicio} a ${semana.fim})`
}

function BarrasPerfil({ perfil, pico }: { perfil: PerfilPainel; pico: number }) {
  const linhas = [
    { rotulo: "Ideias", valor: perfil.ideias, classe: "bg-foreground" },
    { rotulo: "Com roteiro", valor: perfil.roteiros, classe: "bg-foreground/45" },
    { rotulo: "Agendadas", valor: perfil.agendadas, classe: "bg-casal" },
  ]
  return (
    <ul className="flex flex-col gap-1.5">
      {linhas.map((linha) => (
        <li key={linha.rotulo} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2 text-xs text-muted-foreground">
          <span>{linha.rotulo}</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${linha.classe}`} style={{ width: `${(linha.valor / pico) * 100}%` }} />
          </div>
          <span className="text-right tabular-nums">{linha.valor}</span>
        </li>
      ))}
    </ul>
  )
}
