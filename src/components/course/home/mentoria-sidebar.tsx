'use client';

import {
	BarChart3,
	CheckSquare,
	ChevronDown,
	ClipboardList,
	Compass,
	Heart,
	Radio,
	TrendingUp,
	Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface MentoriaSubItem {
	href: string;
	label: string;
	icon: typeof Compass;
}

const MENTORIA_SECTIONS: MentoriaSubItem[] = [
	{
		href: '/course/mentoria/diagnostico',
		label: 'Diagnóstico',
		icon: ClipboardList,
	},
	{
		href: '/course/mentoria/jornada',
		label: 'Jornada',
		icon: Compass,
	},
	{
		href: '/course/mentoria/ferramentas',
		label: 'Ferramentas',
		icon: Wrench,
	},
	{
		href: '/course/mentoria/indicadores',
		label: 'Indicadores',
		icon: BarChart3,
	},
	{
		href: '/course/mentoria/tarefas',
		label: 'Tarefas',
		icon: CheckSquare,
	},
	{
		href: '/course/mentoria/desenvolvimento',
		label: 'Desenvolvimento',
		icon: Heart,
	},
	{
		href: '/course/mentoria/evolucao',
		label: 'Evolução',
		icon: TrendingUp,
	},
	{
		href: '/course/mentoria/lives',
		label: 'Lives',
		icon: Radio,
	},
];

export function MentoriaSidebar({ isCollapsed }: { isCollapsed: boolean }) {
	const pathname = usePathname();
	const isMentoriaActive = pathname.startsWith('/course/mentoria');
	const [isExpanded, setIsExpanded] = useState(isMentoriaActive);

	// Auto-expand when navigating to a mentoria route
	useEffect(() => {
		setIsExpanded(isMentoriaActive);
	}, [isMentoriaActive]);

	return (
		<div className="space-y-1">
			{/* Main mentoria button */}
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
					isMentoriaActive
						? 'text-violet-600 dark:text-violet-400 bg-violet-500/8 dark:bg-violet-500/10 border-l-[3px] border-violet-600'
						: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
				} ${isCollapsed ? 'justify-center' : 'justify-between'}`}
			>
				{!isCollapsed && (
					<>
						<span className="flex-1 text-left">Mentoria 360°</span>
						<ChevronDown
							className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
						/>
					</>
				)}
				{isCollapsed && <Compass className="w-5 h-5" />}
			</button>

			{/* Sub-menu items (expanded state) */}
			{isExpanded && !isCollapsed && (
				<div className="ml-4 space-y-1 border-l border-slate-200 dark:border-white/10">
					{MENTORIA_SECTIONS.map((section) => {
						const isActive = pathname.startsWith(section.href);
						const Icon = section.icon;

						return (
							<Link
								key={section.href}
								href={section.href}
								className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
									isActive
										? 'text-violet-600 dark:text-violet-400 bg-violet-500/8 dark:bg-violet-500/10'
										: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
								}`}
							>
								<Icon className="w-4 h-4 flex-shrink-0" />
								<span className="truncate">{section.label}</span>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
