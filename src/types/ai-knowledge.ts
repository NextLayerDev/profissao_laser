/**
 * Tipos da base de conhecimento (RAG) usada pela IA do chat ao vivo de suporte.
 * Espelha o contrato de `/ai-knowledge` na main API.
 */

/** Origem de onde o conhecimento foi extraído. */
export type KbSourceKind =
	| 'tool'
	| 'plan'
	| 'course'
	| 'lesson'
	| 'faq'
	| 'kb_article'
	| 'parameter'
	| 'machine'
	| 'laser_product'
	| 'fornecedor'
	| 'channel'
	| 'ticket'
	| 'manual';

export type KbTrust = 'trusted' | 'untrusted';

export type KbSourceStatus = 'processing' | 'ready' | 'error' | 'archived';

export type KbSyncStatus = 'running' | 'done' | 'error' | 'canceled';

/** Estratégia usada na recuperação: vetorial, palavra-chave ou nada. */
export type KbMode = 'vector' | 'keyword' | 'none';

/** Motivo de a busca ter degradado (ou 'ok' quando rodou normal). */
export type KbDegradedReason =
	| 'ok'
	| 'empty_base'
	| 'empty_query'
	| 'disabled'
	| 'no_api_key'
	| 'embed_cooldown'
	| 'embed_failed'
	| 'embed_timeout'
	| 'rpc_error'
	| 'global_timeout';

export interface KbSource {
	id: string;
	kind: KbSourceKind;
	externalId: string | null;
	title: string;
	label: string | null;
	contentHash: string | null;
	embeddingModel: string | null;
	trust: KbTrust;
	pinned: boolean;
	enabled: boolean;
	status: KbSourceStatus;
	error: string | null;
	chunkCount: number;
	subjectId: string | null;
	sourceUrl: string | null;
	createdBy: string | null;
	createdAt: string;
	updatedAt: string;
	syncedAt: string | null;
}

export interface KbChunk {
	id: number;
	sourceId: string;
	seq: number;
	content: string;
	tokens: number | null;
	hasEmbedding: boolean;
	embeddingModel: string | null;
	suppressed: boolean;
	active: boolean;
	createdAt: string;
}

export interface KbSourceDetail extends KbSource {
	chunks: KbChunk[];
	/**
	 * Texto original da fonte, como foi gravado. Só o detalhe traz — a listagem
	 * não. É o que a edição de conhecimento escrito à mão deve usar: remontar o
	 * texto juntando os `chunks` reescreveria o original, porque eles já passaram
	 * por normalização e corte.
	 */
	body: string;
}

export interface KbHit {
	chunkId: number;
	sourceId: string;
	title: string;
	kind: KbSourceKind;
	label: string | null;
	trust: KbTrust;
	content: string;
	score: number;
	pinned: boolean;
}

export interface KbSyncCounts {
	scanned: number;
	created: number;
	updated: number;
	unchanged: number;
	archived: number;
	failed: number;
	chunks: number;
	embedded: number;
}

export interface KbSyncRun {
	id: string;
	status: KbSyncStatus;
	trigger: string | null;
	scopes: KbSourceKind[] | null;
	counts: KbSyncCounts;
	error: string | null;
	createdBy: string | null;
	startedAt: string;
	heartbeatAt: string | null;
	finishedAt: string | null;
}

export interface KbHealth {
	sources_total: number;
	sources_ready: number;
	sources_error: number;
	sources_disabled: number;
	chunks_total: number;
	chunks_no_embedding: number;
	chunks_stale_model: number;
	last_synced_at: string | null;
	by_kind: Array<{ kind: KbSourceKind; sources: number; chunks: number }>;
	embeddings_model: string;
	embeddings_available: boolean;
	retrieval_mode: 'off' | 'sync';
}

export interface KbTestResult {
	hits: KbHit[];
	mode: KbMode;
	reason: KbDegradedReason;
	latencyMs: number;
	reply?: string;
	handoff?: boolean;
}

export interface KbAnswerLog {
	id: string;
	chatId: string;
	messageId: string;
	question: string;
	answer: string;
	mode: KbMode;
	reason: KbDegradedReason;
	handoff: boolean;
	latencyMs: number;
	createdAt: string;
}

