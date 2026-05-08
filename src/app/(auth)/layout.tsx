"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { authService } from "@/services/auth-service";

/**
 * Layout das telas de autenticação. Centraliza um cartão na tela.
 * Se o usuário já está logado, redireciona para a home autenticada.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    authService.me().then((u) => {
      if (u) router.replace("/");
    });
  }, [router]);

  return (
    <div className="bg-bg flex min-h-screen items-center justify-center px-4 py-12">
      {children}
    </div>
  );
}
