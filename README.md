# Estúdio · @carolalbas e @albascouple

Sistema local para organizar a produção de conteúdo dos perfis [@carolalbas](https://instagram.com/carolalbas) e [@albascouple](https://instagram.com/albascouple). Roda no seu computador, com o banco em um arquivo SQLite. Não tem login.

## Requisitos

- Node.js 22 ou mais recente
- npm

## Como rodar

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run import
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

No Windows, se `cp` não existir, copie `.env.example` para `.env` manualmente. O conteúdo é só isto:

```
DATABASE_URL="file:./prisma/dev.db"
```

## Importar o banco de ideias

A fonte é `data/banco-de-ideias.md`.

```bash
npm run import
```

O comando pode ser rodado de novo. Ele não duplica série, ideia nem roteiro: casa pelo perfil e pelo título normalizado (sem acento, minúsculo, sem pontuação no fim).

O que a reimportação atualiza:

- texto dos roteiros, série, ordem e a nota que estava entre parênteses
- prioridade alta e a tag `Lote 2` ou `Lote 3`, quando o item aparece em Próximos lotes

O que ela preserva:

- status que você já avançou no pipeline (um `[x]` no Markdown só promove a ideia para Gravado se ela ainda estiver antes disso)
- prioridade que você baixou, desde que o Markdown não marque o item como lote
- notas digitadas no app, datas, gravações e métricas

No terminal aparece quantas séries, ideias e roteiros entraram, e qualquer linha que o leitor não conseguiu interpretar.

## Backup

O banco inteiro é o arquivo `prisma/dev.db`.

```bash
npm run backup
```

Isso copia o arquivo para `backups/banco-DATA.db`. Para restaurar, feche o app e substitua `prisma/dev.db` por essa cópia.

A exportação e a importação em JSON entram numa etapa seguinte. Até lá, a cópia do arquivo SQLite é o backup completo.

## Onde está cada coisa

- `data/banco-de-ideias.md` — roteiros e ideias
- `prisma/schema.prisma` — modelo dos dados
- `scripts/import-banco.ts` — leitor do Markdown
- `prisma/dev.db` — banco local (não vai para o Git)
