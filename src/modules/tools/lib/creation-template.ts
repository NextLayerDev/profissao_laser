import type {
	Creation,
	CreationModel,
	CreationTemplate,
} from '../services/tool-definitions.service';

/**
 * Molde de um formato (espelho de `upvox-main-api/src/lib/creation-template.ts`).
 *
 * O motor é quem recorta e instrui a IA; aqui só mora o que a TELA precisa:
 * qual molde vale para a escolha do aluno, que formatos um card aceita e a
 * proporção para desenhar a prévia. A regra do tamanho (lado maior fixo, menor
 * pela proporção física) é a mesma dos dois lados.
 */

/** Modelos que o aluno pode escolher (os desligados ficam guardados). */
export function activeModels(c: Pick<Creation, 'models'> | undefined) {
	return (c?.models ?? []).filter((m) => m.active !== false);
}

/** O molde que vale: o do modelo escolhido, senão o do próprio formato. */
export function effectiveTemplate(
	c: Creation | undefined,
	modelId: string | null | undefined,
): CreationTemplate | undefined {
	if (!c) return undefined;
	const models = activeModels(c);
	if (models.length > 0) {
		return models.find((m) => m.id === modelId)?.template;
	}
	return c.template;
}

/** Tamanho em px que o motor vai gerar para um molde. */
export function templateSizePx(t: CreationTemplate, longSidePx: number) {
	const clamp = (n: number) => Math.min(4096, Math.max(64, Math.round(n)));
	return t.width_mm >= t.height_mm
		? {
				width: clamp(longSidePx),
				height: clamp((longSidePx * t.height_mm) / t.width_mm),
			}
		: {
				width: clamp((longSidePx * t.width_mm) / t.height_mm),
				height: clamp(longSidePx),
			};
}

/**
 * `data.formats` do card → ids. Gravado como texto separado por vírgula: o
 * editor clássico do banco só preserva string/number em `data`, e um array
 * sumiria no primeiro salvar por lá.
 */
export function parseFormats(raw: unknown): string[] {
	const list = Array.isArray(raw)
		? raw
		: typeof raw === 'string'
			? raw.split(',')
			: [];
	return list
		.filter((v): v is string => typeof v === 'string')
		.map((v) => v.trim())
		.filter(Boolean);
}

export function serializeFormats(ids: string[]): string {
	return ids.join(',');
}

/** Formatos que o aluno vê para um card (lista vazia no card = todos). */
export function formatsForEntry(
	creations: Creation[] | undefined,
	entryData: Record<string, unknown> | undefined,
): Creation[] {
	const ativos = (creations ?? []).filter((c) => c.active !== false);
	const allowed = parseFormats(entryData?.formats);
	return allowed.length === 0
		? ativos
		: ativos.filter((c) => allowed.includes(c.id));
}

/** Problema na geometria (mesma regra do motor) — `null` = molde válido. */
export function templateProblem(t: CreationTemplate): string | null {
	if (!(t.width_mm > 0 && t.height_mm > 0)) return 'Medidas da peça inválidas.';
	for (const z of t.zones ?? []) {
		const nome = z.label?.trim() || 'sem nome';
		if (!(z.w > 0 && z.h > 0)) return `A zona "${nome}" está sem tamanho.`;
		if (
			z.x < 0 ||
			z.y < 0 ||
			z.x + z.w > t.width_mm + 0.01 ||
			z.y + z.h > t.height_mm + 0.01
		) {
			return `A zona "${nome}" passa da borda da peça.`;
		}
	}
	return null;
}

/** Agrupa modelos por marca, na ordem em que aparecem. */
export function groupModelsByBrand(models: CreationModel[]) {
	const groups = new Map<string, CreationModel[]>();
	for (const m of models) {
		const brand = m.brand?.trim() || 'Outros';
		groups.set(brand, [...(groups.get(brand) ?? []), m]);
	}
	return [...groups.entries()];
}

export function slugify(s: string): string {
	return (
		s
			.toLowerCase()
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || `item-${Date.now().toString(36)}`
	);
}
