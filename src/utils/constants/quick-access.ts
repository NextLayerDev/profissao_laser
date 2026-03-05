import {
	Bookmark,
	Compass,
	type LucideIcon,
	MessageSquare,
	PenLine,
} from 'lucide-react';
import type { FeatureKey } from '@/types/classes';

export type QuickAccessItem = {
	label: string;
	Icon: LucideIcon;
	gradient: string;
	featureKey: FeatureKey;
	href?: string;
};

export const quickAccessItems: QuickAccessItem[] = [
	{
		label: 'Jornada',
		Icon: Compass,
		gradient: 'from-blue-500 to-cyan-600',
		featureKey: 'aula',
		href: '/jornada',
	},
	{
		label: 'Dúvidas',
		Icon: MessageSquare,
		gradient: 'from-purple-500 to-indigo-600',
		featureKey: 'chat',
		href: '/duvidas',
	},
	{
		label: 'Vetorização',
		Icon: PenLine,
		gradient: 'from-violet-600 to-fuchsia-600',
		featureKey: 'vetorizacao',
		href: '/vetorizacao',
	},
	{
		label: 'Aulas Salvas',
		Icon: Bookmark,
		gradient: 'from-orange-500 to-amber-500',
		featureKey: 'aula',
	},
];
