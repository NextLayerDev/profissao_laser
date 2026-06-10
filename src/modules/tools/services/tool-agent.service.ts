import { BLOCK_CATALOG } from '@/components/ferramentas/block-catalog';
import {
	type BuilderState,
	buildDoc,
	customToSpec,
} from '@/components/ferramentas/builder-model';
import { getActiveToken } from '@/lib/auth';
import type { ToolDefinitionDoc } from './tool-definitions.service';

/**
 * Cliente do Agente "Engenheiro de Ferramentas" (PR-2). A rota
 * `POST /api/tool-agent/turn` responde em **SSE** (streaming ao vivo), então NÃO
 * dá pra usar EventSource (que é GET-only) — abrimos um `fetch` e lemos o corpo
 * pelo reader, parseando os frames `event:`/`data:` manualmente.
 *
 * A cada turno mandamos o catálogo de blocos (specs + nós custom + campos atuais)
 * junto com a definition: o agente é CATÁLOGO-DRIVEN e só usa ids que existem aqui.
 */

const BASE = process.env.NEXT_PUBLIC_GATEWAY_URL ?? '';

export type AgentEvent =
	| { type: 'text'; delta: string }
	| { type: 'action'; tool: string; label: string; ok: boolean }
	| { type: 'doc'; definition: ToolDefinitionDoc }
	| {
			type: 'cost';
			voxes_spent: number;
			balance: number | null;
			insufficient: boolean;
	  }
	| {
			type: 'done';
			definition: ToolDefinitionDoc;
			done: boolean;
			needs_input: boolean;
	  }
	| { type: 'error'; message: string };

export interface AgentTurnInput {
	session_id: string;
	state: BuilderState;
	message: string;
	history: { role: 'user' | 'assistant'; content: string }[];
}

/** Monta o catálogo enviado ao agente a partir do estado atual do builder. */
function buildCatalog(state: BuilderState) {
	return {
		blocks: BLOCK_CATALOG,
		custom_nodes: state.customNodes
			.map(customToSpec)
			.filter((s): s is NonNullable<typeof s> => !!s),
		inputs: state.fields.map((f) => ({
			name: f.name,
			type: f.type,
			label: f.label,
		})),
	};
}

/** Converte um frame SSE cru (`event: x\ndata: {...}`) num AgentEvent tipado. */
function parseFrame(frame: string): AgentEvent | null {
	let event = '';
	const dataLines: string[] = [];
	for (const line of frame.split('\n')) {
		if (line.startsWith('event:')) event = line.slice(6).trim();
		else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
	}
	if (!event) return null;
	let data: Record<string, unknown> = {};
	try {
		data = dataLines.length ? JSON.parse(dataLines.join('\n')) : {};
	} catch {
		return null;
	}
	switch (event) {
		case 'text':
			return { type: 'text', delta: String(data.delta ?? '') };
		case 'action':
			return {
				type: 'action',
				tool: String(data.type ?? ''),
				label: String(data.label ?? ''),
				ok: data.ok !== false,
			};
		case 'doc':
			return {
				type: 'doc',
				definition: data.definition as ToolDefinitionDoc,
			};
		case 'cost':
			return {
				type: 'cost',
				voxes_spent: Number(data.voxes_spent ?? 0),
				balance:
					data.balance === null || data.balance === undefined
						? null
						: Number(data.balance),
				insufficient: !!data.insufficient,
			};
		case 'done':
			return {
				type: 'done',
				definition: data.definition as ToolDefinitionDoc,
				done: !!data.done,
				needs_input: !!data.needs_input,
			};
		case 'error':
			return { type: 'error', message: String(data.message ?? 'Erro.') };
		default:
			return null;
	}
}

/**
 * Roda um turno e entrega os eventos do agente conforme chegam (async generator).
 * Lança só por erro de rede/abort; status HTTP de negócio (402/403) vira um evento
 * `error` com a mensagem do backend.
 */
export async function* streamAgentTurn(
	input: AgentTurnInput,
	signal: AbortSignal,
): AsyncGenerator<AgentEvent> {
	const token = getActiveToken();
	const res = await fetch(`${BASE}/api/tool-agent/turn`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({
			session_id: input.session_id,
			definition: buildDoc(input.state),
			catalog: buildCatalog(input.state),
			message: input.message,
			history: input.history,
		}),
		signal,
	});

	if (!res.ok || !res.body) {
		let message = 'Não consegui falar com o agente agora.';
		try {
			const j = (await res.json()) as { message?: string };
			if (j?.message === 'session_budget_exceeded')
				message = 'Esta sessão atingiu o limite de mensagens. Recarregue.';
			else if (j?.message) message = j.message;
		} catch {
			// corpo não-JSON
		}
		yield { type: 'error', message };
		return;
	}

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buf = '';
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buf += decoder.decode(value, { stream: true });
		let sep = buf.indexOf('\n\n');
		while (sep >= 0) {
			const frame = buf.slice(0, sep);
			buf = buf.slice(sep + 2);
			const ev = parseFrame(frame);
			if (ev) yield ev;
			sep = buf.indexOf('\n\n');
		}
	}
}
