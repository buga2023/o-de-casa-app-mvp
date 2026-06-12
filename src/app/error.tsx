"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs").then((S) => S.captureException(error));
    }
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-terracota/10 text-terracota">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div>
        <h1 className="font-serif text-2xl text-tinta">Algo deu errado</h1>
        <p className="mt-1 text-sm text-tinta/60">
          Não foi possível carregar esta tela. Tente de novo — se persistir,
          volte para o início.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>Tentar de novo</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Ir para o início
        </Button>
      </div>
    </main>
  );
}
