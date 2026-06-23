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
	if (opts.invocationId) fd.append('invocation_id', opts.invocationId);
	if (opts.draftDefinition) {
		fd.append('definition', JSON.stringify(opts.draftDefinition));
	}
	const { data } = await api.post(`/api/tool-run/${key}`, fd);
	return toolRunResultSchema.parse(data);
}
