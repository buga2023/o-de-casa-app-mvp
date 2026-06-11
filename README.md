# Ô de Casa! — Harness de Construção com IA

Pacote de contexto para um **agente de código** (Cursor, Windsurf, Claude Code, Aider)
construir o app com a **maior chance de acerto**. A ideia: em vez de um prompt único, a IA
recebe contexto estruturado + um portão de verificação (smoke test) e um **loop de reparo**.

## Como usar (3 passos)
1. Crie o repo e copie estes arquivos para a raiz.
2. Aponte o agente para a pasta e mande: **"Leia AGENTS.md e execute o BUILD_PLAN.md fase por fase."**
3. O agente constrói, roda `npm run test:smoke` a cada fase, e só avança quando passa.

## Mapa dos arquivos
| Arquivo | Papel |
|---|---|
| `AGENTS.md` | Regras permanentes do agente (ler sempre). Também serve como `.cursorrules` / `CLAUDE.md`. |
| `SPEC.md` | O QUÊ: visão, personas, escopo, requisitos (RF/BR). |
| `db/schema.sql` | Dados Primeiro: schema Postgres + RLS + bucket + seed demo. |
| `DESIGN.md` | Tokens de design (cores, fontes, layout, componentes). |
| `SCREENS.md` | Spec de cada uma das 8 telas, com estados e critérios de aceite. |
| `BUILD_PLAN.md` | Plano em fases, cada uma com checkpoint e commit. |
| `ACCEPTANCE.md` | Portão final: checklist do caminho-feliz que precisa passar. |
| `tests/smoke.spec.ts` | Smoke test Playwright do caminho-feliz (o verificador). |
| `.env.example` | Variáveis (Supabase). Nunca commitar `.env`. |

## Stack
Next.js 15 (App Router) + TypeScript · Supabase (Auth/Postgres/Storage/Realtime) ·
Tailwind + shadcn/ui · Zod + React Hook Form · Deploy na Vercel.

> Para Lovable/Bolt (geradores one-shot): cole `SPEC.md` + `db/schema.sql` + `DESIGN.md`.
> Para agentes iterativos (Cursor/Windsurf/Claude Code): use o harness inteiro — é onde o
> loop de reparo brilha.
