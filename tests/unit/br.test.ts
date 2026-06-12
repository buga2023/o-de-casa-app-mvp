/**
 * tests/unit/br.test.ts — Regras de negócio BR-01..09 direto sobre api.ts
 * (driver local). Cada regra tem caso positivo e negativo.
 * Rodar: npm run test:unit
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as api from "@/lib/api";
import { newId } from "@/lib/store";
import { DEMO_ANA, DEMO_BRUNO, DEMO_CARLA } from "@/lib/seed";
import {
  MAX_VIZINHOS_PLANO_GRATIS,
  LIMITE_CONVITES_POR_HORA,
  LIMITE_REGISTROS_POR_HORA,
} from "@/lib/types";
import { tryRegra } from "@/lib/errors";

const AGORA = new Date("2026-06-10T12:00:00.000Z");
const FOTO = "data:image/png;base64,abc";

function novoVerificado(nome: string) {
  const p = api.signUp({
    nome,
    telefone: "(71) 99999-0000",
    endereco: "Rua X, 1",
    condominio: "",
    cep: "40000-000",
  });
  return api.verificarPerfil(p.id);
}

function registrarDemo(recebedorId = DEMO_ANA, destinatarioId = DEMO_BRUNO) {
  return api.registrarEncomenda({
    recebedorId,
    destinatarioId,
    descricao: "Caixa",
    fotoUrl: FOTO,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(AGORA);
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("BR-01 — só verificados convidam/são convidados", () => {
  it("bloqueia convite para não verificado", () => {
    const novo = api.signUp({
      nome: "Não Verificado",
      telefone: "(71) 90000-0000",
      endereco: "Rua Y, 2",
      condominio: "",
      cep: "40000-000",
    });
    expect(() => api.convidarVizinho(DEMO_ANA, novo.id)).toThrow(/BR-01/);
  });

  it("permite convite entre verificados", () => {
    const carla = api.getProfile(DEMO_CARLA)!;
    expect(carla.verificado).toBe(true);
    const v = api.convidarVizinho(DEMO_ANA, DEMO_CARLA);
    expect(v.status).toBe("pendente");
  });

  it("não permite convidar a si mesmo", () => {
    expect(() => api.convidarVizinho(DEMO_ANA, DEMO_ANA)).toThrow(
      /si mesmo/
    );
  });
});

describe("BR-02 — vínculo ativo só após aceite", () => {
  it("convite nasce pendente e ativa no aceite", () => {
    const v = api.convidarVizinho(DEMO_ANA, DEMO_CARLA);
    expect(v.status).toBe("pendente");
    expect(api.getVizinhosAtivos(DEMO_ANA).map((p) => p.id)).not.toContain(
      DEMO_CARLA
    );
    const aceito = api.responderConvite(v.id, true);
    expect(aceito.status).toBe("ativo");
    expect(api.getVizinhosAtivos(DEMO_ANA).map((p) => p.id)).toContain(
      DEMO_CARLA
    );
  });

  it("recusa marca recusado e permite reconvite", () => {
    const v = api.convidarVizinho(DEMO_ANA, DEMO_CARLA);
    expect(api.responderConvite(v.id, false).status).toBe("recusado");
    // responder de novo falha
    expect(() => api.responderConvite(v.id, true)).toThrow(/já foi respondido/);
    // reconvite reabre como pendente
    expect(api.convidarVizinho(DEMO_ANA, DEMO_CARLA).status).toBe("pendente");
  });

  it("convite duplicado é bloqueado", () => {
    api.convidarVizinho(DEMO_ANA, DEMO_CARLA);
    expect(() => api.convidarVizinho(DEMO_ANA, DEMO_CARLA)).toThrow(
      /Já existe/
    );
  });
});

describe("BR-03 — foto obrigatória", () => {
  it("não registra sem foto", () => {
    expect(() =>
      api.registrarEncomenda({
        recebedorId: DEMO_ANA,
        destinatarioId: DEMO_BRUNO,
        descricao: "Caixa",
        fotoUrl: "",
      })
    ).toThrow(/BR-03/);
  });

  it("registra com foto", () => {
    const e = registrarDemo();
    expect(e.status).toBe("registrada");
    expect(e.foto_url).toBe(FOTO);
  });
});

describe("BR-04 — notificação imediata ao destinatário", () => {
  it("registrar cria notificação não lida para o destinatário", () => {
    const e = registrarDemo();
    const notifs = api.listNotificacoes(DEMO_BRUNO);
    expect(notifs).toHaveLength(1);
    expect(notifs[0].encomenda_id).toBe(e.id);
    expect(notifs[0].lida).toBe(false);
    expect(api.countNaoLidas(DEMO_BRUNO)).toBe(1);
  });
});

describe("BR-05 — máx. 2 vizinhos ativos no plano grátis", () => {
  it("bloqueia convite acima do limite de ativos", () => {
    // Ana já tem Bruno ativo (seed). Ativa Carla → 2/2.
    const v = api.convidarVizinho(DEMO_ANA, DEMO_CARLA);
    api.responderConvite(v.id, true);
    expect(api.countVizinhosAtivos(DEMO_ANA)).toBe(MAX_VIZINHOS_PLANO_GRATIS);

    const extra = novoVerificado("Diego Extra");
    expect(() => api.convidarVizinho(DEMO_ANA, extra.id)).toThrow(/BR-05/);
  });

  it("re-checa o limite no momento do aceite", () => {
    // com 1 ativo, Ana convida 2 pendentes; o 2º aceite estoura
    const carla = api.convidarVizinho(DEMO_ANA, DEMO_CARLA);
    const diego = novoVerificado("Diego Extra");
    const vDiego = api.convidarVizinho(DEMO_ANA, diego.id);
    api.responderConvite(carla.id, true); // 2/2
    expect(() => api.responderConvite(vDiego.id, true)).toThrow(/BR-05/);
  });
});

describe("BR-06 — contestação em até 48h", () => {
  it("permite contestar dentro do prazo", () => {
    const e = registrarDemo();
    vi.setSystemTime(new Date(AGORA.getTime() + 47 * 60 * 60 * 1000));
    expect(api.podeContestar(api.getEncomenda(e.id)!)).toBe(true);
    api.abrirContestacao({ encomendaId: e.id, motivo: "Caixa violada" });
    expect(api.getEncomenda(e.id)!.status).toBe("contestada");
  });

  it("bloqueia contestação após 48h", () => {
    const e = registrarDemo();
    vi.setSystemTime(new Date(AGORA.getTime() + 49 * 60 * 60 * 1000));
    expect(api.podeContestar(api.getEncomenda(e.id)!)).toBe(false);
    expect(() =>
      api.abrirContestacao({ encomendaId: e.id, motivo: "Tarde demais" })
    ).toThrow(/BR-06/);
  });

  it("exige motivo", () => {
    const e = registrarDemo();
    expect(() =>
      api.abrirContestacao({ encomendaId: e.id, motivo: "   " })
    ).toThrow(/motivo/i);
  });
});

describe("BR-07 — baixa só pelo destinatário, uma vez", () => {
  it("destinatário dá baixa e recebedor é notificado", () => {
    const e = registrarDemo();
    const baixada = api.darBaixa(e.id, DEMO_BRUNO);
    expect(baixada.status).toBe("retirada");
    expect(baixada.retirada_at).not.toBeNull();
    expect(
      api.listNotificacoes(DEMO_ANA).some((n) => /retirada/i.test(n.titulo))
    ).toBe(true);
  });

  it("recebedor não pode dar baixa", () => {
    const e = registrarDemo();
    expect(() => api.darBaixa(e.id, DEMO_ANA)).toThrow(/destinatário/);
  });

  it("baixa dupla é bloqueada", () => {
    const e = registrarDemo();
    api.darBaixa(e.id, DEMO_BRUNO);
    expect(() => api.darBaixa(e.id, DEMO_BRUNO)).toThrow(/já foi retirada/);
  });
});

describe("BR-08 — avaliação (nota 1..5, uma por encomenda)", () => {
  it("rejeita nota fora de 1..5", () => {
    const e = registrarDemo();
    for (const nota of [0, 6]) {
      expect(() =>
        api.avaliar({
          encomendaId: e.id,
          deId: DEMO_BRUNO,
          paraId: DEMO_ANA,
          nota,
          comentario: "",
        })
      ).toThrow(/1 a 5/);
    }
  });

  it("bloqueia avaliação dupla do mesmo avaliador", () => {
    const e = registrarDemo();
    api.avaliar({
      encomendaId: e.id,
      deId: DEMO_BRUNO,
      paraId: DEMO_ANA,
      nota: 5,
      comentario: "",
    });
    expect(api.jaAvaliou(e.id, DEMO_BRUNO)).toBe(true);
    expect(() =>
      api.avaliar({
        encomendaId: e.id,
        deId: DEMO_BRUNO,
        paraId: DEMO_ANA,
        nota: 4,
        comentario: "",
      })
    ).toThrow(/já avaliou/i);
  });
});

describe("BR-09 — reputação real e bloqueio", () => {
  it("recalcula a média do avaliado", () => {
    const e1 = registrarDemo();
    api.avaliar({
      encomendaId: e1.id,
      deId: DEMO_BRUNO,
      paraId: DEMO_ANA,
      nota: 5,
      comentario: "",
    });
    expect(api.getProfile(DEMO_ANA)!.reputacao).toBe(5);

    const e2 = registrarDemo();
    api.avaliar({
      encomendaId: e2.id,
      deId: DEMO_BRUNO,
      paraId: DEMO_ANA,
      nota: 1,
      comentario: "",
    });
    expect(api.getProfile(DEMO_ANA)!.reputacao).toBe(3);
  });

  it("média abaixo de 2.5 bloqueia o avaliado", () => {
    for (let i = 0; i < 2; i++) {
      const e = registrarDemo();
      api.avaliar({
        encomendaId: e.id,
        deId: DEMO_BRUNO,
        paraId: DEMO_ANA,
        nota: 1,
        comentario: "",
      });
    }
    const ana = api.getProfile(DEMO_ANA)!;
    expect(ana.reputacao).toBe(1);
    expect(ana.bloqueado).toBe(true);
  });

  it("bloqueado não pode ser convidado nem ser destinatário", () => {
    // bloqueia Bruno na marra (estado direto, cenário de admin)
    for (let i = 0; i < 2; i++) {
      const e = registrarDemo(DEMO_BRUNO, DEMO_ANA); // Bruno recebe p/ Ana
      api.avaliar({
        encomendaId: e.id,
        deId: DEMO_ANA,
        paraId: DEMO_BRUNO,
        nota: 1,
        comentario: "",
      });
    }
    expect(api.getProfile(DEMO_BRUNO)!.bloqueado).toBe(true);
    expect(() => api.convidarVizinho(DEMO_ANA, DEMO_BRUNO)).toThrow(/BR-09/);
    expect(() => registrarDemo(DEMO_ANA, DEMO_BRUNO)).toThrow(/BR-09/);
    // e some da lista de destinatários disponíveis
    expect(
      api.getDestinatariosDisponiveis(DEMO_ANA).map((p) => p.id)
    ).not.toContain(DEMO_BRUNO);
  });
});

describe("anti-abuso — limites por hora", () => {
  it(`bloqueia o ${LIMITE_CONVITES_POR_HORA + 1}º convite na mesma hora`, () => {
    const alvos = Array.from({ length: LIMITE_CONVITES_POR_HORA + 1 }, (_, i) =>
      novoVerificado(`Vizinho ${i}`)
    );
    // convites pendentes não contam para BR-05 (só ativos)
    for (let i = 0; i < LIMITE_CONVITES_POR_HORA - 1; i++) {
      api.convidarVizinho(DEMO_CARLA, alvos[i].id); // Carla: 0 ativos
    }
    // seed: Carla sem convites prévios; o 10º passa, o 11º estoura
    api.convidarVizinho(DEMO_CARLA, alvos[LIMITE_CONVITES_POR_HORA - 1].id);
    expect(() =>
      api.convidarVizinho(DEMO_CARLA, alvos[LIMITE_CONVITES_POR_HORA].id)
    ).toThrow(/Limite de .* convites/);
  });

  it(`bloqueia o ${LIMITE_REGISTROS_POR_HORA + 1}º registro na mesma hora e libera depois`, () => {
    for (let i = 0; i < LIMITE_REGISTROS_POR_HORA; i++) registrarDemo();
    expect(() => registrarDemo()).toThrow(/Limite de .* registros/);
    // 61 minutos depois, libera
    vi.setSystemTime(new Date(AGORA.getTime() + 61 * 60 * 1000));
    expect(registrarDemo().status).toBe("registrada");
  });
});

describe("ids e código de comprovante", () => {
  it("newId gera ids únicos", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId("t")));
    expect(ids.size).toBe(1000);
  });

  it("código é legível (sem 0/O/1/I/L/U) e único", () => {
    const codigos = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const e = registrarDemo();
      expect(e.codigo_comprovante).toMatch(
        /^ODC-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}$/
      );
      codigos.add(e.codigo_comprovante);
    }
    expect(codigos.size).toBe(10);
  });
});

describe("busca de perfis", () => {
  it("query vazia não lista a base toda", () => {
    expect(api.searchProfiles("")).toEqual([]);
    expect(api.searchProfiles("   ")).toEqual([]);
  });

  it("limita resultados a 20", () => {
    for (let i = 0; i < 25; i++) novoVerificado(`Vizinho Repetido ${i}`);
    expect(api.searchProfiles("Vizinho Repetido")).toHaveLength(20);
  });
});

describe("timeline derivada", () => {
  it("ordena registrada → notificada → retirada → avaliada", () => {
    const e = registrarDemo();
    vi.setSystemTime(new Date(AGORA.getTime() + 60_000));
    api.darBaixa(e.id, DEMO_BRUNO);
    vi.setSystemTime(new Date(AGORA.getTime() + 120_000));
    api.avaliar({
      encomendaId: e.id,
      deId: DEMO_BRUNO,
      paraId: DEMO_ANA,
      nota: 5,
      comentario: "",
    });
    const tipos = api.getTimeline(e.id).map((ev) => ev.tipo);
    expect(tipos).toEqual(["registrada", "notificada", "retirada", "avaliada"]);
  });
});

describe("Result<T> opcional", () => {
  it("converte RegraError em { ok: false }", () => {
    const r = tryRegra(() => api.convidarVizinho(DEMO_ANA, DEMO_ANA));
    expect(r).toEqual({ ok: false, error: expect.stringMatching(/si mesmo/) });
    const ok = tryRegra(() => 42);
    expect(ok).toEqual({ ok: true, value: 42 });
  });
});
