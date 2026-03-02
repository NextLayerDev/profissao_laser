import {
	AlertCircle,
	BarChart3,
	Clock,
	Package,
	Phone,
	Wrench,
} from 'lucide-react';

export const quickAccessItems = [
	{
		title: 'Meus Produtos',
		subtitle: 'Acessar agora',
		icon: Package,
		iconBg: 'bg-violet-600',
		href: '/products',
	},
	{
		title: 'Ferramentas',
		subtitle: 'Acessar agora',
		icon: Wrench,
		iconBg: 'bg-amber-600',
		href: '/sales',
	},
	{
		title: 'Relatórios',
		subtitle: 'Acessar agora',
		icon: BarChart3,
		iconBg: 'bg-blue-600',
		href: '/reports',
	},
	{
		title: 'Suporte',
		subtitle: 'Acessar agora',
		icon: Phone,
		iconBg: 'bg-blue-600',
		href: '/appointments',
	},
];

export const alerts = [
	{
		title: 'Assinaturas para renovar',
		subtitle: 'Verifique as assinaturas que vencem em breve',
		icon: AlertCircle,
		type: 'warning',
	},
	{
		title: 'Nenhuma campanha agendada',
		subtitle: 'Crie uma campanha de marketing',
		icon: Clock,
		type: 'info',
	},
];
