// Montagem pura da linha do tempo do comprovante — compartilhada pelos drivers
// local e supabase. Deriva eventos dos dados existentes (sem tabela própria).

import type {
  Encomenda,
  Notificacao,
  Avaliacao,
  Contestacao,
  EventoTimeline,
} from "./types";

export function montarTimeline(args: {
  encomenda: Encomenda;
  notificacoes: Notificacao[];
  avaliacoes: Avaliacao[];
  contestacoes: Contestacao[];
  nomePorId: (id: string) => string | undefined;
}): EventoTimeline[] {
  const { encomenda: e, notificacoes, avaliacoes, contestacoes, nomePorId } = args;

  const eventos: EventoTimeline[] = [
    { tipo: "registrada", titulo: "Encomenda registrada com foto", at: e.created_at },
  ];

  const notif = notificacoes.find(
    (n) => n.encomenda_id === e.id && n.user_id === e.destinatario_id
  );
  if (notif)
    eventos.push({
      tipo: "notificada",
      titulo: "Destinatário notificado",
      at: notif.created_at,
    });

  if (e.retirada_at)
    eventos.push({
      tipo: "retirada",
      titulo: "Retirada confirmada (baixa)",
      at: e.retirada_at,
    });

  contestacoes
    .filter((c) => c.encomenda_id === e.id)
    .forEach((c) =>
      eventos.push({ tipo: "contestada", titulo: "Contestação aberta", at: c.created_at })
    );

  avaliacoes
    .filter((a) => a.encomenda_id === e.id)
    .forEach((a) =>
      eventos.push({
        tipo: "avaliada",
        titulo: `Avaliação de ${nomePorId(a.de_id) ?? "vizinho"} (${a.nota}★)`,
        at: a.created_at,
      })
    );

  return eventos.sort((x, y) => x.at.localeCompare(y.at));
}
