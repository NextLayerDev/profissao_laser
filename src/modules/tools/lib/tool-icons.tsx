'use client';

import {
	Aperture,
	Box,
	Cpu,
	Flame,
	Image as ImageIcon,
	Layers,
	type LucideIcon,
	type LucideProps,
	PenTool,
	Scissors,
	Sparkles,
	Stamp,
	Sun,
	Wand2,
	Wrench,
	Zap,
} from 'lucide-react';
import { type ComponentType, forwardRef, useEffect, useState } from 'react';

/**
 * Ícones que uma tool da Fábrica pode usar (guardado em `ui.icon` na definition).
 *
 * Dois universos convivem aqui:
 *  1. NOMES LEGADOS curtos ('wrench', 'flame', 'wand'…) — usados em seeds antigos
 *     e no picker fixo original. Resolvem SÍNCRONO (ícone já importado), zero lazy.
 *  2. NOMES PascalCase do lucide ('Rocket', 'PawPrint'…) escolhidos pelo novo
 *     picker completo. Esses são resolvidos LAZY: `resolveToolIcon` devolve um
 *     wrapper que só carrega o mapa `icons` (1671 ícones) do lucide quando de fato
 *     renderiza, com o `Wrench` como placeholder. Assim o chunk gigante NÃO entra
 *     no bundle da nav do cliente (que importa este arquivo).
 */
export const TOOL_ICONS: { name: string; Icon: LucideIcon }[] = [
	{ name: 'wrench', Icon: Wrench },
	{ name: 'flame', Icon: Flame },
	{ name: 'pen', Icon: PenTool },
	{ name: 'image', Icon: ImageIcon },
	{ name: 'wand', Icon: Wand2 },
	{ name: 'sparkles', Icon: Sparkles },
	{ name: 'scissors', Icon: Scissors },
	{ name: 'stamp', Icon: Stamp },
	{ name: 'sun', Icon: Sun },
	{ name: 'layers', Icon: Layers },
	{ name: 'zap', Icon: Zap },
	{ name: 'cpu', Icon: Cpu },
	{ name: 'aperture', Icon: Aperture },
	{ name: 'box', Icon: Box },
];

/**
 * Mapa de nomes que resolvem SÍNCRONO (sem lazy chunk). Inclui os curtos legados
 * + alguns alias úteis que NÃO existem mais no mapa `icons` do lucide 0.564
 * (ex.: `Wand2`/`wand2` viraram `WandSparkles`, mas o componente `Wand2` ainda é
 * exportado por nome). Manter aqui garante que seeds como `prompts_magicos`
 * ('wand2') continuem certos sem precisar do lazy.
 */
const SYNC_BY_NAME = new Map<string, LucideIcon>([
	...TOOL_ICONS.map((t) => [t.name, t.Icon] as const),
	// aliases / nomes PascalCase já importados → instantâneo
	['wand2', Wand2],
	['Wand2', Wand2],
	['Wrench', Wrench],
	['Flame', Flame],
	['PenTool', PenTool],
	['Image', ImageIcon],
	['ImageIcon', ImageIcon],
	['Sparkles', Sparkles],
	['Scissors', Scissors],
	['Stamp', Stamp],
	['Sun', Sun],
	['Layers', Layers],
	['Zap', Zap],
	['Cpu', Cpu],
	['Aperture', Aperture],
	['Box', Box],
]);

/** Normaliza um nome arbitrário para PascalCase (ex.: 'paw-print' → 'PawPrint'). */
function toPascalCase(name: string): string {
	return name
		.split(/[\s_-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
}

// Cache do mapa lucide já carregado (evita re-importar a cada render).
type LucideIconMap = Record<string, LucideIcon>;
let loadedIcons: LucideIconMap | null = null;
let iconsPromise: Promise<LucideIconMap> | null = null;

function loadLucideIcons(): Promise<LucideIconMap> {
	if (loadedIcons) return Promise.resolve(loadedIcons);
	if (!iconsPromise) {
		iconsPromise = import('lucide-react').then((mod) => {
			loadedIcons = mod.icons as unknown as LucideIconMap;
			return loadedIcons;
		});
	}
	return iconsPromise;
}

function pickFromMap(map: LucideIconMap, rawName: string): LucideIcon | null {
	return map[rawName] ?? map[toPascalCase(rawName)] ?? null;
}

/**
 * Resolve um ícone do lucide pelo nome (PascalCase, normalizando se preciso) de
 * forma LAZY: enquanto o mapa não carrega — ou se o nome não existir — mostra o
 * `Wrench`. Encaminha `className`/`size`/`color` etc. pro ícone real, então
 * `<item.icon className="h-5 w-5" />` segue funcionando na sidebar.
 */
function makeLazyToolIcon(rawName: string): LucideIcon {
	const Lazy = forwardRef<SVGSVGElement, LucideProps>((props, ref) => {
		const [Resolved, setResolved] = useState<LucideIcon | null>(() =>
			loadedIcons ? pickFromMap(loadedIcons, rawName) : null,
		);

		useEffect(() => {
			if (Resolved) return;
			let active = true;
			loadLucideIcons().then((map) => {
				if (!active) return;
				const found = pickFromMap(map, rawName) ?? Wrench;
				setResolved(() => found);
			});
			return () => {
				active = false;
			};
		}, [Resolved]);

		const Icon = Resolved ?? Wrench;
		return <Icon ref={ref} {...props} />;
	});
	Lazy.displayName = `ToolIcon(${rawName})`;
	return Lazy as unknown as LucideIcon;
}

// Cache de wrappers lazy por nome (mesma referência de componente entre renders).
const lazyCache = new Map<string, LucideIcon>();

export function resolveToolIcon(name?: string | null): LucideIcon {
	if (!name) return Wrench;
	// (a) legados curtos + aliases já importados → síncrono, sem chunk extra.
	const sync = SYNC_BY_NAME.get(name);
	if (sync) return sync;
	// (b) qualquer nome PascalCase do lucide → wrapper lazy (chunk on-demand).
	const cached = lazyCache.get(name);
	if (cached) return cached;
	const lazy = makeLazyToolIcon(name);
	lazyCache.set(name, lazy);
	return lazy;
}

export type ToolIconComponent = ComponentType<{ className?: string }>;
