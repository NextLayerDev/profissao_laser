export interface VectorizeResult {
	svgContent: string;
	originalName: string;
	isColor: boolean;
}

export async function vectorizeImage(file: File): Promise<VectorizeResult> {
	const formData = new FormData();
	formData.append('image', file);

	const response = await fetch('/api/vectorize', {
		method: 'POST',
		body: formData,
	});

	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw new Error(data.error || `Erro ${response.status} ao vetorizar`);
	}
	return response.json() as Promise<VectorizeResult>;
}
