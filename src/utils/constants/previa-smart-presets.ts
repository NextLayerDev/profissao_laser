/**
 * Presets inteligentes da Prévia IA: a partir do produto escolhido, sugere
 * Material + Acabamento (auto-preenchidos) e fundos de cena (no picker visual).
 * Tudo no front (sem backend). Os valores são "clampados" contra as opções
 * reais vindas de /previas/options antes de aplicar — então um palpite que não
 * exista no catálogo é simplesmente ignorado (nunca quebra o form).
 */

export interface LaserProductLike {
	defaultMaterial?: string | null;
	category?: string | null;
	name?: string | null;
	tags?: string[] | null;
}

/** material (slug) → acabamento padrão (slug). */
const FINISH_BY_MATERIAL: Record<string, string> = {
	madeira: 'fosco',
	mdf: 'fosco',
	bambu: 'fosco',
	'aco-inox': 'escovado',
	inox: 'escovado',
	metal: 'escovado',
	aluminio: 'escovado',
	vidro: 'brilho',
	cristal: 'brilho',
	acrilico: 'brilho',
	ceramica: 'fosco',
	porcelana: 'brilho',
	couro: 'fosco',
	ardosia: 'fosco',
	pedra: 'fosco',
};

/** Acabamento padrão para um material (slug) — undefined se não mapeado. */
export function finishForMaterial(material: string): string | undefined {
	return FINISH_BY_MATERIAL[material];
}

/** Deduz um material (slug) a partir de texto livre (categoria/nome/tags). */
function inferMaterialFromText(text: string): string | undefined {
	const t = text.toLowerCase();
	if (/(inox|a[çc]o|steel|metal|alum[íi]nio)/.test(t)) return 'aco-inox';
	if (/(vidro|ta[çc]a|cristal|glass)/.test(t)) return 'vidro';
	if (/(madeira|wood|bambu|mdf)/.test(t)) return 'madeira';
	if (/(acr[íi]lico|acrylic)/.test(t)) return 'acrilico';
	if (/(cer[âa]mica|porcelana|ceramic|caneca|m[uü]g)/.test(t))
		return 'ceramica';
	if (/(couro|leather)/.test(t)) return 'couro';
	if (/(ard[óo]sia|slate|pedra|stone)/.test(t)) return 'ardosia';
	return undefined;
}

/** Material do produto: usa defaultMaterial; senão deduz de categoria/nome/tags. */
export function deriveMaterial(p: LaserProductLike): string | undefined {
	const dm = p.defaultMaterial?.trim();
	if (dm) return dm;
	const text = [p.category, p.name, ...(p.tags ?? [])]
		.filter(Boolean)
		.join(' ');
	return inferMaterialFromText(text);
}

/** Preset auto-aplicável (material + acabamento) para o produto. */
export function smartPresetFor(
	p: LaserProductLike,
): Record<string, string | undefined> {
	const material = deriveMaterial(p);
	const acabamentoSuperficie = material
		? FINISH_BY_MATERIAL[material]
		: undefined;
	return { material, acabamentoSuperficie };
}

/** fundos (fundoCena slug) sugeridos por material. */
const BACKGROUNDS_BY_MATERIAL: Record<string, string[]> = {
	madeira: ['madeira', 'ambiente-decorado', 'marmore'],
	mdf: ['madeira', 'ambiente-decorado', 'marmore'],
	'aco-inox': ['cinza-gradiente', 'preto-fosco', 'marmore'],
	inox: ['cinza-gradiente', 'preto-fosco', 'marmore'],
	metal: ['cinza-gradiente', 'preto-fosco', 'marmore'],
	vidro: ['marmore', 'ambiente-decorado', 'branco-puro'],
	cristal: ['marmore', 'ambiente-decorado', 'branco-puro'],
	acrilico: ['branco-puro', 'cinza-gradiente', 'transparente'],
	ceramica: ['tecido-linho', 'madeira', 'branco-puro'],
	couro: ['madeira', 'ambiente-decorado', 'preto-fosco'],
	ardosia: ['marmore', 'cinza-gradiente', 'madeira'],
};

const DEFAULT_BACKGROUNDS = ['cinza-gradiente', 'branco-puro', 'preto-fosco'];

/** Até 3 fundos sugeridos para o produto (valores de fundoCena). */
export function suggestedBackgrounds(p: LaserProductLike): string[] {
	const m = deriveMaterial(p);
	const list = m ? BACKGROUNDS_BY_MATERIAL[m] : undefined;
	return list ?? DEFAULT_BACKGROUNDS;
}

/**
 * Mantém de `preset` só os campos cujo valor existe na lista de opções
 * correspondente (clamp contra o catálogo real de /previas/options).
 */
export function pickValidPreset(
	preset: Record<string, string | undefined>,
	optionValues: Record<string, string[]>,
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [key, val] of Object.entries(preset)) {
		if (val && optionValues[key]?.includes(val)) out[key] = val;
	}
	return out;
}
