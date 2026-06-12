// Erros de regra de negócio + Result<T> opcional para quem prefere não usar try/catch.

export class RegraError extends Error {}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

// Converte uma chamada que lança RegraError em Result<T>.
// Erros que não são de regra continuam subindo (bug de programação).
export function tryRegra<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, value: fn() };
  } catch (err) {
    if (err instanceof RegraError) return { ok: false, error: err.message };
    throw err;
  }
}
