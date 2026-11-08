/**
 * ALLOWLIST de ferramentas do aluno (e da staff na área do aluno).
 *
 * Vem de `NEXT_PUBLIC_ENABLED_TOOLS` — chaves separadas por vírgula, ex.:
 * `vectorize,prompts_magicos,previa,parametros` (a Profissão Laser hoje). Vazia
 * ou ausente = SEM restrição: tudo continua como antes. Reverter é só limpar a
 * variável e refazer o deploy; nenhum código de ferramenta foi apagado.
 *
 * O que conta como "ferramenta" (e só isso é filtrado):
 *   - as tools de código (`SYSTEM_TOOLS`) e suas páginas próprias;
 *   - as tools da Fábrica abertas em `/course/t/[key]` (menos as salas).
 * NÃO são filtrados os portões de página (mentoria, suporte, chat, fornecedores,
 * eventos…), as salas de mentoria (`room_v1`) nem as telas do admin.
 *
 * O backend faz o mesmo corte na migration `restringir_ferramentas` do upvox-api
 * (`tools.enabled = false` + definition arquivada); este filtro cobre o que é
 * estático no front (atalhos fixos e rotas próprias).
 */
const RAW = process.env.NEXT_PUBLIC_ENABLED_TOOLS ?? '';

const ENABLED = new Set(
	RAW.split(',')
		.map((k) => k.trim())
		.filter(Boolean),
);

/** `true` quando a allowlist está ligada (variável preenchida). */
export const TOOLS_RESTRICTED = ENABLED.size > 0;

/** A ferramenta `key` pode aparecer/abrir? Sem allowlist, sempre. */
export function isToolEnabled(key: string): boolean {
	return !TOOLS_RESTRICTED || ENABLED.has(key);
}

/** Para onde vai quem abre a rota de uma ferramenta desligada. */
export const DISABLED_TOOL_REDIRECT = '/course/ferramentas';

/**
 * Páginas PRÓPRIAS de ferramentas de código na área do aluno → a tool que as
 * gateia. As tools da Fábrica (`/course/t/[key]`) usam a própria key.
 */
const TOOL_PAGES: { prefix: string; key: string }[] = [
	{ prefix: '/course/vetorizacao', key: 'vectorize' },
	{ prefix: '/course/previas', key: 'previa' },
	{ prefix: '/course/parametros', key: 'parametros' },
	{ prefix: '/course/gravacao-oneclick', key: 'gravacao_oneclick' },
	{ prefix: '/course/canva', key: 'ai_canvas' },
];

function matchesPrefix(pathname: string, prefix: string): boolean {
	return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Chave da ferramenta dona da página própria `pathname`, ou `null` se a rota
 * não é de ferramenta de código (aí o proxy nunca a bloqueia). `/course/t/[key]`
 * fica de fora de propósito: só a definition diz se é sala (`room_v1`, nunca
 * bloqueada) ou ferramenta — quem decide é a própria página.
 */
export function toolKeyForPath(pathname: string): string | null {
	return TOOL_PAGES.find((p) => matchesPrefix(pathname, p.prefix))?.key ?? null;
}

/** A página própria `pathname` é de uma ferramenta desligada? */
export function isDisabledToolPath(pathname: string): boolean {
	const key = toolKeyForPath(pathname);
	return key !== null && !isToolEnabled(key);
}

/**
 * Link de MENU (atalho fixo) que leva a uma ferramenta desligada: página
 * própria ou `/course/t/[key]`. Só para atalhos estáticos — os itens dinâmicos
 * já vêm filtrados do catálogo (que sabe distinguir sala de ferramenta).
 */
export function isDisabledToolLink(href: string | undefined): boolean {
	if (!href) return false;
	const dyn = /^\/course\/t\/([^/?#]+)/.exec(href);
	if (dyn) return !isToolEnabled(decodeURIComponent(dyn[1]));
	return isDisabledToolPath(href);
}
