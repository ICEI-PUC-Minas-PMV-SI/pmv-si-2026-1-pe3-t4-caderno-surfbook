/**
 * Emitter tipado — replica o pattern dos clients do eixo-1
 * (`MockNotebookClient.on("insert", cb)`) com tipagem por evento.
 *
 * Cada repositório define seu mapa de eventos e estende esta classe;
 * o bootstrap central (`lib/app-bootstrap.ts`) registra reações
 * cross-entidade (ex.: notebook.inserted → tagService.upsertFromNotebook).
 *
 * Returns `() => void` em `on(...)` para unsubscribe; padrão idiomático
 * em React (compatível com `useEffect` cleanup).
 */
type Listener<T> = (data: T) => void;

export class Emitter<EventMap extends Record<string, unknown>> {
  private listeners: {
    [K in keyof EventMap]?: Listener<EventMap[K]>[];
  } = {};

  protected emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    this.listeners[event]?.slice().forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        // Falha em um listener não pode interromper os outros
        console.error(`Listener for "${String(event)}" threw:`, err);
      }
    });
  }

  on<K extends keyof EventMap>(
    event: K,
    cb: Listener<EventMap[K]>
  ): () => void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(cb);
    return () => this.off(event, cb);
  }

  off<K extends keyof EventMap>(
    event: K,
    cb: Listener<EventMap[K]>
  ): void {
    this.listeners[event] = this.listeners[event]?.filter((l) => l !== cb);
  }
}
