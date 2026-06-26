import type {
	ToolControl,
	ToolDefinitionDoc,
	ToolInputSpec,
} from '@/modules/tools/services/tool-definitions.service';
import {
	type BlockParam,
	type BlockSpec,
	blockSpec,
	type PortType,
} from './block-catalog';

/**
 * Modelo GERAL do builder: o admin monta uma tool do zero empilhando blocos e
 * ligando saída→entrada — sem ver refs nem JSON. Este módulo converte o estado
 * visual numa ToolDefinition (`buildDoc`) e reconstrói o estado a partir de
 * qualquer definition (`docToState`), classificando cada parâmetro como valor
 * fixo (literal) ou ligação (ref) igual o motor faz.
 */

export type FieldType = 'image' | 'enum' | 'number' | 'int' | 'bool' | 'string';
export type FieldWidget =
	| 'file-drop'
	| 'select'
	| 'slider'
	| 'toggle'
	| 'number'
	| 'text';

export interface BuilderField {
	name: string;
	type: FieldType;
	widget: FieldWidget;
	label: string;
	hint?: string;
	required?: boolean;
	default?: unknown;
	min?: number;
	max?: number;
	step?: number;
	options?: (string | number)[];
	visible: boolean;
}

/** Valor de um parâmetro de bloco: fixo (literal) ou ligado a uma fonte (ref). */
export type ParamValue =
	| { mode: 'literal'; value: unknown }
	| { mode: 'ref'; source: string; negate?: boolean };

export interface BuilderNode {
	id: string;
	block: string;
	params: Record<string, ParamValue>;
}

/**
 * Nó CUSTOMIZADO ("monte do zero"): um preset nomeado sobre um bloco base do
 * catálogo (rótulo/ícone próprios + valores pré-preenchidos). No `buildDoc` ele
 * é EXPANDIDO pro bloco base — o motor só vê blocos que conhece (zero mudança no
 * back). O id do nó referencia `custom:<id>`.
 */
export interface CustomNodeSpec {
	id: string;
	label: string;
	icon: string;
	accent: string;
	baseBlock: string;
	defaults: Record<string, unknown>;
}

export const CUSTOM_PREFIX = 'custom:';

/** Sintetiza um BlockSpec a partir de um nó custom (mesmos params/saídas do base). */
export function customToSpec(c: CustomNodeSpec): BlockSpec | undefined {
	const base = blockSpec(c.baseBlock);
	if (!base) return undefined;
	return {
		...base,
		id: `${CUSTOM_PREFIX}${c.id}`,
		label: c.label,
		sub: `nó · ${base.label}`,
		icon: c.icon,
		accent: c.accent,
		category: 'util',
	};
}

/** Resolve um BlockSpec por id, incluindo nós custom (`custom:<id>`). */
export function resolveSpec(
	blockId: string,
	customs?: CustomNodeSpec[],
): BlockSpec | undefined {
	if (blockId.startsWith(CUSTOM_PREFIX)) {
		const c = customs?.find((x) => `${CUSTOM_PREFIX}${x.id}` === blockId);
		return c ? customToSpec(c) : undefined;
	}
	return blockSpec(blockId);
}

/** Resolve um BlockParam por id+nome, incluindo nós custom. */
export function resolveParam(
	blockId: string,
	name: string,
	customs?: CustomNodeSpec[],
): BlockParam | undefined {
	return resolveSpec(blockId, customs)?.params.find((p) => p.name === name);
}

/**
 * Config de uma tool de "sala" (Mentoria) — engine_runtime='room_v1'. Não é
 * pipeline: o admin define a sala (cap, agenda, link externo, features) e o
 * acesso (planos inclusos grátis / custo em voxes / se pode entrar pagando).
 */
/** Aparência de UMA tela da sala (aluno OU admin). Tudo opcional. */
export interface RoomScreenUi {
	accent?: string;
	theme?: 'app' | 'light' | 'dark';
	labels?: Record<string, string>;
	notice?: {
		type?: 'info' | 'warning' | 'success';
		title?: string;
		message?: string;
	} | null;
	sections?: { materials?: boolean; chat?: boolean };
}

