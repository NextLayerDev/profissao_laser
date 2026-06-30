'use client';

import { createContext, useContext } from 'react';
import { TOOL_COLORS, type ToolColorKey } from '@/utils/constants/tool-colors';
import type {
	AiToolDefinition,
	ScreenUi,
} from '../services/tool-definitions.service';
import { categoryColor } from './tool-categories';

/**
 * Aparência das telas de uma tool de PIPELINE (Banco do Admin / Prompts Mágicos
 * e similares). Espelha o `room-ui` das salas, porém mais simples: o admin
 * personaliza a tela do Admin (`ui.admin`) e a do Cliente (`ui.customer`) a
 * partir do builder — cor de destaque, tema, título/subtítulo e um banner.
 * Ausência de customização = visual padrão (fúcsia dos Prompts Mágicos).
 */

/** Padrão fúcsia (cor histórica do "Banco do Admin" / Prompts Mágicos). */
export const DEFAULT_SCREEN_ACCENT = '#d946ef';
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Aparência resolvida da tela atual (admin/cliente), pronta p/ o renderer. */
export interface ResolvedScreenUi {
	accent: string;
	/** Classe de tema p/ o container raiz: '' (segue o app), 'dark' ou 'room-light'. */
	themeClass: string;
	/** Título customizado do topo (undefined = usar o padrão da tela). */
	title?: string;
	/** Subtítulo customizado do topo (undefined = usar o padrão da tela). */
	subtitle?: string;
	notice: ScreenUi['notice'];
}

const DEFAULT_RESOLVED: ResolvedScreenUi = {
	accent: DEFAULT_SCREEN_ACCENT,
	themeClass: '',
	title: undefined,
	subtitle: undefined,
	notice: null,
};

/** Lê `definition.ui[screen]` e devolve a aparência resolvida da tela. */
export function resolveScreenUi(
	def: AiToolDefinition | undefined,
	screen: 'admin' | 'customer',
): ResolvedScreenUi {
	const ui = def?.definition.ui as
		| { admin?: ScreenUi; customer?: ScreenUi }
		| undefined;
	const s = (screen === 'admin' ? ui?.admin : ui?.customer) ?? {};
	const accent =
		s.accent && HEX.test(s.accent) ? s.accent : DEFAULT_SCREEN_ACCENT;
	const themeClass =
		s.theme === 'dark' ? 'dark' : s.theme === 'light' ? 'room-light' : '';
	return {
		accent,
		themeClass,
		title: s.title?.trim() || undefined,
		subtitle: s.subtitle?.trim() || undefined,
		notice: s.notice ?? null,
	};
}

/** Context p/ as sub-telas lerem a aparência sem prop-drilling. */
export const ScreenUiContext =
	createContext<ResolvedScreenUi>(DEFAULT_RESOLVED);
export const useScreenUi = () => useContext(ScreenUiContext);

/**
 * Hex do acento por chave de cor de tool (espelha as famílias Tailwind de
 * `TOOL_COLORS`, tom 500). `--screen-accent`/`color-mix` precisam de hex.
 */
const COLOR_HEX: Partial<Record<ToolColorKey, string>> = {
	aulas: '#3b82f6',
	suporte: '#f97316',
	biblioteca: '#f59e0b',
	vetorizacao: '#22c55e',
	gravacao: '#ef4444',
	previas: '#ec4899',
	voxxys: '#8b5cf6',
	parametros: '#06b6d4',
	forum: '#6366f1',
	chat: '#14b8a6',
	fornecedores: '#eab308',
	eventos: '#f43f5e',
	membros: '#d946ef',
	vitrine: '#0ea5e9',
};

/**
 * Acento (hex) da tela de uma tool, com identidade por categoria:
 * cor customizada do admin (`ui.customer.accent`) > chave própria (`ui.color`)
 * > cor da categoria (`categoryColor`) > padrão fúcsia. Usado pra dirigir
 * `--screen-accent` no Estúdio sem tocar o banco.
 */
export function accentForTool(def: AiToolDefinition | undefined): string {
	const ui = def?.definition.ui as
		| { customer?: { accent?: string }; color?: string; category?: string }
		| undefined;
	const custom = ui?.customer?.accent;
	if (custom && HEX.test(custom)) return custom;
	const ownKey =
		ui?.color && ui.color in TOOL_COLORS
			? (ui.color as ToolColorKey)
			: categoryColor(ui?.category);
	return COLOR_HEX[ownKey] ?? DEFAULT_SCREEN_ACCENT;
}

/** Estilo inline da cor de destaque (sólido) via CSS var herdada do root. */
export const screenAccentBg = { backgroundColor: 'var(--screen-accent)' };
export const screenAccentText = { color: 'var(--screen-accent)' };
/** Fundo tingido (12%) da cor de destaque — p/ ícones/realces suaves. */
export const screenAccentTint = {
	backgroundColor: 'color-mix(in srgb, var(--screen-accent) 12%, transparent)',
	color: 'var(--screen-accent)',
};
