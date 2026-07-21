import { api } from '@/lib/fetch';

export type VectorizePreset = 'automatico' | 'rapido' | 'detalhado' | 'svg';

/** Parâmetros do motor Potrace (espelha a API). Campos opcionais; o que não
 *  for enviado usa o default do backend. */
export interface VectorizeParams {
	preset?: VectorizePreset;
	mode?: 'trace' | 'posterize' | 'color';
	/** Vetorização em cores: nº de cores da paleta (k-means). */
	maxColors?: number;
	// pré-processamento
	threshold?: number;
	invert?: boolean;
	blur?: number | null;
	sharpen?: boolean;
	brightness?: number | null;
	contrast?: number | null;
	gamma?: number | null;
	edgeDetection?: 'none' | 'sobel' | 'canny' | 'lineart';
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
	/** Formatos já pagos deste vetor (svg/png/dxf) — cobrança por formato no download. */
	paidFormats?: string[];
	/**
	 * A IA não reproduziu a arte com fidelidade (verificação estrutural no
	 * backend) → estornaram a geração e devolveram a vetorização normal. O
	 * cliente volta ao fluxo grátis: paga só ao baixar cada formato.
	 */
	aiFallback?: boolean;
	aiFallbackReason?: string;
}

export type InvertMode = 'auto' | 'geometric' | 'silhouette';

export interface InvertedVector {
	/** Qual caminho rodou de fato. */
	mode: 'geometric' | 'silhouette';
	svgContent: string;
	pngUrl: string;
	dxfContent: string;
	paidFormats: string[];
	/** Id do invertido guardado em "Meus vetores" (quando pedido). */
	savedId?: string;
}

export type VectorFormat = 'svg' | 'png' | 'dxf';

export type VectorClass =
	| 'text'
	| 'line_art'
	| 'logo'
	| 'color_flat'
	| 'grayscale_tonal'
	| 'photo';

/** Perfil da análise automática (router + image analytics). */
export interface ImageProfile {
	class: VectorClass;
	label: string;
	reason: string;
	confidence: number;
	metrics: {
		width: number;
		height: number;
		hasAlpha: boolean;
		colorCount: number;
		grayEntropy: number;
		otsuThreshold: number;
		bimodality: number;
		foregroundRatio: number;
		darkBackground: boolean;
		edgeDensity: number;
		noise: number;
	};
	recommendedParams: VectorizeParams;
	recommendTool?: 'engraving';
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

/**
 * Line-art com IA (foto → gravura "nanquim" via IA → vetor). Cobrada NA GERAÇÃO
 * (a IA custa): o front invoca (debita) e manda o `invocation_id`. Demora ~30–40s
 * (roda o modelo de imagem), por isso o timeout maior. O resultado já vem com
 * todos os formatos pagos (`paidFormats`), então o download não recobra.
 */
export async function aiLineartVectorize(
	file: File,
	opts: {
		invocationId?: string;
		params?: VectorizeParams;
		variant?: 'lineart' | 'color';
	},
): Promise<VectorizeResult> {
	const formData = new FormData();
	formData.append('image', file);
	formData.append('variant', opts.variant ?? 'lineart');
	if (opts.invocationId) formData.append('invocation_id', opts.invocationId);
	if (opts.params) {
		for (const [key, value] of Object.entries(opts.params)) {
			if (value !== undefined && value !== null) {
				formData.append(key, String(value));
			}
		}
	}
	const { data } = await api.post<VectorizeResult>(
		'/api/vectorize/ai-lineart',
		formData,
		// 150s e não 90s: quando a verificação estrutural rejeita a 1ª saída, o
		// backend refaz com prompt mais rígido — duas gerações mais o trace passam
		// de 90s. Estourar aqui deixaria o servidor liquidar uma cobrança de um
		// resultado que o cliente nunca veria.
		{ timeout: 150_000 },
	);
	return data;
}

/**
 * VETOR INVERTIDO (fundo preto): negativo REAL do vetor — o Corel/LightBurn e o
 * laser enxergam a polaridade trocada, não é só a cor da prévia. **Não cobra**:
 * é transformação pura de um vetor já gerado, e o crédito de formato já pago
 * cobre o arquivo invertido.
 */
export async function invertVector(
	vectorId: string,
	mode: InvertMode = 'auto',
	/**
	 * Guarda o invertido em "Meus vetores". Idempotente por (pai, modo) e o
	 * registro herda os formatos já pagos do pai — nunca recobra.
	 */
	persist = false,
): Promise<InvertedVector> {
	const { data } = await api.post<InvertedVector>(
		`/api/vectorize/${vectorId}/invert`,
		{ mode, persist },
		{ timeout: 60_000 },
	);
	return data;
}

/**
 * Cobrança POR FORMATO no download. A geração é grátis; ao baixar um formato
 * ainda não pago deste vetor, o front invoca a tool no upvox (debita) e chama
 * esta rota com o `invocation_id`. O backend grava o formato como pago e liquida.
 * Formato já pago (inclusive re-download) NÃO cobra de novo. Devolve os formatos
 * pagos atualizados.
 */
export async function chargeVectorFormat(
	vectorId: string,
	format: VectorFormat,
	invocationId?: string,
): Promise<{ paidFormats: string[] }> {
	const { data } = await api.post<{ paidFormats: string[] }>(
		`/api/vectorize/${vectorId}/download/${format}`,
		{ invocation_id: invocationId },
	);
	return data;
}

/**
 * Preview rápido e NÃO cobrado: o backend reduz a imagem (~600px), roda o motor
 * sem supersampling e devolve só o SVG inline (sem storage/DB). Para o feedback
 * ao vivo dos sliders — não consome voxes.
 */
export async function previewVectorize(
	file: File,
	params: VectorizeParams,
): Promise<{ svgContent: string }> {
	const formData = new FormData();
	formData.append('image', file);
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null) {
			formData.append(key, String(value));
		}
	}
	const { data } = await api.post<{ svgContent: string }>(
		'/api/vectorize/preview',
		formData,
	);
	return data;
}

/**
 * Análise automática (router + image analytics) — NÃO cobrada. Detecta o tipo
 * da imagem e devolve os parâmetros recomendados, que o modo Automático aplica.
 */
export async function analyzeVectorize(file: File): Promise<ImageProfile> {
	const formData = new FormData();
	formData.append('image', file);
	const { data } = await api.post<ImageProfile>(
		'/api/vectorize/analyze',
		formData,
	);
	return data;
}
