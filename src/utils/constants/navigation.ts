import {
	BarChart3,
	CalendarDays,
	Home,
	Package,
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
		name: 'Agendamentos',
		icon: CalendarDays,
		href: '/appointments',
		hasDropdown: false,
	},
	// { name: 'Parcerias', icon: Users, href: '/partnership', hasDropdown: false },
];