export interface BuilderRoomState {
	cap: number | null; // null = sem limite
	opensMinutesBefore: number;
	defaultDurationMin: number;
	features: { recording: boolean; chat: boolean; materials: boolean };
	includedPlanKeys: string[]; // planos com entrada grátis
	voxCost: number; // custo p/ quem não tem plano
	allowVoxEntry: boolean; // false = só plano (sem comprar entrada)
	/** Aparência personalizável por tela (aluno/admin). */
	ui?: { customer?: RoomScreenUi; admin?: RoomScreenUi };
}

export interface BuilderState {
	templateId: string;
	/**
	 * 'pipeline' (tools de IA) | 'room' (Mentoria/sala) | 'native' (tool nativa
	 * em código — engine_runtime='native_v1'). No modo 'native' o builder só
	 * edita metadados (Identidade/Aparência) e NUNCA reescreve a tool pra blocos.
	 */
	toolType: 'pipeline' | 'room' | 'native';
	toolKey: string;
	title: string;
	description: string;
	icon: string;
	/** Rota da página nativa (ui.href) — só p/ tools 'native' (read-only na UI). */
	href?: string;
	/** Permissão que gateia a tool nativa (ui.permission) — só p/ 'native'. */
	permission?: string;
	/** Categoria (id de TOOL_CATEGORIES) → seção/cor no catálogo. Ausente = 'outros'. */
	category?: string;
	/** Ordem dentro da seção (menor = primeiro). Ausente = 999. */
	order?: number;
	/** Público-alvo: ambos / só admin / só aluno. Ausente = 'both'. */
	audience?: 'both' | 'admin' | 'student';
	/** Cor PRÓPRIA da tool (chave de TOOL_COLORS, ui.color) — sobrepõe a da categoria. */
	color?: string;
	actionLabel: string;
	fields: BuilderField[];
	nodes: BuilderNode[];
	/** nós personalizados criados nesta tool (preset sobre um bloco base). */
	customNodes: CustomNodeSpec[];
	/** fontes (ex.: 'store.url', 'prep.pngBase64', ['prep.width_mm', …]). */
	output: { primary: string; preview: string; meta: string[] };
	voxCost: number;
	freeQuota: Record<string, number | null>;
	/** Presente só quando toolType='room'. */
	room?: BuilderRoomState;
}

/** Planos conhecidos (fallback p/ seeds; a UI usa os planos reais via usePlans). */
export const BUILDER_PLAN_KEYS = ['basic', 'avan', 'pro', 'max'] as const;

/** Helpers tipados de construção de nós (mantêm `ParamValue` certo nos templates). */
const ref = (source: string, negate?: boolean): ParamValue =>
	negate ? { mode: 'ref', source, negate } : { mode: 'ref', source };
const lit = (value: unknown): ParamValue => ({ mode: 'literal', value });
const mkNode = (
	id: string,
	block: string,
	params: Record<string, ParamValue>,
): BuilderNode => ({ id, block, params });

/* ── refs ── */

function isRefString(v: unknown, heads: Set<string>): boolean {
	if (typeof v !== 'string') return false;
	const body = v.startsWith('!') ? v.slice(1) : v;
	const dot = body.indexOf('.');
	if (dot <= 0) return false;
	return heads.has(body.slice(0, dot));
}

function serializeParam(p: ParamValue): unknown {
	if (p.mode === 'literal') return p.value;
	return `${p.negate ? '!' : ''}${p.source}`;
}

function classifyParam(value: unknown, heads: Set<string>): ParamValue {
	if (isRefString(value, heads)) {
		const s = value as string;
		const negate = s.startsWith('!');
		return { mode: 'ref', source: negate ? s.slice(1) : s, negate };
	}
	return { mode: 'literal', value };
}

/** O que um campo de input "produz" como tipo de porta. */
export function fieldProduces(type: FieldType): PortType | 'bool' | 'enum' {
	if (type === 'image') return 'buffer';
	if (type === 'number' || type === 'int') return 'number';
	if (type === 'bool') return 'bool';
	if (type === 'enum') return 'enum';
	return 'string';
}

/* ── field ↔ definition ── */

function fieldToSpec(f: BuilderField): ToolInputSpec {
	const spec: ToolInputSpec = { type: f.type };
	if (f.required) spec.required = true;
	if (f.default !== undefined) spec.default = f.default;
	if (f.min !== undefined) spec.min = f.min;
	if (f.max !== undefined) spec.max = f.max;
	if (f.options) spec.options = f.options;
	if (f.type === 'image') spec.accept = ['png', 'jpg', 'jpeg', 'webp'];
	return spec;
}

