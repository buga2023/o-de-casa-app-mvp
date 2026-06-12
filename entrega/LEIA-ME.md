# Entrega — Ô de Casa! (MVP no ar)

## Item 8 — MVP / QR Code
- **URL pública:** https://odecasa-sandy.vercel.app
- **QR Code:** `qrcode.png` (2048×2048, correção de erro H — pronto para impressão)
- **Como testar (banca):** escanear o QR → tocar em **"Entrar como demo"**.
  O app entra como *Ana Souza*; em **Perfil** dá para alternar entre Ana, Bruno
  e Carla e ver os dois lados do fluxo (registrar ↔ receber). Não precisa de
  login nem cadastro.

## Item 7 — Telas do aplicativo
Prints reais do app (viewport mobile 430px, 2x) em `telas/`:

| Arquivo | Tela |
|---|---|
| `01-cadastro.png` | Cadastro com validação e máscaras |
| `02-convidar-vizinho.png` | Busca e convite de vizinho |
| `03-inicio.png` | Início — lista de encomendas |
| `04-registrar-foto.png` | Registro com foto obrigatória (BR-03) |
| `05-notificacoes.png` | Notificação em tempo real (RF-05) |
| `06-comprovante.png` | Comprovante rastreável com QR e timeline (RF-06) |
| `07-retirada-baixa.png` | Baixa de retirada (RF-07) |
| `08-avaliacao.png` | Avaliação do vizinho (RF-08) |

## Verificação
- Smoke test Playwright (caminho-feliz) executado **contra a URL pública**: 4/4 ✅
- Suíte completa local: 34 testes unitários (BR-01..09) + 10 E2E ✅

## Nota técnica
O app no ar usa o driver de dados **demo** (localStorage no aparelho de quem
testa — cada celular da banca tem seu próprio ambiente, sem interferência).
O backend real (Supabase: Auth + Postgres com RLS + Storage + Realtime) está
implementado em `src/lib/data/supabase.ts` com schema em `db/schema.sql`;
para ativar em produção basta configurar as variáveis de ambiente do projeto
na Vercel (ver `.env.example`) e rodar `node scripts/seed-supabase-demo.mjs`.