// ── Payloads ──────────────────────────────────────────────────────────────

export interface KbSourceListParams {
	kind?: KbSourceKind;
	status?: KbSourceStatus;
	trust?: KbTrust;
	search?: string;
	limit?: number;
	offset?: number;
}

export interface KbSourceListResult {
	items: KbSource[];
	total: number;
}

export interface CreateKbSourcePayload {
	title: string;
	body: string;
	label?: string;
	pinned?: boolean;
}

export interface UpdateKbSourcePayload {
	title?: string;
	body?: string;
	label?: string;
	pinned?: boolean;
	enabled?: boolean;
}

export interface KbTestPayload {
	question: string;
	withReply?: boolean;
	k?: number;
	minSimilarity?: number;
	forceMode?: KbMode;
}

export interface KbAnswerListParams {
	reason?: KbDegradedReason;
	mode?: KbMode;
	handoff?: boolean;
	limit?: number;
}

// ── Rótulos de UI (linguagem de gente, sem jargão técnico) ────────────────

/** Nome amigável de cada origem — a staff de suporte não é técnica. */
export const KIND_LABELS: Record<KbSourceKind, string> = {
	tool: 'Ferramenta',
	plan: 'Plano',
	course: 'Curso',
	lesson: 'Aula',
	faq: 'Perguntas frequentes',
	kb_article: 'Artigo de ajuda',
	parameter: 'Parâmetro de corte',
	machine: 'Máquina',
	laser_product: 'Material',
	fornecedor: 'Fornecedor',
	channel: 'Canal da comunidade',
	ticket: 'Chamado de aluno',
	manual: 'Escrito pela equipe',
};

/** Ordem em que as origens aparecem nos filtros e no modal de varredura. */
export const KIND_ORDER: KbSourceKind[] = [
	'tool',
	'plan',
	'course',
	'lesson',
	'faq',
	'kb_article',
	'parameter',
	'machine',
	'laser_product',
	'fornecedor',
	'channel',
	'ticket',
	'manual',
];

/**
 * Escopos varríveis pelo botão "Ensinar sobre a plataforma". `manual` fica de
 * fora: conhecimento escrito à mão não é gerado por varredura.
 */
export const TEACHABLE_KINDS: KbSourceKind[] = KIND_ORDER.filter(
	(k) => k !== 'manual',
);

/** Conteúdo de aluno — começa desmarcado na varredura por ser sensível. */
export const OPT_IN_KINDS: KbSourceKind[] = ['ticket'];

export const STATUS_LABELS: Record<KbSourceStatus, string> = {
	processing: 'Preparando',
	ready: 'Pronto',
	error: 'Com erro',
	archived: 'Arquivado',
};

export const SYNC_STATUS_LABELS: Record<KbSyncStatus, string> = {
	running: 'Em andamento',
	done: 'Concluída',
	error: 'Falhou',
	canceled: 'Cancelada',
};

/** Explicação humana de por que a busca degradou. */
export const REASON_LABELS: Record<KbDegradedReason, string> = {
	ok: 'Tudo certo',
	empty_base: 'A base ainda está vazia',
	empty_query: 'A pergunta veio vazia',
	disabled: 'A busca está desligada',
	no_api_key: 'Falta a chave do modelo de busca',
	embed_cooldown: 'O modelo de busca está em pausa temporária',
	embed_failed: 'O modelo de busca falhou',
	embed_timeout: 'O modelo de busca demorou demais',
	rpc_error: 'Erro ao consultar a base',
	global_timeout: 'A busca demorou demais',
};

export const MODE_LABELS: Record<KbMode, string> = {
	vector: 'Busca inteligente',
	keyword: 'Busca por palavra-chave',
	none: 'Sem busca',
};

/** Série diária de atendimento da IA + história do aprendizado. */
export interface KbStats {
	periodoDias: number;
	questions: Array<{
		dia: string;
		perguntas: number;
		comBase: number;
		handoff: number;
		latenciaMs: number;
	}>;
	growth: Array<{
		em: string;
		novos: number;
		atualizados: number;
		total: number;
	}>;
	totais: {
		perguntas: number;
		comBase: number;
		handoff: number;
		usoDaBasePct: number | null;
		latenciaMediaMs: number | null;
	};
}
