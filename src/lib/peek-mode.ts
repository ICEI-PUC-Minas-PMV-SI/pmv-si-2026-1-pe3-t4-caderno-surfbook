"use client";

import { useEffect, useState } from "react";

import { storage } from "@/lib/storage";

/**
 * Preferência persistente de **como abrir o peek** (visualização rápida sem
 * sair da página corrente):
 *
 * - `modal` — diálogo centralizado com overlay (default)
 * - `sidebar` — painel deslizante na lateral direita
 *
 * O usuário alterna pelo botão no header do `PeekShell`. A escolha persiste
 * por todos os tipos de peek (notebook, nota, evento), porque a expectativa
 * é que cada usuário prefira um estilo de leitura, não um estilo por tipo.
 */

export type PeekMode = "modal" | "sidebar";

const KEY = "peek-mode";
const DEFAULT: PeekMode = "modal";

export function getPeekMode(): PeekMode {
  const v = storage.get<string>(KEY, DEFAULT);
  return v === "sidebar" ? "sidebar" : "modal";
}

export function setPeekMode(mode: PeekMode): void {
  storage.set(KEY, mode);
  // Notifica outros consumers no mesmo tab
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("peek-mode-change", { detail: mode }));
  }
}

/** Hook reativo — atualiza quando alguém chama setPeekMode no mesmo tab. */
export function usePeekMode(): [PeekMode, (m: PeekMode) => void] {
  const [mode, setMode] = useState<PeekMode>(DEFAULT);

  useEffect(() => {
    setMode(getPeekMode());
    function onChange(e: Event) {
      const detail = (e as CustomEvent<PeekMode>).detail;
      if (detail === "modal" || detail === "sidebar") setMode(detail);
    }
    window.addEventListener("peek-mode-change", onChange);
    return () => window.removeEventListener("peek-mode-change", onChange);
  }, []);

  return [mode, setPeekMode];
}