function fieldToControl(f: BuilderField): ToolControl {
	const c: ToolControl = {
		bind: `input.${f.name}`,
		widget: f.widget,
		label: f.label,
	};
	if (f.min !== undefined) c.min = f.min;
	if (f.max !== undefined) c.max = f.max;
	if (f.step !== undefined) c.step = f.step;
	if (f.options) c.options = f.options;
	return c;
}

/**
 * Campos de catálogo (`category`/`order`/`audience`) que o builder grava em
 * `ui` — só quando setados, pra não poluir o doc nem sobrescrever defaults. O
 * `tool-categories`/`use-tool-catalog` resolvem ausências (outros/999/both).
 */
function catalogUi(state: BuilderState): Partial<{
	category: string;
	order: number;
	audience: string;
	color: string;
}> {
	const ui: Partial<{
		category: string;
		order: number;
		audience: string;
		color: string;
	}> = {};
	if (state.category) ui.category = state.category;
	if (state.order !== undefined) ui.order = state.order;
	if (state.audience) ui.audience = state.audience;
	if (state.color) ui.color = state.color;
	return ui;
}

/** Lê `category`/`order`/`audience`/`color` de volta do `ui` do doc (round-trip). */
function readCatalogUi(ui: unknown): {
	category?: string;
	order?: number;
	audience?: BuilderState['audience'];
	color?: string;
} {
	const u = (ui ?? {}) as {
		category?: unknown;
		order?: unknown;
		audience?: unknown;
		color?: unknown;
	};
	const audience =
		u.audience === 'admin' || u.audience === 'student' || u.audience === 'both'
			? u.audience
			: undefined;
	return {
		category: typeof u.category === 'string' ? u.category : undefined,
		order: typeof u.order === 'number' ? u.order : undefined,
		audience,
		color: typeof u.color === 'string' ? u.color : undefined,
	};
}

/** Doc de uma tool de sala (Mentoria): sem pipeline; config em `room`. */
function buildRoomDoc(state: BuilderState): ToolDefinitionDoc {
	const r = state.room ?? defaultRoom();
	// billing derivado p/ preview/compat; o publish é a fonte (lê room.access).
	const freeQuota: Record<string, number | null> = {};
	for (const k of r.includedPlanKeys) freeQuota[k] = null;
	return {
		schemaVersion: 1,
		input: {},
		pipeline: [],
		room: {
			cap: r.cap,
			schedule: {
				opensMinutesBefore: r.opensMinutesBefore,
				defaultDurationMin: r.defaultDurationMin,
			},
			link: { mode: 'external' },
			features: { ...r.features },
			access: {
				includedPlanKeys: [...r.includedPlanKeys],
				voxCost: r.voxCost,
				allowVoxEntry: r.allowVoxEntry,
			},
			...(r.ui ? { ui: r.ui } : {}),
		},
		output: {},
		ui: {
			layout: 'room',
			icon: state.icon,
			...catalogUi(state),
			title: state.title,
			description: state.description,
			action: { label: state.actionLabel || 'Entrar na sala' },
		},
		billing: { vox_cost: r.voxCost, free_quota: freeQuota },
	} as unknown as ToolDefinitionDoc;
}

/**
 * Doc de uma tool NATIVA (engine_runtime='native_v1'): a página/rota vive em
 * código — o builder só grava metadados (Identidade/Aparência) em `ui`, sem
 * pipeline nem billing. `ui.href`/`ui.permission` são preservados verbatim pra
 * o catálogo/sidebar continuar apontando pra página nativa e gateando o acesso.
 */
function buildNativeDoc(state: BuilderState): ToolDefinitionDoc {
	return {
		schemaVersion: 1,
		input: {},
		pipeline: [],
		output: {},
		ui: {
			layout: 'native',
			icon: state.icon,
			href: state.href,
			permission: state.permission,
			...catalogUi(state),
			title: state.title,
			description: state.description,
		},
		billing: { vox_cost: 0, free_quota: {} },
	} as unknown as ToolDefinitionDoc;
}

