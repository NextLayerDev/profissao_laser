import { api } from '@/lib/fetch';
import { apiCourses } from '@/shared/lib/api-courses';

/** Marca o aluno como visto agora — alimenta o "online" dos membros. */
export async function sendPresenceHeartbeat(): Promise<void> {
	await api.post('/community/presence/heartbeat', {});
}

export interface PresenceSummary {
	totalMembers: number;
	onlineNow: number;
}

/** Totais p/ visão admin (staff): membros cadastrados + online agora. */
export async function getPresenceSummary(): Promise<PresenceSummary> {
	const { data } = await api.get<PresenceSummary>(
		'/community/presence/summary',
	);
	return data;
}

/** Assinantes pagantes (active + trialing) via analytics do upvox. */
export async function getPayingMembersCount(): Promise<number> {
	const { data } = await apiCourses.get<{
		totals_by_status: { active: number; trialing: number };
	}>('/v1/admin/analytics/sales/summary');
	return (
		(data.totals_by_status?.active ?? 0) +
		(data.totals_by_status?.trialing ?? 0)
	);
}
