import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dourado/15 text-dourado">
        <PackageOpen className="h-8 w-8" />
      </div>
      <div>
        <h1 className="font-serif text-2xl text-tinta">Página não encontrada</h1>
        <p className="mt-1 text-sm text-tinta/60">
          O endereço pode estar errado ou a página foi movida.
        </p>
      </div>
      <Link href="/inicio">
        <Button>Ir para o início</Button>
      </Link>
    </main>
  );
}
