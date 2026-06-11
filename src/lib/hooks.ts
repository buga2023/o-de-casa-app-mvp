// Hooks reativos — re-renderizam quando o store muda (realtime simulado, RF-05).
"use client";

import { useEffect, useRef, useState } from "react";
import { subscribe } from "./store";
import { getCurrentUser } from "./api";
import type { Profile } from "./types";

// Re-executa `selector` sempre que o store é salvo. Aceita selector inline
// (identidade muda a cada render) sem entrar em loop: assina o store uma vez.
export function useStore<T>(selector: () => T): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const [value, setValue] = useState<T>(() => selectorRef.current());

  useEffect(() => {
    const run = () => setValue(selectorRef.current());
    run(); // sincroniza com o store do cliente após a hidratação
    return subscribe(run);
  }, []);

  return value;
}

// Usuário logado (reativo). `ready` indica que o cliente já hidratou.
export function useCurrentUser(): { user: Profile | null; ready: boolean } {
  const [ready, setReady] = useState(false);
  const user = useStore(() => getCurrentUser());
  useEffect(() => setReady(true), []);
  return { user, ready };
}
