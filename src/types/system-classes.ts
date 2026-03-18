import { z } from 'zod';

export const systemClassSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable(),
	status: z.enum(['ativo', 'inativo']),
	sistemaGerenciamento: z.boolean(),
	iaPrevias: z.boolean(),
	iaWhatsappPrevias: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

/**
 * Lenient product schema for objects embedded in the /system-classes response.
 * The API may omit certain product fields (type, language, country, stripe IDs…),
 * so we provide safe defaults to prevent ZodErrors.
 * The inferred TypeScript type is identical to Product.
 */
const embeddedProductSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.string().default(''),
	description: z.string().nullable().default(null),
	image: z.string().nullable().default(null),
	price: z.number().default(0),
	status: z.enum(['ativo', 'inativo', 'excluido']).default('ativo'),
	slug: z.string().default(''),
	createdAt: z.string().default(''),
	updatedAt: z.string().default(''),
	language: z.string().default(''),
	country: z.string().default(''),
	category: z.string().nullable().default(null),
	refundDays: z.number().nullable().default(null),
	stripeProductId: z.string().nullable().default(null),
	stripePriceId: z.string().nullable().default(null),
	machine: z.string().nullable().default(null),
	software: z.string().nullable().default(null),
});

/**
 * Lenient class schema for classes embedded in the /system-classes response.
 * The classes array is typically empty from the API; defaults prevent parse failures.
 */
const embeddedClassSchema = z.object({
	id: z.string(),
	name: z.string(),
	tier: z.enum(['prata', 'ouro', 'platina']).default('prata'),
	description: z.string().nullable().default(null),
	status: z.enum(['ativo', 'inativo']).default('ativo'),
	aula: z.boolean().default(false),
	chat: z.boolean().default(false),
	vetorizacao: z.boolean().default(false),
	suporte: z.boolean().default(false),
	comunidade: z.boolean().default(false),
	createdAt: z.string().default(''),
	updatedAt: z.string().default(''),
	products: embeddedProductSchema.array().default([]),
});

export const systemClassWithRelationsSchema = systemClassSchema.extend({
	products: embeddedProductSchema.array().default([]),
	classes: embeddedClassSchema.array().default([]),
});

export type SystemClass = z.infer<typeof systemClassSchema>;
export type SystemClassWithRelations = z.infer<
	typeof systemClassWithRelationsSchema
>;

export interface CreateSystemClassPayload {
	name: string;
	description?: string;
	status?: 'ativo' | 'inativo';
	sistemaGerenciamento?: boolean;
	iaPrevias?: boolean;
	iaWhatsappPrevias?: boolean;
}

export interface UpdateSystemClassPayload {
	name?: string;
	description?: string;
	status?: 'ativo' | 'inativo';
	sistemaGerenciamento?: boolean;
	iaPrevias?: boolean;
	iaWhatsappPrevias?: boolean;
}
