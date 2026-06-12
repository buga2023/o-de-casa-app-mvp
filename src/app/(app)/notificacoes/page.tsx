"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states";
import { useCurrentUser, useData } from "@/lib/hooks";
import { data } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";

export default function NotificacoesPage() {
  const router = useRouter();
  const { user } = useCurrentUser();

  const { data: notificacoes = [] } = useData(
    () => (user ? data.listNotificacoes(user.id) : Promise.resolve([])),
    [user?.id]
  );
  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  if (!user) return null;

  async function abrir(notifId: string, encomendaId: string | null) {
    await data.marcarLida(notifId);
    if (encomendaId && (await data.getEncomenda(encomendaId))) {
      router.push(`/comprovante/${encomendaId}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-tinta">Notificações</h1>
          <p className="text-sm text-tinta/60">
            {naoLidas > 0
              ? `${naoLidas} não lida${naoLidas > 1 ? "s" : ""}`
              : "Tudo em dia"}
          </p>
        </div>
        {naoLidas > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => user && data.marcarTodasLidas(user.id)}
          >
            <CheckCheck className="h-4 w-4" /> Marcar lidas
          </Button>
        )}
      </div>

      {notificacoes.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-10 w-10" strokeWidth={1.5} />}
          title="Sem notificações"
          description="Você será avisado aqui assim que algo acontecer com suas encomendas."
        />
      ) : (
        <ul className="space-y-2">
          {notificacoes.map((n) => (
            <li key={n.id}>
              <Card
                role="button"
                tabIndex={0}
                onClick={() => abrir(n.id, n.encomenda_id)}
                onKeyDown={(e) =>
                  e.key === "Enter" && abrir(n.id, n.encomenda_id)
                }
                className={`flex cursor-pointer gap-3 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/60 ${
                  n.lida ? "opacity-70" : "border-terracota/30"
                }`}
              >
                <div
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    n.lida ? "bg-transparent" : "bg-terracota"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-tinta">{n.titulo}</p>
                  {n.corpo && (
                    <p className="text-sm text-tinta/70">{n.corpo}</p>
                  )}
                  <p className="text-xs text-tinta/40">
                    {formatDateTime(n.created_at)}
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
