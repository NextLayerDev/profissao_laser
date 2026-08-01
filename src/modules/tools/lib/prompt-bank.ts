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
	key: 'criacao' | 'tema' | 'referencias' | 'variacoes' | 'gerar';
	label: string;
}

/**
 * Opções do stepper: `creations` (cards do Passo 1) e `returnVariations`
 * (toggles do Passo 3) vêm da definition da tool — quando ausentes/vazios,
 * a etapa correspondente é omitida (tool legada segue só tema/referências/gerar).
 */
export interface StepsOptions {
	creations?: unknown[];
	returnVariations?: number[];
}

/**
 * Deriva as etapas do stepper a partir do modo + campos avançados da tool:
 * - `criacao`     → só se a tool tem `creations` (Passo 1: Tipo de Criação)
 * - `variacoes`   → só se a tool tem `returnVariations` (Passo 2: 1×/2×/4×)
 * - `tema`        → modos com texto (Passo "Detalhes", linha própria)
 * - `referencias` → modos com imagem
 * - `gerar`       → sempre (última)
 *
 * Ordem visual = ordem do stepper: Tipo → Variações → Detalhes (tema/refs) → Gerar.
 * O card "Detalhes" ocupa sua própria linha full-width abaixo dos cards compactos.
 */
export function stepsForMode(mode: string, opts?: StepsOptions): PromptStep[] {
	const steps: PromptStep[] = [];
	if (opts?.creations?.length) steps.push({ key: 'criacao', label: 'Tipo' });
	if (opts?.returnVariations?.length)
		steps.push({ key: 'variacoes', label: 'Variações' });
	if (modeUsesText(mode)) steps.push({ key: 'tema', label: 'Detalhes' });
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
