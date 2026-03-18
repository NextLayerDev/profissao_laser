import { z } from 'zod';
import { classSchema } from './classes';
import { productSchema } from './products';

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
