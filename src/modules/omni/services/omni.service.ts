import { api } from '@/lib/fetch';
import type {
	CreateOmniInstancePayload,
	OmniAgent,
	OmniAgentPayload,
	OmniBusinessConfig,
	OmniChat,
	OmniChatListParams,
	OmniChatListResponse,
	OmniConnectResponse,
	OmniInstance,
	OmniInstanceStats,
	OmniInstanceStatusResponse,
	OmniKbChunk,
	OmniKbFile,
	OmniMessage,
	OmniTransferPayload,
	UpdateOmniChatPayload,
	UpdateOmniInstancePayload,
} from '../types/omni';

// ─── Instâncias ─────────────────────────────────────────────────────────────

export async function getOmniInstances(): Promise<OmniInstance[]> {
	const { data } = await api.get<OmniInstance[]>('/api/omni/instances');
	return Array.isArray(data) ? data : [];
}

export async function createOmniInstance(
	payload: CreateOmniInstancePayload,
): Promise<OmniInstance> {
	const { data } = await api.post<OmniInstance>('/api/omni/instances', payload);
	return data;
}

export async function getOmniInstance(id: string): Promise<OmniInstance> {
	const { data } = await api.get<OmniInstance>(`/api/omni/instances/${id}`);
	return data;
}

export async function updateOmniInstance(
	id: string,
	payload: UpdateOmniInstancePayload,
): Promise<OmniInstance> {
	const { data } = await api.patch<OmniInstance>(
		`/api/omni/instances/${id}`,
		payload,
	);
	return data;
}

export async function deleteOmniInstance(id: string): Promise<void> {
	await api.delete(`/api/omni/instances/${id}`);
}

export async function connectOmniInstance(
	id: string,
): Promise<OmniConnectResponse> {
	const { data } = await api.post<OmniConnectResponse>(
		`/api/omni/instances/${id}/connect`,
	);
	return data;
}

export async function disconnectOmniInstance(id: string): Promise<void> {
	await api.post(`/api/omni/instances/${id}/disconnect`);
}

export async function getOmniInstanceStatus(
	id: string,
): Promise<OmniInstanceStatusResponse> {
	const { data } = await api.get<OmniInstanceStatusResponse>(
		`/api/omni/instances/${id}/status`,
	);
	return data;
}

export async function getOmniInstanceStats(
	id: string,
): Promise<OmniInstanceStats> {
	const { data } = await api.get<OmniInstanceStats>(
		`/api/omni/instances/${id}/stats`,
	);
	return data ?? {};
}

// ─── Chats ──────────────────────────────────────────────────────────────────

export async function getOmniChats(
	instanceId: string,
	params: OmniChatListParams = {},
): Promise<OmniChatListResponse> {
	const query: Record<string, string | number | boolean> = {};
	if (params.search) query.search = params.search;
	if (params.filter) query.filter = params.filter;
	if (params.leadStep) query.leadStep = params.leadStep;
	if (params.archived !== undefined) query.archived = params.archived;
	if (params.pinned !== undefined) query.pinned = params.pinned;
	query.limit = params.limit ?? 30;
	if (params.cursor) query.cursor = params.cursor;

	const { data } = await api.get<OmniChatListResponse | OmniChat[]>(
		`/api/omni/instances/${instanceId}/chats`,
		{ params: query },
	);
	// Tolera tanto `{chats, nextCursor}` quanto array puro.
	if (Array.isArray(data)) return { chats: data, nextCursor: null };
	return { chats: data?.chats ?? [], nextCursor: data?.nextCursor ?? null };
}

export async function updateOmniChat(
	chatId: string,
	payload: UpdateOmniChatPayload,
): Promise<OmniChat> {
	const { data } = await api.patch<OmniChat>(
		`/api/omni/chats/${chatId}`,
		payload,
	);
	return data;
}

export async function markOmniChatRead(chatId: string): Promise<void> {
	await api.post(`/api/omni/chats/${chatId}/mark-read`);
}

export async function transferOmniChat(
	chatId: string,
	payload: OmniTransferPayload,
): Promise<void> {
	await api.post(`/api/omni/chats/${chatId}/transfer`, payload);
}

