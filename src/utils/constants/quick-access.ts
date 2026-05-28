import {
	BookOpen,
	Eye,
	Headphones,
	LayoutGrid,
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
import type { ComponentType } from 'react';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import type { FeatureKey } from '@/types/classes';

export type QuickAccessItem = {
	label: string;
	description: string;
	Icon: ComponentType<{ className?: string }>;
	section: 'CONTEUDO' | 'COMUNIDADE' | 'FERRAMENTAS';
	featureKey?: FeatureKey;
	href?: string;
	/** Tailwind gradient classes (mesma paleta da landing). */
	gradient: string;
	/** Cor sólida sutil pro ícone no modo compacto (sidebar). */
	iconBg: string;
};

export const quickAccessItems: QuickAccessItem[] = [
	{
		label: 'Aulas Gravadas',
		description: 'Acesse todo o conteudo',
		Icon: Play,
		section: 'CONTEUDO',
		featureKey: 'aula',
		href: '/course/jornada',
		gradient: 'from-violet-600 to-violet-900',
		iconBg: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
	},
	{
		label: 'Suporte on-line',
		description: 'Tire suas duvidas',
		Icon: Headphones,
		section: 'CONTEUDO',
		featureKey: 'suporte',
		href: '/course/duvidas',
		gradient: 'from-orange-400 to-orange-700',
		iconBg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
	},
	{
		label: 'Biblioteca',
		description: 'Vetores e arquivos',
		Icon: BookOpen,
		section: 'CONTEUDO',
		featureKey: 'vetorizacao',
		href: '/course/biblioteca-vetores',
		gradient: 'from-amber-400 to-amber-700',
		iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
	},
	{
		label: 'Vetorizacao',
		description: 'Aprenda a vetorizar',
		Icon: PenLine,
		section: 'FERRAMENTAS',
		featureKey: 'vetorizacao',
		href: '/course/vetorizacao',
		gradient: 'from-green-500 to-green-700',
		iconBg: 'bg-green-500/15 text-green-600 dark:text-green-400',
	},
	{
		label: 'Previas',
		description: 'Visualize antes',
		Icon: Eye,
		section: 'FERRAMENTAS',
		href: '/course/previas',
		gradient: 'from-pink-500 to-pink-800',
		iconBg: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
	},
	{
		label: 'Voxxys',
		description: 'Saldo e pacotes',
		Icon: VoxxysIcon,
		section: 'FERRAMENTAS',
		href: '/course/voxes',
		gradient: 'from-yellow-400 to-amber-600',
		iconBg: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
	},
	{
		label: 'Parametros',
		description: 'Ajuste suas configs',
		Icon: SlidersHorizontal,
		section: 'FERRAMENTAS',
		href: '/course/parametros',
		gradient: 'from-cyan-500 to-cyan-700',
		iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
	},
	{
		label: 'Forum',
		description: 'Discuta com a comunidade',
		Icon: MessageCircle,
		section: 'COMUNIDADE',
		featureKey: 'comunidade',
		href: '/course/forum',
		gradient: 'from-purple-600 to-purple-800',
		iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
	},
	{
		label: 'Chat',
		description: 'Converse em tempo real',
		Icon: MessageSquare,
		section: 'COMUNIDADE',
		featureKey: 'comunidade',
		href: '/course/comunity',
		gradient: 'from-teal-500 to-teal-700',
		iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
	},
	{
		label: 'Fornecedores',
		description: 'Lista de fornecedores',
		Icon: ShoppingBag,
		section: 'FERRAMENTAS',
		href: '/course/fornecedores',
		gradient: 'from-amber-400 to-amber-700',
		iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
	},
	{
		label: 'Eventos e Lives',
		description: 'Fique por dentro',
		Icon: Radio,
		section: 'COMUNIDADE',
		href: '/course/eventos',
		gradient: 'from-rose-500 to-rose-800',
		iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
	},
	{
		label: 'Membros',
		description: 'Conheca a comunidade',
		Icon: Users,
		section: 'COMUNIDADE',
		href: '/course/membros',
		gradient: 'from-violet-600 to-indigo-600',
		iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
	},
	{
		label: 'Vitrine de Projetos',
		description: 'Inspire-se',
		Icon: LayoutGrid,
		section: 'COMUNIDADE',
		href: '/course/vitrine',
		gradient: 'from-pink-500 to-pink-700',
		iconBg: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
	},
	{
		label: 'Canva',
		description: 'Templates e designs',
		Icon: Palette,
		section: 'FERRAMENTAS',
		href: '/course/canva',
		gradient: 'from-cyan-500 to-blue-800',
		iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
	},
	{
		label: 'Fornecedores Vendas',
		description: 'Venda seus produtos',
		Icon: Truck,
		section: 'FERRAMENTAS',
		gradient: 'from-emerald-500 to-emerald-700',
		iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
	},
];
