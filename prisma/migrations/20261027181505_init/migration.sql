-- CreateTable
CREATE TABLE "Serie" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "nomeNormalizado" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "descricao" TEXT,
    "quadroFixo" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Ideia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "tituloNormalizado" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "serieId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDEIA',
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
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

-- CreateTable
CREATE TABLE "Roteiro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ideiaId" TEXT NOT NULL,
    "formatoDescricao" TEXT NOT NULL DEFAULT '',
    "gancho" TEXT NOT NULL DEFAULT '',
    "parte1Tensao" TEXT NOT NULL DEFAULT '',
    "parte2Virada" TEXT NOT NULL DEFAULT '',
    "parte3Aplicacao" TEXT NOT NULL DEFAULT '',
    "legenda" TEXT NOT NULL DEFAULT '',
    "cta" TEXT NOT NULL DEFAULT '',
    "porQuePerform" TEXT NOT NULL DEFAULT '',
    "referenciasBiblicas" JSONB NOT NULL DEFAULT [],
    "autoresCitados" JSONB NOT NULL DEFAULT [],
    "marcadoresHistoria" JSONB NOT NULL DEFAULT [],
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Roteiro_ideiaId_fkey" FOREIGN KEY ("ideiaId") REFERENCES "Ideia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gravacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "data" DATETIME,
    "cenario" TEXT,
    "look" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GravacaoIdeia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gravacaoId" TEXT NOT NULL,
    "ideiaId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "cenario" TEXT,
    "look" TEXT,
    "gravado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "GravacaoIdeia_gravacaoId_fkey" FOREIGN KEY ("gravacaoId") REFERENCES "Gravacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GravacaoIdeia_ideiaId_fkey" FOREIGN KEY ("ideiaId") REFERENCES "Ideia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Metrica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ideiaId" TEXT NOT NULL,
    "alcance" INTEGER,
    "curtidas" INTEGER,
    "comentarios" INTEGER,
    "compartilhamentos" INTEGER,
    "salvamentos" INTEGER,
    "seguidoresGanhos" INTEGER,
    "dataColeta" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Metrica_ideiaId_fkey" FOREIGN KEY ("ideiaId") REFERENCES "Ideia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Serie_perfil_nomeNormalizado_key" ON "Serie"("perfil", "nomeNormalizado");

-- CreateIndex
CREATE INDEX "Ideia_status_idx" ON "Ideia"("status");

-- CreateIndex
CREATE INDEX "Ideia_perfil_status_idx" ON "Ideia"("perfil", "status");

-- CreateIndex
CREATE INDEX "Ideia_dataPlanejada_idx" ON "Ideia"("dataPlanejada");

-- CreateIndex
CREATE UNIQUE INDEX "Ideia_perfil_tituloNormalizado_key" ON "Ideia"("perfil", "tituloNormalizado");

-- CreateIndex
CREATE UNIQUE INDEX "Roteiro_ideiaId_key" ON "Roteiro"("ideiaId");

-- CreateIndex
CREATE UNIQUE INDEX "GravacaoIdeia_gravacaoId_ideiaId_key" ON "GravacaoIdeia"("gravacaoId", "ideiaId");

-- CreateIndex
CREATE INDEX "Metrica_ideiaId_idx" ON "Metrica"("ideiaId");
