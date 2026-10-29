"use client"

import { useState } from "react"
import { CORES_SERIE, EMOJIS_SERIE } from "@/lib/aparencia-serie"
import { cn } from "cn"

export function EscolhaAparencia({
  corInicial = "",
  emojiInicial = "",
}: {
  corInicial?: string | null
  emojiInicial?: string | null
}) {
  const [cor, setCor] = useState(corInicial ?? "")
  const [emoji, setEmoji] = useState(emojiInicial ?? "")

  return (
    <div className="grid gap-3">
      <input type="hidden" name="cor" value={cor} />
      <input type="hidden" name="emoji" value={emoji} />
      <div className="grid gap-1.5">
        <span className="text-xs text-muted-foreground">Cor</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Cor da série">
          {CORES_SERIE.map((item) => {
            const ativo = cor === item.id
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={ativo}
                aria-label={item.rotulo}
                title={item.rotulo}
                onClick={() => setCor(ativo ? "" : item.id)}
                className={cn("size-7 rounded-full", ativo ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-40 hover:opacity-100")}
                style={{ background: item.cor }}
              />
            )
          })}
        </div>
      </div>
      <div className="grid gap-1.5">
        <span className="text-xs text-muted-foreground">Emoji</span>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Emoji da série">
          {EMOJIS_SERIE.map((item) => {
            const ativo = emoji === item.emoji
            return (
              <button
                key={item.emoji}
                type="button"
                aria-pressed={ativo}
                aria-label={item.rotulo}
                title={item.rotulo}
                onClick={() => setEmoji(ativo ? "" : item.emoji)}
                className={cn(
                  "rounded-full px-1.5 py-1 text-lg leading-none",
                  ativo ? "bg-foreground" : "opacity-40 hover:opacity-100",
                )}
              >
                {item.emoji}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
