import { api } from '@/lib/fetch';

export type VectorizePreset = 'rapido' | 'detalhado' | 'svg';

/** Parâmetros do motor Potrace (espelha a API). Campos opcionais; o que não
 *  for enviado usa o default do backend. */
export interface VectorizeParams {
	preset?: VectorizePreset;
	mode?: 'trace' | 'posterize';
	// pré-processamento
	threshold?: number;
	invert?: boolean;
	blur?: number | null;
	sharpen?: boolean;
	brightness?: number | null;
	contrast?: number | null;
	gamma?: number | null;
	edgeDetection?: 'none' | 'sobel' | 'canny';
	// potrace
	turdSize?: number;
	optTolerance?: number;
	alphaMax?: number;
	turnPolicy?:
		| 'black'
		| 'white'
		| 'left'
		| 'right'
		| 'minority'
		| 'majority'
		| null;
	blackOnWhite?: boolean;
	// posterize
	posterizeLevels?: number;
	posterizeFillStrategy?: 'dominant' | 'mean' | 'median' | 'spread';
	posterizeRangeDistribution?: 'auto' | 'equal';
	// dithering
	ditherAlgorithm?:
		| 'floydSteinberg'
		| 'atkinson'
		| 'stucki'
		| 'jarvis'
		| 'sierra'
		| 'ordered'
		| 'halftone'
		| null;
	// estilo
	drawingStyle?: 'fill' | 'stroke' | 'outline';
	color?: string;
	strokeWidth?: number;
	nonScalingStroke?: boolean;
	// padrões de linha
	linePattern?:
		| 'none'
		| 'horizontal'
		| 'vertical'
		| 'diagonal45'
		| 'diagonal135'
		| 'crosshatch'
		| 'diamondHatch';
	lineSpacing?: number;
	lineAngle?: number | null;
	// saída
	dpi?: number | null;
	outputWidth?: number | null;
	outputHeight?: number | null;
	svgOptimize?: boolean;
}

export interface VectorizeResult {
	id: string;
	svgContent: string;
	originalName: string;
	isColor: boolean;
	svgUrl?: string;
	pngUrl?: string;
	dxfContent?: string;
}

export async function vectorizeImage(
	file: File,
	opts: { invocationId?: string; params?: VectorizeParams },
): Promise<VectorizeResult> {
	const formData = new FormData();
	formData.append('image', file);
	// Billing é opcional: quando cobrada, o upvox autoriza antes e o motor valida
	// este id e liquida/estorna. Sem id → rodada livre (ferramenta sem cobrança).
	if (opts.invocationId) formData.append('invocation_id', opts.invocationId);
	if (opts.params) {
		for (const [key, value] of Object.entries(opts.params)) {
			if (value !== undefined && value !== null) {
				formData.append(key, String(value));
			}
		}
	}
	const { data } = await api.post<VectorizeResult>('/api/vectorize', formData);
	return data;
}