export function buildDoc(state: BuilderState): ToolDefinitionDoc {
	if (state.toolType === 'native') return buildNativeDoc(state);
	if (state.toolType === 'room') return buildRoomDoc(state);

	const input: Record<string, ToolInputSpec> = {};
	for (const f of state.fields) input[f.name] = fieldToSpec(f);

	// Nós custom são EXPANDIDOS pro bloco base (o motor só conhece blocos base);
	// guardamos o mapa instância→def em `ui.custom_nodes` pro round-trip.
	const customById = new Map((state.customNodes ?? []).map((c) => [c.id, c]));
	const customInstances: Record<string, string> = {};
	const pipeline = state.nodes.map((n) => {
		let block = n.block;
		if (block.startsWith(CUSTOM_PREFIX)) {
			const defId = block.slice(CUSTOM_PREFIX.length);
			const c = customById.get(defId);
			if (c) {
				customInstances[n.id] = defId;
				block = c.baseBlock;
			}
		}
		const params: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(n.params))
			params[k] = serializeParam(v);
		return { id: n.id, block, params };
	});

	const output: Record<string, unknown> = {};
	if (state.output.primary) output.primary = state.output.primary;
	if (state.output.preview) output.preview = state.output.preview;
	if (state.output.meta.length) output.meta = state.output.meta;
	output.savable = true;

	return {
		schemaVersion: 1,
		input,
		pipeline,
		output,
		ui: {
			layout: 'image-tool',
			icon: state.icon,
			...catalogUi(state),
			controls: state.fields.filter((f) => f.visible).map(fieldToControl),
			action: { label: state.actionLabel || 'Gerar', showCostNotice: true },
			result: {
				kind: 'image',
				downloadFrom: 'output.primary',
				showMeta: state.output.meta.length > 0,
			},
			...(state.customNodes.length
				? {
						custom_nodes: {
							defs: state.customNodes,
							instances: customInstances,
						},
					}
				: {}),
		},
		billing: { vox_cost: state.voxCost, free_quota: state.freeQuota },
	} as unknown as ToolDefinitionDoc;
}

/* ── definition → estado (qualquer pipeline) ── */

function inferFieldWidget(spec: ToolInputSpec, ctl?: ToolControl): FieldWidget {
	if (ctl?.widget) return ctl.widget as FieldWidget;
	if (spec.type === 'image') return 'file-drop';
	if (spec.type === 'bool') return 'toggle';
	if (spec.options) return 'select';
	if (spec.type === 'number' || spec.type === 'int') return 'number';
	return 'text';
}

/** Estado-base de uma sala nova (Mentoria). */
export function defaultRoom(): BuilderRoomState {
	return {
		cap: null,
		opensMinutesBefore: 10,
		defaultDurationMin: 60,
		features: { recording: false, chat: false, materials: false },
		includedPlanKeys: [],
		voxCost: 0,
		allowVoxEntry: true,
	};
}

