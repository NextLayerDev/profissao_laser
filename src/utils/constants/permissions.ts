import type { PermissionModule } from '@/types/roles';

/**
 * Espelho do catálogo da API (`src/lib/permissions.ts`). Usado para renderizar
 * a matriz de cargos sincronamente e mapear abas → permissões. A fonte de
 * verdade continua na API (`GET /permissions/catalog`).
 */
export const PERMISSION_CATALOG: PermissionModule[] = [
	{ module: 'home', label: 'Início', actions: ['view'] },
	{
		module: 'produtos',
		label: 'Produtos',
		actions: ['view', 'edit', 'delete', 'price'],
	},
	{ module: 'vendas', label: 'Vendas', actions: ['view'] },
	{ module: 'relatorios', label: 'Relatórios', actions: ['view'] },
	{ module: 'links', label: 'Links', actions: ['view', 'edit', 'delete'] },
	{
		module: 'comunidade.canais',
		label: 'Comunidade · Canais',
		actions: ['view', 'edit', 'delete'],
	},
	{
		module: 'comunidade.eventos',
		label: 'Comunidade · Eventos',
		actions: ['view', 'edit', 'delete'],
	},
	{
		module: 'comunidade.projetos',
		label: 'Comunidade · Projetos',
		actions: ['view', 'edit', 'delete'],
	},
	{
		module: 'comunidade.biblioteca',
		label: 'Comunidade · Biblioteca',
		actions: ['view', 'edit', 'delete'],
	},
	{ module: 'forum', label: 'Fórum', actions: ['view', 'edit', 'delete'] },
	{
		module: 'agendamentos',
		label: 'Agendamentos',
		actions: ['view', 'edit', 'delete'],
	},
	{ module: 'suporte', label: 'Suporte', actions: ['view', 'edit', 'delete'] },
	{
		module: 'parametros',
		label: 'Parâmetros',
		actions: ['view', 'edit', 'delete'],
	},
	{ module: 'acessos', label: 'Acessos', actions: ['view', 'edit', 'delete'] },
	{ module: 'alunos', label: 'Alunos', actions: ['view', 'edit', 'delete'] },
	{
		module: 'previas',
		label: 'Prévias IA',
		actions: ['view', 'edit', 'delete'],
	},
	{
		module: 'vetorizacao',
		label: 'Vetorização',
		actions: ['view', 'edit', 'delete'],
	},
];

/** Mapeia o `name` de cada item da navbar → chave(s) de permissão de "view". */
export const NAV_VIEW_KEYS: Record<string, string[]> = {
	Home: ['home.view'],
	Produtos: ['produtos.view'],
	Vendas: ['vendas.view'],
	Links: ['links.view'],
	Relatórios: ['relatorios.view'],
	Comunidade: [
		'comunidade.canais.view',
		'comunidade.eventos.view',
		'comunidade.projetos.view',
		'comunidade.biblioteca.view',
	],
	Fórum: ['forum.view'],
	Agendamentos: ['agendamentos.view'],
	Suporte: ['suporte.view'],
	Parametros: ['parametros.view'],
	Acessos: ['acessos.view'],
	Alunos: ['alunos.view'],
	'Previas IA': ['previas.view'],
	Vetorizacao: ['vetorizacao.view'],
};

/** True se o usuário pode ver um item de navbar (qualquer uma das chaves). */
export function canSeeNavItem(
	name: string,
	can: (key: string) => boolean,
): boolean {
	const keys = NAV_VIEW_KEYS[name];
	if (!keys || keys.length === 0) return true; // itens sem mapeamento ficam visíveis
	return keys.some((k) => can(k));
}
