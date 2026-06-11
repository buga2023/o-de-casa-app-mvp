// Tipos do domínio — espelham db/schema.sql. NÃO inventar colunas.

export type VinculoStatus = "pendente" | "ativo" | "recusado";
export type EncomendaStatus = "registrada" | "retirada" | "contestada";
export type ContestacaoStatus = "aberta" | "resolvida";

export interface Profile {
  id: string;
  nome: string;
  telefone: string | null;
  endereco: string | null;
  condominio: string | null;
  cep: string | null;
  verificado: boolean;
  reputacao: number;
  bloqueado: boolean;
  created_at: string;
}

export interface Vinculo {
  id: string;
  morador_id: string;
  vizinho_id: string;
  status: VinculoStatus;
  created_at: string;
}

export interface Encomenda {
  id: string;
  destinatario_id: string;
  recebedor_id: string;
  descricao: string | null;
  foto_url: string; // BR-03: foto obrigatória
  codigo_comprovante: string;
  status: EncomendaStatus;
  created_at: string;
  retirada_at: string | null;
}

export interface Notificacao {
  id: string;
  user_id: string;
  encomenda_id: string | null;
  titulo: string;
  corpo: string | null;
  lida: boolean;
  created_at: string;
}

export interface Avaliacao {
  id: string;
  encomenda_id: string;
  de_id: string;
  para_id: string;
  nota: number; // 1..5
  comentario: string | null;
  created_at: string;
}

export interface Contestacao {
  id: string;
  encomenda_id: string;
  motivo: string;
  status: ContestacaoStatus;
  created_at: string;
}

export interface DBShape {
  profiles: Profile[];
  vinculos: Vinculo[];
  encomendas: Encomenda[];
  notificacoes: Notificacao[];
  avaliacoes: Avaliacao[];
  contestacoes: Contestacao[];
}

// Regras de negócio expostas como constantes (SPEC.md)
export const MAX_VIZINHOS_PLANO_GRATIS = 2; // BR-05
export const CONTESTACAO_PRAZO_MS = 48 * 60 * 60 * 1000; // BR-06
