// Item 8 da entrega — QR Code em PNG de alta resolução apontando para o app.
// Rodar: node scripts/gerar-qrcode.mjs https://sua-url.vercel.app
import QRCode from "qrcode";
import { mkdirSync } from "node:fs";
import path from "node:path";

const url = process.argv[2];
if (!url || !/^https?:\/\//.test(url)) {
  console.error("Uso: node scripts/gerar-qrcode.mjs <URL pública do app>");
  process.exit(1);
}

const destino = path.resolve("entrega", "qrcode.png");
mkdirSync(path.dirname(destino), { recursive: true });

await QRCode.toFile(destino, url, {
  width: 2048, // alta resolução para impressão
  margin: 2,
  errorCorrectionLevel: "H",
  color: { dark: "#2B2118", light: "#FFFFFF" },
});

console.log("✓ QR Code salvo em", destino);
console.log("URL codificada:", url);
