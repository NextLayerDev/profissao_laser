import type { ChannelMessage } from '@/types/community';
import type { User } from '@/types/users';

export interface UserDisplayMap {
	byEmail: Map<string, string>;
	byId: Map<string, string>;
}

/** Constrói mapa email/id → nome a partir da lista de users */
export function buildUserDisplayMap(users: User[]): UserDisplayMap {
	return {
		byEmail: new Map(users.map((u) => [u.email.toLowerCase(), u.name])),
		byId: new Map(users.map((u) => [u.id, u.name])),
	};
}

/** Exibe nome em vez de email para mensagens de users (admins/técnicos) */
export function getMessageDisplayName(
	msg: ChannelMessage,
	userMap: UserDisplayMap,
): string {
	if (msg.userName) return msg.userName;
	const byId = userMap.byId.get(msg.user);
	if (byId) return byId;
	const byEmail = userMap.byEmail.get(msg.user.toLowerCase());
	if (byEmail) return byEmail;
	if (msg.user.includes('@')) return msg.user.split('@')[0] ?? msg.user;
	return msg.user;
}
