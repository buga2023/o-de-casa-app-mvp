"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Share2,
  PackageCheck,
  Star,
  AlertTriangle,
  ArrowLeft,
  QrCode,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { StatusBadge, EmptyState } from "@/components/states";
import { useToast } from "@/components/ui/toast";
import { useCurrentUser, useData } from "@/lib/hooks";
import { data } from "@/lib/data";
import { RegraError } from "@/lib/errors";
import { podeContestar, estaEncerrada } from "@/lib/api";
import { contestacaoSchema } from "@/lib/schemas";
import { formatDateTime } from "@/lib/utils";
import type { EventoTimeline } from "@/lib/types";

export default function ComprovantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useCurrentUser();

  const { data: encomenda, ready } = useData(() => data.getEncomenda(id), [id]);
  const { data: pessoas = {} } = useData(
    () =>
      encomenda
        ? data.getProfilesMap([encomenda.recebedor_id, encomenda.destinatario_id])
        : data.getProfilesMap([]),
    [encomenda?.id]
  );
  const { data: timeline = [] } = useData(
    () => (encomenda ? data.getTimeline(id) : Promise.resolve([])),
    [encomenda?.id, encomenda?.status, encomenda?.retirada_at]
  );
  const { data: avaliado = false } = useData(
    () =>
      encomenda && user
        ? data.jaAvaliou(encomenda.id, user.id)
        : Promise.resolve(false),
    [encomenda?.id, user?.id]
  );

  if (!user) return null;

  if (ready && !encomenda) {
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
  if (!encomenda) return null; // carregando

  const recebedor = pessoas[encomenda.recebedor_id];
  const destinatario = pessoas[encomenda.destinatario_id];
  const souDestinatario = user.id === encomenda.destinatario_id;
  const podeDarBaixa = souDestinatario && encomenda.status === "registrada";
  const retirada = encomenda.status === "retirada";
  const encerrada = estaEncerrada(encomenda); // BR-07

  // contraparte que vou avaliar
  const contraparte = souDestinatario ? recebedor : destinatario;

  function compartilhar() {
    if (!encomenda) return;
    const texto = `Comprovante Ô de Casa! — ${encomenda.codigo_comprovante}`;
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "Ô de Casa!", text: texto, url }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${texto} ${url}`);
      toast("Link do comprovante copiado.");
    }
  }

  async function confirmarBaixa() {
    if (!user || !encomenda) return;
    try {
      await data.darBaixa(encomenda.id, user.id);
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
        <StatusBadge status={encerrada ? "encerrada" : encomenda.status} />
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

      {/* QR Code do comprovante */}
      <QrBloco codigo={encomenda.codigo_comprovante} />

      {/* Linha do tempo */}
      {timeline.length > 0 && <TimelineBloco eventos={timeline} />}

      {/* Avaliação (após retirada) — tela 8 */}
      {retirada && contraparte && !avaliado && (
        <AvaliacaoForm
          onSubmit={async (nota, comentario) => {
            try {
              await data.avaliar({
                encomendaId: encomenda.id,
                deId: user.id,
                paraId: contraparte.id,
                nota,
                comentario,
              });
              toast("Avaliação registrada. Obrigado!");
            } catch (err) {
              toast(err instanceof RegraError ? err.message : "Erro.", "erro");
            }
          }}
          nome={contraparte.nome}
        />
      )}
      {retirada && avaliado && (
        <p className="text-center text-sm text-verde">Avaliação enviada ✓</p>
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
      className="inline-flex min-h-11 items-center gap-1 text-sm text-tinta/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/60"
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

// QR do link público do comprovante — escanear abre esta página.
function QrBloco({ codigo }: { codigo: string }) {
  const [aberto, setAberto] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto || qrUrl) return;
    const url = window.location.href;
    import("qrcode").then((QRCode) =>
      QRCode.toDataURL(url, { width: 240, margin: 1 }).then(setQrUrl)
    );
  }, [aberto, qrUrl]);

  return (
    <Card>
      <CardContent className="pt-4">
        <button
          onClick={() => setAberto((a) => !a)}
          aria-expanded={aberto}
          className="flex min-h-11 w-full items-center justify-center gap-2 text-sm font-medium text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/60"
        >
          <QrCode className="h-4 w-4 text-terracota" />
          {aberto ? "Esconder QR Code" : "Mostrar QR Code"}
        </button>
        {aberto && (
          <div className="mt-3 flex flex-col items-center gap-2 pb-2">
            {qrUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrUrl}
                alt={`QR Code do comprovante ${codigo}`}
                className="h-60 w-60 rounded-xl border border-linha bg-white p-2"
              />
            ) : (
              <div className="h-60 w-60 animate-pulse rounded-xl bg-tinta/5" />
            )}
            <p className="font-mono text-xs text-tinta/60">{codigo}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineBloco({ eventos }: { eventos: EventoTimeline[] }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="mb-3 font-serif text-lg text-tinta">Linha do tempo</p>
        <ol className="space-y-0">
          {eventos.map((ev, i) => (
            <li key={`${ev.tipo}-${ev.at}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
              {i < eventos.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[5px] top-4 h-full w-px bg-linha"
                />
              )}
              <span
                aria-hidden
                className={`mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ${
                  ev.tipo === "contestada"
                    ? "bg-terracota"
                    : ev.tipo === "retirada"
                      ? "bg-verde"
                      : "bg-dourado"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-tinta">{ev.titulo}</p>
                <p className="text-xs text-tinta/50">{formatDateTime(ev.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
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
        <div className="flex gap-1" role="radiogroup" aria-label="Nota de 1 a 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={n === nota}
              aria-label={`Nota ${n}`}
              onClick={() => setNota(n)}
              className="flex h-11 w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/60"
            >
              <Star
                className={`h-7 w-7 ${
                  n <= nota ? "fill-dourado text-dourado" : "text-tinta/25"
                }`}
              />
            </button>
          ))}
        </div>
        <Textarea
          aria-label="Comentário da avaliação"
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
  const [erro, setErro] = useState("");

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

  async function enviar() {
    const parsed = contestacaoSchema.safeParse({ motivo });
    if (!parsed.success) {
      setErro(parsed.error.issues[0].message);
      return;
    }
    try {
      await data.abrirContestacao({ encomendaId, motivo });
      toast("Contestação aberta.");
      setAberto(false);
    } catch (err) {
      toast(err instanceof RegraError ? err.message : "Erro.", "erro");
    }
  }

  return aberto ? (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <Label htmlFor="motivo">Motivo da contestação</Label>
        <Textarea
          id="motivo"
          placeholder="Descreva o problema"
          aria-invalid={Boolean(erro)}
          value={motivo}
          onChange={(e) => {
            setMotivo(e.target.value);
            if (erro) setErro("");
          }}
        />
        {erro && (
          <p role="alert" className="text-xs text-terracota">
            {erro}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setAberto(false)}
          >
            Cancelar
          </Button>
          <Button className="flex-1" disabled={!motivo.trim()} onClick={enviar}>
            Enviar
          </Button>
        </div>
      </CardContent>
    </Card>
  ) : (
    <button
      onClick={() => setAberto(true)}
      className="flex min-h-11 w-full items-center justify-center gap-2 text-sm text-terracota focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracota/60"
    >
      <AlertTriangle className="h-4 w-4" /> Abrir contestação (até 48h)
    </button>
  );
}
