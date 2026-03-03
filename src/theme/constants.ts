export const THEME_LIGHT = {
	bg: 'bg-slate-50',
	bgSecondary: 'bg-white',
	bgTertiary: 'bg-slate-100',
	bgCard: 'bg-white',
	bgInput: 'bg-slate-100',
	text: 'text-slate-900',
	textMuted: 'text-slate-600',
	textSubtle: 'text-slate-500',
	border: 'border-slate-200',
	borderMuted: 'border-slate-100',
	accent: 'text-violet-600',
	accentMuted: 'text-violet-500',
	bgAccent: 'bg-violet-600',
	bgAccentHover: 'hover:bg-violet-500',
	bgAccentMuted: 'bg-violet-500/20',
	borderAccent: 'border-violet-500/50',
	gradientBg: 'from-slate-100 via-white to-slate-50',
	gradientAccent: 'from-violet-600 to-purple-600',
} as const;

export const THEME_DARK = {
	bg: 'bg-[#0d0d0f]',
	bgSecondary: 'bg-[#1a1a1d]',
	bgTertiary: 'bg-white/5',
	bgCard: 'bg-white/5',
	bgInput: 'bg-white/5',
	text: 'text-white',
	textMuted: 'text-gray-400',
	textSubtle: 'text-slate-500',
	border: 'border-gray-800',
	borderMuted: 'border-white/10',
	accent: 'text-violet-400',
	accentMuted: 'text-violet-400',
	bgAccent: 'bg-violet-600',
	bgAccentHover: 'hover:bg-violet-500',
	bgAccentMuted: 'bg-violet-500/20',
	borderAccent: 'border-violet-500/50',
	gradientBg: 'from-[#12103a] via-[#0d0b1e] to-[#0a0818]',
	gradientAccent: 'from-violet-600 to-purple-600',
} as const;

export type Theme = 'light' | 'dark';

export type ThemeClasses = typeof THEME_LIGHT | typeof THEME_DARK;
