import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	abortKbSyncRun,
	createKbSource,
	deleteKbSource,
	getKbHealth,
	getKbSource,
	getKbStats,
	getKbSyncRun,
	listKbAnswers,
	listKbSources,
	listKbSyncRuns,
	reprocessKbSource,
	setKbChunkSuppressed,
	startKbSync,
	testKbRetrieval,
	updateKbSource,
} from '@/services/ai-knowledge';
import type {
	CreateKbSourcePayload,
	KbAnswerListParams,
	KbSourceKind,
	KbSourceListParams,
	KbSyncRun,
	KbTestPayload,
	UpdateKbSourcePayload,
} from '@/types/ai-knowledge';

const KEY = ['ai-knowledge'];

/** Uma varredura viva sem batimento há mais de 30min está travada. */
export const STALE_RUN_MS = 30 * 60 * 1000;

export function isRunStuck(run?: KbSyncRun | null): boolean {
	if (!run || run.status !== 'running') return false;
	const beat = run.heartbeatAt ?? run.startedAt;
	if (!beat) return false;
	const ts = new Date(beat).getTime();
	if (Number.isNaN(ts)) return false;
	return Date.now() - ts > STALE_RUN_MS;
}

// ── Saúde ─────────────────────────────────────────────────────────────────

export function useKbHealth() {
	return useQuery({
		queryKey: [...KEY, 'health'],
		queryFn: getKbHealth,
		refetchInterval: 30000,
	});
}

// ── Varredura ─────────────────────────────────────────────────────────────

export function useKbSyncRuns(limit = 20) {
	return useQuery({
		queryKey: [...KEY, 'runs', limit],
		queryFn: () => listKbSyncRuns(limit),
		refetchInterval: 10000,
	});
}

/** Poll de 2s enquanto a varredura roda; para sozinho quando termina. */
export function useKbSyncRun(id: string | null) {
	return useQuery({
		queryKey: [...KEY, 'run', id],
		queryFn: () => getKbSyncRun(id ?? ''),
		enabled: !!id,
		refetchInterval: (query) =>
			query.state.data?.status === 'running' ? 2000 : false,
	});
}

export function useStartKbSync() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (scopes?: KbSourceKind[]) => startKbSync(scopes),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...KEY, 'runs'] });
		},
	});
}

export function useAbortKbSyncRun() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => abortKbSyncRun(id),
		onSuccess: (run) => {
			qc.setQueryData([...KEY, 'run', run.id], run);
			qc.invalidateQueries({ queryKey: [...KEY, 'runs'] });
			qc.invalidateQueries({ queryKey: [...KEY, 'health'] });
		},
	});
}

// ── Fontes ────────────────────────────────────────────────────────────────

export function useKbSources(params: KbSourceListParams = {}) {
	return useQuery({
		queryKey: [...KEY, 'sources', params],
		queryFn: () => listKbSources(params),
		placeholderData: (prev) => prev,
	});
}

export function useKbSource(id: string | null) {
	return useQuery({
		queryKey: [...KEY, 'source', id],
		queryFn: () => getKbSource(id ?? ''),
		enabled: !!id,
		// Enquanto está sendo preparada, acompanha até ficar pronta.
		refetchInterval: (query) =>
			query.state.data?.status === 'processing' ? 3000 : false,
	});
}

/** Invalida listagem + saúde: qualquer escrita mexe nos dois. */
function useInvalidateSources() {
	const qc = useQueryClient();
	return () => {
		qc.invalidateQueries({ queryKey: [...KEY, 'sources'] });
		qc.invalidateQueries({ queryKey: [...KEY, 'health'] });
	};
}

export function useCreateKbSource() {
	const invalidate = useInvalidateSources();
	return useMutation({
		mutationFn: (payload: CreateKbSourcePayload) => createKbSource(payload),
		onSuccess: invalidate,
	});
}

export function useUpdateKbSource() {
	const qc = useQueryClient();
	const invalidate = useInvalidateSources();
	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: UpdateKbSourcePayload;
		}) => updateKbSource(id, payload),
		onSuccess: (source) => {
			qc.invalidateQueries({ queryKey: [...KEY, 'source', source.id] });
			invalidate();
		},
	});
}

export function useDeleteKbSource() {
	const invalidate = useInvalidateSources();
	return useMutation({
		mutationFn: (id: string) => deleteKbSource(id),
		onSuccess: invalidate,
	});
}

export function useReprocessKbSource() {
	const qc = useQueryClient();
	const invalidate = useInvalidateSources();
	return useMutation({
		mutationFn: (id: string) => reprocessKbSource(id),
		onSuccess: (_data, id) => {
			qc.invalidateQueries({ queryKey: [...KEY, 'source', id] });
			invalidate();
		},
	});
}

// ── Trechos ───────────────────────────────────────────────────────────────

export function useSetKbChunkSuppressed(sourceId: string | null) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, suppressed }: { id: number; suppressed: boolean }) =>
			setKbChunkSuppressed(id, suppressed),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: [...KEY, 'source', sourceId] });
			qc.invalidateQueries({ queryKey: [...KEY, 'health'] });
		},
	});
}

// ── Teste / auditoria ─────────────────────────────────────────────────────

export function useTestKbRetrieval() {
	return useMutation({
		mutationFn: (payload: KbTestPayload) => testKbRetrieval(payload),
	});
}

export function useKbAnswers(params: KbAnswerListParams = {}) {
	return useQuery({
		queryKey: [...KEY, 'answers', params],
		queryFn: () => listKbAnswers(params),
		refetchInterval: 30000,
	});
}

/** Números de atendimento da IA. Atualiza sozinho a cada minuto. */
export function useKbStats(days = 14) {
	return useQuery({
		queryKey: ['ai-knowledge', 'stats', days],
		queryFn: () => getKbStats(days),
		refetchInterval: 60_000,
	});
}
