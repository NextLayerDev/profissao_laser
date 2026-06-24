import {
	Aperture,
	Box,
	Cpu,
	Flame,
	Image as ImageIcon,
	Layers,
	type LucideIcon,
	PenTool,
	Scissors,
	Sparkles,
	Stamp,
	Sun,
	Wand2,
	Wrench,
	Zap,
} from 'lucide-react';

/**
 * Ícones que uma tool da Fábrica pode usar (guardado em `ui.icon` na definition).
 * Usado pelo builder, pelo renderer e pela nav — o nome é estável; o componente
 * é resolvido aqui.
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

const BY_NAME = new Map(TOOL_ICONS.map((t) => [t.name, t.Icon]));

export function resolveToolIcon(name?: string | null): LucideIcon {
	return (name && BY_NAME.get(name)) || Wrench;
}
