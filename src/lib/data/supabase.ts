// Driver Supabase — mesma interface do driver local, falando com Postgres + RLS
// (db/schema.sql). Auth anônima no cadastro; reputação e anti-abuso têm reforço
// por trigger no banco (ver schema). Requer:
//   NEXT_PUBLIC_DATA_DRIVER=supabase
//   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
//   Sign-in anônimo habilitado no painel (Authentication → Providers).
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DataAPI } from "./contract";
import type {
  Profile,
  Vinculo,
  Encomenda,
  Notificacao,
  Avaliacao,
  Contestacao,
} from "../types";
import { MAX_VIZINHOS_PLANO_GRATIS, CONTESTACAO_PRAZO_MS } from "../types";
import { RegraError } from "../errors";
import { now, nowIso } from "../datetime";
import { montarTimeline } from "../timeline";
import { gerarCodigoAleatorio } from "../codigo";
import { comprimirFoto } from "../image";

let _sb: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (_sb) return _sb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new RegraError(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  _sb = createBrowserClient(url, key);
  return _sb;
}

// Postgres: violação de unicidade
const UNIQUE_VIOLATION = "23505";

function check(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

async function fetchProfile(id: string): Promise<Profile | null> {
  const { data, error } = await sb()
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  check(error);
  return (data as Profile) ?? null;
}

// Contas demo no Supabase (criadas por scripts/seed-supabase-demo.mjs).
// O telefone fixo identifica cada perfil demo; a senha vem de
// NEXT_PUBLIC_DEMO_PASSWORD (sem ela, o demo fica desligado).
const DEMO_CONTAS: Record<string, { email: string; telefone: string }> = {
  "demo-ana": { email: "ana.demo@odecasa.app", telefone: "71 99999-0001" },
  "demo-bruno": { email: "bruno.demo@odecasa.app", telefone: "71 99999-0002" },
  "demo-carla": { email: "carla.demo@odecasa.app", telefone: "71 99999-0003" },
};
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

export const supabaseDriver: DataAPI = {
  driver: "supabase",
  supportsDemo: Boolean(DEMO_PASSWORD),

  async getCurrentUser() {
    const { data } = await sb().auth.getUser();
    if (!data.user) return null;
    return fetchProfile(data.user.id);
  },

  async loginDemo(slug) {
    const conta = DEMO_CONTAS[slug];
    if (!conta || !DEMO_PASSWORD)
      throw new RegraError("Login demo não está habilitado neste ambiente.");
    const { error } = await sb().auth.signInWithPassword({
      email: conta.email,
      password: DEMO_PASSWORD,
    });
    if (error)
      throw new RegraError(
        "Conta demo indisponível. Rode scripts/seed-supabase-demo.mjs."
      );
  },

  async getDemoProfiles() {
    if (!DEMO_PASSWORD) return [];
    const telefones = Object.values(DEMO_CONTAS).map((c) => c.telefone);
    const { data, error } = await sb()
      .from("profiles")
      .select("*")
      .in("telefone", telefones);
    check(error);
    const porTelefone = new Map(
      (data as Profile[]).map((p) => [p.telefone, p])
    );
    return Object.entries(DEMO_CONTAS).flatMap(([slug, conta]) => {
      const profile = porTelefone.get(conta.telefone);
      return profile ? [{ slug, profile }] : [];
    });
  },

  async logout() {
    const { error } = await sb().auth.signOut();
    check(error);
  },

  async signUp(input) {
    const { data: auth, error: authError } = await sb().auth.signInAnonymously();
    if (authError || !auth.user)
      throw new RegraError(
        "Não foi possível criar a sessão. Habilite o sign-in anônimo no Supabase."
      );
    const profile = {
      id: auth.user.id,
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
    const { data, error } = await sb()
      .from("profiles")
      .insert(profile)
      .select()
      .single();
    check(error);
    return data as Profile;
  },

  async verificarPerfil(userId) {
    const { data, error } = await sb()
      .from("profiles")
      .update({ verificado: true })
      .eq("id", userId)
      .select()
      .single();
    check(error);
    return data as Profile;
  },

  getProfile: fetchProfile,

  async getProfilesMap(ids) {
    if (ids.length === 0) return {};
    const { data, error } = await sb().from("profiles").select("*").in("id", ids);
    check(error);
    const map: Record<string, Profile> = {};
    (data as Profile[]).forEach((p) => (map[p.id] = p));
    return map;
  },

  async searchProfiles(query, excludeId) {
    const q = query.trim().replace(/[,()]/g, " ").trim();
    if (!q) return [];
    let req = sb()
      .from("profiles")
      .select("*")
      .or(`nome.ilike.%${q}%,telefone.ilike.%${q}%`)
      .limit(20);
    if (excludeId) req = req.neq("id", excludeId);
    const { data, error } = await req;
    check(error);
    return data as Profile[];
  },

  async getVizinhosAtivos(moradorId) {
    const { data, error } = await sb()
      .from("vinculos")
      .select("vizinho_id")
      .eq("morador_id", moradorId)
      .eq("status", "ativo");
    check(error);
    const ids = (data as { vizinho_id: string }[]).map((v) => v.vizinho_id);
    const map = await supabaseDriver.getProfilesMap(ids);
    return ids.map((id) => map[id]).filter(Boolean);
  },

  async countVizinhosAtivos(moradorId) {
    const { count, error } = await sb()
      .from("vinculos")
      .select("id", { count: "exact", head: true })
      .eq("morador_id", moradorId)
      .eq("status", "ativo");
    check(error);
    return count ?? 0;
  },

  async listConvitesPendentes(vizinhoId) {
    const { data, error } = await sb()
      .from("vinculos")
      .select("*")
      .eq("vizinho_id", vizinhoId)
      .eq("status", "pendente");
    check(error);
    return data as Vinculo[];
  },

  async convidarVizinho(moradorId, vizinhoId) {
    if (moradorId === vizinhoId)
      throw new RegraError("Você não pode convidar a si mesmo.");
    const [morador, vizinho] = await Promise.all([
      fetchProfile(moradorId),
      fetchProfile(vizinhoId),
    ]);
    if (!morador || !vizinho) throw new RegraError("Usuário não encontrado.");
    if (!morador.verificado || !vizinho.verificado)
      throw new RegraError("Ambos precisam estar verificados (BR-01).");
    if (vizinho.bloqueado)
      throw new RegraError("Este vizinho está bloqueado (BR-09).");
    if ((await supabaseDriver.countVizinhosAtivos(moradorId)) >= MAX_VIZINHOS_PLANO_GRATIS)
      throw new RegraError(
        `Plano grátis permite até ${MAX_VIZINHOS_PLANO_GRATIS} vizinhos ativos (BR-05).`
      );

    // já existe? recusado pode ser reconvidado
    const { data: existente, error: exErr } = await sb()
      .from("vinculos")
      .select("*")
      .eq("morador_id", moradorId)
      .eq("vizinho_id", vizinhoId)
      .maybeSingle();
    check(exErr);
    if (existente) {
      const v = existente as Vinculo;
      if (v.status !== "recusado")
        throw new RegraError("Já existe um convite para este vizinho.");
      const { data, error } = await sb()
        .from("vinculos")
        .update({ status: "pendente", created_at: nowIso() })
        .eq("id", v.id)
        .select()
        .single();
      check(error);
      return data as Vinculo;
    }

    const { data, error } = await sb()
      .from("vinculos")
      .insert({ morador_id: moradorId, vizinho_id: vizinhoId, status: "pendente" })
      .select()
      .single();
    check(error);
    return data as Vinculo;
  },

  async responderConvite(vinculoId, aceitar) {
    const { data: vData, error: vErr } = await sb()
      .from("vinculos")
      .select("*")
      .eq("id", vinculoId)
      .maybeSingle();
    check(vErr);
    const v = vData as Vinculo | null;
    if (!v) throw new RegraError("Convite não encontrado.");
    if (v.status !== "pendente")
      throw new RegraError("Este convite já foi respondido.");
    if (
      aceitar &&
      (await supabaseDriver.countVizinhosAtivos(v.morador_id)) >= MAX_VIZINHOS_PLANO_GRATIS
    )
      throw new RegraError(
        `O morador já atingiu o limite de ${MAX_VIZINHOS_PLANO_GRATIS} vizinhos (BR-05).`
      );
    const { data, error } = await sb()
      .from("vinculos")
      .update({ status: aceitar ? "ativo" : "recusado" })
      .eq("id", vinculoId)
      .select()
      .single();
    check(error);
    return data as Vinculo;
  },

  async getDestinatariosDisponiveis(recebedorId) {
    const { data, error } = await sb()
      .from("vinculos")
      .select("morador_id")
      .eq("vizinho_id", recebedorId)
      .eq("status", "ativo");
    check(error);
    const ids = (data as { morador_id: string }[]).map((v) => v.morador_id);
    const map = await supabaseDriver.getProfilesMap(ids);
    return ids.map((id) => map[id]).filter((p) => p && !p.bloqueado); // BR-09
  },

  async registrarEncomenda(input) {
    if (!input.fotoUrl) throw new RegraError("Foto é obrigatória (BR-03).");
    const [recebedor, destinatario] = await Promise.all([
      fetchProfile(input.recebedorId),
      fetchProfile(input.destinatarioId),
    ]);
    if (!recebedor || !destinatario)
      throw new RegraError("Usuário não encontrado.");
    if (destinatario.bloqueado)
      throw new RegraError("Destinatário bloqueado (BR-09).");

    const { data: vinculo, error: vErr } = await sb()
      .from("vinculos")
      .select("id")
      .eq("morador_id", input.destinatarioId)
      .eq("vizinho_id", input.recebedorId)
      .eq("status", "ativo")
      .maybeSingle();
    check(vErr);
    if (!vinculo)
      throw new RegraError("Este destinatário não autorizou você a receber.");

    // codigo é unique no banco — em colisão (raríssimo) tenta de novo
    let encomenda: Encomenda | null = null;
    for (let tentativa = 0; tentativa < 3 && !encomenda; tentativa++) {
      const { data, error } = await sb()
        .from("encomendas")
        .insert({
          destinatario_id: input.destinatarioId,
          recebedor_id: input.recebedorId,
          descricao: input.descricao.trim() || null,
          foto_url: input.fotoUrl,
          codigo_comprovante: gerarCodigoAleatorio(),
          status: "registrada",
        })
        .select()
        .single();
      if (error) {
        if ((error as { code?: string }).code === UNIQUE_VIOLATION) continue;
        throw new Error(error.message);
      }
      encomenda = data as Encomenda;
    }
    if (!encomenda) throw new Error("Falha ao gerar código único.");

    // BR-04: notificação imediata ao destinatário
    const { error: nErr } = await sb().from("notificacoes").insert({
      user_id: input.destinatarioId,
      encomenda_id: encomenda.id,
      titulo: "Nova encomenda registrada",
      corpo: `${recebedor.nome} recebeu uma encomenda para você. Código ${encomenda.codigo_comprovante}.`,
    });
    check(nErr);
    return encomenda;
  },

  async listEncomendasAReceber(userId) {
    const { data, error } = await sb()
      .from("encomendas")
      .select("*")
      .eq("destinatario_id", userId)
      .order("created_at", { ascending: false });
    check(error);
    return data as Encomenda[];
  },

  async listEncomendasRegistradas(userId) {
    const { data, error } = await sb()
      .from("encomendas")
      .select("*")
      .eq("recebedor_id", userId)
      .order("created_at", { ascending: false });
    check(error);
    return data as Encomenda[];
  },

  async getEncomenda(id) {
    const { data, error } = await sb()
      .from("encomendas")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    check(error);
    return (data as Encomenda) ?? null;
  },

  async darBaixa(encomendaId, userId) {
    const e = await supabaseDriver.getEncomenda(encomendaId);
    if (!e) throw new RegraError("Encomenda não encontrada.");
    if (e.destinatario_id !== userId)
      throw new RegraError("Só o destinatário pode dar baixa.");
    if (e.status === "retirada")
      throw new RegraError("Esta encomenda já foi retirada.");

    const { data, error } = await sb()
      .from("encomendas")
      .update({ status: "retirada", retirada_at: nowIso() })
      .eq("id", encomendaId)
      .select()
      .single();
    check(error);

    const destinatario = await fetchProfile(e.destinatario_id);
    const { error: nErr } = await sb().from("notificacoes").insert({
      user_id: e.recebedor_id,
      encomenda_id: e.id,
      titulo: "Encomenda retirada",
      corpo: `${destinatario?.nome ?? "O destinatário"} deu baixa na encomenda ${e.codigo_comprovante}.`,
    });
    check(nErr);
    return data as Encomenda;
  },

  async listNotificacoes(userId) {
    const { data, error } = await sb()
      .from("notificacoes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    check(error);
    return data as Notificacao[];
  },

  async countNaoLidas(userId) {
    const { count, error } = await sb()
      .from("notificacoes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("lida", false);
    check(error);
    return count ?? 0;
  },

  async marcarLida(notifId) {
    const { error } = await sb()
      .from("notificacoes")
      .update({ lida: true })
      .eq("id", notifId);
    check(error);
  },

  async marcarTodasLidas(userId) {
    const { error } = await sb()
      .from("notificacoes")
      .update({ lida: true })
      .eq("user_id", userId)
      .eq("lida", false);
    check(error);
  },

  async avaliar(input) {
    if (input.nota < 1 || input.nota > 5)
      throw new RegraError("Nota deve ser de 1 a 5.");
    // reputação média + bloqueio (BR-09) recalculados por trigger no banco
    const { error } = await sb().from("avaliacoes").insert({
      encomenda_id: input.encomendaId,
      de_id: input.deId,
      para_id: input.paraId,
      nota: input.nota,
      comentario: input.comentario.trim() || null,
    });
    if (error) {
      if ((error as { code?: string }).code === UNIQUE_VIOLATION)
        throw new RegraError("Você já avaliou esta encomenda.");
      throw new Error(error.message);
    }
  },

  async jaAvaliou(encomendaId, deId) {
    const { count, error } = await sb()
      .from("avaliacoes")
      .select("id", { count: "exact", head: true })
      .eq("encomenda_id", encomendaId)
      .eq("de_id", deId);
    check(error);
    return (count ?? 0) > 0;
  },

  async abrirContestacao(input) {
    if (!input.motivo.trim()) throw new RegraError("Informe o motivo.");
    const e = await supabaseDriver.getEncomenda(input.encomendaId);
    if (!e) throw new RegraError("Encomenda não encontrada.");
    if (now() - new Date(e.created_at).getTime() > CONTESTACAO_PRAZO_MS)
      throw new RegraError("Prazo de contestação (48h) expirado (BR-06).");

    const { error: cErr } = await sb().from("contestacoes").insert({
      encomenda_id: input.encomendaId,
      motivo: input.motivo.trim(),
      status: "aberta",
    });
    check(cErr);
    const { error: eErr } = await sb()
      .from("encomendas")
      .update({ status: "contestada" })
      .eq("id", input.encomendaId);
    check(eErr);
  },

  async getTimeline(encomendaId) {
    const e = await supabaseDriver.getEncomenda(encomendaId);
    if (!e) return [];
    const [notif, aval, cont] = await Promise.all([
      // RLS: só o dono vê a notificação; para o recebedor o evento pode faltar
      sb().from("notificacoes").select("*").eq("encomenda_id", encomendaId),
      sb().from("avaliacoes").select("*").eq("encomenda_id", encomendaId),
      sb().from("contestacoes").select("*").eq("encomenda_id", encomendaId),
    ]);
    check(notif.error);
    check(aval.error);
    check(cont.error);
    const avaliacoes = aval.data as Avaliacao[];
    const nomes = await supabaseDriver.getProfilesMap(avaliacoes.map((a) => a.de_id));
    return montarTimeline({
      encomenda: e,
      notificacoes: notif.data as Notificacao[],
      avaliacoes,
      contestacoes: cont.data as Contestacao[],
      nomePorId: (id) => nomes[id]?.nome,
    });
  },

  async uploadFoto(file) {
    const { data: auth } = await sb().auth.getUser();
    if (!auth.user) throw new RegraError("Faça login para enviar fotos.");
    const blob = await comprimirFoto(file);
    const path = `${auth.user.id}/${crypto.randomUUID()}.jpg`;
    const { error } = await sb()
      .storage.from("encomendas")
      .upload(path, blob, { contentType: "image/jpeg" });
    check(error);
    return sb().storage.from("encomendas").getPublicUrl(path).data.publicUrl;
  },

  subscribe(cb) {
    try {
      const channel = sb()
        .channel(`odecasa-${Math.abs(Date.now() % 1_000_000)}`)
        .on("postgres_changes", { event: "*", schema: "public" }, cb)
        .subscribe();
      const { data: authSub } = sb().auth.onAuthStateChange(cb);
      return () => {
        sb().removeChannel(channel);
        authSub.subscription.unsubscribe();
      };
    } catch {
      // sem config do Supabase, sem realtime — a UI segue funcionando
      return () => {};
    }
  },

  async resetDemo() {
    throw new RegraError("Reset de dados só existe no modo demo (driver local).");
  },
};
