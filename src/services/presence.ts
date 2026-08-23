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

/**
 * Assinantes pagantes (active + trialing) via contagem dedicada do upvox.
 *
 * Não usa `/v1/admin/analytics/sales/summary`: aquele endpoint agrega
 * assinatura a assinatura (e, sem filtro de data, a base inteira), o que é caro
 * demais pra um card de topo de tela. `/v1/admin/students/stats` é só count.
 */
export async function getPayingMembersCount(): Promise<number> {
	const { data } = await apiCourses.get<{ paying: number }>(
		'/v1/admin/students/stats',
	);
	return data.paying ?? 0;
}
