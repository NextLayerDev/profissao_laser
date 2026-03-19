export const SC_OPTIONS = [
	{ key: 'gerenciamentoSistema' as const, label: 'Sistema de Gerenciamento' },
	{ key: 'iaPrevias' as const, label: 'IA Prévias' },
	{ key: 'iaWhatsappPrevias' as const, label: 'IA WhatsApp Prévias' },
];

export type ScOptionKey =
	| 'gerenciamentoSistema'
	| 'iaPrevias'
	| 'iaWhatsappPrevias';
