"use client";

import * as React from "react";
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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((msg: string, tone: "ok" | "erro" = "ok") => {
    seq += 1;
    const id = seq;
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto w-full max-w-app rounded-xl px-4 py-3 text-sm text-creme shadow-soft",
              t.tone === "erro" ? "bg-terracota" : "bg-verde"
            )}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
