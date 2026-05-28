/**
 * Paleta compartilhada das ferramentas da plataforma.
 * Cada ferramenta tem uma família Tailwind ÚNICA (identidade visual própria),
 * usada tanto no "Acesso Rápido" da home quanto na landing — uma fonte só de
 * verdade pra não repetir cor nem dessincronizar os dois lugares.
 */
export interface ToolColor {
	/** Gradiente de fundo do card (bg-gradient-to-br). */
	gradient: string;
	/** Fundo + cor do ícone em modos sutis. */
	iconBg: string;
}

export const TOOL_COLORS = {
	aulas: {
		gradient: 'from-blue-500 to-blue-800',
		iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
	},
	suporte: {
		gradient: 'from-orange-400 to-orange-700',
		iconBg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
	},
	biblioteca: {
		gradient: 'from-amber-400 to-amber-700',
		iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
	},
	vetorizacao: {
		gradient: 'from-green-500 to-green-700',
		iconBg: 'bg-green-500/15 text-green-600 dark:text-green-400',
	},
	previas: {
		gradient: 'from-pink-500 to-pink-700',
		iconBg: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
	},
	voxxys: {
		gradient: 'from-violet-500 to-violet-800',
		iconBg: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
	},
	parametros: {
		gradient: 'from-cyan-500 to-cyan-700',
		iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
	},
	forum: {
		gradient: 'from-indigo-500 to-indigo-700',
		iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
	},
	chat: {
		gradient: 'from-teal-500 to-teal-700',
		iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
	},
	fornecedores: {
		gradient: 'from-yellow-400 to-yellow-600',
		iconBg: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
	},
	eventos: {
		gradient: 'from-rose-500 to-rose-800',
		iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
	},
	membros: {
		gradient: 'from-fuchsia-500 to-fuchsia-700',
		iconBg: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400',
	},
	vitrine: {
		gradient: 'from-sky-500 to-sky-700',
		iconBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
	},
	canva: {
		gradient: 'from-purple-500 to-purple-800',
		iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
	},
	fornecedoresVendas: {
		gradient: 'from-emerald-500 to-emerald-700',
		iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
	},
	equipeVetores: {
		gradient: 'from-lime-500 to-lime-700',
		iconBg: 'bg-lime-500/15 text-lime-600 dark:text-lime-400',
	},
} as const satisfies Record<string, ToolColor>;

export type ToolColorKey = keyof typeof TOOL_COLORS;
