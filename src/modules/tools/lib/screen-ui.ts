'use client';

import { createContext, useContext } from 'react';
import type {
	AiToolDefinition,
	ScreenUi,
} from '../services/tool-definitions.service';

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

/** Estilo inline da cor de destaque (sólido) via CSS var herdada do root. */
export const screenAccentBg = { backgroundColor: 'var(--screen-accent)' };
export const screenAccentText = { color: 'var(--screen-accent)' };
/** Fundo tingido (12%) da cor de destaque — p/ ícones/realces suaves. */
export const screenAccentTint = {
	backgroundColor: 'color-mix(in srgb, var(--screen-accent) 12%, transparent)',
	color: 'var(--screen-accent)',
};
