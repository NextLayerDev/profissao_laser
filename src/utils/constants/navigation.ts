import {
	BarChart3,
	Home,
	Package,
	ShoppingCart,
	Users,
	Wrench,
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
	{ name: 'Parcerias', icon: Users, href: '/parcerias', hasDropdown: true },
	{
		name: 'Ferramentas',
		icon: Wrench,
		href: '/ferramentas',
		hasDropdown: true,
	},
];
