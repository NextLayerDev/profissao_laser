import { getActiveToken } from '@/lib/auth';
import { lerFramesSse } from '@/lib/sse';
import { listCollection } from './collections.service';

/**
 * Cliente do run com PROGRESSO AO VIVO (`POST /api/tool-run/:key/stream`).
 *
 * A rota é a mesma do run normal por dentro — mesmo billing, mesmo pipeline —,
 * só que transmitida. Existe porque um time de agentes leva de 20 s a 2 min, e
 * tela parada nesse tempo é indistinguível de tela travada.
 *
 * E existe uma segunda razão, menos óbvia: os eventos são a PROVA de que a
 * pesquisa é real. Ver as fontes chegando uma a uma é o antídoto de interface
 * contra "isso aí a IA inventou".
 */

const BASE = process.env.NEXT_PUBLIC_GATEWAY_URL ?? '';

/** Um passo do pipeline ou um agente do time. O `kind` vem do bloco. */
export interface EventoProgresso {
	kind: string;
	/** Carimbado pelo motor: de qual nó do pipeline veio. */
	node?: string;
	[k: string]: unknown;
}

export type ToolStreamEvent =
	| { type: 'progresso'; ev: EventoProgresso }
	| {
			type: 'done';
			output: Record<string, unknown>;
			/**
			 * O código de autenticidade da rodada licenciada.
			 *
			 * Vinha no payload do motor e era DESCARTADO aqui — o mesmo esquecimento
			 * que já aconteceu no schema do Fastify: a arte chegava, o código sumia
			 * no caminho, e a tela mostrava a peça sem QR sem erro nenhum.
			 */
			license?: unknown;
	  }
	| { type: 'erro'; status: number; message: string };

export interface ToolStreamInput {
	key: string;
	/** Campos do formulário. `File` vira parte de arquivo; o resto, texto. */
	values: Record<string, unknown>;
	/** Invocação já cobrada no upvox. */
	invocationId?: string;
	/** Id do run — é por ele que a retomada acha o resultado depois. */
	runId: string;
	/**
	 * Fluxo nomeado (`definition.pipelines`). Ausente = o pipeline padrão.
	 *
	 * No Ateliê é `'ajustar'`: mesma tool, mesma `tool_key`, MESMO caminho de
	 * cobrança — o que muda é o pipeline. Um nome que não existe é recusado com
	 * 400 ANTES do portão de billing, então um `flow` errado nunca cobra.
	 */
	flow?: string;
	signal?: AbortSignal;
}

function montarForm(input: ToolStreamInput): FormData {
	const fd = new FormData();
	if (input.invocationId) fd.append('invocation_id', input.invocationId);
	fd.append('run_id', input.runId);
	if (input.flow) fd.append('flow', input.flow);
	for (const [k, v] of Object.entries(input.values)) {
		if (v === undefined || v === null || v === '') continue;
		if (v instanceof File) fd.append(k, v);
		else fd.append(k, typeof v === 'string' ? v : JSON.stringify(v));
	}
	return fd;
}

/**
 * Roda e entrega os eventos conforme chegam.
 *
 * Lança só por erro de rede/abort. Erro de negócio (402 sem saldo, 403 sem
 * plano) chega como evento `erro` com a mensagem do backend — do mesmo jeito
 * que chegaria na rota normal, só que dentro do stream.
 */
export async function* runToolStream(
	input: ToolStreamInput,
): AsyncGenerator<ToolStreamEvent> {
	const token = getActiveToken();
	const res = await fetch(
		`${BASE}/api/tool-run/${encodeURIComponent(input.key)}/stream`,
		{
			method: 'POST',
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			body: montarForm(input),
			signal: input.signal,
		},
	);

	// Falha ANTES do stream começar (gateway fora, 401): não há frame nenhum.
	if (!res.ok && !res.headers.get('content-type')?.includes('event-stream')) {
		let message = `Falha ao iniciar (${res.status}).`;
		try {
			const j = (await res.json()) as { message?: string };
			if (j?.message) message = j.message;
		} catch {
			// corpo não-JSON
		}
		yield { type: 'erro', status: res.status, message };
		return;
	}

	for await (const frame of lerFramesSse(res, input.signal)) {
		if (frame.event === 'progresso') {
			yield {
				type: 'progresso',
				ev: frame.data as unknown as EventoProgresso,
			};
		} else if (frame.event === 'done') {
			yield {
				type: 'done',
				output: (frame.data.output ?? {}) as Record<string, unknown>,
				license: frame.data.license,
			};
		} else if (frame.event === 'erro') {
			yield {
				type: 'erro',
				status: Number(frame.data.status ?? 500),
				message: String(frame.data.message ?? 'Erro.'),
			};
		}
	}
}

/**
 * RETOMADA — acha o resultado de um run pelo `run_id`.
 *
 * É o que torna o socket descartável. O bloco grava o resultado na coleção
 * ANTES de responder, então fechar a aba, perder o wi-fi ou o celular dormir
 * não perde um trabalho que já foi cobrado: ao voltar, o front pergunta pelo
 * `run_id` e encontra tudo lá.
 *
 * Trinta linhas no lugar de uma fila de jobs, uma tabela de estado e um reaper.
 */
export async function buscarResultadoSalvo(
	toolKey: string,
	collection: string,
	runId: string,
): Promise<Record<string, unknown> | null> {
	const r = await listCollection(toolKey, collection, {
		filters: { run_id: { kind: 'eq', value: runId } },
		pageSize: 1,
	});
	const entry = r.items[0];
	return entry ? { id: entry.id, ...entry.data } : null;
}

/**
 * Poll até o resultado aparecer, para quem reconectou com o run ainda em curso.
 *
 * `intervaloMs` de 3 s e teto de 3 min: um Profundo leva ~2 min, e polling mais
 * agressivo só multiplica requisição sem chegar mais cedo.
 */
export async function aguardarResultadoSalvo(
	toolKey: string,
	collection: string,
	runId: string,
	opts: { intervaloMs?: number; tetoMs?: number; signal?: AbortSignal } = {},
): Promise<Record<string, unknown> | null> {
	const intervalo = opts.intervaloMs ?? 3_000;
	const teto = opts.tetoMs ?? 180_000;
	const ate = Date.now() + teto;

	while (Date.now() < ate) {
		if (opts.signal?.aborted) return null;
		try {
			const achado = await buscarResultadoSalvo(toolKey, collection, runId);
			if (achado) return achado;
		} catch {
			// Erro de rede numa tentativa não encerra a espera.
		}
		await new Promise((r) => setTimeout(r, intervalo));
	}
	return null;
}
