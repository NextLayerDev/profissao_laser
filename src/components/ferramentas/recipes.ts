import type {
	ToolControl,
	ToolDefinitionDoc,
	ToolInputSpec,
} from '@/modules/tools/services/tool-definitions.service';

/**
 * Camada "humana" do builder: o admin não vê pipeline, refs nem JSON. Ele escolhe
 * uma CAPACIDADE (recipe), ajusta o formulário do cliente (rótulos/limites),
 * o preço e os planos. A recipe converte esse estado visual numa ToolDefinition
 * válida (`buildDoc`) e sabe reconstruir o estado a partir de uma definition
 * existente (`docToState`). Refs/pipeline ficam escondidos — só aparecem no modo
 * Avançado (JSON), pra quem quiser.
 */

export type FieldType = 'image' | 'enum' | 'number' | 'int' | 'bool';
export type FieldWidget =
	| 'file-drop'
	| 'select'
	| 'slider'
	| 'toggle'
	| 'number';

export interface BuilderField {
	/** Chave canônica usada nas refs do pipeline (não editável pelo usuário). */
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
	/** Mostrar como controle no formulário do cliente. */
	visible: boolean;
	/** Campo essencial da capacidade — não pode ser removido (mas pode esconder). */
	locked?: boolean;
}

export interface PlanQuota {
	key: string;
	label: string;
}

export const BUILDER_PLANS: PlanQuota[] = [
	{ key: 'basic', label: 'Básico' },
	{ key: 'avan', label: 'Avançado' },
	{ key: 'pro', label: 'Pro' },
	{ key: 'max', label: 'Max' },
];

export interface BuilderState {
	recipeId: string;
	toolKey: string;
	title: string;
	description: string;
	icon: string;
	actionLabel: string;
	fields: BuilderField[];
	voxCost: number;
	/** plano → cota grátis/mês (null = ilimitado). */
	freeQuota: Record<string, number | null>;
}

/** Metadado amigável de cada bloco — só pra desenhar o fluxo (não-técnico). */
export const BLOCK_META: Record<
	string,
	{ label: string; sub: string; icon: string; accent: string }
> = {
	'image.input': {
		label: 'Imagem de entrada',
		sub: 'recebe a foto do cliente',
		icon: 'image',
		accent: 'sky',
	},
	'laser.photoengrave': {
		label: 'Gravação a laser',
		sub: 'tom por material + dithering',
		icon: 'flame',
		accent: 'orange',
	},
	'image.vectorize': {
		label: 'Vetorizar',
		sub: 'imagem → traço (SVG)',
		icon: 'pen',
		accent: 'emerald',
	},
	'output.upload_png': {
		label: 'Entregar PNG',
		sub: 'salva e devolve o link',
		icon: 'box',
		accent: 'violet',
	},
	'output.upload_svg': {
		label: 'Entregar SVG',
		sub: 'salva e devolve o link',
		icon: 'box',
		accent: 'violet',
	},
	'output.return_base64': {
		label: 'Devolver imagem',
		sub: 'sem salvar no servidor',
		icon: 'image',
		accent: 'violet',
	},
};

/* ── helpers: BuilderField ↔ definition ── */

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

function baseDoc(
	state: BuilderState,
	pipeline: ToolDefinitionDoc['pipeline'],
	output: ToolDefinitionDoc['output'],
	resultUi: Record<string, unknown>,
): ToolDefinitionDoc {
	const input: Record<string, ToolInputSpec> = {};
	for (const f of state.fields) input[f.name] = fieldToSpec(f);

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
			result: resultUi,
		},
		billing: { vox_cost: state.voxCost, free_quota: state.freeQuota },
	} as unknown as ToolDefinitionDoc;
}

/* ── Recipes ── */

export interface Recipe {
	id: string;
	name: string;
	tagline: string;
	icon: string;
	accent: string; // tailwind color token
	advanced?: boolean;
	seed: () => BuilderState;
	buildDoc: (state: BuilderState) => ToolDefinitionDoc;
}

