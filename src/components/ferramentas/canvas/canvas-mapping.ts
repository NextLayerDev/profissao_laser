import type { Edge, Node } from '@xyflow/react';
import {
	type BlockParam,
	type BlockSpec,
	blockParam,
	blockSpec,
	type PortType,
} from '../block-catalog';
import {
	type BuilderField,
	type BuilderNode,
	type BuilderState,
	outputSourceType,
	type PortLike,
	typeFits,
	wantType,
} from '../builder-model';
import { PORT_HEX } from '../forge-theme';

/**
 * Projeção `BuilderState ⇄ {nodes, edges}` do React Flow + handlers de conexão.
 * O `state` é a verdade: edges são DERIVADAS dele. As funções de mutação
 * (`applyConnect`/`applyDisconnect`) devolvem um novo `BuilderState` (ou erro),
 * centralizando toda a regra de tipo/ordem num lugar testável.
 */

export const INPUTS_ID = '__inputs__';
export const OUTPUT_ID = '__output__';

export interface InputsNodeData {
	fields: BuilderField[];
	[key: string]: unknown;
}
export interface BlockNodeData {
	node: BuilderNode;
	spec?: BlockSpec;
	index: number;
	[key: string]: unknown;
}
export interface OutputNodeData {
	output: BuilderState['output'];
	[key: string]: unknown;
}

export type FlowNode = Node;
export type FlowEdge = Edge;

/** Quebra uma fonte (`input.x` | `node.field`) no nó+handle do React Flow. */
function sourceToHandle(
	source: string,
): { node: string; handle: string } | null {
	const dot = source.indexOf('.');
	if (dot <= 0) return null;
	const head = source.slice(0, dot);
	if (head === 'input') return { node: INPUTS_ID, handle: source };
	return { node: head, handle: source.slice(dot + 1) };
}

function edgeColor(t: PortLike | undefined): string {
	if (t === 'buffer' || t === 'string' || t === 'number')
		return PORT_HEX[t as PortType];
	if (t === 'bool') return '#c084fc';
	if (t === 'enum') return '#22d3ee';
	return '#64748b';
}

function refEdge(
	id: string,
	source: string,
	target: string,
	targetHandle: string,
	negate: boolean | undefined,
	color: string,
): FlowEdge {
	const sh = sourceToHandle(source);
	return {
		id,
		source: sh?.node ?? '',
		sourceHandle: sh?.handle ?? null,
		target,
		targetHandle,
		animated: true,
		data: { negate: !!negate },
		style: {
			stroke: color,
			strokeWidth: 2,
			...(negate ? { strokeDasharray: '6 4' } : {}),
		},
	};
}

/** Deriva os NÓS do React Flow (posições efêmeras vêm de fora). */
export function buildNodes(
	state: BuilderState,
	positions: Record<string, { x: number; y: number }>,
): FlowNode[] {
	const pos = (id: string) => positions[id] ?? { x: 0, y: 0 };
	return [
		{
			id: INPUTS_ID,
			type: 'inputsNode',
			position: pos(INPUTS_ID),
			deletable: false,
			data: { fields: state.fields } as InputsNodeData,
		},
		...state.nodes.map((n, index) => ({
			id: n.id,
			type: 'blockNode',
			position: pos(n.id),
			data: { node: n, spec: blockSpec(n.block), index } as BlockNodeData,
		})),
		{
			id: OUTPUT_ID,
			type: 'outputNode',
			position: pos(OUTPUT_ID),
			deletable: false,
			data: { output: state.output } as OutputNodeData,
		},
	];
}

/** Deriva as EDGES (puramente do estado — independem de posição). */
export function buildEdges(state: BuilderState): FlowEdge[] {
	const edges: FlowEdge[] = [];
	for (const n of state.nodes) {
		for (const [param, val] of Object.entries(n.params)) {
			if (val.mode !== 'ref' || !val.source) continue;
			edges.push(
				refEdge(
					`${n.id}:${param}`,
					val.source,
					n.id,
					param,
					val.negate,
					edgeColor(outputSourceType(state, val.source)),
				),
			);
		}
	}
	if (state.output.primary) {
		edges.push(
			refEdge(
				`${OUTPUT_ID}:primary`,
				state.output.primary,
				OUTPUT_ID,
				'primary',
				false,
				edgeColor(outputSourceType(state, state.output.primary)),
			),
		);
	}
	if (state.output.preview) {
		edges.push(
			refEdge(
				`${OUTPUT_ID}:preview`,
				state.output.preview,
				OUTPUT_ID,
				'preview',
				false,
				edgeColor(outputSourceType(state, state.output.preview)),
			),
		);
	}
	for (const m of state.output.meta) {
		edges.push(
			refEdge(`${OUTPUT_ID}:meta:${m}`, m, OUTPUT_ID, 'meta', false, '#a78bfa'),
		);
	}
	return edges;
}

/** Atalho: nós + edges juntos (layout inicial / organizar). */
export function stateToFlow(
	state: BuilderState,
	positions: Record<string, { x: number; y: number }>,
): { nodes: FlowNode[]; edges: FlowEdge[] } {
	return { nodes: buildNodes(state, positions), edges: buildEdges(state) };
}

