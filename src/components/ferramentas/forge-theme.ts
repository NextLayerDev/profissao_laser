import { resolveToolIcon } from '@/modules/tools/lib/tool-icons';
import type { PortType } from './block-catalog';

/**
 * Tema "forge" compartilhado pelo builder e pelo canvas de nós: classes literais
 * por accent (Tailwind não enxerga classe interpolada), cores de porta por tipo,
 * keyframes e o helper de ícone.
 */

export interface AccentClasses {
	bar: string;
	chip: string;
	cardHover: string;
	nodeHover: string;
	badge: string;
	ico: string;
	text: string;
	ring: string;
	selBorder: string;
}

export const ACCENTS: Record<string, AccentClasses> = {
	emerald: {
		bar: 'bg-emerald-400/70',
		chip: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20',
		cardHover: 'hover:border-emerald-400/50 hover:shadow-emerald-500/40',
		nodeHover: 'hover:border-emerald-400/50',
		badge: 'bg-emerald-500/20 text-emerald-300 ring-emerald-400/30',
		ico: 'bg-emerald-500/15 text-emerald-300',
		text: 'text-emerald-300',
		ring: 'ring-emerald-400/40',
		selBorder: 'border-emerald-400/70',
	},
	sky: {
		bar: 'bg-sky-400/70',
		chip: 'bg-sky-500/15 text-sky-300 ring-sky-400/20',
		cardHover: 'hover:border-sky-400/50 hover:shadow-sky-500/40',
		nodeHover: 'hover:border-sky-400/50',
		badge: 'bg-sky-500/20 text-sky-300 ring-sky-400/30',
		ico: 'bg-sky-500/15 text-sky-300',
		text: 'text-sky-300',
		ring: 'ring-sky-400/40',
		selBorder: 'border-sky-400/70',
	},
	cyan: {
		bar: 'bg-cyan-400/70',
		chip: 'bg-cyan-500/15 text-cyan-300 ring-cyan-400/20',
		cardHover: 'hover:border-cyan-400/50 hover:shadow-cyan-500/40',
		nodeHover: 'hover:border-cyan-400/50',
		badge: 'bg-cyan-500/20 text-cyan-300 ring-cyan-400/30',
		ico: 'bg-cyan-500/15 text-cyan-300',
		text: 'text-cyan-300',
		ring: 'ring-cyan-400/40',
		selBorder: 'border-cyan-400/70',
	},
	amber: {
		bar: 'bg-amber-400/70',
		chip: 'bg-amber-500/15 text-amber-300 ring-amber-400/20',
		cardHover: 'hover:border-amber-400/50 hover:shadow-amber-500/40',
		nodeHover: 'hover:border-amber-400/50',
		badge: 'bg-amber-500/20 text-amber-300 ring-amber-400/30',
		ico: 'bg-amber-500/15 text-amber-300',
		text: 'text-amber-300',
		ring: 'ring-amber-400/40',
		selBorder: 'border-amber-400/70',
	},
	orange: {
		bar: 'bg-orange-400/70',
		chip: 'bg-orange-500/15 text-orange-300 ring-orange-400/20',
		cardHover: 'hover:border-orange-400/50 hover:shadow-orange-500/40',
		nodeHover: 'hover:border-orange-400/50',
		badge: 'bg-orange-500/20 text-orange-300 ring-orange-400/30',
		ico: 'bg-orange-500/15 text-orange-300',
		text: 'text-orange-300',
		ring: 'ring-orange-400/40',
		selBorder: 'border-orange-400/70',
	},
	violet: {
		bar: 'bg-violet-400/70',
		chip: 'bg-violet-500/15 text-violet-300 ring-violet-400/20',
		cardHover: 'hover:border-violet-400/50 hover:shadow-violet-500/40',
		nodeHover: 'hover:border-violet-400/50',
		badge: 'bg-violet-500/20 text-violet-300 ring-violet-400/30',
		ico: 'bg-violet-500/15 text-violet-300',
		text: 'text-violet-300',
		ring: 'ring-violet-400/40',
		selBorder: 'border-violet-400/70',
	},
	fuchsia: {
		bar: 'bg-fuchsia-400/70',
		chip: 'bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/20',
		cardHover: 'hover:border-fuchsia-400/50 hover:shadow-fuchsia-500/40',
		nodeHover: 'hover:border-fuchsia-400/50',
		badge: 'bg-fuchsia-500/20 text-fuchsia-300 ring-fuchsia-400/30',
		ico: 'bg-fuchsia-500/15 text-fuchsia-300',
		text: 'text-fuchsia-300',
		ring: 'ring-fuchsia-400/40',
		selBorder: 'border-fuchsia-400/70',
	},
	slate: {
		bar: 'bg-slate-400/70',
		chip: 'bg-slate-500/15 text-slate-300 ring-slate-400/20',
		cardHover: 'hover:border-slate-400/50 hover:shadow-slate-500/40',
		nodeHover: 'hover:border-slate-400/50',
		badge: 'bg-slate-500/20 text-slate-300 ring-slate-400/30',
		ico: 'bg-slate-500/15 text-slate-300',
		text: 'text-slate-300',
		ring: 'ring-slate-400/40',
		selBorder: 'border-slate-400/70',
	},
};

export const ac = (a?: string): AccentClasses =>
	ACCENTS[a ?? ''] ?? ACCENTS.emerald;

/** Cor (hex) de cada tipo de porta — pros handles do canvas + legenda. */
export const PORT_HEX: Record<PortType, string> = {
	buffer: '#38bdf8', // sky — imagem/arquivo
	string: '#34d399', // emerald — texto/svg/url
	number: '#fbbf24', // amber — número
};

/** Rótulo amigável do tipo de porta (legenda). */
export const PORT_LABEL: Record<PortType, string> = {
	buffer: 'imagem',
	string: 'texto/arquivo',
	number: 'número',
};

export { resolveToolIcon };
