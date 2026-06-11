// Seed demo — cria perfis verificados e um vínculo ativo, para o botão "Entrar como demo"
// percorrer o caminho-feliz (telas 1→7) sem cadastro. Idempotente: timestamps fixos.
import type { DBShape } from "./types";

export const DEMO_ANA = "demo-ana";
export const DEMO_BRUNO = "demo-bruno";
export const DEMO_CARLA = "demo-carla";

const T0 = "2026-06-01T12:00:00.000Z";

export function seedDB(): DBShape {
  return {
    profiles: [
      {
        id: DEMO_ANA,
        nome: "Ana Souza",
        telefone: "71 99999-0001",
        endereco: "Rua das Mangueiras, 12",
        condominio: "Edifício Iemanjá",
        cep: "40140-000",
        verificado: true,
        reputacao: 5,
        bloqueado: false,
        created_at: T0,
      },
      {
        id: DEMO_BRUNO,
        nome: "Bruno Lima",
        telefone: "71 99999-0002",
        endereco: "Rua das Mangueiras, 12",
        condominio: "Edifício Iemanjá",
        cep: "40140-000",
        verificado: true,
        reputacao: 5,
        bloqueado: false,
        created_at: T0,
      },
      {
        id: DEMO_CARLA,
        nome: "Carla Dias",
        telefone: "71 99999-0003",
        endereco: "Rua das Mangueiras, 12",
        condominio: "Edifício Iemanjá",
        cep: "40140-000",
        verificado: true,
        reputacao: 5,
        bloqueado: false,
        created_at: T0,
      },
    ],
    // vínculo mútuo ativo: cada um pode receber encomendas do outro
    vinculos: [
      {
        id: "vin-ana-bruno",
        morador_id: DEMO_ANA,
        vizinho_id: DEMO_BRUNO,
        status: "ativo",
        created_at: T0,
      },
      {
        id: "vin-bruno-ana",
        morador_id: DEMO_BRUNO,
        vizinho_id: DEMO_ANA,
        status: "ativo",
        created_at: T0,
      },
    ],
    encomendas: [],
    notificacoes: [],
    avaliacoes: [],
    contestacoes: [],
  };
}