export interface ConnectInput {
	source: string | null;
	sourceHandle?: string | null;
	target: string | null;
	targetHandle?: string | null;
}

/** Fonte lógica (`input.x` | `node.field`) a partir do par nó+handle do RF. */
function logicalSource(source: string, sourceHandle?: string | null): string {
	if (source === INPUTS_ID) return sourceHandle ?? '';
	return sourceHandle ? `${source}.${sourceHandle}` : source;
}

export interface MutResult {
	state?: BuilderState;
	error?: string;
}

/** Liga uma edge: valida tipo + ordem e seta o param como ref (ou o output). */
export function applyConnect(state: BuilderState, c: ConnectInput): MutResult {
	if (!c.source || !c.target) return {};
	const src = logicalSource(c.source, c.sourceHandle);
	if (!src) return {};
	const srcType = outputSourceType(state, src);

	// → nó "Resultado"
	if (c.target === OUTPUT_ID) {
		const handle = c.targetHandle;
		if (handle === 'meta') {
			if (srcType !== 'number')
				return { error: 'Detalhes (chips) aceitam só saídas numéricas.' };
			if (state.output.meta.includes(src)) return { state };
			return {
				state: {
					...state,
					output: { ...state.output, meta: [...state.output.meta, src] },
				},
			};
		}
		if (handle === 'primary' || handle === 'preview') {
			return {
				state: { ...state, output: { ...state.output, [handle]: src } },
			};
		}
		return {};
	}

	// → param de um bloco
	const targetNode = state.nodes.find((n) => n.id === c.target);
	if (!targetNode || !c.targetHandle) return {};
	const param: BlockParam | undefined = blockParam(
		targetNode.block,
		c.targetHandle,
	);
	if (!param) return {};

	const want = wantType(param);
	if (srcType && !typeFits(srcType, want)) {
		return { error: `Tipos incompatíveis pra "${param.label}".` };
	}

	// ordem: a fonte (se for um nó) tem que vir ANTES do alvo.
	const sh = sourceToHandle(src);
	if (sh && sh.node !== INPUTS_ID) {
		const srcIdx = state.nodes.findIndex((n) => n.id === sh.node);
		const tgtIdx = state.nodes.findIndex((n) => n.id === c.target);
		if (srcIdx < 0 || srcIdx >= tgtIdx)
			return { error: 'Ligue a saída de uma etapa anterior.' };
	}

	const prev = targetNode.params[c.targetHandle];
	const negate = prev?.mode === 'ref' ? prev.negate : undefined;
	const nodes = state.nodes.map((n) =>
		n.id === targetNode.id
			? {
					...n,
					params: {
						...n.params,
						[c.targetHandle as string]: {
							mode: 'ref' as const,
							source: src,
							...(negate ? { negate } : {}),
						},
					},
				}
			: n,
	);
	return { state: { ...state, nodes } };
}

/** Remove um nó e limpa refs órfãs (params/output que apontavam pra ele). */
export function removeNode(state: BuilderState, id: string): BuilderState {
	const orphan = (s: string) => s.split('.')[0] === id;
	const nodes = state.nodes
		.filter((n) => n.id !== id)
		.map((n) => {
			const params: Record<string, (typeof n.params)[string]> = {};
			for (const [k, v] of Object.entries(n.params)) {
				if (v.mode === 'ref' && v.source && orphan(v.source)) {
					const p = blockParam(n.block, k);
					params[k] =
						p?.kind === 'ref'
							? { mode: 'ref', source: '' }
							: { mode: 'literal', value: p?.default };
				} else {
					params[k] = v;
				}
			}
			return { ...n, params };
		});
	return {
		...state,
		nodes,
		output: {
			primary: orphan(state.output.primary) ? '' : state.output.primary,
			preview: orphan(state.output.preview) ? '' : state.output.preview,
			meta: state.output.meta.filter((m) => !orphan(m)),
		},
	};
}

/** Desliga uma edge: volta o param pra valor fixo (ou ref vazia) / limpa output. */
export function applyDisconnect(
	state: BuilderState,
	edge: FlowEdge,
): BuilderState {
	if (edge.target === OUTPUT_ID) {
		const h = edge.targetHandle;
		if (h === 'primary')
			return { ...state, output: { ...state.output, primary: '' } };
		if (h === 'preview')
			return { ...state, output: { ...state.output, preview: '' } };
		if (h === 'meta') {
			const src = logicalSource(edge.source, edge.sourceHandle);
			return {
				...state,
				output: {
					...state.output,
					meta: state.output.meta.filter((m) => m !== src),
				},
			};
		}
		return state;
	}
	const node = state.nodes.find((n) => n.id === edge.target);
	if (!node || !edge.targetHandle) return state;
	const param = blockParam(node.block, edge.targetHandle);
	const reset =
		param?.kind === 'ref'
			? { mode: 'ref' as const, source: '' }
			: { mode: 'literal' as const, value: param?.default };
	const nodes = state.nodes.map((n) =>
		n.id === node.id
			? { ...n, params: { ...n.params, [edge.targetHandle as string]: reset } }
			: n,
	);
	return { ...state, nodes };
}
