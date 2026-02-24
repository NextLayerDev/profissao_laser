import type { CreateSubscriptionPayload } from '@/types/subscription';

export const SUBSCRIPTION_INTERVALS = ['day', 'week', 'month', 'year'] as const;

export type CsvSubscriptionRow = CreateSubscriptionPayload & { _line: number };

export function parseSubscriptionCsv(
	text: string,
	stripeProductId: string,
): { rows: CsvSubscriptionRow[]; errors: string[] } {
	const lines = text.trim().split(/\r?\n/);
	if (lines.length < 2)
		return { rows: [], errors: ['Arquivo CSV vazio ou sem dados.'] };

	const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
	const expected = ['email', 'amount', 'interval', 'intervalcount', 'endsat'];
	const missing = expected.filter((e) => !header.includes(e));
	if (missing.length > 0) {
		return {
			rows: [],
			errors: [`Colunas faltando no CSV: ${missing.join(', ')}`],
		};
	}

	const idx = (col: string) => header.indexOf(col);
	const rows: CsvSubscriptionRow[] = [];
	const errors: string[] = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const cols = line.split(',').map((c) => c.trim());
		const email = cols[idx('email')] ?? '';
		const amountRaw = cols[idx('amount')] ?? '';
		const interval = cols[idx('interval')] ?? '';
		const intervalCountRaw = cols[idx('intervalcount')] ?? '';
		const endsAt = cols[idx('endsat')] ?? '';

		const lineErrors: string[] = [];

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
			lineErrors.push('e-mail inválido');

		const amount = parseFloat(amountRaw);
		if (Number.isNaN(amount) || amount < 0) lineErrors.push('amount inválido');

		if (
			!SUBSCRIPTION_INTERVALS.includes(
				interval as (typeof SUBSCRIPTION_INTERVALS)[number],
			)
		)
			lineErrors.push(
				`interval deve ser: ${SUBSCRIPTION_INTERVALS.join(' | ')}`,
			);

		const intervalCount = parseInt(intervalCountRaw, 10);
		if (Number.isNaN(intervalCount) || intervalCount < 1)
			lineErrors.push('intervalCount deve ser inteiro ≥ 1');

		if (lineErrors.length > 0) {
			errors.push(`Linha ${i + 1}: ${lineErrors.join('; ')}`);
			continue;
		}

		rows.push({
			_line: i + 1,
			email,
			stripeProductId,
			amount,
			interval: interval as CsvSubscriptionRow['interval'],
			intervalCount,
			endsAt: endsAt ? new Date(endsAt).toISOString() : '',
		});
	}

	return { rows, errors };
}
