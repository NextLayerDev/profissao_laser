import type { PermissionModule } from '@/modules/access';

/**
 * Espelho do catálogo da API (`src/lib/permissions.ts`). Usado para renderizar
 * a matriz de cargos sincronamente e mapear abas → permissões. A fonte de
 * verdade continua na API (`GET /permissions/catalog`).
 */
export const PERMISSION_CATALOG: PermissionModule[] = [
	{ module: 'home', label: 'Início', actions: ['view'] },
	{
		module: 'planos',
		label: 'Planos & Links',
		actions: ['view', 'edit', 'delete', 'price'],
	},
	{ module: 'faturamento', label: 'Faturas', actions: ['view'] },
	{ module: 'financeiro', label: 'Financeiro', actions: ['view'] },
	{ module: 'assinaturas', label: 'Assinaturas', actions: ['view', 'edit'] },
	{ module: 'reembolsos', label: 'Reembolsos', actions: ['view', 'edit'] },
	{ module: 'voxes', label: 'Voxes', actions: ['view'] },
	{
		module: 'cursos',
		label: 'Cursos (módulos/aulas/quizzes)',
		actions: ['view', 'edit', 'delete'],
	},
	{ module: 'alunos', label: 'Alunos', actions: ['view', 'edit', 'delete'] },
	{
		module: 'relatorios',
		label: 'Relatórios / Analytics',
		actions: ['view'],
	},
	{
		module: 'ferramentas',
		label: 'Ferramentas',
		actions: ['view', 'edit', 'delete'],
	},
	{
		module: 'acessos',
		label: 'Acessos (cargos)',
		actions: ['view', 'edit', 'delete'],
	},
	{
		module: 'suporte',
		label: 'Suporte & Agendamentos',
		actions: ['view', 'edit', 'delete'],
	},
];

/**
 * Gate do Suporte → 'suporte.view' (módulo dedicado no catálogo). Agendamentos
 * reaproveita o mesmo array para aparecer exatamente para quem tem acesso à aba
 * Suporte, sem risco de divergir.
 */
const SUPORTE_VIEW_KEYS = ['suporte.view'];

/** Mapeia o `name` de cada item da navbar → chave(s) de permissão de "view". */
export const NAV_VIEW_KEYS: Record<string, string[]> = {
	Home: ['home.view'],
	Produtos: ['planos.view'],
	Vendas: [
		'faturamento.view',
		'assinaturas.view',
		'voxes.view',
		'reembolsos.view',
	],
	Links: ['planos.view'],
	Financeiro: ['financeiro.view'],
	Relatórios: ['relatorios.view'],
	Comunidade: ['ferramentas.view'], // Ajustado conforme módulos disponíveis
	Fórum: ['cursos.view'], // Ajustado conforme módulos disponíveis
	Agendamentos: SUPORTE_VIEW_KEYS, // segue o mesmo gate da aba Suporte
	Suporte: SUPORTE_VIEW_KEYS,
	Parametros: ['acessos.view'],
	Acessos: ['acessos.view'],
	Alunos: ['alunos.view'],
	'Grupo WhatsApp': ['alunos.view'],
	'Previas IA': ['ferramentas.view'],
	Vetorizacao: ['ferramentas.view'],
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
