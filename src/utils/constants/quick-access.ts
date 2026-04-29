import {
	Bookmark,
	Compass,
	FolderOpen,
	HeadphonesIcon,
	LayoutGrid,
	type LucideIcon,
	MessageCircle,
	MessageSquare,
	PenLine,
	Store,
} from 'lucide-react';
import type { FeatureKey } from '@/types/classes';

export type QuickAccessItem = {
	label: string;
	Icon: LucideIcon;
	gradient: string;
	cardBg: string;
	featureKey?: FeatureKey;
	href?: string;
};

export const quickAccessItems: QuickAccessItem[] = [
	{
		label: 'Jornada',
		Icon: Compass,
		gradient: 'from-blue-500 to-cyan-600',
		cardBg: 'from-blue-100 to-white dark:from-blue-500/15 dark:to-[#1a1a1d]',
		featureKey: 'aula',
		href: '/course/jornada',
	},
	{
		label: 'Dúvidas',
		Icon: MessageSquare,
		gradient: 'from-purple-500 to-indigo-600',
		cardBg:
			'from-purple-100 to-white dark:from-purple-500/15 dark:to-[#1a1a1d]',
		featureKey: 'chat',
		href: '/course/duvidas',
	},
	{
		label: 'Vetorização',
		Icon: PenLine,
		gradient: 'from-violet-600 to-fuchsia-600',
		cardBg:
			'from-violet-100 to-white dark:from-violet-600/15 dark:to-[#1a1a1d]',
		featureKey: 'vetorizacao',
		href: '/course/vetorizacao',
	},
	{
		label: 'Aulas Salvas',
		Icon: Bookmark,
		gradient: 'from-orange-500 to-amber-500',
		cardBg:
			'from-orange-100 to-white dark:from-orange-500/15 dark:to-[#1a1a1d]',
		featureKey: 'aula',
	},
	{
		label: 'Biblioteca de Vetores',
		Icon: FolderOpen,
		gradient: 'from-emerald-500 to-teal-600',
		cardBg:
			'from-emerald-100 to-white dark:from-emerald-500/15 dark:to-[#1a1a1d]',
		featureKey: 'vetorizacao',
		href: '/course/biblioteca-vetores',
	},
	{
		label: 'Fórum',
		Icon: MessageCircle,
		gradient: 'from-rose-500 to-pink-600',
		cardBg: 'from-rose-100 to-white dark:from-rose-500/15 dark:to-[#1a1a1d]',
		featureKey: 'comunidade',
		href: '/course/forum',
	},
	{
		label: 'Fornecedores',
		Icon: Store,
		gradient: 'from-green-500 to-emerald-600',
		cardBg: 'from-green-100 to-white dark:from-green-500/15 dark:to-[#1a1a1d]',
		href: '/course/fornecedores',
	},
	{
		label: 'Vitrine',
		Icon: LayoutGrid,
		gradient: 'from-sky-500 to-blue-600',
		cardBg: 'from-sky-100 to-white dark:from-sky-500/15 dark:to-[#1a1a1d]',
		href: '/course/vitrine',
	},
	{
		label: 'Suporte',
		Icon: HeadphonesIcon,
		gradient: 'from-amber-500 to-orange-500',
		cardBg: 'from-amber-100 to-white dark:from-amber-500/15 dark:to-[#1a1a1d]',
		featureKey: 'suporte',
		href: '/course/duvidas',
	},
];
