import {
	Bookmark,
	Compass,
	type LucideIcon,
	MessageSquare,
	PenLine,
	Play,
} from 'lucide-react';

export type FeatureKey =
	| 'aula'
	| 'chat'
	| 'vetorizacao'
	| 'suporte'
	| 'comunidade';

export type QuickAccessItem = {
	label: string;
	Icon: LucideIcon;
	gradient: string;
	featureKey: FeatureKey;
};

export const quickAccessItems: QuickAccessItem[] = [
	{
		label: 'Sala de Aula',
		Icon: Play,
		gradient: 'from-violet-600 to-purple-700',
		featureKey: 'aula',
	},
	{
		label: 'Jornada',
		Icon: Compass,
		gradient: 'from-blue-500 to-cyan-600',
		featureKey: 'aula',
	},
	{
		label: 'Dúvidas',
		Icon: MessageSquare,
		gradient: 'from-purple-500 to-indigo-600',
		featureKey: 'chat',
	},
	{
		label: 'Vetorização',
		Icon: PenLine,
		gradient: 'from-violet-600 to-fuchsia-600',
		featureKey: 'vetorizacao',
	},
	{
		label: 'Aulas Salvas',
		Icon: Bookmark,
		gradient: 'from-orange-500 to-amber-500',
		featureKey: 'aula',
	},
];
