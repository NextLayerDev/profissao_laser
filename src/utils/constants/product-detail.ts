import {
	FileText,
	Globe,
	LayoutDashboard,
	MonitorPlay,
	Ticket,
	Users,
} from 'lucide-react';

export const productMenuItems = [
	{ id: 'painel', label: 'Painel', icon: LayoutDashboard },
	{ id: 'informacoes', label: 'Informações básicas', icon: FileText },
	{ id: 'conteudo', label: 'Conteúdo do curso', icon: MonitorPlay },
	{ id: 'cupons', label: 'Cupons', icon: Ticket },
	{ id: 'membros', label: 'Área de membros', icon: Users },
	{ id: 'pagina', label: 'Página do produto', icon: Globe },
];

export const productConfigItems = [
	{ label: 'Imagem', completed: true },
	{ label: 'Descrição', completed: true },
	{ label: 'Preço', completed: true },
	{ label: 'Módulos', completed: true },
	{ label: 'Aulas', completed: true },
	{ label: 'Ofertas', completed: true },
	{ label: 'Impostos', completed: true },
	{ label: 'Pagamento', completed: true },
];

export const productStats = [
	{ value: '1', label: 'Módulos', color: 'text-white' },
	{ value: '1', label: 'Aulas', color: 'text-white' },
	{ value: '1', label: 'Assinantes ativos', color: 'text-emerald-400' },
	{ value: '0', label: 'Afiliados ativos', color: 'text-white' },
];
