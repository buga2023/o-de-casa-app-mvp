// Hooks reativos sobre a camada de dados assíncrona (src/lib/data).
// Re-executam o fetcher quando o driver sinaliza mudança (realtime, RF-05).
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { data } from "./data";
import type { Profile } from "./types";

interface UseDataResult<T> {
  data: T | undefined;
  ready: boolean;
  refetch: () => void;
}

// Busca assíncrona reativa: refaz em mudanças do store/banco e quando `deps`
// mudam. Erros de fetch são relançados no render para o error boundary.
export function useData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[]
): UseDataResult<T> {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const gen = useRef(0);
  const [state, setState] = useState<{
    value: T | undefined;
    ready: boolean;
    error: unknown;
  }>({ value: undefined, ready: false, error: null });

  const run = useCallback(() => {
    const g = ++gen.current;
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((v) => {
        if (g === gen.current)
          setState({ value: v, ready: true, error: null });
      })
      .catch((err) => {
        if (g === gen.current)
          setState((s) => ({ ...s, ready: true, error: err }));
      });
  }, []);

  useEffect(() => {
    run();
    return data.subscribe(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  if (state.error) throw state.error;
  return { data: state.value, ready: state.ready, refetch: run };
}

// Usuário logado (reativo). `ready` indica que a primeira leitura terminou.
export function useCurrentUser(): { user: Profile | null; ready: boolean } {
  const { data: user, ready } = useData(() => data.getCurrentUser(), []);
  return { user: user ?? null, ready };
}
