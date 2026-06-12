// Schemas Zod por tela — validação com mensagem por campo.

import { z } from "zod";

export const cadastroSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo.")
    .max(80, "Nome muito longo."),
  telefone: z
    .string()
    .regex(
      /^\(\d{2}\) \d{4,5}-\d{4}$/,
      "Celular no formato (71) 99999-9999."
    ),
  endereco: z
    .string()
    .trim()
    .min(3, "Informe rua e número.")
    .max(120, "Endereço muito longo."),
  cep: z.string().regex(/^\d{5}-\d{3}$/, "CEP no formato 40140-000."),
  condominio: z.string().trim().max(80, "Nome muito longo.").optional().default(""),
});

export type CadastroForm = z.input<typeof cadastroSchema>;

export const registrarSchema = z.object({
  destinatarioId: z.string().min(1, "Escolha para quem é a encomenda."),
  fotoUrl: z.string().min(1, "A foto é obrigatória (BR-03)."),
  descricao: z.string().trim().max(200, "Descrição muito longa.").optional().default(""),
});

export const contestacaoSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(5, "Descreva o motivo (mínimo 5 caracteres).")
    .max(500, "Motivo muito longo."),
});
