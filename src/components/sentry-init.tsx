"use client";

// Observabilidade no cliente (P3.14). Inerte sem NEXT_PUBLIC_SENTRY_DSN.

import { useEffect } from "react";

export function SentryInit() {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    import("@sentry/nextjs").then((Sentry) =>
      Sentry.init({ dsn, tracesSampleRate: 0.1 })
    );
  }, []);
  return null;
}
