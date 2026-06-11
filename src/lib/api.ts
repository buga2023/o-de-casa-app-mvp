// API de domínio — aplica as Regras de Negócio (BR-01..09) sobre o store local.
// Mesma semântica de uma camada Supabase: troque store.ts por chamadas reais depois.
"use client";

import {
  loadDB,
  saveDB,
  newId,
  getSessionUserId,
  setSessionUserId,
} from "./store";
import type {
  Profile,
  Vinculo,
  Encomenda,
  Notificacao,
} from "./types";
import { MAX_VIZINHOS_PLANO_GRATIS, CONTESTACAO_PRAZO_MS } from "./types";

export class RegraError extends Error {}

// ---------------- AUTH / PERFIL (RF-01) ----------------

export function getCurrentUser(): Profile | null {
  const id = getSessionUserId();
  if (!id) return null;
  return loadDB().profiles.find((p) => p.id === id) ?? null;
}

export function loginDemo(userId: string) {
  setSessionUserId(userId);
}

export function logout() {
  setSessionUserId(null);
}

export interface SignUpInput {
  nome: string;
  telefone: string;
  endereco: string;
  condominio: string;
  cep: string;
}

// Cria conta + sessão. verificado=false até a "verificação em 2 passos".
export function signUp(input: SignUpInput): Profile {
  const db = loadDB();
  const profile: Profile = {
    id: newId("usr"),
    nome: input.nome.trim(),
    telefone: input.telefone.trim() || null,
    endereco: input.endereco.trim() || null,
    condominio: input.condominio.trim() || null,
    cep: input.cep.trim() || null,
    verificado: false,
    reputacao: 5,
    bloqueado: false,
    created_at: nowIso(),
  };
  db.profiles.push(profile);
  saveDB(db);
  setSessionUserId(profile.id);
  return profile;
}

// Verificação em 2 passos simulada → verificado=true (BR-01).
export function verificarPerfil(userId: string): Profile {
  const db = loadDB();
  const p = db.profiles.find((x) => x.id === userId);
  if (!p) throw new RegraError("Perfil não encontrado.");
  p.verificado = true;
  saveDB(db);
  return p;
}

// ---------------- PERFIS ----------------

export function getProfile(id: string): Profile | null {
  return loadDB().profiles.find((p) => p.id === id) ?? null;
}

export function searchProfiles(query: string, excludeId?: string): Profile[] {
  const q = query.trim().toLowerCase();
  return loadDB().profiles.filter((p) => {
    if (p.id === excludeId) return false;
    if (!q) return true;
    return (
      p.nome.toLowerCase().includes(q) ||
      (p.telefone ?? "").toLowerCase().includes(q)
    );
  });
}

// ---------------- VÍNCULOS (RF-02, RF-03 · BR-01/02/05/09) ----------------

export function listVinculosDoUsuario(userId: string): Vinculo[] {
  return loadDB().vinculos.filter(
    (v) => v.morador_id === userId || v.vizinho_id === userId
  );
}

// Vizinhos que EU (morador) autorizei e estão ativos.
export function getVizinhosAtivos(moradorId: string): Profile[] {
  const db = loadDB();
  return db.vinculos
    .filter((v) => v.morador_id === moradorId && v.status === "ativo")
    .map((v) => db.profiles.find((p) => p.id === v.vizinho_id))
    .filter((p): p is Profile => Boolean(p));
}

export function countVizinhosAtivos(moradorId: string): number {
  return loadDB().vinculos.filter(
    (v) => v.morador_id === moradorId && v.status === "ativo"
  ).length;
}

// Convites pendentes onde EU sou o convidado (vizinho).
export function listConvitesPendentes(vizinhoId: string): Vinculo[] {
  return loadDB().vinculos.filter(
    (v) => v.vizinho_id === vizinhoId && v.status === "pendente"
  );
}

