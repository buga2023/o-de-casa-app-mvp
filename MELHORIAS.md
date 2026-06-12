# MELHORIAS.md — Roadmap para deixar o MVP mais sólido

> **STATUS (2026-06-12): todos os itens implementados.**
> P0: camada `src/lib/data` (drivers local/supabase por env), Zod+RHF com erro
> por campo e máscaras, error boundaries/not-found, UUID + código base32 legível.
> P1: Vitest cobrindo BR-01..09 (30 testes), E2E com caminhos-tristes (10 testes),
> CI em `.github/workflows/ci.yml`, passe de a11y (labels, foco, alvos 44px, aria).
> P2: compressão de foto client-side, PWA (manifest+SW) com notificações,
> QR Code no comprovante, reputação recalculada com bloqueio BR-09, timeline.
> P3: Sentry inerte sem DSN, guia de deploy Vercel no README, anti-abuso
> (limites/hora no app + triggers SQL). Dívidas técnicas: todas pagas.
> Pendências externas: criar projeto Supabase, conta Sentry e deploy (ver README).

Estado atual: caminho-feliz funcionando ponta a ponta (8 telas), backend **mock local**
(localStorage), cobertura **E2E Playwright** (4 testes verdes), build limpo.
Este documento lista melhorias **priorizadas** para robustez, qualidade e produção.

Legenda de esforço: 🟢 baixo · 🟡 médio · 🔴 alto.
Cada item traz o **porquê** e um **critério de pronto**.

---

## P0 — Solidez imediata (antes de qualquer refino de UI)

### 1. Backend real (Supabase) atrás da mesma interface 🔴
- **Porquê:** hoje os dados vivem só no navegador (localStorage). Sem isso não há
  multiusuário real, persistência entre dispositivos, nem RLS/segurança.
- **Como:** criar `src/lib/data/index.ts` com a interface atual de `api.ts` e duas
  implementações: `local` (atual) e `supabase` (`@supabase/ssr`). Selecionar por env
  (`NEXT_PUBLIC_DATA_DRIVER`). O `db/schema.sql` já está pronto para rodar.
- **Pronto quando:** o mesmo fluxo passa com `DATA_DRIVER=supabase` e RLS ligado.

### 2. Validação de formulários com Zod + React Hook Form 🟡
- **Porquê:** hoje a validação do cadastro é manual e mínima; entradas inválidas
  (CEP, telefone) passam. Forms são a maior fonte de bug/inconsistência.
- **Como:** schemas Zod por tela (cadastro, registrar, contestação), mensagens de erro
  inline por campo, máscara de telefone/CEP.
- **Pronto quando:** submeter com dados inválidos mostra erro por campo e não cria registro.

### 3. Error boundaries + estados de erro de verdade 🟢
- **Porquê:** um throw em qualquer tela hoje quebra a árvore inteira.
- **Como:** `error.tsx` e `not-found.tsx` por segmento de rota; fallback amigável com
  "tentar de novo". Comprovante inexistente já trata, mas falta o resto.
- **Pronto quando:** forçar um erro mostra tela amigável, não tela branca.

### 4. IDs e timestamps robustos 🟢
- **Porquê:** `newId()` usa contador + `Date.now()`; em volume há risco teórico de colisão
  e ordenação só por string. `codigo_comprovante` idem.
- **Como:** usar `crypto.randomUUID()` (disponível no browser) para ids; código de
  comprovante com prefixo + base32 sem ambiguidade (sem 0/O, 1/I).
- **Pronto quando:** ids únicos garantidos e código legível para ditar por telefone.

---

## P1 — Qualidade e confiança

### 5. Testes unitários das regras de negócio (BR-01..09) 🟡
- **Porquê:** o E2E cobre o feliz; as **regras** (limite de 2 vizinhos, prazo 48h,
  foto obrigatória, bloqueio) precisam de testes diretos e rápidos.
- **Como:** Vitest sobre `api.ts` (a lógica é pura sobre o store). Casos de borda:
  convidar 3º vizinho, aceitar após limite, contestar após 48h, registrar sem foto.
