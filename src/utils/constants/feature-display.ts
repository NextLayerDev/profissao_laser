import {
	BookOpen,
	MessageCircle,
	Pen,
	Shield,
	Sparkles,
	Users,
	Zap,
} from 'lucide-react';

export const FEATURE_ICONS: Record<string, typeof BookOpen> = {
	aula: BookOpen,
	chat: MessageCircle,
	vetorizacao: Pen,
	suporte: Zap,
	comunidade: Users,
	gerenciamentoSistema: Shield,
	iaPrevias: Sparkles,
	iaWhatsappPrevias: MessageCircle,
};

export const FEATURE_DESCRIPTIONS: Record<string, string> = {
	aula: 'Aulas completas do básico ao avançado com conteúdo atualizado',
	chat: 'Tire dúvidas em tempo real com nossos especialistas',
	vetorizacao: 'Serviço de vetorização profissional para seus projetos',
	suporte: 'Suporte técnico especializado via WhatsApp e acesso remoto',
	comunidade: 'Acesso ao grupo exclusivo de profissionais do mercado laser',
	gerenciamentoSistema: 'Acesso completo ao sistema de gerenciamento',
	iaPrevias: 'Geração de prévias automáticas com Inteligência Artificial',
	iaWhatsappPrevias: 'Envio de prévias via WhatsApp com IA integrada',
};
