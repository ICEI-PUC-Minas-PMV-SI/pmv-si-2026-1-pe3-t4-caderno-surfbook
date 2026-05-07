"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Label } from "@/components/ui/label/label";
import { authService } from "@/services/auth-service";

export default function CadastrarPage() {
  const router = useRouter();
  const nameId = useId();
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
      await authService.signup({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        password: String(data.get("password") ?? ""),
      });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta.");
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
        <h1 className="font-display text-2xl font-semibold">Crie sua conta</h1>
        <p className="text-muted-foreground text-sm">
          Comece a organizar seus cadernos em segundos.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={nameId} required>
          Nome
        </Label>
        <Input
          id={nameId}
          name="name"
          placeholder="Como gostaria de ser chamado(a)"
          required
          autoFocus
          autoComplete="name"
        />
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
          autoComplete="email"
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
          placeholder="ao menos 4 caracteres"
          required
          minLength={4}
          autoComplete="new-password"
        />
      </div>

      {error && (
        <p id={errorId} className="text-danger text-sm" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {loading ? "Criando conta…" : "Criar conta"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="text-brand-500 underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
