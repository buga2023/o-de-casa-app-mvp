// Driver local — delega para a lógica síncrona de api.ts (localStorage).
// As regras de negócio (BR-01..09) vivem em api.ts e valem para o modo demo.
"use client";

import type { DataAPI } from "./contract";
import * as api from "../api";
import { subscribe, resetDB } from "../store";
import { comprimirFoto, blobToDataUrl } from "../image";

export const localDriver: DataAPI = {
  driver: "local",
  supportsDemo: true,

  getCurrentUser: async () => api.getCurrentUser(),
  loginDemo: async (userId) => api.loginDemo(userId),
  logout: async () => api.logout(),
  signUp: async (input) => api.signUp(input),
  verificarPerfil: async (userId) => api.verificarPerfil(userId),

  getProfile: async (id) => api.getProfile(id),
  getProfilesMap: async (ids) => {
    const map: Record<string, import("../types").Profile> = {};
    for (const id of ids) {
      const p = api.getProfile(id);
      if (p) map[id] = p;
    }
    return map;
  },
  searchProfiles: async (query, excludeId) => api.searchProfiles(query, excludeId),

  getVizinhosAtivos: async (moradorId) => api.getVizinhosAtivos(moradorId),
  countVizinhosAtivos: async (moradorId) => api.countVizinhosAtivos(moradorId),
  listConvitesPendentes: async (vizinhoId) => api.listConvitesPendentes(vizinhoId),
  convidarVizinho: async (moradorId, vizinhoId) =>
    api.convidarVizinho(moradorId, vizinhoId),
  responderConvite: async (vinculoId, aceitar) =>
    api.responderConvite(vinculoId, aceitar),

  getDestinatariosDisponiveis: async (recebedorId) =>
    api.getDestinatariosDisponiveis(recebedorId),
  registrarEncomenda: async (input) => api.registrarEncomenda(input),
  listEncomendasAReceber: async (userId) => api.listEncomendasAReceber(userId),
  listEncomendasRegistradas: async (userId) =>
    api.listEncomendasRegistradas(userId),
  getEncomenda: async (id) => api.getEncomenda(id),
  darBaixa: async (encomendaId, userId) => api.darBaixa(encomendaId, userId),

  listNotificacoes: async (userId) => api.listNotificacoes(userId),
  countNaoLidas: async (userId) => api.countNaoLidas(userId),
  marcarLida: async (notifId) => api.marcarLida(notifId),
  marcarTodasLidas: async (userId) => api.marcarTodasLidas(userId),

  avaliar: async (input) => api.avaliar(input),
  jaAvaliou: async (encomendaId, deId) => api.jaAvaliou(encomendaId, deId),
  abrirContestacao: async (input) => api.abrirContestacao(input),
  getTimeline: async (encomendaId) => api.getTimeline(encomendaId),

  // No modo local a "URL" é um data URL comprimido (cabe no localStorage).
  uploadFoto: async (file) => blobToDataUrl(await comprimirFoto(file)),

  subscribe,
  resetDemo: async () => resetDB(),
};
