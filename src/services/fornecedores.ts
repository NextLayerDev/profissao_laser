import { api } from '@/lib/fetch';
import type {
	CreateFornecedorBody,
	Fornecedor,
	UpdateFornecedorBody,
} from '@/types/fornecedor';

/** Lista os fornecedores (tool Fornecedores) — main API. */
export async function listFornecedores(): Promise<Fornecedor[]> {
	const { data } = await api.get<Fornecedor[]>('/fornecedores');
	return data ?? [];
}

export async function createFornecedor(
	body: CreateFornecedorBody,
): Promise<Fornecedor> {
	const { data } = await api.post<Fornecedor>('/fornecedores', body);
	return data;
}

export async function updateFornecedor(
	id: string,
	body: UpdateFornecedorBody,
): Promise<Fornecedor> {
	const { data } = await api.patch<Fornecedor>(`/fornecedores/${id}`, body);
	return data;
}

export async function deleteFornecedor(id: string): Promise<void> {
	await api.delete(`/fornecedores/${id}`);
}
