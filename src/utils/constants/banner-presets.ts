/**
 * Banners do perfil (servidos de /public/banners). O cliente escolhe um destes
 * 4 padrões OU sobe o próprio (vira URL do Bunny). Quem ainda não escolheu vê
 * o DEFAULT_BANNER (Banner 3 — moeda Voxxys) — vale pra atuais e novos.
 */
export const BANNER_PRESETS = [
	'banner-1',
	'banner-2',
	'banner-3',
	'banner-4',
] as const;
export type BannerPreset = (typeof BANNER_PRESETS)[number];

/** URL pública do banner-preset. */
export function bannerPresetUrl(b: BannerPreset): string {
	return `/banners/${b}.png`;
}

/** Banner padrão exibido pra quem não escolheu nenhum. */
export const DEFAULT_BANNER = '/banners/banner-3.png';

/** True se a URL é um dos banners-preset (vs. banner enviado). */
export function isBannerPresetUrl(url?: string | null): boolean {
	return !!url && BANNER_PRESETS.some((b) => url.endsWith(`/banners/${b}.png`));
}
