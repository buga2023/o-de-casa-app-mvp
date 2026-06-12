"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Inbox, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/states";
import { EncomendaCard } from "@/components/encomenda-card";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useData } from "@/lib/hooks";
import { data } from "@/lib/data";

export default function InicioPage() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState<"receber" | "registradas">("receber");
  const [q, setQ] = useState("");

  const { data: aReceber = [] } = useData(
    () => (user ? data.listEncomendasAReceber(user.id) : Promise.resolve([])),
    [user?.id]
  );
  const { data: registradas = [] } = useData(
    () => (user ? data.listEncomendasRegistradas(user.id) : Promise.resolve([])),
    [user?.id]
  );

  // nomes das contrapartes (recebedor/destinatário) das duas listas
  const idsContrapartes = Array.from(
    new Set([
      ...aReceber.map((e) => e.recebedor_id),
      ...registradas.map((e) => e.destinatario_id),
    ])
  );
  const { data: nomes = {} } = useData(
    () => data.getProfilesMap(idsContrapartes),
    [idsContrapartes.join(",")]
  );

  if (!user) return null;

  const lista = tab === "receber" ? aReceber : registradas;
  const filtrada = lista.filter((e) => {
    if (!q.trim()) return true;
    const term = q.toLowerCase();
    const outroId = tab === "receber" ? e.recebedor_id : e.destinatario_id;
    const outro = nomes[outroId];
    return (
      (e.descricao ?? "").toLowerCase().includes(term) ||
      e.codigo_comprovante.toLowerCase().includes(term) ||
      (outro?.nome ?? "").toLowerCase().includes(term)
    );
  });

  const buscaSemResultado = filtrada.length === 0 && q.trim() && lista.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl text-tinta">Suas encomendas</h1>
        <p className="text-sm text-tinta/60">
          Acompanhe o que você tem a receber e o que registrou.
        </p>
      </div>

      <div className="flex gap-2 rounded-xl bg-tinta/5 p-1">
        <TabButton active={tab === "receber"} onClick={() => setTab("receber")}>
          A receber{aReceber.length > 0 && ` (${aReceber.length})`}
        </TabButton>
        <TabButton
          active={tab === "registradas"}
          onClick={() => setTab("registradas")}
        >
          Registradas{registradas.length > 0 && ` (${registradas.length})`}
        </TabButton>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta/40" />
        <Input
          aria-label="Buscar encomenda"
          placeholder="Buscar por código, descrição ou nome"
          className="pl-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtrada.length === 0 ? (
        buscaSemResultado ? (
          <EmptyState
            icon={<Search className="h-10 w-10" strokeWidth={1.5} />}
            title="Nada encontrado"
            description={`Nenhuma encomenda combina com “${q.trim()}”. Tente outro código, nome ou descrição.`}
          />
        ) : tab === "receber" ? (
          <EmptyState
            icon={<Inbox className="h-10 w-10" strokeWidth={1.5} />}
            title="Nada a receber por aqui"
            description="Quando um vizinho registrar uma encomenda para você, ela aparece aqui."
          />
        ) : (
          <EmptyState
            icon={<Send className="h-10 w-10" strokeWidth={1.5} />}
            title="Você ainda não registrou encomendas"
            description="Use o botão Registrar para guardar uma encomenda de um vizinho."
            action={
              <Link href="/registrar">
                <Button size="sm">Registrar encomenda</Button>
              </Link>
            }
          />
        )
      ) : (
        <ul className="space-y-3">
          {filtrada.map((e) => {
            const outroId =
              tab === "receber" ? e.recebedor_id : e.destinatario_id;
            return (
              <li key={e.id}>
                <EncomendaCard
                  encomenda={e}
                  rotulo={tab === "receber" ? "Recebida por" : "Para"}
                  nomeContraparte={nomes[outroId]?.nome ?? "—"}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 flex-1 rounded-lg py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/60 ${
        active ? "bg-white text-tinta shadow-soft" : "text-tinta/50"
      }`}
    >
      {children}
    </button>
  );
}
