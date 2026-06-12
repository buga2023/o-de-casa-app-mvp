/**
 * tests/sad-paths.spec.ts — Caminhos-tristes (P1.6):
 * convite recusado, limite BR-05, contestação dentro/fora do prazo,
 * busca sem resultado e cadastro inválido.
 * Rodar: npm run test:smoke
 */
import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";

const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

async function entrarComoDemoLimpo(page: Page) {
  await page.goto(BASE);
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(BASE);
  await page.getByRole("button", { name: /entrar como demo/i }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
}

async function trocarPara(page: Page, primeiroNome: string) {
  await page.getByRole("link", { name: "Perfil" }).click();
  await page.getByRole("button", { name: primeiroNome, exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /suas encomendas/i })
  ).toBeVisible();
}

async function convidarCarla(page: Page) {
  await page.getByRole("link", { name: "Vizinhos" }).click();
  await page.getByLabel("Convidar um vizinho").fill("Carla");
  await page.getByRole("button", { name: /convidar/i }).click();
  await expect(page.getByText(/convite enviado/i)).toBeVisible();
}

test("convite recusado não cria vínculo ativo (BR-02)", async ({ page }) => {
  await entrarComoDemoLimpo(page); // Ana
  await convidarCarla(page);

  await trocarPara(page, "Carla");
  await page.getByRole("link", { name: "Vizinhos" }).click();
  await page
    .getByRole("button", { name: /recusar convite de ana/i })
    .click();
  await expect(page.getByText(/convite recusado/i)).toBeVisible();

  // De volta como Ana: Carla não entra nos ativos (segue 1/2 do seed)
  await trocarPara(page, "Ana");
  await page.getByRole("link", { name: "Vizinhos" }).click();
  await expect(page.getByText("1/2 (plano grátis)")).toBeVisible();
});

test("limite de vizinhos bloqueia novos convites (BR-05)", async ({ page }) => {
  await entrarComoDemoLimpo(page); // Ana (Bruno já ativo no seed)
  await convidarCarla(page);

  await trocarPara(page, "Carla");
  await page.getByRole("link", { name: "Vizinhos" }).click();
  await page.getByRole("button", { name: /aceitar convite de ana/i }).click();
  await expect(page.getByText(/vínculo ativado/i)).toBeVisible();

  await trocarPara(page, "Ana");
  await page.getByRole("link", { name: "Vizinhos" }).click();
  await expect(page.getByText("2/2 (plano grátis)")).toBeVisible();
  await expect(page.getByText(/atingiu o limite/i)).toBeVisible();
  await expect(page.getByLabel("Convidar um vizinho")).toBeDisabled();
});

test("contestação dentro do prazo muda o status (BR-06)", async ({ page }) => {
  await entrarComoDemoLimpo(page); // Ana registra para Bruno
  await page.getByRole("link", { name: "Registrar" }).click();
  await page.getByLabel("Foto da encomenda", { exact: true }).setInputFiles({
    name: "encomenda.png",
    mimeType: "image/png",
    buffer: PNG_1x1,
  });
  await page.getByText("Bruno Lima").click();
  await page.getByRole("button", { name: /registrar encomenda/i }).click();
  await expect(
    page.getByRole("heading", { name: /comprovante/i })
  ).toBeVisible();

  // Bruno conteste pela notificação
  await trocarPara(page, "Bruno");
  await page.getByRole("link", { name: "Notificações" }).click();
  await page.getByText(/nova encomenda registrada/i).click();
  await page
    .getByRole("button", { name: /abrir contestação/i })
    .click();
  await page
    .getByLabel(/motivo da contestação/i)
    .fill("A caixa chegou violada.");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByText(/contestação registrada/i)).toBeVisible();
  await expect(page.getByText("Contestada").first()).toBeVisible();
});

test("contestação fora do prazo é bloqueada (BR-06)", async ({ page }) => {
  // Semeia uma encomenda registrada há 3 dias e sessão como Bruno
  const tresDiasAtras = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const t0 = "2026-06-01T12:00:00.000Z";
  const db = {
    profiles: [
      perfil("demo-ana", "Ana Souza", t0),
      perfil("demo-bruno", "Bruno Lima", t0),
    ],
    vinculos: [
      { id: "vin-ana-bruno", morador_id: "demo-ana", vizinho_id: "demo-bruno", status: "ativo", created_at: t0 },
      { id: "vin-bruno-ana", morador_id: "demo-bruno", vizinho_id: "demo-ana", status: "ativo", created_at: t0 },
    ],
    encomendas: [
      {
        id: "enc-velha",
        destinatario_id: "demo-bruno",
        recebedor_id: "demo-ana",
        descricao: "Caixa antiga",
        foto_url:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        codigo_comprovante: "ODC-TEST-VELH",
        status: "registrada",
        created_at: tresDiasAtras,
        retirada_at: null,
      },
    ],
    notificacoes: [],
    avaliacoes: [],
    contestacoes: [],
  };

  await page.addInitScript(
    ({ db, session }) => {
      window.localStorage.setItem("odecasa.db.v1", JSON.stringify(db));
      window.localStorage.setItem("odecasa.session.v1", session);
    },
    { db, session: "demo-bruno" }
  );
  await page.goto(`${BASE}/comprovante/enc-velha`);

  await expect(
    page.getByText(/prazo de contestação \(48h\) encerrado/i)
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /abrir contestação/i })
  ).toHaveCount(0);
});

test("busca sem resultado mostra estado vazio", async ({ page }) => {
  await entrarComoDemoLimpo(page); // Ana
  await page.getByRole("link", { name: "Registrar" }).click();
  await page.getByLabel("Foto da encomenda", { exact: true }).setInputFiles({
    name: "encomenda.png",
    mimeType: "image/png",
    buffer: PNG_1x1,
  });
  await page.getByText("Bruno Lima").click();
  await page.getByRole("button", { name: /registrar encomenda/i }).click();
  await expect(
    page.getByRole("heading", { name: /comprovante/i })
  ).toBeVisible();

  await page.getByRole("link", { name: "Início" }).click();
  await page.getByRole("button", { name: /registradas/i }).click();
  await page.getByLabel("Buscar encomenda").fill("zzz-nada");
  await expect(page.getByText(/nada encontrado/i)).toBeVisible();
});

test("cadastro com dados inválidos mostra erro por campo e não cria conta", async ({
  page,
}) => {
  await page.goto(`${BASE}/cadastro`);
  await page.getByLabel(/nome completo/i).fill("A");
  await page.getByLabel(/celular/i).fill("123");
  await page.getByLabel(/^cep/i).fill("1");
  await page.getByRole("button", { name: /continuar/i }).click();

  await expect(page.getByText(/informe seu nome completo/i)).toBeVisible();
  await expect(page.getByText(/celular no formato/i)).toBeVisible();
  await expect(page.getByText(/cep no formato/i)).toBeVisible();
  await expect(page.getByText(/informe rua e número/i)).toBeVisible();
  // segue na tela de cadastro (não avançou para verificação)
  await expect(
    page.getByRole("heading", { name: /criar conta/i })
  ).toBeVisible();
});

function perfil(id: string, nome: string, created_at: string) {
  return {
    id,
    nome,
    telefone: "71 99999-0000",
    endereco: "Rua das Mangueiras, 12",
    condominio: "Edifício Iemanjá",
    cep: "40140-000",
    verificado: true,
    reputacao: 5,
    bloqueado: false,
    created_at,
  };
}
