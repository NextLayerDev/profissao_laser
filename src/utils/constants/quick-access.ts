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
	section: 'CONTEUDO' | 'COMUNIDADE' | 'FERRAMENTAS';
	featureKey?: FeatureKey;
	href?: string;
};

export const quickAccessItems: QuickAccessItem[] = [
	{
		label: 'Aulas Gravadas',
		description: 'Acesse todo o conteudo',
		Icon: Play,
		section: 'CONTEUDO',
		featureKey: 'aula',
		href: '/course/jornada',
	},
	{
		label: 'Suporte on-line',
		description: 'Tire suas duvidas',
		Icon: Headphones,
		section: 'CONTEUDO',
		featureKey: 'suporte',
		href: '/course/duvidas',
	},
	{
		label: 'Biblioteca',
		description: 'Vetores e arquivos',
		Icon: BookOpen,
		section: 'CONTEUDO',
		featureKey: 'vetorizacao',
		href: '/course/biblioteca-vetores',
	},
	{
		label: 'Vetorizacao',
		description: 'Aprenda a vetorizar',
		Icon: PenLine,
		section: 'CONTEUDO',
		featureKey: 'vetorizacao',
		href: '/course/vetorizacao',
	},
	{
		label: 'Previas',
		description: 'Visualize antes',
		Icon: Eye,
		section: 'FERRAMENTAS',
		href: '/course/previas',
	},
	{
		label: 'Parametros',
		description: 'Ajuste suas configs',
		Icon: SlidersHorizontal,
		section: 'FERRAMENTAS',
		href: '/course/parametros',
	},
	{
		label: 'Forum',
		description: 'Discuta com a comunidade',
		Icon: MessageCircle,
		section: 'COMUNIDADE',
		featureKey: 'comunidade',
		href: '/course/forum',
	},
	{
		label: 'Chat',
		description: 'Converse em tempo real',
		Icon: MessageSquare,
		section: 'COMUNIDADE',
		featureKey: 'comunidade',
		href: '/course/comunity',
	},
	{
		label: 'Fornecedores',
		description: 'Lista de fornecedores',
		Icon: ShoppingBag,
		section: 'FERRAMENTAS',
		href: '/course/fornecedores',
	},
	{
		label: 'Eventos e Lives',
		description: 'Fique por dentro',
		Icon: Radio,
		section: 'COMUNIDADE',
		href: '/course/eventos',
	},
	{
		label: 'Membros',
		description: 'Conheca a comunidade',
		Icon: Users,
		section: 'COMUNIDADE',
		href: '/course/membros',
	},
	{
		label: 'Vitrine de Projetos',
		description: 'Inspire-se',
		Icon: LayoutGrid,
		section: 'COMUNIDADE',
		href: '/course/vitrine',
	},
	{
		label: 'Canva',
		description: 'Templates e designs',
		Icon: Palette,
		section: 'FERRAMENTAS',
		href: '/course/canva',
	},
	{
		label: 'Fornecedores Vendas',
		description: 'Venda seus produtos',
		Icon: Truck,
		section: 'FERRAMENTAS',
	},
];
