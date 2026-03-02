import type { ClassTier } from '@/types/classes';

export const TIER_STYLES: Record<
	ClassTier,
	{
		gradient: string;
		badge: string;
		label: string;
		glow: string;
		divider: string;
	}
> = {
	prata: {
		gradient: 'from-slate-700 via-slate-500 to-slate-400',
		badge: 'bg-slate-400/20 text-slate-300 border border-slate-500/40',
		label: 'Prata',
		glow: 'hover:shadow-slate-500/20',
		divider: 'border-slate-600/30',
	},
	ouro: {
		gradient: 'from-amber-700 via-yellow-500 to-amber-400',
		badge: 'bg-amber-400/20 text-amber-300 border border-amber-500/40',
		label: 'Ouro',
		glow: 'hover:shadow-amber-500/20',
		divider: 'border-amber-600/30',
	},
	platina: {
		gradient: 'from-violet-700 via-purple-500 to-cyan-400',
		badge: 'bg-violet-400/20 text-violet-300 border border-violet-500/40',
		label: 'Platina',
		glow: 'hover:shadow-violet-500/20',
		divider: 'border-violet-600/30',
	},
};

export const TIER_OPTIONS: { value: ClassTier; label: string }[] = [
	{ value: 'prata', label: 'Prata' },
	{ value: 'ouro', label: 'Ouro' },
	{ value: 'platina', label: 'Platina' },
];
