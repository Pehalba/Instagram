"use client"

import { collection, onSnapshot, type Firestore } from "firebase/firestore"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { abrirFirestore } from "@/lib/firebase-cliente"
import { configFirebase } from "@/lib/firebase-config"
import {
  COLECAO_IDEIAS,
  COLECAO_SERIES,
  COLECAO_SUBSERIES,
  agendarIdeiaNuvem,
  criarSerieNuvem,
  criarSubserieNuvem,
  editarSerieNuvem,
  editarSubserieNuvem,
  excluirIdeiaNuvem,
  excluirIdeiasNuvem,
  ideiaDoDocumento,
  moverIdeiasNuvem,
  moverStatusNuvem,
  moverSubseriesNuvem,
  paraLista,
  paraRoteiroEditor,
  paraSerieOpcao,
  paraSubserieOpcao,
  removerSerieNuvem,
  removerSeriesNuvem,
  removerSubserieNuvem,
  removerSubseriesNuvem,
  roteiroTemTexto,
  salvarIdeiaNuvem,
  salvarRoteiroNuvem,
  serieDoDocumento,
  subserieDoDocumento,
  type EstadoGravacao,
  type IdeiaNuvem,
  type SerieNuvem,
  type SubserieNuvem,
} from "@/lib/gravar-nuvem"
import type { IdeiaLista, RoteiroEditor, SerieOpcao, SubserieOpcao } from "@/lib/tipos-ideia"

type BancoFirebase = {
  pronto: boolean
  erro: string | null
  ideias: IdeiaLista[]
  series: SerieOpcao[]
  subseries: SubserieOpcao[]
  seriesCompletas: SerieNuvem[]
  subseriesCompletas: SubserieNuvem[]
  ideiasCompletas: IdeiaNuvem[]
  salvarIdeia: (estado: EstadoGravacao, form: FormData) => Promise<EstadoGravacao>
  excluirIdeia: (form: FormData) => Promise<void>
  lerRoteiro: (ideiaId: string) => Promise<{
    formatoDescricao: string
    gancho: string
    parte1: string
    parte2: string
    parte3: string
    legenda: string
    cta: string
    porQuePerform: string
  } | null>
  moverStatus: (id: string, status: string) => Promise<void>
  agendarIdeia: (id: string, iso: string | null) => Promise<void>
  salvarRoteiro: (estado: EstadoGravacao, form: FormData) => Promise<EstadoGravacao>
  criarSerie: (estado: EstadoGravacao, form: FormData) => Promise<EstadoGravacao>
  editarSerie: (estado: EstadoGravacao, form: FormData) => Promise<EstadoGravacao>
  removerSerie: (form: FormData) => Promise<void>
  criarSubserie: (estado: EstadoGravacao, form: FormData) => Promise<EstadoGravacao>
  editarSubserie: (estado: EstadoGravacao, form: FormData) => Promise<EstadoGravacao>
  removerSubserie: (form: FormData) => Promise<void>
  excluirIdeias: (ids: string[]) => Promise<void>
  moverIdeias: (ids: string[], destino: { serieId: string | null; subserieId: string | null }) => Promise<EstadoGravacao>
  removerSeries: (ids: string[]) => Promise<void>
  removerSubseries: (ids: string[]) => Promise<void>
  moverSubseries: (ids: string[], serieId: string) => Promise<EstadoGravacao>
  roteiroDe: (id: string) => RoteiroEditor
}

const Contexto = createContext<BancoFirebase | null>(null)

export function useBanco() {
  const banco = useContext(Contexto)
  if (!banco) throw new Error("ProvedorFirebase não envolve este componente.")
  return banco
}

