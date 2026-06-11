# notes.md — Decisões e cortes da construção

## Decisões de arquitetura (combinadas com o dono do projeto)
- **Backend em modo local (mock), não Supabase.** A pedido, o app roda 100% offline.
  Há uma camada de dados em `src/lib/` que **espelha o contrato** de `db/schema.sql`
  (mesmos tipos, mesmas regras de negócio), persistindo em `localStorage`:
  - `types.ts` — tipos/enuns idênticos ao schema.
  - `store.ts` — persistência + pub/sub (Realtime simulado) + sessão.
  - `seed.ts` — perfis demo verificados (Ana, Bruno, Carla) com vínculo ativo mútuo.
  - `api.ts` — API de domínio que aplica **BR-01..BR-09**.
  > Para migrar ao Supabase real depois: trocar `store.ts`/`api.ts` por chamadas
  > `@supabase/ssr` mantendo as mesmas assinaturas. O schema já está pronto em `db/schema.sql`.
- **Cobertura de teste = E2E (Playwright).** A pedido, a meta é cobrir o caminho-feliz
  por fluxo (telas 1→7), não cobertura de linhas. Ver `tests/smoke.spec.ts`.

## Cortes / simplificações (vs. o harness original)
- **shadcn/ui não foi instalado via CLI.** Os primitivos (`Button`, `Card`, `Input`,
  `Badge`, `Toast`) foram escritos à mão no mesmo estilo (cva + tokens do `DESIGN.md`),
  para evitar dependência de rede/CLI interativa. Visual e API equivalentes.
- **Zod + React Hook Form não usados.** A validação dos forms (cadastro) é manual e
  enxuta — suficiente para o MVP. Fácil de trocar por RHF+Zod se necessário.
- **Storage = data URL.** A foto obrigatória é lida via `FileReader` e guardada como
  data URL (substitui o bucket `encomendas`). BR-03/BR-08 respeitados (foto exigida e
  nunca apagada do registro).
- **Sentry / deploy Vercel (Fase 8):** fora do escopo do modo local. Guardrails de
  segredos/RLS não se aplicam (sem backend remoto).

## Tela 8 (avaliar/contestar) — incluída
Mesmo sendo "desejável", a avaliação (1–5) e a contestação com prazo de 48h (BR-06)
estão implementadas na tela de comprovante.

## Como validar
1. `npm run dev` → abrir http://localhost:3000
2. "Entrar como demo" (entra como Ana) → percorrer Início/Vizinhos/Registrar/Notificações/Perfil.
3. Em **Perfil → Trocar de usuário (demo)** alterne Ana/Bruno para ver os dois lados
   (registrar como Ana → receber e dar baixa como Bruno).
4. `npm run test:smoke` → 4 testes, caminho-feliz completo.
