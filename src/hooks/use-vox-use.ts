import { useQuery } from '@tanstack/react-query';
import { getVoxUseSummary } from '@/services/vox-use';

export function useVoxUseSummary(period: { from?: string; to?: string }) {
	return useQuery({
		queryKey: ['vox-use', period],
		queryFn: () => getVoxUseSummary(period),
		placeholderData: (prev) => prev,
	});
}
