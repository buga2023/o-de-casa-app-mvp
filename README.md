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

---

## Rodando o app

```bash
npm install
npm run dev          # http://localhost:3000 (modo demo, dados no localStorage)
npm run test:unit    # Vitest — regras de negócio BR-01..09
npm run test:smoke   # Playwright — caminho-feliz + caminhos-tristes
npm run build        # build de produção
```

## Drivers de dados (MELHORIAS.md P0.1)

A camada `src/lib/data` tem uma interface única com dois drivers, escolhidos por env:

- **`local`** (padrão): tudo no `localStorage`, com botão "Entrar como demo".
- **`supabase`**: backend real com RLS. Para ativar:
  1. Crie um projeto no Supabase e rode `db/schema.sql` no SQL Editor
     (inclui triggers de reputação BR-09 e anti-abuso).
  2. Habilite **Authentication → Providers → Anonymous sign-in**.
  3. Copie `.env.example` para `.env.local` e preencha
     `NEXT_PUBLIC_DATA_DRIVER=supabase`, URL e anon key.

## Deploy (Vercel — MELHORIAS.md P3.15)

1. Suba o repo no GitHub (o CI em `.github/workflows/ci.yml` roda build + testes).
2. Importe o repo na Vercel (framework: Next.js, sem config extra).
3. Defina as envs do `.env.example` no painel da Vercel.
4. A URL pública servirá de QR Code para a banca.

Observabilidade: defina `NEXT_PUBLIC_SENTRY_DSN` para ativar o Sentry
(cliente + servidor + error boundaries). Sem a env, fica inerte.