export function docToState(def: {
	tool_key: string;
	title: string;
	description: string | null;
	engine_runtime?: string;
	definition: ToolDefinitionDoc;
}): BuilderState {
	const doc = def.definition;

	// Tool NATIVA (engine_runtime='native_v1' OU ui.layout='native' OU ui.href):
	// detecta PRIMEIRO — a página vive em código, então só reconstruímos os
	// metadados (sem pipeline/campos/billing) pra editar Identidade/Aparência.
	const nativeUi = (doc.ui ?? {}) as { layout?: string; href?: string };
	if (
		def.engine_runtime === 'native_v1' ||
		nativeUi.layout === 'native' ||
		!!nativeUi.href
	) {
		return nativeDocToState(def, doc.ui);
	}

	// Tool de sala (Mentoria): reconstrói o estado de room (sem pipeline).
	const roomDoc = (doc as { room?: Record<string, unknown> }).room;
	if (roomDoc) return roomDocToState(def, roomDoc, doc.ui);

	const inputSpec = (doc.input ?? {}) as Record<string, ToolInputSpec>;
	const controls = (doc.ui?.controls ?? []) as ToolControl[];
	const controlByName = new Map(
		controls.map((c) => [c.bind.replace(/^input\./, ''), c]),
	);

	const fields: BuilderField[] = Object.entries(inputSpec).map(
		([name, spec]) => {
			const ctl = controlByName.get(name);
			return {
				name,
				type: (spec.type ?? 'string') as FieldType,
				widget: inferFieldWidget(spec, ctl),
				label: ctl?.label ?? name,
				required: spec.required,
				default: spec.default,
				min: (ctl?.min ?? spec.min) as number | undefined,
				max: (ctl?.max ?? spec.max) as number | undefined,
				step: ctl?.step as number | undefined,
				options: spec.options as (string | number)[] | undefined,
				visible: controlByName.has(name),
			};
		},
	);

	const rawNodes = (doc.pipeline ?? []) as {
		id: string;
		block: string;
		params?: Record<string, unknown>;
	}[];
	// nós custom: restaura os defs e remapeia o bloco das instâncias.
	const customMeta = (
		doc.ui as
			| {
					custom_nodes?: {
						defs?: CustomNodeSpec[];
						instances?: Record<string, string>;
					};
			  }
			| undefined
	)?.custom_nodes;
	const customNodes = Array.isArray(customMeta?.defs) ? customMeta.defs : [];
	const instances = customMeta?.instances ?? {};

	const heads = new Set<string>(['input', ...rawNodes.map((n) => n.id)]);
	const nodes: BuilderNode[] = rawNodes.map((n) => {
		const params: Record<string, ParamValue> = {};
		for (const [k, v] of Object.entries(n.params ?? {})) {
			params[k] = classifyParam(v, heads);
		}
		const block = instances[n.id]
			? `${CUSTOM_PREFIX}${instances[n.id]}`
			: n.block;
		return { id: n.id, block, params };
	});

	const out = (doc.output ?? {}) as {
		primary?: string;
		preview?: string;
		meta?: string[];
	};
	const billing = doc.billing ?? {};
	const freeQuota: Record<string, number | null> = {};
	for (const [k, v] of Object.entries(billing.free_quota ?? {})) {
		freeQuota[k] = v;
	}
	const action = doc.ui?.action as { label?: string } | undefined;
	const cat = readCatalogUi(doc.ui);

	return {
		templateId: 'custom',
		toolType: 'pipeline',
		toolKey: def.tool_key,
		title: def.title,
		description: def.description ?? '',
		icon: (doc.ui as { icon?: string } | undefined)?.icon ?? 'wrench',
		category: cat.category,
		order: cat.order,
		audience: cat.audience,
		color: cat.color,
		actionLabel: action?.label ?? 'Gerar',
		fields,
		nodes,
		customNodes,
		output: {
			primary: out.primary ?? '',
			preview: out.preview ?? '',
			meta: Array.isArray(out.meta) ? out.meta : [],
		},
		voxCost: typeof billing.vox_cost === 'number' ? billing.vox_cost : 0,
		freeQuota,
	};
}

/** definition de sala → BuilderState (round-trip idempotente com buildRoomDoc). */
function roomDocToState(
	def: { tool_key: string; title: string; description: string | null },
	roomDoc: Record<string, unknown>,
	topUi?: unknown,
): BuilderState {
	const r = roomDoc as {
		cap?: number | null;
		schedule?: { opensMinutesBefore?: number; defaultDurationMin?: number };
		features?: { recording?: boolean; chat?: boolean; materials?: boolean };
		access?: {
			includedPlanKeys?: string[];
			voxCost?: number;
			allowVoxEntry?: boolean;
		};
		ui?: BuilderRoomState['ui'];
	};
	const room: BuilderRoomState = {
		cap: r.cap ?? null,
		opensMinutesBefore: r.schedule?.opensMinutesBefore ?? 10,
		defaultDurationMin: r.schedule?.defaultDurationMin ?? 60,
		features: {
			recording: !!r.features?.recording,
			chat: !!r.features?.chat,
			materials: !!r.features?.materials,
		},
		includedPlanKeys: Array.isArray(r.access?.includedPlanKeys)
			? r.access.includedPlanKeys
			: [],
		voxCost: r.access?.voxCost ?? 0,
		allowVoxEntry: r.access?.allowVoxEntry !== false,
		...(r.ui ? { ui: r.ui } : {}),
	};
	const cat = readCatalogUi(topUi);
	return {
		templateId: 'mentoria',
		toolType: 'room',
		toolKey: def.tool_key,
		title: def.title,
		description: def.description ?? '',
		icon: 'video',
		category: cat.category,
		order: cat.order,
		audience: cat.audience,
		color: cat.color,
		actionLabel: 'Entrar na sala',
		fields: [],
		nodes: [],
		customNodes: [],
		output: { primary: '', preview: '', meta: [] },
		voxCost: room.voxCost,
		freeQuota: {},
		room,
	};
}

