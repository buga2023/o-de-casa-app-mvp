"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Share2,
  PackageCheck,
  Star,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, EmptyState } from "@/components/states";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser, useStore } from "@/lib/hooks";
import {
  getEncomenda,
  getProfile,
  darBaixa,
  podeContestar,
  avaliar,
  abrirContestacao,
  RegraError,
} from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function ComprovantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useCurrentUser();

  const encomenda = useStore(() => getEncomenda(id));
  const [avaliado, setAvaliado] = useState(false);

  if (!user) return null;

  if (!encomenda) {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => router.push("/inicio")} />
        <EmptyState
          title="Comprovante não encontrado"
          description="Verifique o código ou volte para a lista de encomendas."
        />
      </div>
    );
  }

  const recebedor = getProfile(encomenda.recebedor_id);
  const destinatario = getProfile(encomenda.destinatario_id);
  const souDestinatario = user.id === encomenda.destinatario_id;
  const podeDarBaixa =
    souDestinatario && encomenda.status === "registrada";
  const retirada = encomenda.status === "retirada";

  // contraparte que vou avaliar
  const contraparte = souDestinatario ? recebedor : destinatario;

  function compartilhar() {
    if (!encomenda) return;
    const texto = `Comprovante Ô de Casa! — ${encomenda.codigo_comprovante}`;
    const url =
      typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "Ô de Casa!", text: texto, url }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${texto} ${url}`);
      toast("Link do comprovante copiado.");
    }
  }

  function confirmarBaixa() {
    if (!user || !encomenda) return;
    try {
      darBaixa(encomenda.id, user.id);
      toast("Baixa confirmada. Recebedor notificado.");
    } catch (err) {
      toast(err instanceof RegraError ? err.message : "Erro.", "erro");
    }
  }

  return (
    <div className="space-y-4">
      <BackButton onClick={() => router.back()} />

      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-tinta">Comprovante</h1>
        <StatusBadge status={encomenda.status} />
      </div>

      <Card>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={encomenda.foto_url}
          alt="Foto da encomenda registrada"
          className="max-h-72 w-full rounded-t-card object-cover"
        />
        <CardContent className="space-y-3 pt-4">
          <Linha rotulo="Código" valor={encomenda.codigo_comprovante} mono />
          <Linha
            rotulo="Registrada em"
            valor={formatDateTime(encomenda.created_at)}
          />
          <Linha rotulo="Recebida por" valor={recebedor?.nome ?? "—"} />
          <Linha rotulo="Destinatário" valor={destinatario?.nome ?? "—"} />
          {encomenda.descricao && (
            <Linha rotulo="Descrição" valor={encomenda.descricao} />
          )}
          {encomenda.retirada_at && (
            <Linha
              rotulo="Retirada em"
              valor={formatDateTime(encomenda.retirada_at)}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={compartilhar}>
          <Share2 className="h-4 w-4" /> Compartilhar
        </Button>
        {podeDarBaixa && (
          <Button className="flex-1" onClick={confirmarBaixa}>
            <PackageCheck className="h-4 w-4" /> Dar baixa
          </Button>
        )}
      </div>

      {/* Avaliação (após retirada) — tela 8 */}
      {retirada && contraparte && !avaliado && (
        <AvaliacaoForm
          onSubmit={(nota, comentario) => {
            try {
              avaliar({
                encomendaId: encomenda.id,
                deId: user.id,
                paraId: contraparte.id,
                nota,
                comentario,
              });
              setAvaliado(true);
              toast("Avaliação registrada. Obrigado!");
            } catch (err) {
              toast(err instanceof RegraError ? err.message : "Erro.", "erro");
            }
          }}
          nome={contraparte.nome}
        />
      )}
      {avaliado && (
        <p className="text-center text-sm text-verde">
          Avaliação enviada ✓
        </p>
      )}

      {/* Contestação (BR-06: 48h do registro) — tela 8 */}
      {souDestinatario && (
        <ContestacaoBloco
          encomendaId={encomenda.id}
          dentroDoPrazo={podeContestar(encomenda)}
          contestada={encomenda.status === "contestada"}
        />
      )}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm text-tinta/60"
    >
      <ArrowLeft className="h-4 w-4" /> Voltar
    </button>
  );
}

function Linha({
  rotulo,
  valor,
  mono,
}: {
  rotulo: string;
  valor: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-linha pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-tinta/60">{rotulo}</span>
      <span
        className={`text-right text-sm font-medium text-tinta ${
          mono ? "font-mono" : ""
        }`}
      >
        {valor}
      </span>
    </div>
  );
}

function AvaliacaoForm({
  nome,
  onSubmit,
}: {
  nome: string;
  onSubmit: (nota: number, comentario: string) => void;
}) {
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <p className="font-serif text-lg text-tinta">Avaliar {nome}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Nota ${n}`}
              onClick={() => setNota(n)}
            >
              <Star
                className={`h-7 w-7 ${
                  n <= nota
                    ? "fill-dourado text-dourado"
                    : "text-tinta/25"
                }`}
              />
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Comentário (opcional)"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
        <Button className="w-full" onClick={() => onSubmit(nota, comentario)}>
          Enviar avaliação
        </Button>
      </CardContent>
    </Card>
  );
}

function ContestacaoBloco({
  encomendaId,
  dentroDoPrazo,
  contestada,
}: {
  encomendaId: string;
  dentroDoPrazo: boolean;
  contestada: boolean;
}) {
  const { toast } = useToast();
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");

  if (contestada) {
    return (
      <div className="flex items-center gap-2 rounded-card bg-terracota/10 px-4 py-3 text-sm text-terracota">
        <AlertTriangle className="h-4 w-4" /> Contestação registrada.
      </div>
    );
  }

  if (!dentroDoPrazo) {
    return (
      <p className="text-center text-xs text-tinta/40">
        Prazo de contestação (48h) encerrado.
      </p>
    );
  }

  function enviar() {
    try {
      abrirContestacao({ encomendaId, motivo });
      toast("Contestação aberta.");
      setAberto(false);
    } catch (err) {
      toast(err instanceof RegraError ? err.message : "Erro.", "erro");
    }
  }

  return aberto ? (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <Label>Motivo da contestação</Label>
        <Textarea
          placeholder="Descreva o problema"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setAberto(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={!motivo.trim()}
            onClick={enviar}
          >
            Enviar
          </Button>
        </div>
      </CardContent>
    </Card>
  ) : (
    <button
      onClick={() => setAberto(true)}
      className="flex w-full items-center justify-center gap-2 text-sm text-terracota"
    >
      <AlertTriangle className="h-4 w-4" /> Abrir contestação (até 48h)
    </button>
  );
}
