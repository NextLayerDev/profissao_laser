import type { SystemClass } from '@/types/system-classes';

export const SC_OPTIONS: {
	key: keyof Pick<SystemClass, 'prata' | 'gold' | 'platina'>;
	label: string;
}[] = [
	{ key: 'prata', label: 'Suporte Prata' },
	{ key: 'gold', label: 'Suporte Gold' },
	{ key: 'platina', label: 'Suporte Platina' },
];
