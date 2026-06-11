# SPEC.md — Ô de Casa! (o quê e por quê)

## Visão
App mobile-first onde um **morador** autoriza **vizinhos de confiança** a receber suas
encomendas. O vizinho registra a entrega com **foto obrigatória**; o sistema gera um
**comprovante rastreável** e **notifica** o destinatário, que depois **dá baixa** na retirada.

## Público
Moradores de apartamentos e casas sem portaria 24h em Salvador. MVP acadêmico que precisa
estar **100% operacional (front + back)** e acessível por **URL pública** (vira QR Code).

## Personas
- **Morador (destinatário):** autoriza vizinhos, recebe notificações/comprovantes, dá baixa.
- **Vizinho recebedor:** aceita autorização e registra encomendas com foto.
- Um mesmo usuário pode atuar como morador e como vizinho.

## Escopo do MVP (caminho-feliz)
cadastrar → autorizar vizinho → registrar encomenda com foto → notificar → dar baixa → comprovante.
Avaliação/contestação (telas 8) são desejáveis, não bloqueantes.

## Requisitos Funcionais
- RF-01 cadastro e verificação de morador
- RF-02 convidar vizinho e registrar aceite/recusa
- RF-03 validar relação de vizinhança (CEP/condomínio) antes de ativar
- RF-04 registrar encomenda com captura de foto e confirmação
- RF-05 notificar o destinatário em tempo real
- RF-06 gerar comprovante rastreável (data, hora, foto, recebedor)
- RF-07 baixa/retirada pelo destinatário
- RF-08 abertura/acompanhamento de contestações (até 48h)
- RF-09 avaliação mútua de reputação após a entrega

## Regras de Negócio
- BR-01 só verificados convidam/são autorizados
- BR-02 vínculo ativo só após aceite explícito
- BR-03 registro exige no mínimo 1 foto (bloqueante)
- BR-04 notificação imediata após o registro
- BR-05 plano grátis: até 2 vizinhos recebedores
- BR-06 contestação até 48h após o registro
- BR-07 entrega encerra ao dar baixa (retirada)
- BR-08 fotos de comprovação não são apagadas
- BR-09 só vizinhos com reputação ativa (não bloqueados) recebem
