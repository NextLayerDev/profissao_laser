import {
	BookOpen,
	Eye,
	Headphones,
	LayoutGrid,
	type LucideIcon,
	MessageCircle,
	MessageSquare,
	Palette,
	PenLine,
	Play,
	Radio,
	ShoppingBag,
	SlidersHorizontal,
	Truck,
	Users,
} from 'lucide-react';
import type { FeatureKey } from '@/types/classes';

export type QuickAccessItem = {
	label: string;
	description: string;
	Icon: LucideIcon;
	gradient: string;
	featureKey?: FeatureKey;
	href?: string;
};

export const quickAccessItems: QuickAccessItem[] = [
	{
		label: 'Aulas Gravadas',
		description: 'Acesse todo o conteudo',
		Icon: Play,
		gradient: 'from-emerald-500 to-teal-500',
		featureKey: 'aula',
		href: '/course/jornada',
	},
	{
		label: 'Suporte on-line',
		description: 'Tire suas duvidas',
		Icon: Headphones,
		gradient: 'from-blue-500 to-blue-600',
		featureKey: 'suporte',
		href: '/course/duvidas',
	},
	{
		label: 'Biblioteca',
		description: 'Vetores e arquivos',
		Icon: BookOpen,
		gradient: 'from-purple-500 to-violet-600',
		featureKey: 'vetorizacao',
		href: '/course/biblioteca-vetores',
	},
	{
		label: 'Vetorizacao',
		description: 'Aprenda a vetorizar',
		Icon: PenLine,
		gradient: 'from-pink-500 to-rose-500',
		featureKey: 'vetorizacao',
		href: '/course/vetorizacao',
	},
	{
		label: 'Previas',
		description: 'Visualize antes',
		Icon: Eye,
		gradient: 'from-rose-500 to-red-500',
		href: '/course/previas',
	},
	{
		label: 'Parametros',
		description: 'Ajuste suas configs',
		Icon: SlidersHorizontal,
		gradient: 'from-emerald-500 to-green-600',
		href: '/course/parametros',
	},
	{
		label: 'Forum',
		description: 'Discuta com a comunidade',
		Icon: MessageCircle,
		gradient: 'from-violet-500 to-indigo-600',
		featureKey: 'comunidade',
		href: '/course/forum',
	},
	{
		label: 'Chat',
		description: 'Converse em tempo real',
		Icon: MessageSquare,
		gradient: 'from-cyan-500 to-blue-500',
		featureKey: 'comunidade',
		href: '/course/comunity',
	},
	{
		label: 'Fornecedores',
		description: 'Lista de fornecedores',
		Icon: ShoppingBag,
		gradient: 'from-blue-600 to-indigo-700',
		href: '/course/fornecedores',
	},
	{
		label: 'Eventos e Lives',
		description: 'Fique por dentro',
		Icon: Radio,
		gradient: 'from-pink-500 to-orange-400',
		href: '/course/eventos',
	},
	{
		label: 'Membros',
		description: 'Conheca a comunidade',
		Icon: Users,
		gradient: 'from-violet-500 to-purple-600',
		href: '/course/membros',
	},
	{
		label: 'Vitrine de Projetos',
		description: 'Inspire-se',
		Icon: LayoutGrid,
		gradient: 'from-sky-400 to-blue-500',
		href: '/course/vitrine',
	},
	{
		label: 'Canva',
		description: 'Templates e designs',
		Icon: Palette,
		gradient: 'from-lime-400 to-green-500',
		href: '/course/canva',
	},
	{
		label: 'Fornecedores Vendas',
		description: 'Venda seus produtos',
		Icon: Truck,
		gradient: 'from-pink-400 to-rose-500',
	},
];
