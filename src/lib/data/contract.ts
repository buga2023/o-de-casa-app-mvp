// Contrato da camada de dados — interface única com duas implementações:
// `local` (localStorage, padrão) e `supabase` (@supabase/ssr + RLS).
// Selecionada por NEXT_PUBLIC_DATA_DRIVER em src/lib/data/index.ts.

import type {
  Profile,
  Vinculo,
  Encomenda,
  Notificacao,
  EventoTimeline,
} from "../types";
import type { SignUpInput, RegistrarInput } from "../api";

export interface DataAPI {
  driver: "local" | "supabase";
  // Login demo e reset só existem no driver local (a UI esconde quando false).
  supportsDemo: boolean;

  // auth / perfil (RF-01)
  getCurrentUser(): Promise<Profile | null>;
  // slug: "demo-ana" | "demo-bruno" | "demo-carla" (ver lib/seed.ts)
  loginDemo(slug: string): Promise<void>;
  // perfis demo disponíveis (vazio quando o demo está desligado)
  getDemoProfiles(): Promise<{ slug: string; profile: Profile }[]>;
  logout(): Promise<void>;
  signUp(input: SignUpInput): Promise<Profile>;
  verificarPerfil(userId: string): Promise<Profile>;

  // perfis
  getProfile(id: string): Promise<Profile | null>;
  getProfilesMap(ids: string[]): Promise<Record<string, Profile>>;
  searchProfiles(query: string, excludeId?: string): Promise<Profile[]>;

  // vínculos (RF-02/03)
  getVizinhosAtivos(moradorId: string): Promise<Profile[]>;
  countVizinhosAtivos(moradorId: string): Promise<number>;
  listConvitesPendentes(vizinhoId: string): Promise<Vinculo[]>;
  convidarVizinho(moradorId: string, vizinhoId: string): Promise<Vinculo>;
  responderConvite(vinculoId: string, aceitar: boolean): Promise<Vinculo>;

  // encomendas (RF-04/06/07)
  getDestinatariosDisponiveis(recebedorId: string): Promise<Profile[]>;
  registrarEncomenda(input: RegistrarInput): Promise<Encomenda>;
  listEncomendasAReceber(userId: string): Promise<Encomenda[]>;
  listEncomendasRegistradas(userId: string): Promise<Encomenda[]>;
  getEncomenda(id: string): Promise<Encomenda | null>;
  darBaixa(encomendaId: string, userId: string): Promise<Encomenda>;

  // notificações (RF-05)
  listNotificacoes(userId: string): Promise<Notificacao[]>;
  countNaoLidas(userId: string): Promise<number>;
  marcarLida(notifId: string): Promise<void>;
  marcarTodasLidas(userId: string): Promise<void>;

  // avaliação / contestação (RF-08/09)
  avaliar(input: {
    encomendaId: string;
    deId: string;
    paraId: string;
    nota: number;
    comentario: string;
  }): Promise<void>;
  jaAvaliou(encomendaId: string, deId: string): Promise<boolean>;
  abrirContestacao(input: { encomendaId: string; motivo: string }): Promise<void>;
  getTimeline(encomendaId: string): Promise<EventoTimeline[]>;

  // storage (foto, BR-03) — comprime e retorna URL persistível
  uploadFoto(file: File): Promise<string>;

  // realtime — notifica quando qualquer dado relevante muda
  subscribe(cb: () => void): () => void;

  // demo (apenas driver local)
  resetDemo(): Promise<void>;
}
