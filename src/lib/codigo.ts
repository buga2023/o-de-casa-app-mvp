// Código de comprovante legível para ditar por telefone: alfabeto sem
// caracteres ambíguos (0/O, 1/I/L, U). Formato ODC-XXXX-XXXX.

export const ALFABETO_CODIGO = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export function gerarCodigoAleatorio(): string {
  let s = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    bytes.forEach((b) => (s += ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]));
  } else {
    for (let i = 0; i < 8; i++)
      s += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)];
  }
  return `ODC-${s.slice(0, 4)}-${s.slice(4)}`;
}