export function ProvedorFirebase({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Firestore | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [series, setSeries] = useState<SerieNuvem[]>([])
  const [subseries, setSubseries] = useState<SubserieNuvem[]>([])
  const [ideias, setIdeias] = useState<IdeiaNuvem[]>([])
  const [seriesProntas, setSeriesProntas] = useState(false)
  const [subseriesProntas, setSubseriesProntas] = useState(false)
  const [ideiasProntas, setIdeiasProntas] = useState(false)
  const seriesRef = useRef(series)
  const subseriesRef = useRef(subseries)
  const ideiasRef = useRef(ideias)
  seriesRef.current = series
  subseriesRef.current = subseries
  ideiasRef.current = ideias

  useEffect(() => {
    let ativo = true
    let cancelarSeries = () => {}
    let cancelarSubseries = () => {}
    let cancelarIdeias = () => {}
    abrirFirestore()
      .then((banco) => {
        if (!ativo) return
        setDb(banco)
        cancelarSeries = onSnapshot(
          collection(banco, COLECAO_SERIES),
          (consulta) => {
            setSeries(consulta.docs.flatMap((item) => {
              const serie = serieDoDocumento(item.id, item.data())
              return serie ? [serie] : []
            }))
            setSeriesProntas(true)
          },
          () => setErro("Não consegui ler as séries no Firebase."),
        )
        cancelarSubseries = onSnapshot(
          collection(banco, COLECAO_SUBSERIES),
          (consulta) => {
            setSubseries(consulta.docs.flatMap((item) => {
              const subserie = subserieDoDocumento(item.id, item.data())
              return subserie ? [subserie] : []
            }))
            setSubseriesProntas(true)
          },
          () => setErro("Não consegui ler as subséries no Firebase."),
        )
        cancelarIdeias = onSnapshot(
          collection(banco, COLECAO_IDEIAS),
          (consulta) => {
            setIdeias(consulta.docs.flatMap((item) => {
              const ideia = ideiaDoDocumento(item.id, item.data())
              return ideia ? [ideia] : []
            }))
            setIdeiasProntas(true)
          },
          () => setErro("Não consegui ler as ideias no Firebase."),
        )
      })
      .catch(() => {
        if (!ativo) return
        setErro(
          configFirebase()
            ? "Não consegui entrar no Firebase. Ative o acesso anônimo e publique as regras."
            : "O Firebase não está configurado. Preencha as chaves NEXT_PUBLIC_FIREBASE_* no .env.",
        )
      })
    return () => {
      ativo = false
      cancelarSeries()
      cancelarSubseries()
      cancelarIdeias()
    }
  }, [])

  const salvarIdeia = useCallback(async (_estado: EstadoGravacao, form: FormData) => {
    if (!db) return { erro: "O Firebase ainda está abrindo." }
    return salvarIdeiaNuvem(db, form, ideiasRef.current, seriesRef.current, subseriesRef.current)
  }, [db])
  const excluirIdeia = useCallback(async (form: FormData) => {
    if (!db) return
    await excluirIdeiaNuvem(db, String(form.get("id") ?? ""))
  }, [db])
  const lerRoteiro = useCallback(async (ideiaId: string) => {
    const ideia = ideiasRef.current.find((item) => item.id === ideiaId)
    if (!ideia || !roteiroTemTexto(ideia.roteiro)) return null
    const roteiro = ideia.roteiro
    return {
      formatoDescricao: roteiro?.formatoDescricao ?? "",
      gancho: roteiro?.gancho ?? "",
      parte1: roteiro?.parte1Tensao ?? "",
      parte2: roteiro?.parte2Virada ?? "",
      parte3: roteiro?.parte3Aplicacao ?? "",
      legenda: roteiro?.legenda ?? "",
      cta: roteiro?.cta ?? "",
      porQuePerform: roteiro?.porQuePerform ?? "",
    }
  }, [])
  const moverStatus = useCallback(async (id: string, status: string) => {
    if (!db) return
    await moverStatusNuvem(db, id, status)
  }, [db])
  const agendarIdeia = useCallback(async (id: string, iso: string | null) => {
    if (!db) return
    await agendarIdeiaNuvem(db, id, iso)
  }, [db])
  const salvarRoteiro = useCallback(async (_estado: EstadoGravacao, form: FormData) => {
    if (!db) return { erro: "O Firebase ainda está abrindo." }
    return salvarRoteiroNuvem(db, form, ideiasRef.current)
  }, [db])
  const criarSerie = useCallback(async (_estado: EstadoGravacao, form: FormData) => {
    if (!db) return { erro: "O Firebase ainda está abrindo." }
    return criarSerieNuvem(db, form, seriesRef.current)
  }, [db])
  const editarSerie = useCallback(async (_estado: EstadoGravacao, form: FormData) => {
    if (!db) return { erro: "O Firebase ainda está abrindo." }
    return editarSerieNuvem(db, form, seriesRef.current)
  }, [db])
  const removerSerie = useCallback(async (form: FormData) => {
    if (!db) return
    await removerSerieNuvem(db, String(form.get("id") ?? ""), ideiasRef.current, subseriesRef.current)
  }, [db])
  const criarSubserie = useCallback(async (_estado: EstadoGravacao, form: FormData) => {
    if (!db) return { erro: "O Firebase ainda está abrindo." }
    return criarSubserieNuvem(db, form, subseriesRef.current, seriesRef.current)
  }, [db])
  const editarSubserie = useCallback(async (_estado: EstadoGravacao, form: FormData) => {
    if (!db) return { erro: "O Firebase ainda está abrindo." }
    return editarSubserieNuvem(db, form, subseriesRef.current)
  }, [db])
  const removerSubserie = useCallback(async (form: FormData) => {
    if (!db) return
    await removerSubserieNuvem(db, String(form.get("id") ?? ""), ideiasRef.current)
  }, [db])
  const excluirIdeias = useCallback(async (ids: string[]) => {
    if (!db) return
    await excluirIdeiasNuvem(db, ids)
  }, [db])
  const moverIdeias = useCallback(async (ids: string[], destino: { serieId: string | null; subserieId: string | null }) => {
    if (!db) return { erro: "O Firebase ainda está abrindo." }
    return moverIdeiasNuvem(db, ids, destino, ideiasRef.current, seriesRef.current, subseriesRef.current)
  }, [db])
  const removerSeries = useCallback(async (ids: string[]) => {
    if (!db) return
    await removerSeriesNuvem(db, ids, ideiasRef.current, subseriesRef.current)
  }, [db])
  const removerSubseries = useCallback(async (ids: string[]) => {
    if (!db) return
    await removerSubseriesNuvem(db, ids, ideiasRef.current)
  }, [db])
  const moverSubseries = useCallback(async (ids: string[], serieId: string) => {
    if (!db) return { erro: "O Firebase ainda está abrindo." }
    return moverSubseriesNuvem(db, ids, serieId, subseriesRef.current, seriesRef.current, ideiasRef.current)
  }, [db])

  const valor = useMemo<BancoFirebase>(() => ({
    pronto: Boolean(db) && seriesProntas && subseriesProntas && ideiasProntas && !erro,
    erro,
    ideias: ideias.map((ideia) => paraLista(ideia, series, subseries)),
    series: series.map(paraSerieOpcao),
    subseries: subseries.map(paraSubserieOpcao),
    seriesCompletas: series,
    subseriesCompletas: subseries,
    ideiasCompletas: ideias,
    salvarIdeia,
    excluirIdeia,
    lerRoteiro,
    moverStatus,
    agendarIdeia,
    salvarRoteiro,
    criarSerie,
    editarSerie,
    removerSerie,
    criarSubserie,
    editarSubserie,
    removerSubserie,
    excluirIdeias,
    moverIdeias,
    removerSeries,
    removerSubseries,
    moverSubseries,
    roteiroDe: (id) => paraRoteiroEditor(ideias.find((ideia) => ideia.id === id)?.roteiro ?? null),
  }), [
    agendarIdeia,
    criarSerie,
    criarSubserie,
    db,
    editarSerie,
    editarSubserie,
    erro,
    excluirIdeia,
    excluirIdeias,
    ideias,
    ideiasProntas,
    lerRoteiro,
    moverIdeias,
    moverStatus,
    moverSubseries,
    removerSerie,
    removerSeries,
    removerSubserie,
    removerSubseries,
    salvarIdeia,
    salvarRoteiro,
    series,
    seriesProntas,
    subseries,
    subseriesProntas,
  ])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
