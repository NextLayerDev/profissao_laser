// Seções da Mentoria 360°, em um só lugar.
//
// Duas superfícies consomem esta lista: o card de navegação que fica dentro da
// área da Mentoria (`_components/mentoria-nav-card.tsx`) e qualquer atalho que
// precise enumerar as telas. Antes o array vivia dentro do componente da
// sidebar global, o que impedia reuso.
//
// Só entram rotas que existem. O desenho do time também previa "Metas",
// "Relatórios" e "Configuração"; elas ainda não têm página, e um link morto é
// pior que uma ausência — estão registradas em docs/mentoria-360-design-system.md.

import {
	BarChart3,
	CheckSquare,
	ClipboardList,
	Compass,
	Heart,
	Home,
	type LucideIcon,
	Radio,
	TrendingUp,
	Wrench,
} from 'lucide-react';

export type MentoriaSection = {
	href: string;
	label: string;
	icon: LucideIcon;
};

export const MENTORIA_ROOT = '/course/mentoria';

export const MENTORIA_SECTIONS: MentoriaSection[] = [
	{ href: MENTORIA_ROOT, label: 'Minha Empresa', icon: Home },
	{
		href: `${MENTORIA_ROOT}/diagnostico`,
		label: 'Diagnóstico',
		icon: ClipboardList,
	},
	{ href: `${MENTORIA_ROOT}/jornada`, label: 'Jornada', icon: Compass },
	{ href: `${MENTORIA_ROOT}/ferramentas`, label: 'Ferramentas', icon: Wrench },
	{
		href: `${MENTORIA_ROOT}/indicadores`,
		label: 'Indicadores',
		icon: BarChart3,
	},
	{ href: `${MENTORIA_ROOT}/tarefas`, label: 'Tarefas', icon: CheckSquare },
	{
		href: `${MENTORIA_ROOT}/desenvolvimento`,
		label: 'Desenvolvimento',
		icon: Heart,
	},
	{ href: `${MENTORIA_ROOT}/evolucao`, label: 'Evolução', icon: TrendingUp },
	{ href: `${MENTORIA_ROOT}/lives`, label: 'Lives', icon: Radio },
];

/**
 * Qual seção está ativa para um pathname.
 *
 * `startsWith` sozinho não serve: a raiz `/course/mentoria` é prefixo de todas
 * as outras e ficaria acesa o tempo todo. A raiz exige igualdade exata.
 */
export function isSectionActive(section: MentoriaSection, pathname: string) {
	if (section.href === MENTORIA_ROOT) return pathname === MENTORIA_ROOT;
	return pathname.startsWith(section.href);
}
