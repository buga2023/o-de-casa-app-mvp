"use client";

import { useState } from "react";
import { Search, UserPlus, Check, X, ShieldCheck } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser, useStore } from "@/lib/hooks";
import {
  getVizinhosAtivos,
  countVizinhosAtivos,
  listConvitesPendentes,
  convidarVizinho,
  responderConvite,
  searchProfiles,
  getProfile,
  RegraError,
} from "@/lib/api";
import { MAX_VIZINHOS_PLANO_GRATIS } from "@/lib/types";

export default function VizinhosPage() {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const [q, setQ] = useState("");

  const ativos = useStore(() => (user ? getVizinhosAtivos(user.id) : []));
  const ativosCount = useStore(() =>
    user ? countVizinhosAtivos(user.id) : 0
  );
  const convites = useStore(() =>
    user ? listConvitesPendentes(user.id) : []
  );

  if (!user) return null;

  const noLimite = ativosCount >= MAX_VIZINHOS_PLANO_GRATIS;
  const resultados = q.trim() ? searchProfiles(q, user.id) : [];

  function convidar(vizinhoId: string) {
    if (!user) return;
    try {
      convidarVizinho(user.id, vizinhoId);
      toast("Convite enviado.");
      setQ("");
    } catch (err) {
      toast(err instanceof RegraError ? err.message : "Erro ao convidar.", "erro");
    }
  }

  function responder(vinculoId: string, aceitar: boolean) {
    try {
      responderConvite(vinculoId, aceitar);
      toast(aceitar ? "Vínculo ativado." : "Convite recusado.");
    } catch (err) {
      toast(err instanceof RegraError ? err.message : "Erro.", "erro");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-tinta">Vizinhos</h1>
        <p className="text-sm text-tinta/60">
          Autorize vizinhos de confiança a receber suas encomendas.
        </p>
      </div>

      {/* Convites recebidos */}
      {convites.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-tinta">
            Convites para você
          </h2>
          {convites.map((c) => {
            const morador = getProfile(c.morador_id);
            return (
              <Card key={c.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-tinta">{morador?.nome}</p>
                  <p className="text-xs text-tinta/60">
                    quer te autorizar a receber as encomendas dele.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => responder(c.id, true)}
                  aria-label={`Aceitar convite de ${morador?.nome}`}
                >
                  <Check className="h-4 w-4" /> Aceitar
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => responder(c.id, false)}
                  aria-label={`Recusar convite de ${morador?.nome}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            );
          })}
        </section>
      )}

      {/* Meus vizinhos ativos */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-tinta">
            Vizinhos ativos
          </h2>
          <Badge variant={noLimite ? "terracota" : "neutral"}>
            {ativosCount}/{MAX_VIZINHOS_PLANO_GRATIS} (plano grátis)
          </Badge>
        </div>
        {ativos.length === 0 ? (
          <EmptyState
            icon={<UserPlus className="h-10 w-10" strokeWidth={1.5} />}
            title="Nenhum vizinho ativo"
            description="Busque abaixo e envie um convite. Ele entra como ativo após o aceite."
          />
        ) : (
          <ul className="space-y-2">
            {ativos.map((v) => (
              <Card key={v.id} className="flex items-center gap-3 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-verde/12 text-verde">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-tinta">{v.nome}</p>
                  <p className="text-xs text-tinta/60">{v.condominio}</p>
                </div>
                <Badge variant="verde">ativo</Badge>
              </Card>
            ))}
          </ul>
        )}
      </section>

      {/* Buscar e convidar */}
      <section className="space-y-2">
        <Label htmlFor="busca">Convidar um vizinho</Label>
        {noLimite && (
          <p className="rounded-xl bg-terracota/10 px-3 py-2 text-xs text-terracota">
            Você atingiu o limite de {MAX_VIZINHOS_PLANO_GRATIS} vizinhos do
            plano grátis (BR-05).
          </p>
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta/40" />
          <Input
            id="busca"
            className="pl-9"
            placeholder="Buscar por nome ou telefone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            disabled={noLimite}
          />
        </div>
        {resultados.length > 0 && (
          <ul className="space-y-2">
            {resultados.map((p) => (
              <Card key={p.id} className="flex items-center gap-3 p-3">
                <div className="flex-1">
                  <p className="font-medium text-tinta">
                    {p.nome}{" "}
                    {p.verificado && (
                      <Badge variant="dourado" className="ml-1">
                        verificado
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-tinta/60">{p.telefone}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => convidar(p.id)}
                  disabled={!p.verificado || p.bloqueado}
                >
                  <UserPlus className="h-4 w-4" /> Convidar
                </Button>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
