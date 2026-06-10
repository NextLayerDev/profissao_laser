import { z } from 'zod';
import { api } from '@/lib/fetch';

/** Chaves de material aceitas pelo motor (espelha a API `/api/laser-prep`). */
export const LASER_PREP_MATERIALS = [
	'wood',
	'black slate',
	'glass',
	'acrylic',
	'leather',
	'cork',
	'andonized aluminum',
	'stainless steel',
	'white tile',
	'white tile painted black',
] as const;

export type LaserPrepMaterial = (typeof LASER_PREP_MATERIALS)[number];

/** Parâmetros do motor de fotogravação. Campos opcionais usam o default do backend. */
export interface LaserPrepParams {
	material: LaserPrepMaterial;
	width_mm: number;
	/** Default do backend = 254. */
	dpi?: number;
	/** 'true' desativa o dithering (envia o cinza contínuo). */
	noDither?: boolean;
	ditherAlgorithm?: string;
	/** Limpa o fundo (flood-fill das bordas, limiar adaptativo) — até os cantos. */
	cleanBackground?: boolean;
	/** Margem abaixo da mediana da borda: maior limpa fundos mais escuros (default 16). */
	bgMargin?: number;
}

export const laserPrepResultSchema = z.object({
	id: z.string(),
	pngUrl: z.string(),
	pngBase64: z.string(), // 'data:image/png;base64,...'
	width_mm: z.number(),
	height_mm: z.number(),
	dpi: z.number(),
	px_w: z.number(),
	px_h: z.number(),
});

export type LaserPrepResult = z.infer<typeof laserPrepResultSchema>;

export async function prepImage(
	file: File,
	opts: { invocationId?: string; params: LaserPrepParams },
): Promise<LaserPrepResult> {
	const formData = new FormData();
	formData.append('image', file);
	// Billing é opcional: quando cobrada, o upvox autoriza antes e o motor valida
	// este id e liquida/estorna. Sem id → rodada livre (ferramenta sem cobrança).
	if (opts.invocationId) formData.append('invocation_id', opts.invocationId);

	const {
		material,
		width_mm,
		dpi,
		noDither,
		ditherAlgorithm,
		cleanBackground,
		bgMargin,
	} = opts.params;
	formData.append('material', material);
	formData.append('width_mm', String(width_mm));
	if (dpi !== undefined) formData.append('dpi', String(dpi));
	// O motor só observa noDither quando presente e === 'true'.
	if (noDither) formData.append('noDither', 'true');
	if (ditherAlgorithm) formData.append('ditherAlgorithm', ditherAlgorithm);
	// Limpeza de fundo (opt-in); só envia quando ligada.
	if (cleanBackground) {
		formData.append('cleanBackground', 'true');
		if (bgMargin !== undefined) formData.append('bgMargin', String(bgMargin));
	}

	const { data } = await api.post('/api/laser-prep', formData);
	return laserPrepResultSchema.parse(data);
}
