import type { ToolBankEntry } from '../services/tool-bank.service';

/**
 * Helpers compartilhados da experiência "Prompts Mágicos" (Banco do Admin do
 * lado do cliente). Fonte única de verdade pra ler o `mode`/`max_images` de um
 * registro e derivar rótulos/etapas — usado pelo `DynamicToolView` (wiring) e
 * pelos sub-componentes de UI (`PromptGallery` / `PromptGenerateView`), pra
 * NÃO reinventar a leitura de `data` em cada lugar.
 */

/** Modos suportados de um registro do banco. */
export type PromptMode = 'texto' | 'imagem' | 'texto_imagem';

/** O `mode` do registro determina quais inputs o cliente preenche. */
export function modeOf(entry: ToolBankEntry): string {
	const m = entry.data?.mode;
	return typeof m === 'string' ? m : 'texto';
}

/** Lê `data.max_images` de um registro e clampa em 1–3 (default 1). */
export function maxImagesOf(entry: ToolBankEntry): number {
	const raw = entry.data?.max_images;
	const n =
		typeof raw === 'number'
			? raw
			: typeof raw === 'string'
				? Number.parseInt(raw, 10)
				: 1;
	if (!Number.isFinite(n)) return 1;
	return Math.min(3, Math.max(1, Math.trunc(n)));
}

/** Imagem de capa do registro (depois ?? antes). */
export function coverOf(entry: ToolBankEntry): string | null {
	return entry.example_after_url ?? entry.example_before_url ?? null;
}

/** Rótulo amigável do modo, pra badges. */
export function modeLabel(mode: string): string {
	if (mode === 'imagem') return 'Imagem';
	if (mode === 'texto_imagem') return 'Texto + Imagem';
	return 'Texto';
}

/** O modo usa entrada de texto (tema)? */
export function modeUsesText(mode: string): boolean {
	return mode.includes('texto');
}

/** O modo usa imagem(ns) de referência? */
export function modeUsesImage(mode: string): boolean {
	return mode.includes('imagem');
}

/** Uma etapa do fluxo de geração (stepper). */
export interface PromptStep {
	key: 'tema' | 'referencias' | 'gerar';
	label: string;
}

/**
 * Deriva as etapas do stepper a partir do modo:
 * - `texto_imagem` → [Tema, Referências, Gerar]
 * - `texto`        → [Tema, Gerar]
 * - `imagem`       → [Referências, Gerar]
 */
export function stepsForMode(mode: string): PromptStep[] {
	const steps: PromptStep[] = [];
	if (modeUsesText(mode)) steps.push({ key: 'tema', label: 'Tema' });
	if (modeUsesImage(mode))
		steps.push({ key: 'referencias', label: 'Referências' });
	steps.push({ key: 'gerar', label: 'Gerar' });
	return steps;
}

/**
 * Baixa uma URL como arquivo (fetch→blob), com fallback de abrir em nova aba.
 * O anchor é anexado ao DOM antes do click (Firefox ignora click programático
 * em anchor solto) e o object URL é revogado num tick posterior (revogar na
 * hora aborta o download em alguns navegadores).
 */
export async function downloadUrl(url: string, name: string): Promise<void> {
	try {
		const res = await fetch(url);
		const blob = await res.blob();
		const objectUrl = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = objectUrl;
		a.download = name;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
	} catch {
		window.open(url, '_blank');
	}
}
