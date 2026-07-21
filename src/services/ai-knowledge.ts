import { apiCourses } from '@/shared/lib/api-courses';
import type {
	CreateKbSourcePayload,
	KbAnswerListParams,
	KbAnswerLog,
	KbChunk,
	KbHealth,
	KbSource,
	KbSourceDetail,
	KbSourceKind,
	KbSourceListParams,
	KbSourceListResult,
	KbStats,
	KbSyncRun,
	KbTestPayload,
	KbTestResult,
	UpdateKbSourcePayload,
} from '@/types/ai-knowledge';

/**
 * Base de conhecimento da IA (RAG). Tudo na main API (`api`), prefixo
 * `/v1/ai-knowledge`. O middleware da API deriva a permissão do método HTTP:
 * GET → suporte.view, POST/PATCH → suporte.edit, DELETE → suporte.delete.
 */

// ── Saúde ─────────────────────────────────────────────────────────────────

export async function getKbHealth(): Promise<KbHealth> {
	const { data } = await apiCourses.get<KbHealth>('/v1/ai-knowledge/health');
	return data;
}

// ── Varredura (sync) ──────────────────────────────────────────────────────

/** 409 = já existe varredura rodando; a UI adota o `runId` devolvido. */
export interface StartKbSyncResult {
	runId: string;
	adopted: boolean;
	message?: string;
}

export async function startKbSync(
	scopes?: KbSourceKind[],
): Promise<StartKbSyncResult> {
	try {
		const { data } = await apiCourses.post<{ runId: string }>(
			'/v1/ai-knowledge/sync',
			{
				...(scopes?.length ? { scopes } : {}),
				trigger: 'manual',
			},
		);
		return { runId: data.runId, adopted: false };
	} catch (err) {
		// 409 não é erro de verdade: outra varredura já está rodando e a tela
		// simplesmente acompanha o progresso dela.
		const res = (
			err as { response?: { status?: number; data?: unknown } } | undefined
		)?.response;
		const body = res?.data as { runId?: string; message?: string } | undefined;
		if (res?.status === 409 && body?.runId) {
			return { runId: body.runId, adopted: true, message: body.message };
		}
		throw err;
	}
}

export async function listKbSyncRuns(limit = 20): Promise<KbSyncRun[]> {
	const { data } = await apiCourses.get<KbSyncRun[]>(
		'/v1/ai-knowledge/sync/runs',
		{
			params: { limit },
		},
	);
	return Array.isArray(data) ? data : [];
}

export async function getKbSyncRun(id: string): Promise<KbSyncRun> {
	const { data } = await apiCourses.get<KbSyncRun>(
		`/v1/ai-knowledge/sync/runs/${id}`,
	);
	return data;
}

export async function abortKbSyncRun(id: string): Promise<KbSyncRun> {
	const { data } = await apiCourses.post<KbSyncRun>(
		`/v1/ai-knowledge/sync/runs/${id}/abort`,
	);
	return data;
}

// ── Fontes ────────────────────────────────────────────────────────────────

export async function listKbSources(
	params: KbSourceListParams = {},
): Promise<KbSourceListResult> {
	const { data } = await apiCourses.get<KbSourceListResult>(
		'/v1/ai-knowledge/sources',
		{
			params,
		},
	);
	return { items: data?.items ?? [], total: data?.total ?? 0 };
}

export async function getKbSource(id: string): Promise<KbSourceDetail> {
	const { data } = await apiCourses.get<KbSourceDetail>(
		`/v1/ai-knowledge/sources/${id}`,
	);
	return { ...data, chunks: data?.chunks ?? [] };
}

export async function createKbSource(
	payload: CreateKbSourcePayload,
): Promise<KbSource> {
	const { data } = await apiCourses.post<KbSource>(
		'/v1/ai-knowledge/sources',
		payload,
	);
	return data;
}

export async function updateKbSource(
	id: string,
	payload: UpdateKbSourcePayload,
): Promise<KbSource> {
	const { data } = await apiCourses.patch<KbSource>(
		`/v1/ai-knowledge/sources/${id}`,
		payload,
	);
	return data;
}

export async function deleteKbSource(id: string): Promise<{ ok: true }> {
	const { data } = await apiCourses.delete<{ ok: true }>(
		`/v1/ai-knowledge/sources/${id}`,
	);
	return data;
}

export async function reprocessKbSource(id: string): Promise<{ ok: true }> {
	const { data } = await apiCourses.post<{ ok: true }>(
		`/v1/ai-knowledge/sources/${id}/reprocess`,
	);
	return data;
}

// ── Trechos (chunks) ──────────────────────────────────────────────────────

export async function setKbChunkSuppressed(
	id: number,
	suppressed: boolean,
): Promise<KbChunk> {
	const { data } = await apiCourses.patch<KbChunk>(
		`/v1/ai-knowledge/chunks/${id}`,
		{
			suppressed,
		},
	);
	return data;
}

// ── Teste / auditoria ─────────────────────────────────────────────────────

export async function testKbRetrieval(
	payload: KbTestPayload,
): Promise<KbTestResult> {
	const { data } = await apiCourses.post<KbTestResult>(
		'/v1/ai-knowledge/test',
		payload,
	);
	return { ...data, hits: data?.hits ?? [] };
}

export async function listKbAnswers(
	params: KbAnswerListParams = {},
): Promise<KbAnswerLog[]> {
	const { data } = await apiCourses.get<KbAnswerLog[]>(
		'/v1/ai-knowledge/answers',
		{
			params,
		},
	);
	return Array.isArray(data) ? data : [];
}

/** Números de atendimento da IA e a história do que ela foi aprendendo. */
export async function getKbStats(days = 14): Promise<KbStats> {
	const { data } = await apiCourses.get<KbStats>('/v1/ai-knowledge/stats', {
		params: { days },
	});
	return data;
}
