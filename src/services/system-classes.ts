import { api } from '@/lib/fetch';
import type {
	CreateSystemClassPayload,
	SystemClass,
	SystemClassWithRelations,
	UpdateSystemClassPayload,
} from '@/types/system-classes';
import {
	systemClassSchema,
	systemClassWithRelationsSchema,
} from '@/types/system-classes';

export async function getSystemClasses(): Promise<SystemClassWithRelations[]> {
	const { data } = await api.get('/system-classes');
	return systemClassWithRelationsSchema.array().parse(data);
}

export async function getSystemClass(
	id: string,
): Promise<SystemClassWithRelations> {
	const { data } = await api.get(`/system-class/${id}`);
	return systemClassWithRelationsSchema.parse(data);
}

export async function createSystemClass(
	payload: CreateSystemClassPayload,
): Promise<SystemClass> {
	const { data } = await api.post('/system-class', payload);
	return systemClassSchema.parse(data);
}

export async function updateSystemClass(
	id: string,
	payload: UpdateSystemClassPayload,
): Promise<SystemClass> {
	const { data } = await api.patch(`/system-class/${id}`, payload);
	return systemClassSchema.parse(data);
}

export async function deleteSystemClass(id: string): Promise<void> {
	await api.delete(`/system-class/${id}`);
}

export async function linkProduct(
	id: string,
	productId: string,
): Promise<void> {
	await api.post(`/system-class/${id}/product`, { productId });
}

export async function unlinkProduct(
	id: string,
	productId: string,
): Promise<void> {
	await api.delete(`/system-class/${id}/product/${productId}`);
}

export async function linkClass(id: string, classId: string): Promise<void> {
	await api.post(`/system-class/${id}/class`, { classId });
}

export async function unlinkClass(id: string, classId: string): Promise<void> {
	await api.delete(`/system-class/${id}/class/${classId}`);
}
