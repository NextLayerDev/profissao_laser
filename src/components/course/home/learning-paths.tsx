'use client';

import { BookOpen, Layers, Maximize2, PenTool } from 'lucide-react';
import Link from 'next/link';

const PATHS = [
	{
		name: 'Comecar do Zero',
		lessons: 24,
		progress: 60,
		Icon: BookOpen,
		gradient: 'from-violet-600 to-violet-700',
		iconBg: 'bg-violet-500/10 dark:bg-violet-500/20',
	},
	{
		name: 'Viver de Personalizados',
		lessons: 18,
		progress: 35,
		Icon: Layers,
		gradient: 'from-blue-500 to-cyan-500',
		iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
	},
	{
		name: 'Producao em Escala',
		lessons: 32,
		progress: 24,
		Icon: Maximize2,
		gradient: 'from-emerald-500 to-teal-500',
		iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
	},
	{
		name: 'Dominar Vetorizacao',
		lessons: 15,
		progress: 70,
		Icon: PenTool,
		gradient: 'from-pink-500 to-rose-500',
		iconBg: 'bg-pink-500/10 dark:bg-pink-500/20',
	},
];

export function LearningPaths() {
	return (
		<section className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/5 rounded-2xl p-6">
			<div className="flex justify-between items-center mb-5">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					Trilhas de Aprendizado
				</h3>
				<Link
					href="/course/jornada"
					className="text-violet-600 dark:text-violet-400 hover:text-violet-600 text-sm font-medium transition-colors"
				>
					Ver todas
				</Link>
			</div>

			<div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-violet-500/20">
				{PATHS.map((path) => (
					<div
						key={path.name}
						className="flex-shrink-0 w-56 rounded-xl border border-slate-100 dark:border-white/5 p-4 hover:border-violet-200 dark:hover:border-violet-500/20 transition-colors"
					>
						<div
							className={`w-12 h-12 rounded-xl ${path.iconBg} flex items-center justify-center mb-3`}
						>
							<path.Icon
								className={`w-6 h-6 bg-gradient-to-br ${path.gradient} bg-clip-text`}
								style={{
									color: path.gradient.includes('violet')
										? '#8b5cf6'
										: path.gradient.includes('blue')
											? '#3b82f6'
											: path.gradient.includes('emerald')
												? '#10b981'
												: '#ec4899',
								}}
							/>
						</div>
						<p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
							{path.name}
						</p>
						<p className="text-xs text-slate-400 dark:text-gray-500 mb-3">
							{path.lessons} aulas
						</p>
						<div className="w-full h-1.5 bg-slate-100 dark:bg-[#1a1a1d] rounded-full overflow-hidden mb-1">
							<div
								className={`h-full bg-gradient-to-r ${path.gradient} rounded-full transition-all`}
								style={{ width: `${path.progress}%` }}
							/>
						</div>
						<p className="text-[11px] text-slate-500 dark:text-gray-500 text-right">
							{path.progress}%
						</p>
					</div>
				))}
			</div>
		</section>
	);
}
