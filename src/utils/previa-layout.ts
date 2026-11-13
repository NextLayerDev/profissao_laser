import type { PreviaLayout, PreviaLayoutBox } from '@/types/previas';

// Onde cada elemento (logo, texto, 2º texto) cai na foto do produto. Tudo
// normalizado de 0 a 1 em relação à FOTO: x, y = centro; w, h = tamanho antes
// da rotação; rot em graus, sentido horário. O mesmo formato vai para o motor.

export type LayoutKey = 'logo' | 'texto' | 'texto2';
export const LAYOUT_KEYS: LayoutKey[] = ['logo', 'texto', 'texto2'];

export const LAYOUT_LABEL: Record<LayoutKey, string> = {
	logo: 'Imagem',
	texto: 'Texto',
	texto2: '2º texto',
};

const MIN_SIDE = 0.03;

/** Largura do produto na foto quando não dá para medir (copo típico). */
export const PRODUCT_WIDTH_ASSUMED = 0.45;

/** Tamanhos rápidos: fração da LARGURA DO PRODUTO que o elemento ocupa. */
export const SIZE_STEPS = [
	{ key: 'P', label: 'Pequeno', frac: 0.25 },
	{ key: 'M', label: 'Médio', frac: 0.45 },
	{ key: 'G', label: 'Grande', frac: 0.75 },
] as const;

/** Largura da arte em % da foto, por `tamanho` (posição automática). */
const WIDTH_BY_SIZE: Record<string, number> = {
	pequeno: 0.22,
	medio: 0.34,
	grande: 0.48,
	custom: 0.34,
};

/** Centro do conjunto por `posicao` (posição automática). */
const CENTER_BY_POSITION: Record<string, { x: number; y: number }> = {
	central: { x: 0.5, y: 0.52 },
	superior: { x: 0.5, y: 0.34 },
	inferior: { x: 0.5, y: 0.68 },
	lateral: { x: 0.36, y: 0.52 },
	'envolvente-360': { x: 0.5, y: 0.52 },
};

const clamp = (n: number, min: number, max: number) =>
	Math.min(max, Math.max(min, n));

export function normalizeRotation(deg: number): number {
	let r = ((((deg + 180) % 360) + 360) % 360) - 180;
	if (r === -180) r = 180;
	return Math.round(r);
}

/** Proporção (largura/altura) aproximada de uma linha de texto. */
export function textAspect(text: string): number {
	return Math.max(1.6, text.trim().length * 0.56 + 0.4);
}

/**
 * Caixa de largura `w` (fração da foto) para um conteúdo de proporção
 * `aspect`, numa foto de proporção `frameAspect` (largura/altura).
 */
function sized(w: number, aspect: number, frameAspect: number) {
	let width = w;
	let height = (width * frameAspect) / aspect;
	if (height > 0.9) {
		height = 0.9;
		width = (height * aspect) / frameAspect;
	}
	if (width > 1) {
		width = 1;
		height = (width * frameAspect) / aspect;
	}
	return { w: clamp(width, MIN_SIDE, 1), h: clamp(height, MIN_SIDE, 1) };
}

export function clampBox(b: PreviaLayoutBox): PreviaLayoutBox {
	return {
		x: clamp(b.x, 0, 1),
		y: clamp(b.y, 0, 1),
		w: clamp(b.w, MIN_SIDE, 1),
		h: clamp(b.h, MIN_SIDE, 1),
		rot: normalizeRotation(b.rot),
	};
}

/** Mesma caixa (centro e giro) com outra largura, mantendo a proporção. */
export function scaleBox(b: PreviaLayoutBox, factor: number): PreviaLayoutBox {
	const max = Math.min(1 / b.w, 1 / b.h);
	const min = Math.max(MIN_SIDE / b.w, MIN_SIDE / b.h);
	const f = clamp(factor, min, max);
	return clampBox({ ...b, w: b.w * f, h: b.h * f });
}

/** Largura da caixa em fração da largura do produto. */
export function productFraction(w: number, productWidth: number | null) {
	return Math.min(1, w / (productWidth ?? PRODUCT_WIDTH_ASSUMED));
}

