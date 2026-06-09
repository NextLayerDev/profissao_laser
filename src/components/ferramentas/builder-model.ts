import type {
	ToolControl,
	ToolDefinitionDoc,
	ToolInputSpec,
} from '@/modules/tools/services/tool-definitions.service';
import { blockSpec, type PortType } from './block-catalog';

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

export interface BuilderState {
	templateId: string;
	toolKey: string;
	title: string;
	description: string;
	icon: string;
	actionLabel: string;
	fields: BuilderField[];
	nodes: BuilderNode[];
	/** fontes (ex.: 'store.url', 'prep.pngBase64', ['prep.width_mm', …]). */
	output: { primary: string; preview: string; meta: string[] };
	voxCost: number;
	freeQuota: Record<string, number | null>;
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

export function buildDoc(state: BuilderState): ToolDefinitionDoc {
	const input: Record<string, ToolInputSpec> = {};
	for (const f of state.fields) input[f.name] = fieldToSpec(f);

	const pipeline = state.nodes.map((n) => {
		const params: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(n.params))
			params[k] = serializeParam(v);
		return { id: n.id, block: n.block, params };
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
			controls: state.fields.filter((f) => f.visible).map(fieldToControl),
			action: { label: state.actionLabel || 'Gerar', showCostNotice: true },
			result: {
				kind: 'image',
				downloadFrom: 'output.primary',
				showMeta: state.output.meta.length > 0,
			},
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

export function docToState(def: {
	tool_key: string;
	title: string;
	description: string | null;
	definition: ToolDefinitionDoc;
}): BuilderState {
	const doc = def.definition;
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
	const heads = new Set<string>(['input', ...rawNodes.map((n) => n.id)]);
	const nodes: BuilderNode[] = rawNodes.map((n) => {
		const params: Record<string, ParamValue> = {};
		for (const [k, v] of Object.entries(n.params ?? {})) {
			params[k] = classifyParam(v, heads);
		}
		return { id: n.id, block: n.block, params };
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

	return {
		templateId: 'custom',
		toolKey: def.tool_key,
		title: def.title,
		description: def.description ?? '',
		icon: (doc.ui as { icon?: string } | undefined)?.icon ?? 'wrench',
		actionLabel: action?.label ?? 'Gerar',
		fields,
		nodes,
		output: {
			primary: out.primary ?? '',
			preview: out.preview ?? '',
			meta: Array.isArray(out.meta) ? out.meta : [],
		},
		voxCost: typeof billing.vox_cost === 'number' ? billing.vox_cost : 0,
		freeQuota,
	};
}

/* ── fontes compatíveis pra ligar um parâmetro ── */

export interface SourceOption {
	value: string; // 'input.x' | 'node.field'
	label: string;
	type: PortType | 'bool' | 'enum';
}

/** Aceita-se uma fonte se o tipo dela "cabe" no que o parâmetro espera. */
function typeFits(
	src: PortType | 'bool' | 'enum',
	want: PortType | 'bool' | 'enum',
): boolean {
	if (src === want) return true;
	// enum e string são intercambiáveis o suficiente p/ ligação simples.
	if (
		(want === 'string' || want === 'enum') &&
		(src === 'string' || src === 'enum')
	)
		return true;
	return false;
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
		const spec = blockSpec(n.block);
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
		const spec = blockSpec(n.block);
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

export function newNode(blockId: string, existing: BuilderNode[]): BuilderNode {
	const spec = blockSpec(blockId);
	const baseId = blockId.split('.').pop() || 'node';
	let id = baseId;
	let n = 1;
	const taken = new Set(existing.map((e) => e.id));
	while (taken.has(id)) {
		n += 1;
		id = `${baseId}${n}`;
	}
	const params: Record<string, ParamValue> = {};
	for (const p of spec?.params ?? []) {
		params[p.name] =
			p.kind === 'ref'
				? { mode: 'ref', source: '' }
				: { mode: 'literal', value: p.default };
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
		toolKey: '',
		title: '',
		description: '',
		icon: 'wrench',
		actionLabel: 'Gerar',
		fields: [imageField()],
		nodes: [mkNode('src', 'image.input', { from: ref('input.image') })],
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
		toolKey: '',
		title: 'Gravação a laser',
		description: 'Prepara uma foto pra gravação a laser.',
		icon: 'flame',
		actionLabel: 'Gerar gravação',
		voxCost: 0.3,
		freeQuota: { max: 20, avan: 2, pro: 0, basic: 0 },
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
		toolKey: '',
		title: 'Vetorização',
		description: 'Converte uma imagem em vetor (SVG).',
		icon: 'pen',
		actionLabel: 'Vetorizar',
		voxCost: 0.1,
		freeQuota: { max: null, avan: 5, pro: 2, basic: 0 },
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

export const TEMPLATES: Template[] = [blank, laser, vectorize];

export function slugifyKey(title: string): string {
	return title
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 60);
}