export async function transferAllOmniChatsToAi(
	instanceId: string,
): Promise<void> {
	await api.post(`/api/omni/instances/${instanceId}/chats/transfer-all`, {
		to: 'ai',
	});
}

// ─── Mensagens ──────────────────────────────────────────────────────────────

export async function getOmniMessages(
	chatId: string,
	params: { before?: string; limit?: number } = {},
): Promise<OmniMessage[]> {
	const query: Record<string, string | number> = {
		limit: params.limit ?? 50,
	};
	if (params.before) query.before = params.before;
	const { data } = await api.get<OmniMessage[]>(
		`/api/omni/chats/${chatId}/messages`,
		{ params: query },
	);
	return Array.isArray(data) ? data : [];
}

export async function sendOmniText(
	chatId: string,
	text: string,
): Promise<OmniMessage> {
	const { data } = await api.post<OmniMessage>(
		`/api/omni/chats/${chatId}/send`,
		{ text },
	);
	return data;
}

export async function sendOmniFile(
	chatId: string,
	file: File,
	caption?: string,
): Promise<OmniMessage> {
	const formData = new FormData();
	formData.append('file', file);
	if (caption) formData.append('caption', caption);
	const { data } = await api.post<OmniMessage>(
		`/api/omni/chats/${chatId}/send`,
		formData,
	);
	return data;
}

// ─── Agentes ────────────────────────────────────────────────────────────────

export async function getOmniAgents(instanceId: string): Promise<OmniAgent[]> {
	const { data } = await api.get<OmniAgent[]>(
		`/api/omni/instances/${instanceId}/agents`,
	);
	return Array.isArray(data) ? data : [];
}

export async function createOmniAgent(
	instanceId: string,
	payload: OmniAgentPayload,
): Promise<OmniAgent> {
	const { data } = await api.post<OmniAgent>(
		`/api/omni/instances/${instanceId}/agents`,
		payload,
	);
	return data;
}

export async function updateOmniAgent(
	agentId: string,
	payload: OmniAgentPayload,
): Promise<OmniAgent> {
	const { data } = await api.patch<OmniAgent>(
		`/api/omni/agents/${agentId}`,
		payload,
	);
	return data;
}

export async function deleteOmniAgent(agentId: string): Promise<void> {
	await api.delete(`/api/omni/agents/${agentId}`);
}

// ─── Config do negócio ──────────────────────────────────────────────────────

export async function getOmniBusinessConfig(
	instanceId: string,
): Promise<Partial<OmniBusinessConfig>> {
	const { data } = await api.get<Partial<OmniBusinessConfig>>(
		`/api/omni/instances/${instanceId}/business-config`,
	);
	return data ?? {};
}

export async function putOmniBusinessConfig(
	instanceId: string,
	config: OmniBusinessConfig,
): Promise<OmniBusinessConfig> {
	const { data } = await api.put<OmniBusinessConfig>(
		`/api/omni/instances/${instanceId}/business-config`,
		config,
	);
	return data;
}

// ─── Base de conhecimento ───────────────────────────────────────────────────

export async function getOmniKbFiles(
	instanceId: string,
): Promise<OmniKbFile[]> {
	const { data } = await api.get<OmniKbFile[]>(
		`/api/omni/instances/${instanceId}/kb/files`,
	);
	return Array.isArray(data) ? data : [];
}

export async function uploadOmniKbFile(
	instanceId: string,
	file: File,
): Promise<OmniKbFile> {
	const formData = new FormData();
	formData.append('file', file);
	const { data } = await api.post<OmniKbFile>(
		`/api/omni/instances/${instanceId}/kb/files`,
		formData,
	);
	return data;
}

export async function deleteOmniKbFile(fileId: string): Promise<void> {
	await api.delete(`/api/omni/kb/files/${fileId}`);
}

export async function searchOmniKb(
	instanceId: string,
	query: string,
): Promise<OmniKbChunk[]> {
	const { data } = await api.post<OmniKbChunk[] | { chunks?: OmniKbChunk[] }>(
		`/api/omni/instances/${instanceId}/kb/search`,
		{ query },
	);
	if (Array.isArray(data)) return data;
	return data?.chunks ?? [];
}
