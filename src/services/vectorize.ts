import { api } from '@/shared/lib/fetch';

export interface VectorizeResult {
	svgContent: string;
	originalName: string;
	isColor: boolean;
}

export async function vectorizeImage(
	file: File,
	opts?: { useCredits?: boolean },
): Promise<VectorizeResult> {
	const formData = new FormData();
	formData.append('image', file);
	if (opts?.useCredits) {
		formData.append('useCredits', 'true');
	}
	const { data } = await api.post<VectorizeResult>('/vectorize', formData);
	return data;
}
