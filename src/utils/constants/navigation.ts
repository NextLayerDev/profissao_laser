import {
	BarChart3,
	Home,
	MessageSquare,
	Package,
	ShieldCheck,
	ShoppingCart,
} from 'lucide-react';
import type { NavItem } from '@/types/navigation';

export const navItems: NavItem[] = [
	{ name: 'Home', icon: Home, href: '/', hasDropdown: false },
	{ name: 'Produtos', icon: Package, href: '/products', hasDropdown: false },
	{ name: 'Vendas', icon: ShoppingCart, href: '/sales', hasDropdown: false },
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
	{ name: 'Acessos', icon: ShieldCheck, href: '/acessos', hasDropdown: false },
];
