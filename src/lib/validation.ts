import { z } from "zod";

export const authSchema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
});

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
});

export const updateStickerSchema = z.object({
  code: z.string().min(2),
  status: z.enum(["COLADA", "FALTANDO", "REPETIDA"]),
  repeatedCount: z.number().int().min(0).default(0),
});

export const createFamilySchema = z.object({
  name: z.string().min(3, "Informe o nome da família."),
});

export const joinFamilySchema = z.object({
  code: z
    .string()
    .min(4, "Informe o código da família.")
    .transform((value) => value.trim().toUpperCase()),
});

export const familyMemberActionSchema = z.object({
  action: z.enum(["approve", "reject", "remove"]),
});
