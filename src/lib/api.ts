/**
 * api.ts — fetch helper + flag de habilitação de backend real.
 *
 * Enquanto `NEXT_PUBLIC_API_URL` não estiver setada, `isApiEnabled` é false e
 * os services usam os Mock repositories. Quando um backend real existir,
 * basta setar a env var; nenhuma alteração em componentes/telas é necessária.
 *
 * Referência do pattern: ~/code/novelist-app/novelist/src/lib/api.ts
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
export const isApiEnabled = !!API_BASE;

interface ApiOptions extends RequestInit {
  json?: unknown;
}

export async function api<T = unknown>(
  path: string,
  opts: ApiOptions = {}
): Promise<T> {
  const { json, headers: customHeaders, ...rest } = opts;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  let body = opts.body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers,
    body,
    ...rest,
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ error: "unknown", message: res.statusText }));
    throw new ApiError(res.status, error.error, error.message);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}
