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
