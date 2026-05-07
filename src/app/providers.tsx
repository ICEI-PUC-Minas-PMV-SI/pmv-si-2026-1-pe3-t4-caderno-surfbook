"use client";

import { ToastProvider } from "@/components/ui/toast/toast";

/**
 * Wrapper de providers globais — montado no root layout.
 * - ToastProvider: feedback de ações em qualquer tela
 *
 * Adicionar aqui novos providers conforme surgirem (Theme, Auth context, etc.).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
