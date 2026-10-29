"use client"

import { collection, onSnapshot, type Firestore } from "firebase/firestore"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { abrirFirestore } from "@/lib/firebase-cliente"
import {
  COLECAO_IDEIAS,
  COLECAO_SERIES,
  agendarIdeiaNuvem,
  criarSerieNuvem,
  editarSerieNuvem,
  excluirIdeiaNuvem,
  ideiaDoDocumento,
  moverStatusNuvem,
  paraLista,
  paraRoteiroEditor,
  paraSerieOpcao,
  removerSerieNuvem,
  roteiroTemTexto,
  salvarIdeiaNuvem,
  salvarRoteiroNuvem,
  serieDoDocumento,
  type EstadoGravacao,
  type IdeiaNuvem,
  type SerieNuvem,
} from "@/lib/gravar-nuvem"
import type { IdeiaLista, RoteiroEditor, SerieOpcao } from "@/lib/tipos-ideia"

type BancoFirebase = {
  pronto: boolean
  erro: string | null
  ideias: IdeiaLista[]
  series: SerieOpcao[]
  seriesCompletas: SerieNuvem[]
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
  roteiroDe: (id: string) => RoteiroEditor
}

const Contexto = createContext<BancoFirebase | null>(null)

export function useFirebase() {
  return useContext(Contexto)
}

export function ProvedorFirebase({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Firestore | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [series, setSeries] = useState<SerieNuvem[]>([])
  const [ideias, setIdeias] = useState<IdeiaNuvem[]>([])
  const [seriesProntas, setSeriesProntas] = useState(false)
  const [ideiasProntas, setIdeiasProntas] = useState(false)
  const seriesRef = useRef(series)
  const ideiasRef = useRef(ideias)
  seriesRef.current = series
  ideiasRef.current = ideias

  useEffect(() => {
    let ativo = true
    let cancelarSeries = () => {}
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
        if (ativo) setErro("Não consegui entrar no Firebase. Ative o acesso anônimo e publique as regras.")
      })
    return () => {
      ativo = false
      cancelarSeries()
      cancelarIdeias()
    }
  }, [])

  const salvarIdeia = useCallback(async (_estado: EstadoGravacao, form: FormData) => {
    if (!db) return { erro: "O Firebase ainda está abrindo." }
    return salvarIdeiaNuvem(db, form, ideiasRef.current, seriesRef.current)
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
    await removerSerieNuvem(db, String(form.get("id") ?? ""), ideiasRef.current)
  }, [db])

  const valor = useMemo<BancoFirebase>(() => ({
    pronto: Boolean(db) && seriesProntas && ideiasProntas && !erro,
    erro,
    ideias: ideias.map((ideia) => paraLista(ideia, series)),
    series: series.map(paraSerieOpcao),
    seriesCompletas: series,
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
    roteiroDe: (id) => paraRoteiroEditor(ideias.find((ideia) => ideia.id === id)?.roteiro ?? null),
  }), [
    agendarIdeia,
    criarSerie,
    db,
    editarSerie,
    erro,
    excluirIdeia,
    ideias,
    ideiasProntas,
    lerRoteiro,
    moverStatus,
    removerSerie,
    salvarIdeia,
    salvarRoteiro,
    series,
    seriesProntas,
  ])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
