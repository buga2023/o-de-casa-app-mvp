"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Boundary do segmento autenticado — mantém header/nav do layout de fora
// do crash e oferece recuperação sem sair do app.
export default function AppError({
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
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-terracota/10 text-terracota">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <div>
        <h1 className="font-serif text-xl text-tinta">
          Não consegui carregar esta tela
        </h1>
        <p className="mt-1 text-sm text-tinta/60">
          Pode ser algo passageiro. Tente de novo.
        </p>
      </div>
      <Button onClick={reset}>Tentar de novo</Button>
    </div>
  );
}
