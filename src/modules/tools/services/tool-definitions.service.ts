import { z } from 'zod';
import { api } from '@/lib/fetch';
import { apiCourses } from '@/shared/lib/api-courses';

/**
 * Fábrica de Tools (front) — uma tool é DADO: o upvox guarda/serve a
 * ToolDefinition (input + pipeline + ui + billing); o motor genérico (main API)
 * roda por `key`; o `DynamicToolView` desenha a tela a partir de `ui`.
 *
 * `apiCourses` → upvox (`/v1/...`); `api` → main API (`/api/tool-run/...`).
 */

export const toolInputSpecSchema = z
	.object({
		/**
		 * `file` = arquivo NÃO-imagem (DXF, SVG, …). Trafega como Buffer igual a
		 * `image`, mas é validado por extensão (`accept`) em vez de mimetype.
		 *
		 * ATENÇÃO AO DEPLOY: este enum é fechado nos DOIS lados. Publicar uma tool
		 * com `type:'file'` antes do back de produção subir dá 500 no publish/run.
		 */
		type: z.enum(['image', 'enum', 'number', 'int', 'bool', 'string', 'file']),
		required: z.boolean().optional(),
		default: z.unknown().optional(),
		options: z.array(z.unknown()).optional(),
		min: z.number().optional(),
		max: z.number().optional(),
		/** Extensões aceitas por um input `type:'file'` (`['dxf','svg']`). */
		accept: z.array(z.string()).optional(),
	})
	.passthrough();
export type ToolInputSpec = z.infer<typeof toolInputSpecSchema>;

export const toolControlSchema = z
	.object({
		bind: z.string(),
		widget: z.string(),
		label: z.string().optional(),
		/** Seção do estúdio onde o controle aparece (ex.: "Luz", "Cor"). */
		group: z.string().optional(),
		min: z.number().optional(),
		max: z.number().optional(),
		step: z.number().optional(),
		options: z.array(z.unknown()).optional(),
	})
	.passthrough();
export type ToolControl = z.infer<typeof toolControlSchema>;

/**
 * "Banco" da tool (Banco do Admin / Prompts Mágicos): o admin alimenta uma lista
 * de registros (cada um vira um card na galeria do cliente). `fields` descreve os
 * campos próprios de cada registro (guardados em `data`); `card` mapeia o visual;
 * `inject` diz como os campos do registro entram no run (motor genérico).
 */
export const bankFieldSchema = z.object({
	name: z.string(),
	label: z.string().optional(),
	type: z.enum(['text', 'textarea', 'enum', 'image']),
	options: z.array(z.string()).optional(),
	required: z.boolean().optional(),
	placeholder: z.string().optional(),
});
export type BankFieldDef = z.infer<typeof bankFieldSchema>;

export const bankConfigSchema = z
	.object({
		enabled: z.boolean().default(false),
		fields: z.array(bankFieldSchema).default([]),
		card: z
			.object({
				image: z.string().optional(),
				title: z.string().optional(),
				subtitle: z.string().optional(),
				category: z.string().optional(),
			})
			.partial()
			.default({}),
		inject: z
			.record(
				z.string(),
				z.object({ from: z.string(), substitute: z.boolean().optional() }),
			)
			.default({}),
	})
	.passthrough();
export type BankConfig = z.infer<typeof bankConfigSchema>;

/**
 * Aparência de UMA tela de uma tool de PIPELINE (Admin OU Cliente). Espelha o
 * `RoomScreenUi` das salas, porém mais simples (sem materiais/chat): cor de
 * destaque, tema, título/subtítulo do topo e um banner/aviso opcional. Tudo
 * opcional — ausência = visual padrão. Guardado em `ui.admin` / `ui.customer`.
 */
