"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Label } from "@/components/ui/label/label";
import { authService } from "@/services/auth-service";

export default function LoginPage() {
  const router = useRouter();
  const emailId = useId();
  const passId = useId();
  const errorId = useId();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = new FormData(e.currentTarget);
    try {
      await authService.login({
        email: String(data.get("email") ?? ""),
        password: String(data.get("password") ?? ""),
      });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-surface w-full max-w-sm space-y-5 rounded-lg border p-8 shadow-md"
      noValidate
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <Image src="/logo.png" alt="" width={48} height={48} priority />
        <h1 className="font-display text-2xl font-semibold">
          <span className="text-brand-500 font-normal">Surf</span>
          <span className="text-brand-700">Book.</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Entre para continuar seus estudos.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={emailId} required>
          Email
        </Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          placeholder="seu@email.com"
          required
          autoFocus
          autoComplete="email"
          aria-describedby={error ? errorId : undefined}
          invalid={!!error}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={passId} required>
          Senha
        </Label>
        <Input
          id={passId}
          name="password"
          type="password"
          placeholder="••••••••"
          required
          minLength={4}
          autoComplete="current-password"
          aria-describedby={error ? errorId : undefined}
          invalid={!!error}
        />
      </div>

      {error && (
        <p id={errorId} className="text-danger text-sm" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {loading ? "Entrando…" : "Entrar"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Não tem conta?{" "}
        <Link
          href="/cadastrar"
          className="text-brand-500 underline-offset-4 hover:underline"
        >
          Crie agora
        </Link>
      </p>
    </form>
  );
}
