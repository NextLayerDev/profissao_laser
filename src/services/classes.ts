import { api } from '@/lib/fetch';
import {
	type Class,
	type ClassWithProducts,
	classSchema,
	classWithProductsSchema,
} from '@/types/classes';

export interface CreateClassPayload {
	name: string;
	tier: 'prata' | 'ouro' | 'platina';
	description?: string;
	status?: 'ativo' | 'inativo';
	aula?: boolean;
	chat?: boolean;
	vetorizacao?: boolean;
	suporte?: boolean;
	comunidade?: boolean;
}

export interface UpdateClassPayload {
	name?: string;
	tier?: 'prata' | 'ouro' | 'platina';
	description?: string;
	status?: 'ativo' | 'inativo';
	aula?: boolean;
	chat?: boolean;
	vetorizacao?: boolean;
	suporte?: boolean;
	comunidade?: boolean;
}

export async function getClasses(): Promise<ClassWithProducts[]> {
	const { data } = await api.get('/classes');
	return classWithProductsSchema.array().parse(data);
}

export async function createClass(payload: CreateClassPayload): Promise<Class> {
	const { data } = await api.post('/class', payload);
	return classSchema.parse(data);
}

export async function updateClass(
	id: string,
	payload: UpdateClassPayload,
): Promise<Class> {
	const { data } = await api.patch(`/class/${id}`, payload);
	return classSchema.parse(data);
}

export async function deleteClass(id: string): Promise<void> {
	await api.delete(`/class/${id}`);
}

export async function addProductToClass(
	classId: string,
	productId: string,
): Promise<void> {
	await api.post(`/class/${classId}/product`, { productId });
}

export async function removeProductFromClass(
	classId: string,
	productId: string,
): Promise<void> {
	await api.delete(`/class/${classId}/product/${productId}`);
}
