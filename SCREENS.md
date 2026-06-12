# Telas — especificação e critérios de aceite

Para cada tela: componentes principais · regras · **aceite** (o que precisa funcionar).

## 1. Cadastro & verificação — RF-01 · BR-01
- Form: nome, celular, endereço (CEP + condomínio). Cria `profiles` (id = auth.uid).
- "Verificação em 2 passos" simulada → seta `verificado = true`.
- **Aceite:** usuário novo cria conta, vê o perfil com selo "verificado".

## 2. Convidar/autorizar vizinho — RF-02, RF-03 · BR-02, BR-05, BR-09
- Buscar usuário (por nome/telefone) → enviar convite (`vinculos.status = pendente`).
- O convidado vê o convite e aceita/recusa → `ativo`/`recusado`.
- Bloqueios: só `verificado` convida/é convidado; máx. 2 vínculos ativos como morador; não convidar bloqueado.
- **Aceite:** A convida B; B aceita; A vê B como "vizinho ativo".

## 3. Início / encomendas
- Duas listas: "A receber" (sou destinatário) e "Registradas por mim" (sou recebedor), com status + busca.
- **Aceite:** encomendas aparecem com status correto e abrem o comprovante.

## 4. Registrar encomenda com foto — RF-04 · BR-03, BR-04 (CORAÇÃO DO MVP)
- Escolher destinatário (entre quem me autorizou) → **foto OBRIGATÓRIA** (sem foto, botão salvar desabilitado).
- Upload no Storage `encomendas`; cria `encomendas (status=registrada)`; gera `codigo_comprovante`;
  cria `notificacoes` para o destinatário.
- **Aceite:** registrar com foto cria a encomenda, o comprovante e a notificação; sem foto não salva.

## 5. Notificações — RF-05 · BR-04
- Lista em tempo real (Supabase Realtime); badge de não-lidas; marcar como lida.
- **Aceite:** ao registrar (tela 4), a notificação aparece para o destinatário sem recarregar.

## 6. Comprovante rastreável — RF-06 · BR-08
- Mostra código, data/hora, foto, recebedor, destinatário; botão compartilhar (Web Share API).
- **Aceite:** abre pelo código e exibe todos os campos + a foto.

## 7. Retirar / dar baixa — RF-07 · BR-07
- Destinatário confirma retirada → `status=retirada`, `retirada_at=now()`; notifica o recebedor.
- **Aceite:** dar baixa muda o status e gera notificação ao recebedor.

## 8. Avaliar & contestar — RF-08, RF-09 · BR-06 (desejável)
- Após retirada: avaliação mútua (1–5) e abrir contestação (motivo) em até 48h do registro.
- **Aceite:** registra avaliação; contestação só permitida dentro de 48h.