/**
 * definition de tool NATIVA → BuilderState (metadados only). NÃO reconstrói
 * pipeline/campos/billing: a página vive em código. Lê título/descrição, ícone
 * e catálogo (category/order/audience) do `ui`, mais `href`/`permission` por
 * cast preciso — round-trip idempotente com `buildNativeDoc`.
 */
function nativeDocToState(
	def: { tool_key: string; title: string; description: string | null },
	topUi?: unknown,
): BuilderState {
	const u = (topUi ?? {}) as {
		icon?: string;
		href?: string;
		permission?: string;
	};
	const cat = readCatalogUi(topUi);
	return {
		templateId: 'native',
		toolType: 'native',
		toolKey: def.tool_key,
		title: def.title,
		description: def.description ?? '',
		icon: typeof u.icon === 'string' ? u.icon : 'wrench',
		category: cat.category,
		order: cat.order,
		audience: cat.audience,
		color: cat.color,
		href: typeof u.href === 'string' ? u.href : undefined,
		permission: typeof u.permission === 'string' ? u.permission : undefined,
		actionLabel: '',
		fields: [],
		nodes: [],
		customNodes: [],
		output: { primary: '', preview: '', meta: [] },
		voxCost: 0,
		freeQuota: {},
	};
}

/* ── fontes compatíveis pra ligar um parâmetro ── */

export interface SourceOption {
	value: string; // 'input.x' | 'node.field'
	label: string;
	type: PortType | 'bool' | 'enum';
}

export type PortLike = PortType | 'bool' | 'enum';

/** Aceita-se uma fonte se o tipo dela "cabe" no que o parâmetro espera. */
export function typeFits(src: PortLike, want: PortLike): boolean {
	if (src === want) return true;
	// enum e string são intercambiáveis o suficiente p/ ligação simples.
	if (
		(want === 'string' || want === 'enum') &&
		(src === 'string' || src === 'enum')
	)
		return true;
	// tudo é trivialmente "texto": número/bool cabem num alvo string (o motor já
	// stringifica). Permite compor textos/corpos com cálculos e respostas de API.
	if (want === 'string' && (src === 'number' || src === 'bool')) return true;
	return false;
}

/** O tipo de porta que um parâmetro de bloco espera (ref ou literal-ligável). */
export function wantType(param: BlockParam): PortLike {
	if (param.kind === 'ref') return param.refType ?? 'buffer';
	if (param.valueType === 'int') return 'number';
	return param.valueType ?? 'string';
}

/** Resolve o tipo de porta de uma fonte (`input.x` ou `node.field`). */
export function outputSourceType(
	state: BuilderState,
	source: string,
): PortLike | undefined {
	const dot = source.indexOf('.');
	if (dot <= 0) return undefined;
	const head = source.slice(0, dot);
	const field = source.slice(dot + 1);
	if (head === 'input') {
		const f = state.fields.find((x) => x.name === field);
		return f ? fieldProduces(f.type) : undefined;
	}
	const node = state.nodes.find((n) => n.id === head);
	const spec = node ? resolveSpec(node.block, state.customNodes) : undefined;
	return spec?.outputs.find((o) => o.name === field)?.type;
}

export function availableSources(
	state: BuilderState,
	nodeIndex: number,
	want: PortType | 'bool' | 'enum',
): SourceOption[] {
	const out: SourceOption[] = [];
	for (const f of state.fields) {
		const t = fieldProduces(f.type);
		if (typeFits(t, want)) {
			out.push({ value: `input.${f.name}`, label: f.label, type: t });
		}
	}
	state.nodes.forEach((n, i) => {
		if (i >= nodeIndex) return; // só nós anteriores
		const spec = resolveSpec(n.block, state.customNodes);
		for (const o of spec?.outputs ?? []) {
			if (typeFits(o.type, want)) {
				out.push({
					value: `${n.id}.${o.name}`,
					label: `${spec?.label ?? n.block} · ${o.label}`,
					type: o.type,
				});
			}
		}
	});
	return out;
}