- **Pronto quando:** `vitest` cobre cada BR com caso positivo e negativo.

### 6. Expandir E2E para os caminhos-tristes 🟡
- **Porquê:** só testamos sucesso. Falta: convite recusado, limite BR-05 bloqueando,
  contestação dentro/fora do prazo, busca sem resultado.
- **Pronto quando:** ≥1 teste por regra de bloqueio.

### 7. CI (GitHub Actions) 🟢
- **Porquê:** garantir que build + testes rodam a cada push.
- **Como:** workflow com `npm ci`, `npm run build`, `npx playwright test`.
- **Pronto quando:** PR vermelho quando algo quebra.

### 8. Acessibilidade (a11y) 🟡
- **Porquê:** mobile-first de verdade exige foco visível, labels, contraste, toque ≥44px.
- **Como:** `htmlFor` em todos os labels, `aria-live` nos toasts (já tem `role=status`),
  foco preso em diálogos, navegação por teclado nos cards clicáveis.
- **Pronto quando:** auditoria Lighthouse a11y ≥ 90.

---

## P2 — Experiência e produto

### 9. Upload de foto real + compressão 🟡
- **Porquê:** data URL incha o localStorage e não escala. Fotos grandes travam.
- **Como:** com Supabase, subir ao bucket `encomendas`; comprimir client-side
  (canvas/`createImageBitmap`) antes do upload; aceitar câmera traseira (já tem `capture`).
- **Pronto quando:** foto de 4MB vira ~200KB e abre rápido no comprovante.

### 10. Notificações push reais (PWA) 🔴
- **Porquê:** hoje "tempo real" é só dentro do app aberto. RF-05 ganha força com push.
- **Como:** manifest PWA + service worker + Web Push (ou Supabase Realtime + Notifications API).
- **Pronto quando:** destinatário recebe push com o app fechado.

### 11. QR Code do comprovante 🟢
- **Porquê:** o SPEC fala em URL pública que vira QR; o comprovante rastreável combina com QR.
- **Como:** gerar QR do link `/comprovante/[id]` (lib leve `qrcode`) na tela 6.
- **Pronto quando:** escanear o QR abre o comprovante.

### 12. Reputação que realmente muda 🟡
- **Porquê:** `reputacao` é fixa em 5; as avaliações (tela 8) não a alteram.
- **Como:** recalcular média das avaliações recebidas ao avaliar; BR-09 (bloquear quem
  cai abaixo de um limite) passa a ter efeito.
- **Pronto quando:** avaliar baixo derruba a média e, no limite, bloqueia o recebedor.

### 13. Histórico/auditoria da encomenda 🟢
- **Porquê:** comprovante "rastreável" pede linha do tempo (registrada → notificada →
  retirada → avaliada/contestada).
- **Pronto quando:** a tela 6 mostra a timeline de eventos com data/hora.

---

## P3 — Produção e blindagem (Fase 8 do BUILD_PLAN)

### 14. Observabilidade (Sentry) 🟢 · 15. Deploy Vercel + env 🟡 · 16. Rate limit/anti-abuso 🔴
- Monitorar erros em produção, publicar URL estável (vira o QR Code da banca),
  e limitar criação de convites/registros para evitar spam.
- **Pronto quando:** URL pública estável, erros chegam no Sentry, RLS + limites ativos.

---

## Dívidas técnicas pontuais (rápidas)
- [ ] `formatDateTime`/`podeContestar` usam `Date` direto — centralizar e testar fuso.
- [ ] Toast: limitar fila e permitir fechar manualmente.
- [ ] `searchProfiles` retorna todos quando vazio — paginar/limitar.
- [ ] Tipar retornos de erro (hoje `RegraError` + string) com um `Result<T>` opcional.
- [ ] Extrair `EncomendaCard` (repetido entre Início e futuras telas).

---

### Sugestão de ordem de execução
**P0 (1→4)** deixa o MVP confiável → **P1 (5→8)** trava a qualidade com testes/CI →
**P2/P3** conforme prioridade de produto e prazo da banca.
