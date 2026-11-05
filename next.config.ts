import path from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // O site publicado é só HTML/JS em out/; os dados vêm do Firestore no navegador.
  output: "export",
  // better-sqlite3 é módulo nativo; o bundler não deve empacotá-lo.
  serverExternalPackages: ["better-sqlite3"],
  // Evita o Turbopack subir até um package-lock fora desta pasta.
  turbopack: {
    root: path.resolve(process.cwd()),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
