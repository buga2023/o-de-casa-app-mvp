"use client";

// Registra o service worker e emite notificação do sistema quando chega
// notificação nova para o usuário logado (RF-05). Com o driver supabase o
// gatilho é o realtime; no local, o storage event entre abas.

import { useEffect, useRef } from "react";
import { data } from "@/lib/data";
import { useCurrentUser } from "@/lib/hooks";

export function PwaSetup() {
  const { user } = useCurrentUser();
  const vistas = useRef<Set<string> | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!user || typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const userId = user.id;
    const checar = async () => {
      const notifs = await data.listNotificacoes(userId);
      const naoLidas = notifs.filter((n) => !n.lida);
      if (vistas.current === null) {
        // primeira leitura: só memoriza, não notifica o histórico
        vistas.current = new Set(naoLidas.map((n) => n.id));
        return;
      }
      for (const n of naoLidas) {
        if (vistas.current.has(n.id)) continue;
        vistas.current.add(n.id);
        if (Notification.permission === "granted" && document.hidden) {
          new Notification(n.titulo, {
            body: n.corpo ?? undefined,
            icon: "/icon.svg",
            tag: n.id,
          });
        }
      }
    };

    checar();
    const unsub = data.subscribe(checar);
    return () => {
      unsub();
      vistas.current = null;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
