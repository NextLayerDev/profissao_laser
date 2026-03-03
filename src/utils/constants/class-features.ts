import type { CustomerFeatures, FeatureKey } from '@/types/classes';

export const FULL_FEATURES: CustomerFeatures = {
	aula: true,
	chat: true,
	vetorizacao: true,
	suporte: true,
	comunidade: true,
};

export const CLASS_FEATURES: { key: FeatureKey; label: string }[] = [
	{ key: 'aula', label: 'Aulas' },
	{ key: 'chat', label: 'Chat' },
	{ key: 'vetorizacao', label: 'Vetorização' },
	{ key: 'suporte', label: 'Suporte' },
	{ key: 'comunidade', label: 'Comunidade' },
];
