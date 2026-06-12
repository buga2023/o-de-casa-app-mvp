"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, Camera, BellRing } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/hooks";
import { data } from "@/lib/data";
import { DEMO_ANA } from "@/lib/seed";

export default function LandingPage() {
  const router = useRouter();
  const { user, ready } = useCurrentUser();

  useEffect(() => {
    if (ready && user) router.replace("/inicio");
  }, [ready, user, router]);

  async function entrarComoDemo() {
    await data.loginDemo(DEMO_ANA);
    router.replace("/inicio");
  }

  return (
    <main className="flex min-h-dvh flex-col px-5 py-10">
      <div className="flex flex-1 flex-col justify-center gap-8">
        <header className="space-y-3">
          <Brand className="text-3xl" />
          <h1 className="font-serif text-2xl leading-snug text-tinta">
            Seu vizinho de confiança recebe sua encomenda — com foto e
            comprovante.
          </h1>
          <p className="text-sm text-tinta/60">
            Sem portaria 24h? O <Brand /> deixa um vizinho autorizado receber,
            registrar com foto e te avisar na hora.
          </p>
        </header>

        <ul className="space-y-3">
          <Feature icon={<Camera className="h-5 w-5" />} text="Registro com foto obrigatória" />
          <Feature icon={<BellRing className="h-5 w-5" />} text="Notificação em tempo real" />
          <Feature icon={<PackageCheck className="h-5 w-5" />} text="Comprovante rastreável e baixa na retirada" />
        </ul>
      </div>

      <div className="space-y-3">
        {data.supportsDemo && (
          <Button className="w-full" size="lg" onClick={entrarComoDemo}>
            Entrar como demo
          </Button>
        )}
        <Button
          variant={data.supportsDemo ? "outline" : "primary"}
          className="w-full"
          size="lg"
          onClick={() => router.push("/cadastro")}
        >
          Criar minha conta
        </Button>
        {data.supportsDemo && (
          <p className="text-center text-xs text-tinta/50">
            Modo demo: percorra o fluxo completo sem cadastro.
          </p>
        )}
      </div>
    </main>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3 rounded-card border border-linha bg-white px-4 py-3 shadow-soft">
      <span className="text-terracota">{icon}</span>
      <span className="text-sm text-tinta">{text}</span>
    </li>
  );
}
