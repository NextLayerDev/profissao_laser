import { api } from '@/lib/fetch';
import { type Sales, salesSchema } from '@/types/sales';

export async function getSales(): Promise<Sales[]> {
	const { data } = await api.get('/sales');
	return salesSchema.array().parse(data);
}
