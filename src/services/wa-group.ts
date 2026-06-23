import { apiCourses } from '@/shared/lib/api-courses';

export type WaGroupAction = 'add' | 'remove' | null;

export interface WaGroupRow {
	subscription_id: string;
	customer_id: string;
	name: string | null;
	email: string | null;
	phone: string | null;
	status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
	current_period_end: string;
	cancel_at_period_end: boolean;
	wa_group_added: boolean;
	wa_group_added_at: string | null;
	wa_group_removed_at: string | null;
	action: WaGroupAction;
}

export interface WaGroupList {
	rows: WaGroupRow[];
	total: number;
	counts: { to_add: number; to_remove: number; in_group: number };
}

/** Assinantes do plano com a marcação do grupo de WhatsApp (staff/admin). */
export async function listWaGroup(params: {
	plan_key?: string;
	limit?: number;
	offset?: number;
}): Promise<WaGroupList> {
	const { data } = await apiCourses.get<WaGroupList>('/v1/admin/wa-group', {
		params,
	});
	return data;
}

/** Marca manualmente adicionado/removido do grupo. */
export async function setWaGroup(
	subscriptionId: string,
	added: boolean,
): Promise<void> {
	await apiCourses.patch(`/v1/admin/subscriptions/${subscriptionId}/wa-group`, {
		added,
	});
}