// Morador convida vizinho.
export function convidarVizinho(moradorId: string, vizinhoId: string): Vinculo {
  const db = loadDB();
  if (moradorId === vizinhoId)
    throw new RegraError("Você não pode convidar a si mesmo.");

  const morador = db.profiles.find((p) => p.id === moradorId);
  const vizinho = db.profiles.find((p) => p.id === vizinhoId);
  if (!morador || !vizinho) throw new RegraError("Usuário não encontrado.");

  // BR-01: só verificados convidam/são convidados
  if (!morador.verificado || !vizinho.verificado)
    throw new RegraError("Ambos precisam estar verificados (BR-01).");
  // BR-09: não convidar bloqueado
  if (vizinho.bloqueado)
    throw new RegraError("Este vizinho está bloqueado (BR-09).");
  // BR-05: máx. 2 vizinhos ativos no plano grátis
  if (countVizinhosAtivos(moradorId) >= MAX_VIZINHOS_PLANO_GRATIS)
    throw new RegraError(
      `Plano grátis permite até ${MAX_VIZINHOS_PLANO_GRATIS} vizinhos ativos (BR-05).`
    );

  const existente = db.vinculos.find(
    (v) => v.morador_id === moradorId && v.vizinho_id === vizinhoId
  );
  if (existente) {
    if (existente.status === "recusado") {
      existente.status = "pendente";
      existente.created_at = nowIso();
      saveDB(db);
      return existente;
    }
    throw new RegraError("Já existe um convite para este vizinho.");
  }

  const vinculo: Vinculo = {
    id: newId("vin"),
    morador_id: moradorId,
    vizinho_id: vizinhoId,
    status: "pendente", // BR-02: ativo só após aceite
    created_at: nowIso(),
  };
  db.vinculos.push(vinculo);
  saveDB(db);
  return vinculo;
}

// Convidado aceita/recusa (BR-02).
export function responderConvite(vinculoId: string, aceitar: boolean): Vinculo {
  const db = loadDB();
  const v = db.vinculos.find((x) => x.id === vinculoId);
  if (!v) throw new RegraError("Convite não encontrado.");
  if (v.status !== "pendente")
    throw new RegraError("Este convite já foi respondido.");

  if (aceitar) {
    // re-checa BR-05 no momento do aceite
    if (countVizinhosAtivos(v.morador_id) >= MAX_VIZINHOS_PLANO_GRATIS)
      throw new RegraError(
        `O morador já atingiu o limite de ${MAX_VIZINHOS_PLANO_GRATIS} vizinhos (BR-05).`
      );
    v.status = "ativo";
  } else {
    v.status = "recusado";
  }
  saveDB(db);
  return v;
}

// ---------------- ENCOMENDAS (RF-04 · BR-03/04/09) ----------------

// Destinatários para quem EU (recebedor) posso registrar: moradores que me autorizaram.
export function getDestinatariosDisponiveis(recebedorId: string): Profile[] {
  const db = loadDB();
  return db.vinculos
    .filter((v) => v.vizinho_id === recebedorId && v.status === "ativo")
    .map((v) => db.profiles.find((p) => p.id === v.morador_id))
    .filter((p): p is Profile => Boolean(p) && !p!.bloqueado); // BR-09
}

export interface RegistrarInput {
  recebedorId: string;
  destinatarioId: string;
  descricao: string;
  fotoUrl: string;
}

export function registrarEncomenda(input: RegistrarInput): Encomenda {
  const db = loadDB();
  // BR-03: foto obrigatória
  if (!input.fotoUrl) throw new RegraError("Foto é obrigatória (BR-03).");

  const recebedor = db.profiles.find((p) => p.id === input.recebedorId);
  const destinatario = db.profiles.find((p) => p.id === input.destinatarioId);
  if (!recebedor || !destinatario)
    throw new RegraError("Usuário não encontrado.");

  // BR-09: destinatário não bloqueado
  if (destinatario.bloqueado)
    throw new RegraError("Destinatário bloqueado (BR-09).");

  // precisa existir vínculo ativo (morador=destinatário autorizou recebedor)
  const vinculo = db.vinculos.find(
    (v) =>
      v.morador_id === input.destinatarioId &&
      v.vizinho_id === input.recebedorId &&
      v.status === "ativo"
  );
  if (!vinculo)
    throw new RegraError("Este destinatário não autorizou você a receber.");

  const encomenda: Encomenda = {
    id: newId("enc"),
    destinatario_id: input.destinatarioId,
    recebedor_id: input.recebedorId,
    descricao: input.descricao.trim() || null,
    foto_url: input.fotoUrl,
    codigo_comprovante: gerarCodigo(),
    status: "registrada",
    created_at: nowIso(),
    retirada_at: null,
  };
  db.encomendas.push(encomenda);

  // BR-04: notificação imediata ao destinatário
  db.notificacoes.push({
    id: newId("ntf"),
    user_id: input.destinatarioId,
    encomenda_id: encomenda.id,
    titulo: "Nova encomenda registrada",
    corpo: `${recebedor.nome} recebeu uma encomenda para você. Código ${encomenda.codigo_comprovante}.`,
    lida: false,
    created_at: nowIso(),
  });

  saveDB(db);
  return encomenda;
}

