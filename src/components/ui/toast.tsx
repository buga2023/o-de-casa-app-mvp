"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = { id: number; msg: string; tone: "ok" | "erro" };
type Ctx = { toast: (msg: string, tone?: "ok" | "erro") => void };

const ToastCtx = React.createContext<Ctx | null>(null);

export function useToast(): Ctx {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) return { toast: () => {} };
  return ctx;
}

let seq = 0;
const MAX_FILA = 3;
const DURACAO_MS = 3200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const fechar = React.useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = React.useCallback(
    (msg: string, tone: "ok" | "erro" = "ok") => {
      seq += 1;
      const id = seq;
      // fila limitada: descarta os mais antigos em rajadas
      setToasts((t) => [...t, { id, msg, tone }].slice(-MAX_FILA));
      setTimeout(() => fechar(id), DURACAO_MS);
    },
    [fechar]
  );

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-app items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm text-creme shadow-soft",
              t.tone === "erro" ? "bg-terracota" : "bg-verde"
            )}
          >
            <span>{t.msg}</span>
            <button
              onClick={() => fechar(t.id)}
              aria-label="Fechar aviso"
              className="-m-1 shrink-0 rounded-full p-1 text-creme/80 hover:text-creme focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-creme/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
