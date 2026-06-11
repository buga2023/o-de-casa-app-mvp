/**
 * tests/smoke.spec.ts — Caminho-feliz do Ô de Casa!
 * Setup:  npm i -D @playwright/test && npx playwright install chromium
 * Rodar:  npm run test:smoke
 */
import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";

// PNG 1x1 transparente — serve de "foto" para o upload obrigatório (BR-03).
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

// Começa cada teste num estado limpo (sem dados demo de execuções anteriores).
async function entrarComoDemoLimpo(page: Page) {
  await page.goto(BASE);
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto(BASE);
  await page.getByRole("button", { name: /entrar como demo/i }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
}

test("home carrega sem erro de console", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(BASE);
  await expect(page).toHaveTitle(/.+/);
  await page.waitForLoadState("networkidle");
  expect(errors, errors.join("\n")).toEqual([]);
});

test("modo demo entra e mostra a home do app", async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole("button", { name: /entrar como demo/i }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await expect(page.getByRole("heading", { name: /suas encomendas/i })).toBeVisible();
});

test("registrar encomenda exige foto (BR-03)", async ({ page }) => {
  await entrarComoDemoLimpo(page);
  await page.getByRole("link", { name: "Registrar" }).click();
  // sem foto, o botão de salvar deve estar desabilitado
  const salvar = page.getByRole("button", { name: /registrar encomenda/i });
  await expect(salvar).toBeDisabled();
});

test("caminho-feliz: registrar com foto -> notificar -> comprovante -> dar baixa", async ({
  page,
}) => {
  // ----- Como Ana: registra encomenda PARA Bruno com foto -----
  await entrarComoDemoLimpo(page);
  await page.getByRole("link", { name: "Registrar" }).click();

  // foto obrigatória
  await page.getByLabel("Foto da encomenda", { exact: true }).setInputFiles({
    name: "encomenda.png",
    mimeType: "image/png",
    buffer: PNG_1x1,
  });
  // escolhe destinatário (quem autorizou Ana a receber)
  await page.getByText("Bruno Lima").click();

  const salvar = page.getByRole("button", { name: /registrar encomenda/i });
  await expect(salvar).toBeEnabled();
  await salvar.click();

  // gera comprovante com código rastreável (RF-06)
  await expect(page.getByRole("heading", { name: /comprovante/i })).toBeVisible();
  await expect(page.getByText(/ODC-/)).toBeVisible();

  // ----- Troca para Bruno (destinatário) -----
  await page.getByRole("link", { name: "Perfil" }).click();
  await page.getByRole("button", { name: "Bruno" }).click();
  await expect(page.getByRole("heading", { name: /suas encomendas/i })).toBeVisible();

  // Notificação em tempo real (RF-05)
  await page.getByRole("link", { name: "Notificações" }).click();
  await expect(
    page.getByText(/nova encomenda registrada/i)
  ).toBeVisible();

  // Abre o comprovante pela notificação e dá baixa (RF-07)
  await page.getByText(/nova encomenda registrada/i).click();
  await expect(page.getByRole("heading", { name: /comprovante/i })).toBeVisible();
  await page.getByRole("button", { name: /dar baixa/i }).click();

  // status muda para "Retirada"
  await expect(page.getByText("Retirada").first()).toBeVisible();
});