const LASER: Recipe = {
	id: 'laser',
	name: 'Gravação a laser',
	tagline:
		'Prepara uma foto pra gravar: tom por material, dithering e PNG no DPI certo.',
	icon: 'flame',
	accent: 'orange',
	seed: () => ({
		recipeId: 'laser',
		toolKey: '',
		title: 'Gravação a laser',
		description: 'Prepara uma foto pra gravação a laser.',
		icon: 'flame',
		actionLabel: 'Gerar gravação',
		voxCost: 0.3,
		freeQuota: { max: 20, avan: 2, pro: 0, basic: 0 },
		fields: [
			{
				name: 'image',
				type: 'image',
				widget: 'file-drop',
				label: 'Sua imagem',
				required: true,
				visible: true,
				locked: true,
			},
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
				locked: true,
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
	}),
	buildDoc: (state) =>
		baseDoc(
			state,
			[
				{ id: 'src', block: 'image.input', params: { from: 'input.image' } },
				{
					id: 'prep',
					block: 'laser.photoengrave',
					params: {
						image: 'src.buffer',
						material: 'input.material',
						width_mm: 'input.width_mm',
						dpi: 'input.dpi',
						noDither: '!input.dither',
						cleanBackground: 'input.cleanBackground',
					},
				},
				{
					id: 'store',
					block: 'output.upload_png',
					params: { from: 'prep.png', folder: 'laser-prep' },
				},
			],
			{
				primary: 'store.url',
				preview: 'prep.pngBase64',
				meta: [
					'prep.width_mm',
					'prep.height_mm',
					'prep.dpi',
					'prep.px_w',
					'prep.px_h',
				],
				savable: true,
			},
			{ kind: 'image', downloadFrom: 'output.primary', showMeta: true },
		),
};

const VECTORIZE: Recipe = {
	id: 'vectorize',
	name: 'Vetorizar imagem',
	tagline:
		'Converte uma imagem em traço vetorial (SVG) pronto pra corte/plotter.',
	icon: 'pen',
	accent: 'emerald',
	seed: () => ({
		recipeId: 'vectorize',
		toolKey: '',
		title: 'Vetorização',
		description: 'Converte uma imagem em vetor (SVG).',
		icon: 'pen',
		actionLabel: 'Vetorizar',
		voxCost: 0.1,
		freeQuota: { max: null, avan: 5, pro: 2, basic: 0 },
		fields: [
			{
				name: 'image',
				type: 'image',
				widget: 'file-drop',
				label: 'Sua imagem',
				required: true,
				visible: true,
				locked: true,
			},
			{
				name: 'threshold',
				type: 'int',
				widget: 'slider',
				label: 'Limiar (preto/branco)',
				hint: 'Mais alto = mais áreas viram preto.',
				default: 128,
				min: 0,
				max: 255,
				step: 1,
				visible: true,
			},
		],
	}),
	buildDoc: (state) =>
		baseDoc(
			state,
			[
				{ id: 'src', block: 'image.input', params: { from: 'input.image' } },
				{
					id: 'vec',
					block: 'image.vectorize',
					params: { image: 'src.buffer', threshold: 'input.threshold' },
				},
				{
					id: 'store',
					block: 'output.upload_svg',
					params: { from: 'vec.svg', folder: 'tool-output' },
				},
			],
			{ primary: 'store.url', savable: true },
			{ kind: 'image', downloadFrom: 'output.primary', showMeta: false },
		),
};

export const RECIPES: Recipe[] = [LASER, VECTORIZE];

export function getRecipe(id: string): Recipe | undefined {
	return RECIPES.find((r) => r.id === id);
}

/** Constrói a definition a partir do estado visual (usa a recipe). */
export function buildDocFromState(state: BuilderState): ToolDefinitionDoc {
	const recipe = getRecipe(state.recipeId);
	if (!recipe) throw new Error(`recipe desconhecida: ${state.recipeId}`);
	return recipe.buildDoc(state);
}

/* ── Reverse: definition → estado visual (pra editar tools existentes) ── */

/** Detecta a recipe a partir dos blocos do pipeline. null = avançada (só JSON). */
export function detectRecipeId(doc: ToolDefinitionDoc): string | null {
	const blocks = new Set(
		(doc.pipeline ?? []).map((n) => (n as { block?: string }).block),
	);
	if (blocks.has('laser.photoengrave')) return 'laser';
	if (blocks.has('image.vectorize')) return 'vectorize';
	return null;
}

/** Reconstrói o estado visual de uma definition conhecida (recipe detectada). */
export function docToState(
	def: {
		tool_key: string;
		title: string;
		description: string | null;
		definition: ToolDefinitionDoc;
	},
	recipeId: string,
): BuilderState {
	const recipe = getRecipe(recipeId);
	const seed = recipe ? recipe.seed() : RECIPES[0].seed();
	const doc = def.definition;
	const input = (doc.input ?? {}) as Record<string, ToolInputSpec>;
	const controls = (doc.ui?.controls ?? []) as ToolControl[];
	const controlByName = new Map(
		controls.map((c) => [c.bind.replace(/^input\./, ''), c]),
	);

	// Reaproveita a ordem/locks da seed; aplica os valores reais da definition.
	const fields: BuilderField[] = seed.fields.map((sf) => {
		const spec = input[sf.name];
		const ctl = controlByName.get(sf.name);
		return {
			...sf,
			label: ctl?.label ?? sf.label,
			default: spec?.default ?? sf.default,
			min: (ctl?.min ?? spec?.min ?? sf.min) as number | undefined,
			max: (ctl?.max ?? spec?.max ?? sf.max) as number | undefined,
			step: (ctl?.step ?? sf.step) as number | undefined,
			options: (spec?.options ?? sf.options) as (string | number)[] | undefined,
			required: spec?.required ?? sf.required,
			visible: controlByName.has(sf.name),
		};
	});

	const billing = doc.billing ?? {};
	const voxCost =
		typeof billing.vox_cost === 'number' ? billing.vox_cost : seed.voxCost;
	const freeQuota: Record<string, number | null> = { ...seed.freeQuota };
	for (const p of BUILDER_PLANS) {
		const q = billing.free_quota?.[p.key];
		if (q !== undefined) freeQuota[p.key] = q;
	}

	const action = doc.ui?.action as { label?: string } | undefined;

	return {
		recipeId,
		toolKey: def.tool_key,
		title: def.title,
		description: def.description ?? '',
		icon:
			(doc.ui as { icon?: string } | undefined)?.icon ??
			recipe?.icon ??
			'wrench',
		actionLabel: action?.label ?? seed.actionLabel,
		fields,
		voxCost,
		freeQuota,
	};
}

/** Sugere uma tool_key a partir do título (slug a–z0–9_). */
export function slugifyKey(title: string): string {
	return title
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '') // remove acentos
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 60);
}
