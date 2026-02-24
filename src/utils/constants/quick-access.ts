import {
	Bookmark,
	Compass,
	type LucideIcon,
	MessageSquare,
	PenLine,
	Play,
} from 'lucide-react';

export type QuickAccessItem = {
	label: string;
	Icon: LucideIcon;
	gradient: string;
};

export const quickAccessItems: QuickAccessItem[] = [
	{
		label: 'Sala de Aula',
		Icon: Play,
		gradient: 'from-violet-600 to-purple-700',
	},
	{ label: 'Jornada', Icon: Compass, gradient: 'from-blue-500 to-cyan-600' },
	{
		label: 'Dúvidas',
		Icon: MessageSquare,
		gradient: 'from-purple-500 to-indigo-600',
	},
	{
		label: 'Vetorização',
		Icon: PenLine,
		gradient: 'from-violet-600 to-fuchsia-600',
	},
	{
		label: 'Aulas Salvas',
		Icon: Bookmark,
		gradient: 'from-orange-500 to-amber-500',
	},
];