export const screenUiSchema = z
	.object({
		accent: z
			.string()
			.regex(/^#[0-9a-fA-F]{6}$/)
			.optional(),
		theme: z.enum(['app', 'light', 'dark']).optional(),
		title: z.string().optional(),
		subtitle: z.string().optional(),
		notice: z
			.object({
				type: z.enum(['info', 'warning', 'success']).optional(),
				title: z.string().optional(),
				message: z.string().optional(),
			})
			.nullable()
			.optional(),
	})
	.passthrough();
export type ScreenUi = z.infer<typeof screenUiSchema>;

export const toolDefinitionDocSchema = z
	.object({
		schemaVersion: z.number().optional(),
		input: z.record(z.string(), toolInputSpecSchema).default({}),
		pipeline: z.array(z.unknown()).default([]),
		output: z.record(z.string(), z.unknown()).default({}),
		ui: z
			.object({
				layout: z.string().optional(),
				controls: z.array(toolControlSchema).default([]),
				action: z
					.object({
						label: z.string().optional(),
						showCostNotice: z.boolean().optional(),
					})
					.partial()
					.passthrough()
					.optional(),
				result: z
					.object({
						kind: z.string().optional(),
						downloadFrom: z.string().optional(),
						showMeta: z.boolean().optional(),
					})
					.partial()
					.passthrough()
					.optional(),
				// Aparência personalizável da tela do Admin e do Cliente (pipeline).
				// O resto de `ui` segue passthrough (icon/bank/custom_nodes/etc.).
				admin: screenUiSchema.optional(),
				customer: screenUiSchema.optional(),
				// info: catálogo infinito — a tool se auto-organiza na sidebar/hub.
				// `category` mapeia pra uma seção (admin/aluno), `order` ordena dentro
				// dela, `audience` restringe onde aparece. Tudo opcional → tools
				// antigas continuam válidas (cai em "outros"/"both" por padrão).
				category: z.string().optional(),
				order: z.number().optional(),
				audience: z.enum(['both', 'admin', 'student']).optional(),
				// Tools NATIVAS (engine_runtime 'native_v1'): a tela é uma página/rota
				// própria do app (não o DynamicToolView), então a definição carrega o
				// `href` da rota e a `permission` que a gateia. Opcionais → tools de
				// pipeline/Fábrica continuam válidas sem eles.
				href: z.string().optional(),
				permission: z.string().optional(),
				// Cor PRÓPRIA da tool (chave de `TOOL_COLORS`) — sobrescreve a cor
				// herdada da categoria no catálogo/board. Opcional → ausente = herda
				// da categoria. Validada contra a paleta no consumo (`safeColor`).
				color: z.string().optional(),
			})
			.passthrough()
			.default({ controls: [] }),
		billing: z
			.object({
				vox_cost: z.union([z.number(), z.literal('metered')]).optional(),
				free_quota: z.record(z.string(), z.number().nullable()).optional(),
			})
			.partial()
			.passthrough()
			.optional(),
		bank: bankConfigSchema.optional(),
		// Override per-tool do modelo OpenRouter usado por `ai.generate_image`
		// (catálogo curado: ver `image-models.service.ts`). O motor injeta
		// automaticamente nos `params` dos nós `ai.generate_image` no main API.
		model: z.string().optional(),
		// System prompt opcional enviado ao `ai.generate_image`. SUBSTITUI o
		// prompt laser padrão (decisão 2026-07-10: replace total).
		system_prompt: z.string().optional(),
		/** Modelo de TEXTO dos nós `ai.text` (espelho de `model`, que é de imagem). */
		text_model: z.string().optional(),
		text_system_prompt: z.string().optional(),
		/** Datasets declarados pela tool (ver Coleções). Forma livre — o back valida. */
		collections: z.record(z.string(), z.unknown()).optional(),
		// Dimensões EXATAS de saída (px) — arte de gravação a laser precisa do
		// tamanho exato. O motor injeta a proporção no prompt e redimensiona a
		// saída pra image_width×image_height.
		image_width: z.number().optional(),
		image_height: z.number().optional(),
		/**
		 * "Tipos de Criação" do Passo 1 (Prompts Mágicos). Cards visuais (ícone +
		 * nome amigável) que o cliente escolhe; a resolução (width×height) é
		 * HIDDEN e injetada no run via `creation_id`. Vazio → cai em
		 * `image_width/height` legado. `active:false` oculta o card.
		 */
		creations: z
			.array(
				z.object({
					id: z.string(),
					label: z.string(),
					icon: z.string().optional(),
					width: z.number(),
					height: z.number(),
					active: z.boolean().optional(),
				}),
			)
			.optional(),
		/**
		 * Quantidades de variações do Passo 3 (ex.: [1,2,4]). O 1º elemento é o
		 * default. Vazio/ausente = [1] (sem escolha). 1 run = 1 billing.
		 */
		return_variations: z.array(z.number()).optional(),
		/**
		 * TRUE = o motor manda SÓ a user message ao modelo (sem system prompt,
		 * sem TEXT_LEAD, sem sufixo FORMATO). Dimensão via sharp. Escopado por
		 * tool (Prompts Mágicos) — ai-extra mantém o comportamento atual.
		 */
		raw_prompt: z.boolean().optional(),
	})
	.passthrough();
export type ToolDefinitionDoc = z.infer<typeof toolDefinitionDocSchema>;
export type Creation = NonNullable<ToolDefinitionDoc['creations']>[number];

export const aiToolDefinitionSchema = z
	.object({
		id: z.string(),
		tool_key: z.string(),
		version: z.number(),
		status: z.string(),
		title: z.string(),
		description: z.string().nullable(),
		engine_runtime: z.string(),
		definition: toolDefinitionDocSchema,
	})
	.passthrough();
export type AiToolDefinition = z.infer<typeof aiToolDefinitionSchema>;

/* ── Leitura por key (motor + renderer) ── */
export async function getToolDefinition(
	key: string,
): Promise<AiToolDefinition> {
	const { data } = await apiCourses.get(`/v1/tool-definition/${key}`);
	return aiToolDefinitionSchema.parse(data);
}

/* ── Admin ── */
export async function listToolDefinitions(): Promise<AiToolDefinition[]> {
	const { data } = await apiCourses.get('/v1/tool-definitions');
	return z.array(aiToolDefinitionSchema).parse(data);
}

/** Cor/categoria (ui) por tool_key — QUALQUER status, leve. Usado pra linkar a
 * cor de uma feature do aluno à da tool admin correspondente (requireAuth). */
export interface ToolColorRow {
	tool_key: string;
	color: string | null;
	category: string | null;
}

export async function listToolColors(): Promise<ToolColorRow[]> {
	const { data } = await apiCourses.get('/v1/tool-definitions/colors');
	return (data ?? []) as ToolColorRow[];
}

export interface CreateToolDefinitionBody {
	tool_key: string;
	title: string;
	description?: string;
	engine_runtime?: string;
	definition: ToolDefinitionDoc;
}

export async function createToolDefinition(
	body: CreateToolDefinitionBody,
): Promise<AiToolDefinition> {
	const { data } = await apiCourses.post('/v1/tool-definition', body);
	return aiToolDefinitionSchema.parse(data);
}

export interface UpdateToolDefinitionBody {
	title?: string;
	description?: string | null;
	engine_runtime?: string;
	definition?: ToolDefinitionDoc;
}

export async function updateToolDefinition(
	id: string,
	body: UpdateToolDefinitionBody,
): Promise<AiToolDefinition> {
	const { data } = await apiCourses.patch(`/v1/tool-definition/${id}`, body);
	return aiToolDefinitionSchema.parse(data);
}

/**
 * Move uma tool para outra CATEGORIA (slug). Reescreve só `definition.ui.category`
 * com MERGE total — preserva `bank`/`pipeline`/`input`/`output` e o resto de `ui`
 * (icon/order/audience/admin/customer/...). Mesmo padrão anti-wipe do `saveMut`:
 * nunca mandamos um doc cru que apagaria o banco da tool.
 */
export async function setToolCategory(
	def: AiToolDefinition,
	slug: string,
): Promise<AiToolDefinition> {
	return updateToolDefinition(def.id, {
		title: def.title,
		description: def.description,
		engine_runtime: def.engine_runtime,
		definition: {
			...def.definition,
			ui: { ...(def.definition.ui ?? {}), category: slug },
		},
	});
}

/**
 * Define a COR PRÓPRIA de uma tool (chave de `TOOL_COLORS`) — reescreve só
 * `definition.ui.color` com MERGE total, espelhando `setToolCategory`. Preserva
 * `bank`/`pipeline`/`input`/`output` e o resto de `ui` (icon/category/order/...).
 * Mesmo padrão anti-wipe: nunca mandamos um doc cru que apagaria o banco.
 */
export async function setToolColor(
	def: AiToolDefinition,
	color: string,
): Promise<AiToolDefinition> {
	return updateToolDefinition(def.id, {
		title: def.title,
		description: def.description,
		engine_runtime: def.engine_runtime,
		definition: {
			...def.definition,
			ui: { ...(def.definition.ui ?? {}), color },
		},
	});
}

/**
 * Define o MODELO de imagem (OpenRouter id) usado pelo `ai.generate_image`
 * desta tool. Reescreve só `definition.model` com MERGE total. Preserva
 * `bank`/`pipeline`/`input`/`output`/`ui` e o resto. `modelId === null` apaga
 * a chave (volta ao default do sistema). Mesmo padrão anti-wipe do
 * `setToolCategory` / `setToolColor`. Encadeia `publishToolDefinition` para
 * o motor passar a usar o override na próxima invocação (cache de 60s no
 * `loadPublishedToolDefinition` na main API torna a publicação obrigatória).
 */
/**
 * Modelo de TEXTO da tool (`ai.text`). Espelha `setToolModel`, inclusive o
 * ponto crítico: espalha `...def.definition` e reescreve UMA chave. Mandar o
 * doc cru apagaria `bank`/`pipeline`/`collections` — é o bug que já custou o
 * `bank.inject` uma vez.
 */
export async function setToolTextModel(
	def: AiToolDefinition,
	modelId: string | null,
): Promise<PublishResult> {
	const next: ToolDefinitionDoc = { ...def.definition };
	if (modelId) next.text_model = modelId;
	else delete (next as { text_model?: string }).text_model;
	await updateToolDefinition(def.id, {
		title: def.title,
		description: def.description,
		engine_runtime: def.engine_runtime,
		definition: next,
	});
	return publishToolDefinition(def.id);
}

export async function setToolModel(
	def: AiToolDefinition,
	modelId: string | null,
): Promise<PublishResult> {
	const next: ToolDefinitionDoc = { ...def.definition };
	if (modelId) next.model = modelId;
	else delete (next as { model?: string }).model;
	await updateToolDefinition(def.id, {
		title: def.title,
		description: def.description,
		engine_runtime: def.engine_runtime,
		definition: next,
	});
	return publishToolDefinition(def.id);
}

/**
 * Define o SYSTEM PROMPT customizado enviado ao `ai.generate_image` desta
 * tool. SUBSTITUI o prompt laser padrão (decisão 2026-07-10: replace total).
 * `prompt === null` ou vazio apaga a chave (volta ao default). Mesmo padrão
 * anti-wipe do `setToolCategory` / `setToolColor`. Encadeia publish — ver
 * `setToolModel` para a justificativa.
 */
export async function setToolSystemPrompt(
	def: AiToolDefinition,
	prompt: string | null,
): Promise<PublishResult> {
	const next: ToolDefinitionDoc = { ...def.definition };
	if (prompt && prompt.trim().length > 0) next.system_prompt = prompt;
	else delete (next as { system_prompt?: string }).system_prompt;
	await updateToolDefinition(def.id, {
		title: def.title,
		description: def.description,
		engine_runtime: def.engine_runtime,
		definition: next,
	});
	return publishToolDefinition(def.id);
}

/**
 * Define as DIMENSÕES EXATAS de saída (px) do `ai.generate_image` desta tool —
 * arte de gravação a laser precisa do tamanho exato. `null` apaga (volta à
 * saída nativa do modelo). Mesmo padrão anti-wipe do `setToolModel`.
 */
export async function setToolImageSize(
	def: AiToolDefinition,
	size: { width: number; height: number } | null,
): Promise<PublishResult> {
	const next: ToolDefinitionDoc = { ...def.definition };
	if (size && size.width > 0 && size.height > 0) {
		next.image_width = Math.round(size.width);
		next.image_height = Math.round(size.height);
	} else {
		delete (next as { image_width?: number }).image_width;
		delete (next as { image_height?: number }).image_height;
	}
	await updateToolDefinition(def.id, {
		title: def.title,
		description: def.description,
		engine_runtime: def.engine_runtime,
		definition: next,
	});
	return publishToolDefinition(def.id);
}

/**
 * Define os "Tipos de Criação" (Passo 1), as "Variações de retorno" (Passo 3)
 * e o flag `raw_prompt` (sem intermediação) de uma tool de imagem. Mesmo
 * padrão anti-wipe do `setToolImageSize` — só os 3 campos são tocados; o resto
 * da definition é preservado por spread. Encadeia publish.
 *
 * Qualquer campo `undefined` no patch é ignorado (não apaga). Pra APAGAR, mande
 * `[]` (creations/return_variations) ou `false` (raw_prompt).
 */
export async function setToolImageAdvanced(
	def: AiToolDefinition,
	patch: {
		creations?: Creation[] | null;
		return_variations?: number[] | null;
		raw_prompt?: boolean | null;
	},
): Promise<PublishResult> {
	const next: ToolDefinitionDoc = { ...def.definition };
	if (patch.creations !== undefined) {
		if (patch.creations && patch.creations.length > 0)
			next.creations = patch.creations;
		else delete (next as { creations?: Creation[] }).creations;
	}
	if (patch.return_variations !== undefined) {
		if (patch.return_variations && patch.return_variations.length > 0)
			next.return_variations = patch.return_variations;
		else delete (next as { return_variations?: number[] }).return_variations;
	}
	if (patch.raw_prompt !== undefined) {
		if (patch.raw_prompt) next.raw_prompt = true;
		else delete (next as { raw_prompt?: boolean }).raw_prompt;
	}
	await updateToolDefinition(def.id, {
		title: def.title,
		description: def.description,
		engine_runtime: def.engine_runtime,
		definition: next,
	});
	return publishToolDefinition(def.id);
}

export const publishResultSchema = z.object({
	tool_key: z.string(),
	version: z.number(),
	status: z.literal('published'),
});
export type PublishResult = z.infer<typeof publishResultSchema>;

export async function publishToolDefinition(
	id: string,
): Promise<PublishResult> {
	const { data } = await apiCourses.post(`/v1/tool-definition/${id}/publish`);
	return publishResultSchema.parse(data);
}

/* ── Run no motor genérico (main API) ── */
export const toolRunResultSchema = z.object({
	id: z.string(),
	output: z.record(z.string(), z.unknown()),
});
export type ToolRunResult = z.infer<typeof toolRunResultSchema>;

/**
 * Resolução de saída escolhida pelo CLIENTE na hora da geração — mesmo formato
 * do `bankImageSizeSchema` da main API (`unit: 'px' | 'preset'`). Enviada como
 * `image_size` (JSON), vence o tamanho do item do banco e o default da tool.
 */
export type RunToolEngineImageSize =
	| { unit: 'px'; width: number; height: number }
	| { unit: 'preset'; preset_id: string }
	| 'native';

export interface RunToolEngineOpts {
	values: Record<string, unknown>;
	inputSpec: Record<string, ToolInputSpec>;
	invocationId?: string;
	/** Definition inline p/ preview de rascunho (staff; o motor não cobra). */
	draftDefinition?: ToolDefinitionDoc;
	/**
	 * Run de uma tool com Banco: o registro escolhido + os inputs do cliente por
	 * registro. O motor substitui `{tema}` no script do registro e gera a imagem.
	 * Campos `string`/`number` viram form fields; `File`s viram arquivos.
	 */
	bankEntryId?: string;
	bankInputs?: Record<string, unknown>;
	/** Resolução de saída escolhida pelo cliente (ausente = usa o default). */
	imageSize?: RunToolEngineImageSize;
}

export async function runToolEngine(
	key: string,
	opts: RunToolEngineOpts,
): Promise<ToolRunResult> {
	const fd = new FormData();
	for (const [name, spec] of Object.entries(opts.inputSpec)) {
		const v = opts.values[name];
		// `file` (DXF/SVG) trafega igual a `image`. Sem este ramo o `File` era
		// descartado EM SILÊNCIO: o form ia sem o arquivo, o motor rodava e
		// devolvia lixo, sem nenhum erro visível.
		if (spec.type === 'image' || spec.type === 'file') {
			if (v instanceof File) fd.append(name, v);
		} else if (v !== undefined && v !== null && v !== '') {
			fd.append(name, typeof v === 'boolean' ? String(v) : String(v));
		}
	}
	if (opts.bankEntryId) fd.append('bank_entry_id', opts.bankEntryId);
	for (const [name, v] of Object.entries(opts.bankInputs ?? {})) {
		if (v instanceof File) fd.append(name, v);
		else if (v !== undefined && v !== null && v !== '') {
			fd.append(name, typeof v === 'boolean' ? String(v) : String(v));
		}
	}
	if (opts.invocationId) fd.append('invocation_id', opts.invocationId);
	if (opts.imageSize) {
		fd.append(
			'image_size',
			opts.imageSize === 'native' ? 'native' : JSON.stringify(opts.imageSize),
		);
	}
	if (opts.draftDefinition) {
		fd.append('definition', JSON.stringify(opts.draftDefinition));
	}
	const { data } = await api.post(`/api/tool-run/${key}`, fd);
	return toolRunResultSchema.parse(data);
}

export interface RunToolPreviewOpts {
	values: Record<string, unknown>;
	inputSpec: Record<string, ToolInputSpec>;
	/** Definition inline p/ preview de rascunho (staff). */
	draftDefinition?: ToolDefinitionDoc;
}

/**
 * Preview AO VIVO NÃO COBRADO (estúdio): manda a imagem + params pro endpoint
 * `/preview`, que reduz a foto, tira os nós de saída/IA e devolve `{ preview }`
 * (base64) e, nas tools de CAD, `{ assembly }` — a montagem 3D não é imagem e
 * por isso viaja num campo próprio. Sem billing, sem storage — é o feedback dos
 * sliders.
 */
export async function runToolPreview(
	key: string,
	opts: RunToolPreviewOpts,
): Promise<{ preview: string | null; assembly?: unknown }> {
	const fd = new FormData();
	for (const [name, spec] of Object.entries(opts.inputSpec)) {
		const v = opts.values[name];
		// `file` (DXF/SVG) trafega igual a `image`. Sem este ramo o `File` era
		// descartado EM SILÊNCIO: o form ia sem o arquivo, o motor rodava e
		// devolvia lixo, sem nenhum erro visível.
		if (spec.type === 'image' || spec.type === 'file') {
			if (v instanceof File) fd.append(name, v);
		} else if (v !== undefined && v !== null && v !== '') {
			fd.append(name, typeof v === 'boolean' ? String(v) : String(v));
		}
	}
	if (opts.draftDefinition) {
		fd.append('definition', JSON.stringify(opts.draftDefinition));
	}
	const { data } = await api.post(`/api/tool-run/${key}/preview`, fd);
	return (data ?? { preview: null }) as {
		preview: string | null;
		assembly?: unknown;
	};
}
