// Captura as telas principais do app em modo demo (salva em entrega/telas).
// Requer o dev server rodando (npm run dev) em http://localhost:3000.
// Rodar: node scripts/capturar-telas.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const DIR = path.resolve("entrega", "telas");
mkdirSync(DIR, { recursive: true });

// "Foto" da encomenda: ilustração SVG de caixa (offline, sem dependências)
const FOTO_SVG = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450">
    <rect width="600" height="450" fill="#E8D8C3"/>
    <rect x="150" y="120" width="300" height="220" rx="10" fill="#B07B4F"/>
    <rect x="150" y="120" width="300" height="50" fill="#9A6A42"/>
    <rect x="285" y="120" width="30" height="220" fill="#8A5E3A"/>
    <text x="300" y="395" font-family="sans-serif" font-size="26" fill="#6B4E36" text-anchor="middle">Caixa média — frágil</text>
  </svg>`
);

// Print do tamanho do viewport (como a tela de um celular). fullPage cria
// artefatos com header/nav sticky.
async function shot(page, nome) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400); // fontes/transições
  await page.screenshot({ path: path.join(DIR, nome) });
  console.log("✓", nome);
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 2,
});

// estado limpo
await page.goto(BASE);
await page.evaluate(() => window.localStorage.clear());

// 01 — Cadastro (preenchido, mostra máscaras)
await page.goto(`${BASE}/cadastro`);
await page.getByLabel(/nome completo/i).fill("Marina Castro");
await page.getByLabel(/celular/i).fill("71987654321");
await page.getByLabel(/endereço/i).fill("Rua das Mangueiras, 12");
await page.getByLabel(/^cep/i).fill("40140000");
await page.getByLabel(/condomínio/i).fill("Edifício Iemanjá");
await shot(page, "01-cadastro.png");

// entra como demo (Ana)
await page.goto(BASE);
await page.getByRole("button", { name: /entrar como demo/i }).click();
await page.getByRole("heading", { name: /suas encomendas/i }).waitFor();

// 02 — Convidar vizinho (busca com resultado)
await page.getByRole("link", { name: "Vizinhos" }).click();
await page.getByLabel("Convidar um vizinho").fill("Carla");
await page.getByRole("button", { name: /convidar/i }).waitFor();
await shot(page, "02-convidar-vizinho.png");

// 04 — Registrar com foto (preview + destinatário selecionado)
await page.getByRole("link", { name: "Registrar" }).click();
await page.getByLabel("Foto da encomenda", { exact: true }).setInputFiles({
  name: "caixa.svg",
  mimeType: "image/svg+xml",
  buffer: FOTO_SVG,
});
await page.getByAltText(/pré-visualização/i).waitFor();
await page.getByText("Bruno Lima").click();
await page
  .getByLabel(/descrição/i)
  .fill("Caixa média da Amazon, frágil");
await shot(page, "04-registrar-foto.png");

// registra → 06 Comprovante (com QR Code aberto)
await page.getByRole("button", { name: /registrar encomenda/i }).click();
await page.getByRole("heading", { name: /comprovante/i }).waitFor();
await page.getByRole("button", { name: /mostrar qr code/i }).click();
await page.getByAltText(/qr code do comprovante/i).waitFor();
await page.waitForTimeout(3400); // toast de sucesso some antes do print
await shot(page, "06-comprovante.png");

// 03 — Início (aba Registradas com a encomenda)
await page.getByRole("link", { name: "Início" }).click();
await page.getByRole("button", { name: /registradas/i }).click();
await page.getByText(/caixa média da amazon/i).first().waitFor();
await shot(page, "03-inicio.png");

// troca para Bruno (destinatário)
await page.getByRole("link", { name: "Perfil" }).click();
await page.getByRole("button", { name: "Bruno", exact: true }).click();
await page.getByRole("heading", { name: /suas encomendas/i }).waitFor();

// 05 — Notificações (não lida)
await page.getByRole("link", { name: "Notificações" }).click();
await page.getByText(/nova encomenda registrada/i).waitFor();
await shot(page, "05-notificacoes.png");

// abre o comprovante e dá baixa → 07 Retirada
await page.getByText(/nova encomenda registrada/i).click();
await page.getByRole("heading", { name: /comprovante/i }).waitFor();
await page.getByRole("button", { name: /dar baixa/i }).click();
await page.getByText("Retirada").first().waitFor();
await shot(page, "07-retirada-baixa.png");

// 08 — Avaliação (form preenchido)
await page.getByText(/avaliar ana/i).waitFor();
await page.getByLabel(/comentário da avaliação/i).fill("Tudo certo, caixa intacta. Obrigado, vizinha!");
await page.getByText(/avaliar ana/i).scrollIntoViewIfNeeded();
await page.waitForTimeout(3400); // toast da baixa some antes do print
await shot(page, "08-avaliacao.png");

await browser.close();
console.log(`\nTelas salvas em ${DIR}`);
