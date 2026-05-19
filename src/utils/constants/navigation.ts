import {
	BarChart3,
	CalendarClock,
	Eye,
	Headphones,
	HelpCircle,
	Home,
	Link2,
	MessageSquare,
	Package,
	PenLine,
	ShieldCheck,
	ShoppingCart,
	SlidersHorizontal,
	Users,
} from 'lucide-react';
import type { NavItem } from '@/types/navigation';

export const navItems: NavItem[] = [
	{ name: 'Home', icon: Home, href: '/dashboard', hasDropdown: false },
	{ name: 'Produtos', icon: Package, href: '/products', hasDropdown: false },
	{ name: 'Vendas', icon: ShoppingCart, href: '/sales', hasDropdown: false },
	{ name: 'Links', icon: Link2, href: '/links', hasDropdown: false },
	{
		name: 'Relatórios',
		icon: BarChart3,
		href: '/reports',
		hasDropdown: false,
	},
	{
		name: 'Comunidade',
		icon: MessageSquare,
		href: '/community',
		hasDropdown: false,
	},
	{
		name: 'Fórum',
		icon: HelpCircle,
		href: '/forum',
		hasDropdown: false,
	},
	{
		name: 'Agendamentos',
		icon: CalendarClock,
		href: '/agendamentos',
		hasDropdown: false,
	},
	{ name: 'Suporte', icon: Headphones, href: '/suporte', hasDropdown: false },
	{
		name: 'Parametros',
		icon: SlidersHorizontal,
		href: '/parametros',
		hasDropdown: false,
	},
	{ name: 'Acessos', icon: ShieldCheck, href: '/acessos', hasDropdown: false },
	{ name: 'Alunos', icon: Users, href: '/alunos', hasDropdown: false },
	{ name: 'Previas IA', icon: Eye, href: '/previas-admin', hasDropdown: false },
	{
		name: 'Vetorizacao',
		icon: PenLine,
		href: '/vetorizacao-admin',
		hasDropdown: false,
	},
];
