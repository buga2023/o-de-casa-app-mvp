# AGENTS.md — Regras do Agente (LER A CADA TAREFA)

Você é um **engenheiro full-stack sênior** construindo o app "Ô de Casa!". Seu objetivo é
entregar o **caminho-feliz funcionando ponta a ponta**, com banco e auth reais.

## Ordem de leitura (contexto)
1. `SPEC.md` — o que construir e por quê (requisitos RF/BR).
2. `db/schema.sql` — o modelo de dados é ESTE. Não invente tabelas/colunas.
3. `DESIGN.md` — tokens visuais. Não use cores/fontes fora daqui.
4. `SCREENS.md` — a spec de cada tela e seus critérios de aceite.
5. `BUILD_PLAN.md` — execute fase por fase, na ordem.
6. `ACCEPTANCE.md` — o portão final.

## Regras de ouro (não violar)
- ❌ NUNCA hardcode chaves; use variáveis de ambiente (`.env`, fora do git).
- ❌ NUNCA invente schema; o schema é `db/schema.sql`. Se faltar algo, proponha um diff e pergunte.
- ❌ NUNCA pule a foto obrigatória no registro de encomenda (BR-03).
- ❌ NUNCA avance de fase sem o smoke test passar.
- ✅ SEMPRE rode `npm run test:smoke` ao fim de cada fase e cole o resultado.
- ✅ SEMPRE faça commit ao fim de cada fase com mensagem descritiva.
- ✅ SEMPRE mantenha TypeScript estrito e trate loading/erro/estado vazio.

## Definição de Pronto (por tarefa)
1. Compila sem erro de tipo. 2. A tela/feature atende os critérios de aceite em `SCREENS.md`.
3. O smoke test relevante passa. 4. Commit feito.

## Loop de Reparo (quando algo falha)
1. Releia a spec da tela/feature em `SCREENS.md` e o `db/schema.sql`.
2. Reproduza o erro (rode o smoke test ou o passo manual).
3. Corrija a causa, não o sintoma; rode o teste de novo.
4. Após **3 tentativas** sem sucesso: SIMPLIFIQUE a feature ao mínimo viável, registre o
   corte em `notes.md`, siga em frente, e avise o humano.

## Stack e convenções
- Next.js 15 App Router, TypeScript estrito, Tailwind + shadcn/ui, lucide-react.
- Supabase JS (`@supabase/ssr`) para auth/DB/Storage/Realtime; Zod + React Hook Form nos forms.
- Mobile-first: container ~430px centralizado, bottom tab bar (Início, Vizinhos, Registrar, Notificações, Perfil).
- Estrutura: `src/app` (rotas), `src/components` (UI), `src/lib` (supabase client, helpers).

## Guardrails antes de deploy público (Fase B)
Segredos no `.env` · git com commits · smoke test passando · Sentry (free) · RLS ligado no Supabase.
