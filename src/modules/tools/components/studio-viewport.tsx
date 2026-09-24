'use client';

import type { ComponentProps } from 'react';
import { StudioPreview } from './studio-preview';
import { type Assembly, ModelViewport } from './viewport/model-viewport';
import {
	type QuoteBreakdownLike,
	QuoteViewport,
} from './viewport/quote-viewport';
import { TurntableViewport } from './viewport/turntable-viewport';
import { type VectorLayer, VectorViewport } from './viewport/vector-viewport';

/**
 * Despachante de VIEWPORT do Estúdio, dirigido por `ui.result.kind`.
 *
 * É um ENVELOPE, não uma reescrita: `kind` ausente (ou `'image'`) cai no
 * `StudioPreview` de sempre, então as ~100 tools já publicadas não mudam de
 * comportamento em nada. Ligar essa chave é o que transforma o Estúdio em tela
 * de CAD ou de orçamento sem criar um `ui.layout` novo para cada uma.
 *
 * A chave `ui.result.kind` já existia no schema desde o começo — só nunca teve
 * consumidor.
 */

export type ResultKind = 'image' | 'vector' | 'model3d' | 'quote' | 'table';

type PreviewProps = ComponentProps<typeof StudioPreview>;

export interface StudioViewportProps extends PreviewProps {
	kind?: ResultKind;
	/** Saída do run — de onde saem SVG, camadas e dimensões. */
	output?: Record<string, unknown>;
	/** Paths declarados em `ui.result` (`layersFrom`, `framesFrom`, …). */
	sources?: {
		layersFrom?: string;
		framesFrom?: string;
		modelFrom?: string;
		quoteFrom?: string;
		/** Prévia da peça e texto do orçamento do cliente (`kind: 'quote'`). */
		previewFrom?: string;
		publicFrom?: string;
	};
	/**
	 * Montagem vinda do preview AO VIVO (`/preview` → `assembly`). Tem prioridade
	 * sobre a do `output`: enquanto o usuário mexe nos sliders, o run cobrado está
	 * desatualizado, e mostrar a peça antiga sobre parâmetros novos é pior que não
	 * mostrar nada.
	 */
	liveAssembly?: unknown;
}

/** Resolve `output.x` / `x` contra o objeto de saída. */
function pick(output: Record<string, unknown> | undefined, path?: string) {
	if (!output || !path) return undefined;
	return output[path.startsWith('output.') ? path.slice(7) : path];
}

function asNumber(v: unknown): number | undefined {
	const n = Number(v);
	return Number.isFinite(n) ? n : undefined;
}

/** Montagem só é montagem se tiver peça: `{parts: []}` cairia no 3D vazio. */
function asAssembly(v: unknown): Assembly | undefined {
	if (!v || typeof v !== 'object') return undefined;
	const a = v as Partial<Assembly>;
	return Array.isArray(a.parts) && a.parts.length > 0
		? (a as Assembly)
		: undefined;
}

function asFrames(v: unknown): string[] | undefined {
	if (!Array.isArray(v) || v.length === 0) return undefined;
	return v.every((f) => typeof f === 'string') ? (v as string[]) : undefined;
}

export function StudioViewport({
	kind,
	output,
	sources,
	liveAssembly,
	...previewProps
}: StudioViewportProps) {
	if (kind === 'vector') {
		const svg =
			(pick(output, 'preview') as string | undefined) ??
			(pick(output, 'svg') as string | undefined) ??
			previewProps.resultPreview ??
			previewProps.liveSrc;

		if (svg) {
			const meta = (output?.meta ?? {}) as Record<string, unknown>;
			return (
				<VectorViewport
					svg={svg}
					layers={
						pick(output, sources?.layersFrom) as VectorLayer[] | undefined
					}
					unitsPerMm={asNumber(meta.units_per_mm)}
					widthMm={asNumber(meta.width_mm)}
					heightMm={asNumber(meta.height_mm)}
				/>
			);
		}
		// Sem SVG ainda (primeiro load, ou o run não produziu): cai no preview
		// padrão, que já sabe desenhar esqueleto e estado vazio.
	}

	if (kind === 'model3d') {
		// Ordem deliberada: montagem real (WebGL) > mesa giratória de PNGs >
		// preview de imagem. A mesa giratória não é consolo, é o caminho que
		// funciona em celular fraco — e custa 0 KB de bundle.
		const assembly =
			asAssembly(liveAssembly) ??
			asAssembly(pick(output, sources?.modelFrom)) ??
			asAssembly(pick(output, 'assembly'));
		if (assembly) {
			const meta = (output?.meta ?? {}) as Record<string, unknown>;
			const material = meta.material;
			return (
				<ModelViewport
					assembly={assembly}
					materialHint={typeof material === 'string' ? material : undefined}
				/>
			);
		}

		const frames =
			asFrames(pick(output, sources?.framesFrom)) ??
			asFrames(pick(output, 'frames'));
		if (frames) return <TurntableViewport frames={frames} />;
		// Sem montagem e sem quadros: cai no preview de imagem abaixo.
	}

	if (kind === 'quote') {
		const bd =
			(pick(output, sources?.quoteFrom) as QuoteBreakdownLike | undefined) ??
			(pick(output, 'breakdown') as QuoteBreakdownLike | undefined);

		// Só entra no viewport de orçamento quando existe orçamento. Antes do
		// primeiro run, `bd` é undefined e o preview padrão já sabe desenhar o
		// estado vazio — repetir isso aqui seria só uma tela vazia a mais.
		if (bd && typeof bd === 'object') {
			const publico =
				pick(output, sources?.publicFrom) ?? pick(output, 'quote_public');
			return (
				<QuoteViewport
					breakdown={bd}
					preview={
						(pick(output, sources?.previewFrom) as string | undefined) ??
						(pick(output, 'preview') as string | undefined) ??
						// `resultPreview` é `string | null` no contrato do preview antigo.
						previewProps.resultPreview ??
						undefined
					}
					publico={typeof publico === 'string' ? publico : undefined}
				/>
			);
		}
	}

	// `table` ainda não tem viewport próprio — cai no preview de imagem, que
	// desenha esqueleto e estado vazio. Melhor isso do que uma tela em branco.
	return <StudioPreview {...previewProps} />;
}
