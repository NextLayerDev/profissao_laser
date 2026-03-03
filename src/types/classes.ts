import { z } from 'zod';
import { productSchema } from './products';

export const classTierSchema = z.enum(['prata', 'ouro', 'platina']);
export type ClassTier = z.infer<typeof classTierSchema>;

export const classSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	tier: classTierSchema,
	description: z.string().nullable(),
	status: z.enum(['ativo', 'inativo']),
	aula: z.boolean(),
	chat: z.boolean(),
	vetorizacao: z.boolean(),
	suporte: z.boolean(),
	comunidade: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const classWithProductsSchema = classSchema.extend({
	products: productSchema.array(),
});

export type Class = z.infer<typeof classSchema>;
export type ClassWithProducts = z.infer<typeof classWithProductsSchema>;

export type FeatureKey =
	| 'aula'
	| 'chat'
	| 'vetorizacao'
	| 'suporte'
	| 'comunidade';

export type CustomerFeatures = {
	aula: boolean;
	chat: boolean;
	vetorizacao: boolean;
	suporte: boolean;
	comunidade: boolean;
};

export type FeatureUpgradeTiers = Record<FeatureKey, string | null>;
