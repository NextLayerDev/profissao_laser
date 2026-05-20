import { api } from '@/lib/fetch';
import type { CustomerVector } from '@/services/vectors';

export interface VectorizeResult {
	svgContent: string;
	originalName: string;
}

/**
 * Vectoriza a imagem e retorna o SVG como texto.
 * Usa POST /vectorize (sem save) → response body é image/svg+xml.
 */
export async function vectorizeImage(file: File): Promise<VectorizeResult> {
	const formData = new FormData();
	formData.append('file', file);

	const response = await api.post<string>('/vectorize', formData, {
		responseType: 'text',
	});

	return {
		svgContent: response.data,
		originalName: file.name,
	};
}

/**
 * Vectoriza E guarda na biblioteca do customer numa única chamada.
 * Usa POST /vectorize com save=true → 201 com objeto CustomerVector.
 */
export async function vectorizeAndSave(file: File): Promise<CustomerVector> {
	const formData = new FormData();
	formData.append('file', file);
	formData.append('save', 'true');

	const response = await api.post<CustomerVector>('/vectorize', formData);

	return response.data;
}
