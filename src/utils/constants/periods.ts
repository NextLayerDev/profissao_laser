import type { GroupBy } from '@/utils/sales-analytics';

export type Period = '7d' | '30d' | '90d' | '1y' | 'all';

export const PERIODS: { value: Period; label: string; groupBy: GroupBy }[] = [
	{ value: '7d', label: '7 dias', groupBy: 'day' },
	{ value: '30d', label: '30 dias', groupBy: 'day' },
	{ value: '90d', label: '90 dias', groupBy: 'week' },
	{ value: '1y', label: '1 ano', groupBy: 'month' },
	{ value: 'all', label: 'Tudo', groupBy: 'month' },
];
