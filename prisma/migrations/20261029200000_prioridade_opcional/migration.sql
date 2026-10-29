-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ideia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "tituloNormalizado" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "serieId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDEIA',
    "prioridade" TEXT,
    "formato" TEXT,
    "duracaoEstimadaSeg" INTEGER,
    "tags" JSONB NOT NULL DEFAULT [],
    "notaOrigem" TEXT,
    "notas" TEXT,
    "dataPlanejada" DATETIME,
    "dataPostada" DATETIME,
    "ordemNaSerie" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ideia_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ideia" ("id", "titulo", "tituloNormalizado", "perfil", "serieId", "status", "prioridade", "formato", "duracaoEstimadaSeg", "tags", "notaOrigem", "notas", "dataPlanejada", "dataPostada", "ordemNaSerie", "createdAt", "updatedAt") SELECT "id", "titulo", "tituloNormalizado", "perfil", "serieId", "status", "prioridade", "formato", "duracaoEstimadaSeg", "tags", "notaOrigem", "notas", "dataPlanejada", "dataPostada", "ordemNaSerie", "createdAt", "updatedAt" FROM "Ideia";
DROP TABLE "Ideia";
ALTER TABLE "new_Ideia" RENAME TO "Ideia";
CREATE INDEX "Ideia_status_idx" ON "Ideia"("status");
CREATE INDEX "Ideia_perfil_status_idx" ON "Ideia"("perfil", "status");
CREATE INDEX "Ideia_dataPlanejada_idx" ON "Ideia"("dataPlanejada");
CREATE UNIQUE INDEX "Ideia_perfil_tituloNormalizado_key" ON "Ideia"("perfil", "tituloNormalizado");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
