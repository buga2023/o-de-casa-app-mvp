// Compressão de foto no cliente — uma foto de 4MB vira ~50KB antes de
// persistir (localStorage ou bucket). Reduz para no máx. 1024px e JPEG 0.6.
// O alvo pequeno é proposital: no modo demo a foto vai pro localStorage
// (cota ~5MB no mobile), então cada registro precisa ocupar pouco espaço.
"use client";

const MAX_DIM = 1024;
const QUALIDADE = 0.6;

export async function comprimirFoto(file: File): Promise<Blob> {
  // Fotos já bem pequenas passam direto (evita recomprimir ícones/prints leves).
  if (file.size <= 80 * 1024) return file;

  // Formatos que o navegador não decodifica (ex.: HEIC do iPhone) fazem
  // createImageBitmap rejeitar — nesse caso seguimos com o arquivo original
  // em vez de bloquear o registro (a foto não pode impedir o cadastro).
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const escala = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALIDADE)
  );
  return blob ?? file;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler a foto."));
    reader.readAsDataURL(blob);
  });
}
