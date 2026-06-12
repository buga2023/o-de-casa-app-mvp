// Tempo centralizado — único ponto que lê o relógio. Testes controlam o "agora"
// com vi.setSystemTime (fake timers), e a formatação pt-BR fica num lugar só.

export function now(): number {
  return Date.now();
}

export function nowIso(): string {
  return new Date(now()).toISOString();
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