/** Caixa com a largura de um dos tamanhos rápidos (P/M/G). */
export function boxWithProductFraction(
	b: PreviaLayoutBox,
	frac: number,
	productWidth: number | null,
): PreviaLayoutBox {
	const target = frac * (productWidth ?? PRODUCT_WIDTH_ASSUMED);
	return scaleBox(b, target / b.w);
}

/**
 * Onde a posição automática (tamanho + posição + rotação do avançado) põe
 * cada elemento: a imagem e, embaixo, o texto e o 2º texto, empilhados e
 * centrados no ponto da posição escolhida. É o ponto de partida do editor.
 */
export function autoLayout(p: {
	logoAspect: number | null;
	texto: string;
	texto2: string;
	tamanho: string;
	posicao: string;
	rotacao: number;
	frameAspect: number;
}): PreviaLayout {
	const fa = p.frameAspect > 0 ? p.frameAspect : 1;
	const base =
		p.posicao === 'envolvente-360' ? 0.7 : (WIDTH_BY_SIZE[p.tamanho] ?? 0.34);
	const parts: { key: LayoutKey; w: number; h: number }[] = [];
	if (p.logoAspect) {
		parts.push({ key: 'logo', ...sized(base, p.logoAspect, fa) });
	}
	const textMax = p.logoAspect ? Math.max(base, 0.2) * 1.1 : 0.6;
	for (const [key, text, k] of [
		['texto', p.texto, 1],
		['texto2', p.texto2, 0.85],
	] as const) {
		if (!text.trim()) continue;
		const w = clamp(text.trim().length * 0.03, 0.12, textMax) * k;
		parts.push({ key, ...sized(w, textAspect(text), fa) });
	}
	const gap = 0.02;
	const total =
		parts.reduce((s, part) => s + part.h, 0) + gap * (parts.length - 1);
	const center = CENTER_BY_POSITION[p.posicao] ?? CENTER_BY_POSITION.central;
	let top = clamp(center.y - total / 2, 0.02, Math.max(0.02, 0.98 - total));
	const out: PreviaLayout = {};
	for (const part of parts) {
		out[part.key] = clampBox({
			x: center.x,
			y: top + part.h / 2,
			w: part.w,
			h: part.h,
			rot: p.rotacao || 0,
		});
		top += part.h + gap;
	}
	return out;
}

/**
 * Largura do produto na foto (0..1): a caixa do que não é fundo liso, lida
 * num canvas pequeno. Null se a foto não deixar ler (CORS) ou o fundo não for
 * liso o bastante — aí vale `PRODUCT_WIDTH_ASSUMED`.
 */
export function measureProductWidth(url: string): Promise<number | null> {
	return new Promise((resolve) => {
		const img = new window.Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			try {
				const S = 96;
				const ratio = img.naturalWidth / img.naturalHeight || 1;
				const w = ratio >= 1 ? S : Math.round(S * ratio);
				const h = ratio >= 1 ? Math.round(S / ratio) : S;
				const canvas = document.createElement('canvas');
				canvas.width = w;
				canvas.height = h;
				const ctx = canvas.getContext('2d');
				if (!ctx) return resolve(null);
				ctx.drawImage(img, 0, 0, w, h);
				const d = ctx.getImageData(0, 0, w, h).data;
				const bg = [d[0], d[1], d[2]];
				let minX = w;
				let maxX = -1;
				for (let y = 0; y < h; y++) {
					for (let x = 0; x < w; x++) {
						const i = (y * w + x) * 4;
						const diff =
							Math.abs(d[i] - bg[0]) +
							Math.abs(d[i + 1] - bg[1]) +
							Math.abs(d[i + 2] - bg[2]);
						if (d[i + 3] > 20 && diff > 60) {
							if (x < minX) minX = x;
							if (x > maxX) maxX = x;
						}
					}
				}
				const frac = maxX >= minX ? (maxX - minX + 1) / w : 0;
				resolve(frac > 0.1 && frac < 0.95 ? frac : null);
			} catch {
				resolve(null);
			}
		};
		img.onerror = () => resolve(null);
		img.src = url;
	});
}
