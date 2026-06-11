# BUILD_PLAN.md — Fases (execute em ordem; commit + smoke test ao fim de cada)

## Fase 0 — Bootstrap
- create-next-app (TS, Tailwind, App Router) + shadcn init + supabase-js.
- `.env` a partir de `.env.example`. "Hello world" rodando e deployado na Vercel.
- ✅ Checkpoint: app no ar; `npm run dev` ok; commit `chore: bootstrap`.

## Fase 1 — Dados + Auth
- Rodar `db/schema.sql` no Supabase (tabelas + RLS + bucket + seed demo).
- Auth e-mail/senha; criação de `profiles`; **botão "Entrar como demo"** (morador + vizinho vinculados).
- ✅ Checkpoint: login funciona; perfil persiste; commit `feat: auth + schema`.

## Fase 2 — Tela 1 (cadastro/verificação)
- ✅ Checkpoint: cria conta verificada; smoke `home loads` passa; commit.

## Fase 3 — Tela 2 (autorizar vizinho)
- Convite → aceite → vínculo ativo (com BR-01/02/05/09).
- ✅ Checkpoint: fluxo de vínculo ponta a ponta; commit.

## Fase 4 — Tela 4 (registrar com foto) + comprovante + notificação
- Upload Storage, geração de comprovante, notificação. **Coração do MVP.**
- ✅ Checkpoint: smoke `core flow` passa; commit.

## Fase 5 — Telas 3, 5, 6 (lista, notificações realtime, comprovante)
- ✅ Checkpoint: notificação em tempo real visível; commit.

## Fase 6 — Tela 7 (dar baixa)
- ✅ Checkpoint: status muda e notifica recebedor; commit.

## Fase 7 — Tela 8 (avaliar/contestar) [se houver tempo]
- ✅ Checkpoint: avaliação grava; contestação respeita 48h; commit.

## Fase 8 — Blinda + Deploy
- 5 guardrails (Sentry, etc.); rodar `ACCEPTANCE.md` inteiro; deploy final na Vercel.
- ✅ Checkpoint: URL pública estável → pronta para virar QR Code.
