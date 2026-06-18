import { z } from 'zod';

// NOTA DE MIGRAÇÃO: os tipos de login/registro foram para
// `@/modules/access` (types/auth.ts). O que resta aqui é do domínio CUSTOMER
// (perfil) e migra junto com o módulo `account`/`users` numa onda futura.

export const updateCustomerSchema = z.object({
	name: z.string().min(2).optional(),
	email: z.string().email().optional(),
	phone: z.string().optional(),
});

export type UpdateCustomerPayload = z.infer<typeof updateCustomerSchema>;
