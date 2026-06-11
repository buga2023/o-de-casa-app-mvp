# ACCEPTANCE.md — Portão final (o caminho-feliz precisa passar 100%)

Rode manualmente (e via `npm run test:smoke`) antes de considerar pronto:

1. [ ] Criar conta nova → perfil verificado.
2. [ ] Como morador A, convidar vizinho B → B aceita → A vê B como ativo.
3. [ ] Tentar registrar encomenda SEM foto → bloqueado (BR-03).
4. [ ] Como B, registrar encomenda PARA A com foto → encomenda criada + comprovante gerado.
5. [ ] A recebe a NOTIFICAÇÃO em tempo real (sem recarregar) — RF-05.
6. [ ] Abrir o COMPROVANTE pelo código → código, data/hora, foto, recebedor, destinatário.
7. [ ] A dá BAIXA → status "retirada" + B é notificado.
8. [ ] Limite de 2 vizinhos no plano grátis respeitado (BR-05).
9. [ ] Nenhuma chave hardcoded; `.env` fora do git; RLS ligado.
10. [ ] App responsivo, mobile-first, sem erro no console.

Modo demo: o botão "Entrar como demo" permite percorrer 1→7 sem cadastro (para a banca/QR Code).
