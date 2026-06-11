"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Inbox, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { EmptyState, StatusBadge } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useStore } from "@/lib/hooks";
import {
  listEncomendasARceber,
  listEncomendasRegistradas,
  getProfile,
} from "@/lib/api";
import type { Encomenda } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export default function InicioPage() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState<"receber" | "registradas">("receber");
  const [q, setQ] = useState("");

  const aReceber = useStore(() =>
    user ? listEncomendasARceber(user.id) : []
  );
  const registradas = useStore(() =>
    user ? listEncomendasRegistradas(user.id) : []
  );

  if (!user) return null;

  const lista = tab === "receber" ? aReceber : registradas;
  const filtrada = lista.filter((e) => {
    if (!q.trim()) return true;
    const term = q.toLowerCase();
    const outro = getProfile(
      tab === "receber" ? e.recebedor_id : e.destinatario_id
    );
    return (
      (e.descricao ?? "").toLowerCase().includes(term) ||
      e.codigo_comprovante.toLowerCase().includes(term) ||
      (outro?.nome ?? "").toLowerCase().includes(term)
    );
  });

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
        tab === "receber" ? (
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
          {filtrada.map((e) => (
            <EncomendaItem key={e.id} encomenda={e} perspectiva={tab} />
          ))}
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
      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
        active ? "bg-white text-tinta shadow-soft" : "text-tinta/50"
      }`}
    >
      {children}
    </button>
  );
}

function EncomendaItem({
  encomenda,
  perspectiva,
}: {
  encomenda: Encomenda;
  perspectiva: "receber" | "registradas";
}) {
  const outroId =
    perspectiva === "receber"
      ? encomenda.recebedor_id
      : encomenda.destinatario_id;
  const outro = getProfile(outroId);
  const rotulo = perspectiva === "receber" ? "Recebida por" : "Para";

  return (
    <li>
      <Link href={`/comprovante/${encomenda.id}`}>
        <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-tinta/[0.02]">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-tinta/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={encomenda.foto_url}
              alt="Foto da encomenda"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-medium text-tinta">
                {encomenda.descricao || "Encomenda"}
              </p>
              <StatusBadge status={encomenda.status} />
            </div>
            <p className="truncate text-xs text-tinta/60">
              {rotulo} {outro?.nome ?? "—"} · {encomenda.codigo_comprovante}
            </p>
            <p className="text-xs text-tinta/40">
              {formatDateTime(encomenda.created_at)}
            </p>
          </div>
        </Card>
      </Link>
    </li>
  );
}
