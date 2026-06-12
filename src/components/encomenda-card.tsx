// Card de encomenda reutilizável (Início, listas futuras). Puramente
// apresentacional: nomes resolvidos pelo chamador.
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/states";
import type { Encomenda } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function EncomendaCard({
  encomenda,
  rotulo,
  nomeContraparte,
}: {
  encomenda: Encomenda;
  rotulo: string;
  nomeContraparte: string;
}) {
  return (
    <Link
      href={`/comprovante/${encomenda.id}`}
      className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/60"
    >
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
            {rotulo} {nomeContraparte} · {encomenda.codigo_comprovante}
          </p>
          <p className="text-xs text-tinta/40">
            {formatDateTime(encomenda.created_at)}
          </p>
        </div>
      </Card>
    </Link>
  );
}
