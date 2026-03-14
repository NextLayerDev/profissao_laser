import { z } from 'zod';
import { classSchema } from './classes';
import { productSchema } from './products';

export const systemClassSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable(),
	status: z.enum(['ativo', 'inativo']),
	system: z.boolean(),
	aula: z.boolean(),
	chat: z.boolean(),
	vetorizacao: z.boolean(),
	suporte: z.boolean(),
	comunidade: z.boolean(),
	prata: z.boolean(),
	gold: z.boolean(),
	platina: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const systemClassWithRelationsSchema = systemClassSchema.extend({
	products: productSchema.array(),
	classes: classSchema.array(),
});

export type SystemClass = z.infer<typeof systemClassSchema>;
export type SystemClassWithRelations = z.infer<
	typeof systemClassWithRelationsSchema
>;

export interface CreateSystemClassPayload {
	name: string;
	description?: string;
	status?: 'ativo' | 'inativo';
	system?: boolean;
	aula?: boolean;
	chat?: boolean;
	vetorizacao?: boolean;
	suporte?: boolean;
	comunidade?: boolean;
	prata?: boolean;
	gold?: boolean;
	platina?: boolean;
}

export interface UpdateSystemClassPayload {
	name?: string;
	description?: string;
	status?: 'ativo' | 'inativo';
	system?: boolean;
	aula?: boolean;
	chat?: boolean;
	vetorizacao?: boolean;
	suporte?: boolean;
	comunidade?: boolean;
	prata?: boolean;
	gold?: boolean;
	platina?: boolean;
}
