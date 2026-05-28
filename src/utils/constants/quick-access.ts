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
import { Voxxys3DIcon } from '@/components/ui/voxxys-icon';
import type { FeatureKey } from '@/types/classes';
import { TOOL_COLORS } from './tool-colors';

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
	/** Ícone-imagem (ex.: logo 3D): renderiza maior e sem o box branco atrás. */
	iconBare?: boolean;
};

export const quickAccessItems: QuickAccessItem[] = [
	{
		label: 'Aulas Gravadas',
		description: 'Acesse todo o conteudo',
		Icon: Play,
		section: 'CONTEUDO',
		featureKey: 'aula',
		href: '/course/jornada',
		...TOOL_COLORS.aulas,
	},
	{
		label: 'Suporte on-line',
		description: 'Tire suas duvidas',
		Icon: Headphones,
		section: 'CONTEUDO',
		featureKey: 'suporte',
		href: '/course/duvidas',
		...TOOL_COLORS.suporte,
	},
	{
		label: 'Biblioteca',
		description: 'Vetores e arquivos',
		Icon: BookOpen,
		section: 'CONTEUDO',
		featureKey: 'vetorizacao',
		href: '/course/biblioteca-vetores',
		...TOOL_COLORS.biblioteca,
	},
	{
		label: 'Vetorizacao',
		description: 'Aprenda a vetorizar',
		Icon: PenLine,
		section: 'FERRAMENTAS',
		featureKey: 'vetorizacao',
		href: '/course/vetorizacao',
		...TOOL_COLORS.vetorizacao,
	},
	{
		label: 'Previas',
		description: 'Visualize antes',
		Icon: Eye,
		section: 'FERRAMENTAS',
		href: '/course/previas',
		...TOOL_COLORS.previas,
	},
	{
		label: 'Voxxys',
		description: 'Saldo e pacotes',
		Icon: Voxxys3DIcon,
		section: 'FERRAMENTAS',
		href: '/course/voxes',
		iconBare: true,
		...TOOL_COLORS.voxxys,
	},
	{
		label: 'Parametros',
		description: 'Ajuste suas configs',
		Icon: SlidersHorizontal,
		section: 'FERRAMENTAS',
		href: '/course/parametros',
		...TOOL_COLORS.parametros,
	},
	{
		label: 'Forum',
		description: 'Discuta com a comunidade',
		Icon: MessageCircle,
		section: 'COMUNIDADE',
		featureKey: 'comunidade',
		href: '/course/forum',
		...TOOL_COLORS.forum,
	},
	{
		label: 'Chat',
		description: 'Converse em tempo real',
		Icon: MessageSquare,
		section: 'COMUNIDADE',
		featureKey: 'comunidade',
		href: '/course/comunity',
		...TOOL_COLORS.chat,
	},
	{
		label: 'Fornecedores',
		description: 'Lista de fornecedores',
		Icon: ShoppingBag,
		section: 'FERRAMENTAS',
		href: '/course/fornecedores',
		...TOOL_COLORS.fornecedores,
	},
	{
		label: 'Eventos e Lives',
		description: 'Fique por dentro',
		Icon: Radio,
		section: 'COMUNIDADE',
		href: '/course/eventos',
		...TOOL_COLORS.eventos,
	},
	{
		label: 'Membros',
		description: 'Conheca a comunidade',
		Icon: Users,
		section: 'COMUNIDADE',
		href: '/course/membros',
		...TOOL_COLORS.membros,
	},
	{
		label: 'Vitrine de Projetos',
		description: 'Inspire-se',
		Icon: LayoutGrid,
		section: 'COMUNIDADE',
		href: '/course/vitrine',
		...TOOL_COLORS.vitrine,
	},
	{
		label: 'Canva',
		description: 'Templates e designs',
		Icon: Palette,
		section: 'FERRAMENTAS',
		href: '/course/canva',
		...TOOL_COLORS.canva,
	},
	{
		label: 'Fornecedores Vendas',
		description: 'Venda seus produtos',
		Icon: Truck,
		section: 'FERRAMENTAS',
		...TOOL_COLORS.fornecedoresVendas,
	},
];
