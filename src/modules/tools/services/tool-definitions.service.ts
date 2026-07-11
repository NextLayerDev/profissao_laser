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
		type: z.enum(['image', 'enum', 'number', 'int', 'bool', 'string']),
		required: z.boolean().optional(),
		default: z.unknown().optional(),
		options: z.array(z.unknown()).optional(),
		min: z.number().optional(),
		max: z.number().optional(),
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
	})
	.passthrough();
export type ToolDefinitionDoc = z.infer<typeof toolDefinitionDocSchema>;

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
}

export async function runToolEngine(
	key: string,
	opts: RunToolEngineOpts,
): Promise<ToolRunResult> {
	const fd = new FormData();
	for (const [name, spec] of Object.entries(opts.inputSpec)) {
		const v = opts.values[name];
		if (spec.type === 'image') {
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
 * `/preview`, que reduz a foto, tira os nós de saída/IA e devolve só `{ preview }`
 * (base64). Sem billing, sem storage — é o feedback dos sliders.
 */
export async function runToolPreview(
	key: string,
	opts: RunToolPreviewOpts,
): Promise<{ preview: string | null }> {
	const fd = new FormData();
	for (const [name, spec] of Object.entries(opts.inputSpec)) {
		const v = opts.values[name];
		if (spec.type === 'image') {
			if (v instanceof File) fd.append(name, v);
		} else if (v !== undefined && v !== null && v !== '') {
			fd.append(name, typeof v === 'boolean' ? String(v) : String(v));
		}
	}
	if (opts.draftDefinition) {
		fd.append('definition', JSON.stringify(opts.draftDefinition));
	}
	const { data } = await api.post(`/api/tool-run/${key}/preview`, fd);
	return (data ?? { preview: null }) as { preview: string | null };
}
