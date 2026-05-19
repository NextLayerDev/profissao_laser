import { api } from '@/lib/fetch';

export type VectorMode = 'contorno' | 'detalhado' | 'preenchimento';

export interface VectorizeParams {
	mode?: VectorMode;
	detailLevel?: number;
	smoothing?: number;
	noiseReduction?: number;
	blackAndWhite?: boolean;
	invertColors?: boolean;
}

export interface VectorizeResult {
	svgContent: string;
	originalName: string;
	isColor: boolean;
	dxfContent?: string;
	pngUrl?: string;
}

function appendParams(formData: FormData, params: VectorizeParams) {
	if (params.mode) formData.append('mode', params.mode);
	if (params.detailLevel != null)
		formData.append('detailLevel', String(params.detailLevel));
	if (params.smoothing != null)
		formData.append('smoothing', String(params.smoothing));
	if (params.noiseReduction != null)
		formData.append('noiseReduction', String(params.noiseReduction));
	if (params.blackAndWhite != null)
		formData.append('blackAndWhite', String(params.blackAndWhite));
	if (params.invertColors != null)
		formData.append('invertColors', String(params.invertColors));
}

export async function vectorizeImage(
	file: File,
	params?: VectorizeParams,
): Promise<VectorizeResult> {
	const formData = new FormData();
	formData.append('image', file);
	if (params) appendParams(formData, params);
	const { data } = await api.post<VectorizeResult>(
		'/api/vectorize',
		formData,
	);
	return data;
}

export async function vectorizeBatch(
	files: File[],
	params?: VectorizeParams,
): Promise<VectorizeResult[]> {
	const formData = new FormData();
	for (const file of files) {
		formData.append('images', file);
	}
	if (params) appendParams(formData, params);
	const { data } = await api.post<VectorizeResult[]>(
		'/api/vectorize/batch',
		formData,
	);
	return data;
}

export async function exportVector(
	svgContent: string,
	format: 'dxf' | 'png',
): Promise<Blob> {
	const { data } = await api.post(
		`/api/vectorize/export/${format}`,
		{ svgContent },
		{ responseType: 'blob' },
	);
	return data;
}
