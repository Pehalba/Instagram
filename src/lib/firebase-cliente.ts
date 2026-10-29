import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth, signInAnonymously } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { configFirebase } from "@/lib/firebase-config"

let abertura: Promise<Firestore> | null = null

export function abrirFirestore(): Promise<Firestore> {
  if (abertura) return abertura
  const config = configFirebase()
  if (!config) return Promise.reject(new Error("Firebase sem configuração."))
  abertura = (async () => {
    const app = getApps().length > 0 ? getApp() : initializeApp(config)
    const auth = getAuth(app)
    if (!auth.currentUser) await signInAnonymously(auth)
    return getFirestore(app)
  })()
  return abertura
}
