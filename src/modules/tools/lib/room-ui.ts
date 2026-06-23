'use client';

import { createContext, useContext } from 'react';
import type { AiToolDefinition } from '../services/tool-definitions.service';

/** Aparência de UMA tela da sala (aluno OU admin). Espelha o backend. */
export interface RoomScreenUi {
	accent?: string;
	theme?: 'app' | 'light' | 'dark';
	labels?: Record<string, string>;
	notice?: {
		type?: 'info' | 'warning' | 'success';
		title?: string;
		message?: string;
	} | null;
	sections?: { materials?: boolean; chat?: boolean };
}

export interface RoomUi {
	customer?: RoomScreenUi;
	admin?: RoomScreenUi;
}

export const DEFAULT_ROOM_ACCENT = '#ff3b30';
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Aparência resolvida da tela atual, pronta p/ o renderer. */
export interface ResolvedRoomUi {
	accent: string;
	/** Classe de tema p/ o container raiz: '' (segue o app), 'dark' ou 'room-light'. */
	themeClass: string;
	notice: RoomScreenUi['notice'];
	/** Texto: override do label ou o fallback padrão. */
	L: (key: string, fallback: string) => string;
	/** Visibilidade combinada (feature da sala × override desta tela). */
	showMaterials: (feature: boolean) => boolean;
	showChat: (feature: boolean) => boolean;
}

const DEFAULT_RESOLVED: ResolvedRoomUi = {
	accent: DEFAULT_ROOM_ACCENT,
	themeClass: '',
	notice: null,
	L: (_k, fallback) => fallback,
	showMaterials: (feature) => feature,
	showChat: (feature) => feature,
};

/** Lê `definition.room.ui[screen]` e devolve a aparência resolvida da tela. */
export function resolveRoomUi(
	def: AiToolDefinition | undefined,
	isAdmin: boolean,
): ResolvedRoomUi {
	const room = (def?.definition as { room?: { ui?: RoomUi } } | undefined)
		?.room;
	const screen = (isAdmin ? room?.ui?.admin : room?.ui?.customer) ?? {};
	const accent =
		screen.accent && HEX.test(screen.accent)
			? screen.accent
			: DEFAULT_ROOM_ACCENT;
	const themeClass =
		screen.theme === 'dark'
			? 'dark'
			: screen.theme === 'light'
				? 'room-light'
				: '';
	return {
		accent,
		themeClass,
		notice: screen.notice ?? null,
		L: (key, fallback) => screen.labels?.[key]?.trim() || fallback,
		showMaterials: (feature) => (screen.sections?.materials ?? true) && feature,
		showChat: (feature) => (screen.sections?.chat ?? true) && feature,
	};
}

/** Context p/ as sub-telas (cards/modais) lerem labels sem prop-drilling. */
export const RoomUiContext = createContext<ResolvedRoomUi>(DEFAULT_RESOLVED);
export const useRoomUi = () => useContext(RoomUiContext);

/** Estilo inline da cor de destaque (sólido) via CSS var herdada do root. */
export const accentBg = { backgroundColor: 'var(--room-accent)' };
export const accentText = { color: 'var(--room-accent)' };
/** Fundo tingido (12%) da cor de destaque — p/ ícones/realces suaves. */
export const accentTint = {
	backgroundColor: 'color-mix(in srgb, var(--room-accent) 12%, transparent)',
	color: 'var(--room-accent)',
};
