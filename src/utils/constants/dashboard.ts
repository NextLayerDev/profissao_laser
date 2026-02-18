import {
	AlertCircle,
	BarChart3,
	Clock,
	Package,
	Users2,
	Wrench,
} from 'lucide-react';

export const quickAccessItems = [
	{
		title: 'Meus Produtos',
		subtitle: 'Acessar agora',
		icon: Package,
		iconBg: 'bg-violet-600',
	},
	{
		title: 'Ferramentas',
		subtitle: 'Acessar agora',
		icon: Wrench,
		iconBg: 'bg-amber-600',
	},
	{
		title: 'Relatórios',
		subtitle: 'Acessar agora',
		icon: BarChart3,
		iconBg: 'bg-blue-600',
	},
	{
		title: 'Afiliados',
		subtitle: 'Acessar agora',
		icon: Users2,
		iconBg: 'bg-rose-600',
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
