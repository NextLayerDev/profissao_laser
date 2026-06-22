import { z } from 'zod';
import { api } from '@/lib/fetch';

/**
 * Mentoria (tool `room_v1`) — sessões de vídeo/lives gateadas. A main API
 * (`api`, mesmo gateway da comunidade) faz o gating por plano/voxes, respeita o
 * cap e só revela o link externo (Zoom/Meet) a quem pode entrar.
 */

export const mentorshipSessionSchema = z.object({
	id: z.string(),
	toolKey: z.string(),
	title: z.string(),
	description: z.string().nullable().optional(),
	date: z.string(),
	time: z.string().nullable().optional(),
	durationMin: z.number().default(60),
	joinOpensMinutesBefore: z.number().default(10),
	cap: z.number().nullable().optional(),
	recordingUrl: z.string().nullable().optional(),
	hostId: z.string().nullable().optional(),
});
export type MentorshipSession = z.infer<typeof mentorshipSessionSchema>;

export const sessionAttendeeSchema = z.object({
	customerId: z.string(),
	customerName: z.string().nullable(),
	customerImage: z.string().nullable(),
	joinedAt: z.string(),
});
export type SessionAttendee = z.infer<typeof sessionAttendeeSchema>;

export const roomStateSchema = z.object({
	session: mentorshipSessionSchema,
	isOpen: z.boolean(),
	isLive: z.boolean(),
	hasEnded: z.boolean(),
	startsAt: z.string(),
	opensAt: z.string(),
	attendees: z.array(sessionAttendeeSchema),
	activeCount: z.number(),
	hasJoined: z.boolean(),
	access: z.enum(['included', 'pay', 'blocked']),
	voxCost: z.number(),
	externalUrl: z.string().nullable(),
});
export type RoomState = z.infer<typeof roomStateSchema>;

export const joinResultSchema = z.object({
	externalUrl: z.string(),
	state: roomStateSchema,
});
export type JoinResult = z.infer<typeof joinResultSchema>;

export interface CreateSessionBody {
	title: string;
	description?: string;
	date: string;
	time?: string;
	durationMin?: number;
	joinOpensMinutesBefore?: number;
	externalUrl: string;
	cap?: number | null;
	recordingUrl?: string | null;
}
export type UpdateSessionBody = Partial<CreateSessionBody>;

/* ── Aluno ── */
export async function listMentorshipSessions(
	toolKey: string,
): Promise<MentorshipSession[]> {
	const { data } = await api.get(
		`/mentorship/${encodeURIComponent(toolKey)}/sessions`,
	);
	return z.array(mentorshipSessionSchema).parse(data);
}

export async function getRoomState(sessionId: string): Promise<RoomState> {
	const { data } = await api.get(
		`/mentorship/sessions/${encodeURIComponent(sessionId)}/room`,
	);
	return roomStateSchema.parse(data);
}

export async function joinSession(
	sessionId: string,
	invocationId?: string,
): Promise<JoinResult> {
	const { data } = await api.post(
		`/mentorship/sessions/${encodeURIComponent(sessionId)}/join`,
		invocationId ? { invocationId } : {},
	);
	return joinResultSchema.parse(data);
}

export async function leaveSession(sessionId: string): Promise<void> {
	await api.post(`/mentorship/sessions/${encodeURIComponent(sessionId)}/leave`);
}

/* ── Admin (staff) ── */
export async function createMentorshipSession(
	toolKey: string,
	body: CreateSessionBody,
): Promise<MentorshipSession> {
	const { data } = await api.post(
		`/mentorship/${encodeURIComponent(toolKey)}/sessions`,
		body,
	);
	return mentorshipSessionSchema.parse(data);
}

export async function updateMentorshipSession(
	id: string,
	body: UpdateSessionBody,
): Promise<MentorshipSession> {
	const { data } = await api.patch(
		`/mentorship/sessions/${encodeURIComponent(id)}`,
		body,
	);
	return mentorshipSessionSchema.parse(data);
}

export async function deleteMentorshipSession(id: string): Promise<void> {
	await api.delete(`/mentorship/sessions/${encodeURIComponent(id)}`);
}
