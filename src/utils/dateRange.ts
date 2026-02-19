export type Period = '7d' | '30d' | '90d' | '1y' | 'all';

export function getDateRange(period: Period): { from: Date; to: Date } {
	const to = new Date();
	to.setHours(23, 59, 59, 999);
	const from = new Date();
	from.setHours(0, 0, 0, 0);
	switch (period) {
		case '7d':
			from.setDate(from.getDate() - 6);
			break;
		case '30d':
			from.setDate(from.getDate() - 29);
			break;
		case '90d':
			from.setDate(from.getDate() - 89);
			break;
		case '1y':
			from.setFullYear(from.getFullYear() - 1);
			break;
		case 'all':
			from.setFullYear(2000);
			break;
	}
	return { from, to };
}
