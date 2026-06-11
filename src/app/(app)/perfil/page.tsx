"use client";

import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Star,
  LogOut,
  RefreshCw,
  Repeat,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser, useStore } from "@/lib/hooks";
import { logout, loginDemo, getProfile } from "@/lib/api";
import { resetDB } from "@/lib/store";
import { DEMO_ANA, DEMO_BRUNO, DEMO_CARLA } from "@/lib/seed";

const DEMOS = [DEMO_ANA, DEMO_BRUNO, DEMO_CARLA];

export default function PerfilPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useCurrentUser();

  // usado só para forçar re-render ao trocar de usuário
  useStore(() => user?.id);

  if (!user) return null;

  const ehDemo = DEMOS.includes(user.id);

  function sair() {
    logout();
    router.replace("/");
  }

  function trocarDemo(id: string) {
    loginDemo(id);
    const p = getProfile(id);
    toast(`Agora você é ${p?.nome ?? "demo"}.`);
    router.replace("/inicio");
  }

  function resetar() {
    resetDB();
    loginDemo(DEMO_ANA);
    toast("Dados demo reiniciados.");
    router.replace("/inicio");
  }

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-2xl text-tinta">Perfil</h1>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-terracota/12 font-serif text-xl text-terracota">
              {user.nome.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-serif text-xl text-tinta">{user.nome}</p>
              <div className="mt-1 flex items-center gap-2">
                {user.verificado ? (
                  <Badge variant="verde">
                    <BadgeCheck className="h-3.5 w-3.5" /> verificado
                  </Badge>
                ) : (
                  <Badge variant="terracota">não verificado</Badge>
                )}
                <Badge variant="dourado">
                  <Star className="h-3.5 w-3.5 fill-current" /> {user.reputacao}
                </Badge>
              </div>
            </div>
          </div>

          <dl className="space-y-2 border-t border-linha pt-3 text-sm">
            <Info termo="Celular" desc={user.telefone ?? "—"} />
            <Info termo="Endereço" desc={user.endereco ?? "—"} />
            <Info termo="Condomínio" desc={user.condominio ?? "—"} />
            <Info termo="CEP" desc={user.cep ?? "—"} />
          </dl>
        </CardContent>
      </Card>

      {ehDemo && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-tinta">
            <Repeat className="h-4 w-4" /> Trocar de usuário (demo)
          </h2>
          <p className="text-xs text-tinta/60">
            Para a banca: alterne entre os perfis para ver os dois lados
            (registrar e receber).
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMOS.map((id) => {
              const p = getProfile(id);
              const atual = id === user.id;
              return (
                <Button
                  key={id}
                  variant={atual ? "primary" : "outline"}
                  size="sm"
                  onClick={() => !atual && trocarDemo(id)}
                >
                  {p?.nome.split(" ")[0]}
                </Button>
              );
            })}
          </div>
        </section>
      )}

      <div className="space-y-2 pt-2">
        {ehDemo && (
          <Button variant="outline" className="w-full" onClick={resetar}>
            <RefreshCw className="h-4 w-4" /> Reiniciar dados demo
          </Button>
        )}
        <Button variant="ghost" className="w-full text-terracota" onClick={sair}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>
    </div>
  );
}

function Info({ termo, desc }: { termo: string; desc: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-tinta/60">{termo}</dt>
      <dd className="text-right font-medium text-tinta">{desc}</dd>
    </div>
  );
}
