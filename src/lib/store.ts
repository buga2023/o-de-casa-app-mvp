// Store local — substitui o Supabase (Auth/DB/Storage/Realtime) com persistência
// em localStorage. Mesmo "contrato" de dados do db/schema.sql para troca futura fácil.
"use client";

import type { DBShape } from "./types";
import { seedDB } from "./seed";

const KEY = "odecasa.db.v1";
const SESSION_KEY = "odecasa.session.v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadDB(): DBShape {
  if (!isBrowser()) return seedDB();
  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    const seeded = seedDB();
    window.localStorage.setItem(KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw) as DBShape;
  } catch {
    const seeded = seedDB();
    window.localStorage.setItem(KEY, JSON.stringify(seeded));
    return seeded;
  }
}

export function saveDB(db: DBShape) {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(db));
  // notifica assinantes (realtime simulado) — síncrono + cross-tab via storage event
  listeners.forEach((l) => l());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  if (isBrowser()) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (isBrowser()) window.removeEventListener("storage", onStorage);
  };
}

export function resetDB() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(SESSION_KEY);
  loadDB();
  listeners.forEach((l) => l());
}

// ----- sessão (auth simulada) -----
export function getSessionUserId(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function setSessionUserId(id: string | null) {
  if (!isBrowser()) return;
  if (id) window.localStorage.setItem(SESSION_KEY, id);
  else window.localStorage.removeItem(SESSION_KEY);
  listeners.forEach((l) => l());
}

// id simples e ordenável o suficiente para o MVP (sem Math.random no SSR)
let counter = 0;
export function newId(prefix = "id"): string {
  counter += 1;
  const t = isBrowser() ? Date.now() : 0;
  return `${prefix}_${t.toString(36)}_${counter.toString(36)}`;
}