export function listEncomendasARceber(userId: string): Encomenda[] {
  return loadDB()
    .encomendas.filter((e) => e.destinatario_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function listEncomendasRegistradas(userId: string): Encomenda[] {
  return loadDB()
    .encomendas.filter((e) => e.recebedor_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getEncomenda(id: string): Encomenda | null {
  return loadDB().encomendas.find((e) => e.id === id) ?? null;
}

export function getEncomendaByCodigo(codigo: string): Encomenda | null {
  const c = codigo.trim().toUpperCase();
  return (
    loadDB().encomendas.find((e) => e.codigo_comprovante.toUpperCase() === c) ??
    null
  );
}

// ---------------- DAR BAIXA (RF-07 · BR-07) ----------------

export function darBaixa(encomendaId: string, userId: string): Encomenda {
  const db = loadDB();
  const e = db.encomendas.find((x) => x.id === encomendaId);
  if (!e) throw new RegraError("Encomenda não encontrada.");
  if (e.destinatario_id !== userId)
    throw new RegraError("Só o destinatário pode dar baixa.");
  if (e.status === "retirada")
    throw new RegraError("Esta encomenda já foi retirada.");

  e.status = "retirada";
  e.retirada_at = nowIso();

  const destinatario = db.profiles.find((p) => p.id === e.destinatario_id);
  // notifica o recebedor
  db.notificacoes.push({
    id: newId("ntf"),
    user_id: e.recebedor_id,
    encomenda_id: e.id,
    titulo: "Encomenda retirada",
    corpo: `${destinatario?.nome ?? "O destinatário"} deu baixa na encomenda ${e.codigo_comprovante}.`,
    lida: false,
    created_at: nowIso(),
  });

  saveDB(db);
  return e;
}

// ---------------- NOTIFICAÇÕES (RF-05 · BR-04) ----------------

export function listNotificacoes(userId: string): Notificacao[] {
  return loadDB()
    .notificacoes.filter((n) => n.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function countNaoLidas(userId: string): number {
  return loadDB().notificacoes.filter((n) => n.user_id === userId && !n.lida)
    .length;
}

export function marcarLida(notifId: string) {
  const db = loadDB();
  const n = db.notificacoes.find((x) => x.id === notifId);
  if (n) n.lida = true;
  saveDB(db);
}

export function marcarTodasLidas(userId: string) {
  const db = loadDB();
  db.notificacoes.forEach((n) => {
    if (n.user_id === userId) n.lida = true;
  });
  saveDB(db);
}

// ---------------- AVALIAÇÃO / CONTESTAÇÃO (RF-08/09 · BR-06) ----------------

export function podeContestar(e: Encomenda): boolean {
  const registrada = new Date(e.created_at).getTime();
  return Date.now() - registrada <= CONTESTACAO_PRAZO_MS; // BR-06: 48h
}

export function avaliar(input: {
  encomendaId: string;
  deId: string;
  paraId: string;
  nota: number;
  comentario: string;
}) {
  const db = loadDB();
  if (input.nota < 1 || input.nota > 5)
    throw new RegraError("Nota deve ser de 1 a 5.");
  db.avaliacoes.push({
    id: newId("avl"),
    encomenda_id: input.encomendaId,
    de_id: input.deId,
    para_id: input.paraId,
    nota: input.nota,
    comentario: input.comentario.trim() || null,
    created_at: nowIso(),
  });
  saveDB(db);
}

export function abrirContestacao(input: { encomendaId: string; motivo: string }) {
  const db = loadDB();
  const e = db.encomendas.find((x) => x.id === input.encomendaId);
  if (!e) throw new RegraError("Encomenda não encontrada.");
  if (!podeContestar(e))
    throw new RegraError("Prazo de contestação (48h) expirado (BR-06).");
  if (!input.motivo.trim()) throw new RegraError("Informe o motivo.");

  e.status = "contestada";
  db.contestacoes.push({
    id: newId("ctt"),
    encomenda_id: input.encomendaId,
    motivo: input.motivo.trim(),
    status: "aberta",
    created_at: nowIso(),
  });
  saveDB(db);
}

// ---------------- STORAGE (foto) ----------------

// Converte arquivo em data URL (substitui upload no bucket 'encomendas').
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler a foto."));
    reader.readAsDataURL(file);
  });
}

// ---------------- helpers ----------------

function nowIso(): string {
  return new Date().toISOString();
}

function gerarCodigo(): string {
  const n = loadDB().encomendas.length + 1;
  const base = (Date.now() % 1_000_000).toString(36).toUpperCase();
  return `ODC-${base}-${String(n).padStart(3, "0")}`;
}
