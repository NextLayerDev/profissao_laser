/**
 * Ícones de perfil (estilo Netflix). 7 cores em /public/avatars.
 * Default por gênero do nome: feminino rosa/roxo, masculino azul/verde.
 * Laranja, lima e vermelho são extras (disponíveis no picker pra todo mundo).
 *
 * Durante a Festa Junina (até 15/07), `seasonalUrl` troca cada ícone pela sua
 * versão temática em /avatars/festa — só no render, sem gravar nada no banco.
 */
export const AVATAR_PRESETS = [
	'rosa',
	'roxo',
	'azul',
	'verde',
	'laranja',
	'lima',
	'vermelho',
] as const;
export type AvatarPreset = (typeof AVATAR_PRESETS)[number];

/** URL pública do ícone (servido de /public/avatars). */
export function avatarPresetUrl(p: AvatarPreset): string {
	return `/avatars/${p}.png`;
}

/** True se a URL é um dos nossos ícones-preset (vs. foto enviada). */
export function isAvatarPresetUrl(url?: string | null): boolean {
	return !!url && AVATAR_PRESETS.some((p) => url.endsWith(`/avatars/${p}.png`));
}

// ─── Tema sazonal: Festa Junina ───────────────────────────────────────────────
// Na temporada trocamos os ícones-preset pelas versões temáticas em
// /public/avatars/festa (mesmas cores + xadrez/cacto/balão). Em 16/07 volta
// sozinho ao normal — nada temático é gravado, a troca acontece só no render.
const FESTA_UNTIL = new Date('2026-07-16T00:00:00-03:00');

/** Estamos no período de Festa Junina? (até 15/07, inclusive). */
export function isFestaSeason(now: Date = new Date()): boolean {
	return now < FESTA_UNTIL;
}

/**
 * Na temporada, troca a URL de um ícone-preset normal pela versão festa.
 * Fotos enviadas (Bunny) e URLs não-preset passam intactas; fora da temporada
 * devolve a URL original (revert automático pela data).
 */
export function seasonalUrl(url: string): string {
	if (!isFestaSeason()) return url;
	for (const p of AVATAR_PRESETS) {
		if (url.endsWith(`/avatars/${p}.png`)) return `/avatars/festa/${p}.png`;
	}
	return url;
}

const FEMALE_ICONS: AvatarPreset[] = ['rosa', 'roxo'];
const MALE_ICONS: AvatarPreset[] = ['azul', 'verde'];

// Heurística PT-BR: 1º nome terminado em "a" tende a feminino. As listas abaixo
// cobrem as exceções mais comuns (é só um DEFAULT — o usuário pode trocar).
const MALE_EXCEPTIONS = new Set(['luca', 'juca', 'joca', 'noa', 'akira']);
const FEMALE_EXCEPTIONS = new Set([
	'beatriz',
	'ester',
	'esther',
	'raquel',
	'isabel',
	'miriam',
	'ines',
	'carmen',
	'eliane',
	'aline',
	'adriane',
	'daniele',
	'rute',
	'lais',
	'tais',
	'iris',
	'yasmin',
	'jasmin',
	'evelyn',
	'kelly',
	'jennifer',
	'jenifer',
	'heloise',
	'agnes',
	'doris',
	'mercedes',
	'liz',
	'mel',
	'rachel',
	'nicole',
	'estefani',
	'estefany',
]);

// Primeiro nome em minúsculas e sem acentos. O normalize('NFD') separa os
// diacríticos e o filtro final [^a-z] os remove (junto com dígitos/símbolos).
function normalizeFirstName(name?: string | null): string {
	return (name || '')
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.split(/\s+/)[0]
		.replace(/[^a-z]/g, '');
}

/** Heurística simples: o primeiro nome aparenta ser feminino? */
export function isFemaleName(name?: string | null): boolean {
	const first = normalizeFirstName(name);
	if (!first) return false;
	if (MALE_EXCEPTIONS.has(first)) return false;
	if (FEMALE_EXCEPTIONS.has(first)) return true;
	return first.endsWith('a');
}

// Hash determinístico (string -> inteiro), pra escolha estável por usuário.
function hashString(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) {
		h = (h * 31 + s.charCodeAt(i)) | 0;
	}
	return Math.abs(h);
}

/**
 * Ícone default do usuário: cor por gênero do nome + escolha estável (hash do
 * nome/chave) dentro do grupo. Mesmo usuário → sempre o mesmo ícone.
 */
export function defaultAvatarFor(
	name?: string | null,
	key?: string | null,
): string {
	const group = isFemaleName(name) ? FEMALE_ICONS : MALE_ICONS;
	const seed = `${key ?? ''}|${name ?? ''}` || 'x';
	return avatarPresetUrl(group[hashString(seed) % group.length]);
}
