import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listWaGroup, setWaGroup } from '@/services/wa-group';

const KEY = ['wa-group'] as const;
const PAGE_SIZE = 50;

export function useWaGroup(page: number, planKey = 'pro') {
	const offset = page * PAGE_SIZE;
	return useQuery({
		queryKey: [...KEY, planKey, offset],
		queryFn: () => listWaGroup({ plan_key: planKey, limit: PAGE_SIZE, offset }),
		placeholderData: (prev) => prev,
	});
}

export function useSetWaGroup() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			subscriptionId,
			added,
		}: {
			subscriptionId: string;
			added: boolean;
		}) => setWaGroup(subscriptionId, added),
		onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
	});
}

export { PAGE_SIZE as WA_GROUP_PAGE_SIZE };