/** Todas as saídas de todos os nós (pra escolher o resultado). */
export function allNodeOutputs(state: BuilderState): SourceOption[] {
	const out: SourceOption[] = [];
	for (const n of state.nodes) {
		const spec = resolveSpec(n.block, state.customNodes);
		for (const o of spec?.outputs ?? []) {
			out.push({
				value: `${n.id}.${o.name}`,
				label: `${spec?.label ?? n.block} · ${o.label}`,
				type: o.type,
			});
		}
	}
	return out;
}

/* ── criação de campos e nós ── */

export function newField(type: FieldType, index: number): BuilderField {
	const base = {
		name: `campo_${index}`,
		type,
		label: 'Novo campo',
		visible: true,
	};
	switch (type) {
		case 'image':
			return {
				...base,
				name: 'imagem',
				widget: 'file-drop',
				label: 'Imagem',
				required: true,
			};
		case 'number':
			return {
				...base,
				widget: 'slider',
				default: 0,
				min: 0,
				max: 100,
				step: 1,
			};
		case 'int':
			return { ...base, widget: 'number', default: 0 };
		case 'bool':
			return { ...base, widget: 'toggle', default: false };
		case 'enum':
			return { ...base, widget: 'select', options: ['a', 'b'], default: 'a' };
		default:
			return { ...base, widget: 'text', default: '' };
	}
}

export function newNode(
	blockId: string,
	existing: BuilderNode[],
	customs?: CustomNodeSpec[],
): BuilderNode {
	const spec = resolveSpec(blockId, customs);
	const custom = blockId.startsWith(CUSTOM_PREFIX)
		? customs?.find((c) => `${CUSTOM_PREFIX}${c.id}` === blockId)
		: undefined;
	// id base: 'meu_no' pros custom, 'photoengrave' pros do catálogo.
	const baseId = blockId.startsWith(CUSTOM_PREFIX)
		? blockId.slice(CUSTOM_PREFIX.length).replace(/[^a-z0-9]+/gi, '_')
		: blockId.split('.').pop() || 'node';
	let id = baseId;
	let n = 1;
	const taken = new Set(existing.map((e) => e.id));
	while (taken.has(id)) {
		n += 1;
		id = `${baseId}${n}`;
	}
	const params: Record<string, ParamValue> = {};
	for (const p of spec?.params ?? []) {
		const cd = custom?.defaults?.[p.name];
		params[p.name] =
			p.kind === 'ref'
				? { mode: 'ref', source: '' }
				: { mode: 'literal', value: cd !== undefined ? cd : p.default };
	}
	return { id, block: blockId, params };
}

/* ── templates ── */

function imageField(): BuilderField {
	return {
		name: 'image',
		type: 'image',
		widget: 'file-drop',
		label: 'Sua imagem',
		required: true,
		visible: true,
	};
}

export interface Template {
	id: string;
	name: string;
	tagline: string;
	icon: string;
	accent: string;
	seed: () => BuilderState;
}

const blank: Template = {
	id: 'blank',
	name: 'Do zero',
	tagline: 'Comece com uma imagem e empilhe os blocos que quiser.',
	icon: 'sparkles',
	accent: 'cyan',
	seed: () => ({
		templateId: 'blank',
		toolType: 'pipeline',
		toolKey: '',
		title: '',
		description: '',
		icon: 'wrench',
		actionLabel: 'Gerar',
		fields: [imageField()],
		nodes: [mkNode('src', 'image.input', { from: ref('input.image') })],
		customNodes: [],
		output: { primary: '', preview: '', meta: [] },
		voxCost: 0,
		freeQuota: { basic: 0, avan: 0, pro: 0, max: 0 },
	}),
};

