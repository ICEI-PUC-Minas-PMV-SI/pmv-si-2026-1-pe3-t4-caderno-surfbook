/**
 * Wrapper sobre localStorage com namespace `surfbook-eixo3-*`.
 * Tipado e SSR-safe — retorna fallback quando window não existe.
 *
 * Usado pelos Mock repositories para persistência local.
 */

const NAMESPACE = "surfbook-eixo3";

function key(name: string) {
  return `${NAMESPACE}:${name}`;
}

export const storage = {
  get<T>(name: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key(name));
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  set<T>(name: string, value: T): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key(name), JSON.stringify(value));
  },

  remove(name: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key(name));
  },

  clearAll(): void {
    if (typeof window === "undefined") return;
    const prefix = `${NAMESPACE}:`;
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => window.localStorage.removeItem(k));
  },
};
