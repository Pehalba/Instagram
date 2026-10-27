import { copyFileSync, existsSync, mkdirSync } from "node:fs"
import path from "node:path"

const origem = path.join(process.cwd(), "prisma", "dev.db")
if (!existsSync(origem)) {
  console.error("Não encontrei prisma/dev.db. Rode npm run import antes do backup.")
  process.exit(1)
}

const pasta = path.join(process.cwd(), "backups")
mkdirSync(pasta, { recursive: true })
const carimbo = new Date().toISOString().replace(/[:.]/g, "-")
const destino = path.join(pasta, `banco-${carimbo}.db`)
copyFileSync(origem, destino)
console.log(`Backup salvo em ${destino}`)