const laser: Template = {
	id: 'laser',
	name: 'Gravação a laser',
	tagline: 'Modelo pronto: foto → gravação (PNG no DPI certo).',
	icon: 'flame',
	accent: 'orange',
	seed: () => ({
		templateId: 'laser',
		toolType: 'pipeline',
		toolKey: '',
		title: 'Gravação a laser',
		description: 'Prepara uma foto pra gravação a laser.',
		icon: 'flame',
		actionLabel: 'Gerar gravação',
		voxCost: 0.3,
		freeQuota: { max: 20, avan: 2, pro: 0, basic: 0 },
		customNodes: [],
		fields: [
			imageField(),
			{
				name: 'material',
				type: 'enum',
				widget: 'select',
				label: 'Material',
				default: 'wood',
				options: [
					'wood',
					'black slate',
					'glass',
					'acrylic',
					'leather',
					'cork',
					'andonized aluminum',
					'stainless steel',
					'white tile',
					'white tile painted black',
				],
				visible: true,
			},
			{
				name: 'width_mm',
				type: 'number',
				widget: 'slider',
				label: 'Largura (mm)',
				default: 150,
				min: 10,
				max: 600,
				step: 5,
				visible: true,
			},
			{
				name: 'dpi',
				type: 'int',
				widget: 'select',
				label: 'DPI',
				default: 254,
				options: [203, 254, 300, 600],
				visible: true,
			},
			{
				name: 'dither',
				type: 'bool',
				widget: 'toggle',
				label: 'Dithering',
				default: true,
				visible: true,
			},
			{
				name: 'cleanBackground',
				type: 'bool',
				widget: 'toggle',
				label: 'Limpar fundo',
				default: false,
				visible: true,
			},
		],
		nodes: [
			mkNode('src', 'image.input', { from: ref('input.image') }),
			mkNode('prep', 'laser.photoengrave', {
				image: ref('src.buffer'),
				material: ref('input.material'),
				width_mm: ref('input.width_mm'),
				dpi: ref('input.dpi'),
				noDither: ref('input.dither', true),
				cleanBackground: ref('input.cleanBackground'),
			}),
			mkNode('store', 'output.upload_png', {
				from: ref('prep.png'),
				folder: lit('laser-prep'),
			}),
		],
		output: {
			primary: 'store.url',
			preview: 'prep.pngBase64',
			meta: [
				'prep.width_mm',
				'prep.height_mm',
				'prep.dpi',
				'prep.px_w',
				'prep.px_h',
			],
		},
	}),
};

const vectorize: Template = {
	id: 'vectorize',
	name: 'Vetorizar imagem',
	tagline: 'Modelo pronto: imagem → traço vetorial (SVG).',
	icon: 'pen',
	accent: 'emerald',
	seed: () => ({
		templateId: 'vectorize',
		toolType: 'pipeline',
		toolKey: '',
		title: 'Vetorização',
		description: 'Converte uma imagem em vetor (SVG).',
		icon: 'pen',
		actionLabel: 'Vetorizar',
		voxCost: 0.1,
		freeQuota: { max: null, avan: 5, pro: 2, basic: 0 },
		customNodes: [],
		fields: [
			imageField(),
			{
				name: 'threshold',
				type: 'int',
				widget: 'slider',
				label: 'Limiar (P/B)',
				default: 128,
				min: 0,
				max: 255,
				step: 1,
				visible: true,
			},
		],
		nodes: [
			mkNode('src', 'image.input', { from: ref('input.image') }),
			mkNode('vec', 'image.vectorize', {
				image: ref('src.buffer'),
				threshold: ref('input.threshold'),
			}),
			mkNode('store', 'output.upload_svg', {
				from: ref('vec.svg'),
				folder: lit('tool-output'),
			}),
		],
		output: { primary: 'store.url', preview: '', meta: [] },
	}),
};

const mentoria: Template = {
	id: 'mentoria',
	name: 'Mentoria (sala ao vivo)',
	tagline: 'Sala de vídeo/live com acesso por plano ou voxes e cap de gente.',
	icon: 'video',
	accent: 'violet',
	seed: () => ({
		templateId: 'mentoria',
		toolType: 'room',
		toolKey: '',
		title: 'Mentoria',
		description: 'Sessões de mentoria ao vivo (sala de vídeo).',
		icon: 'video',
		actionLabel: 'Entrar na sala',
		fields: [],
		nodes: [],
		customNodes: [],
		output: { primary: '', preview: '', meta: [] },
		voxCost: 0,
		freeQuota: {},
		room: defaultRoom(),
	}),
};

export const TEMPLATES: Template[] = [blank, laser, vectorize, mentoria];

export function slugifyKey(title: string): string {
	return title
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 60);
}
