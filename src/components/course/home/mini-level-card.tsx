'use client';

import { Star } from 'lucide-react';

interface MiniLevelCardProps {
	level?: string;
	currentXp?: number;
	nextXp?: number;
}

export function MiniLevelCard({
	level = 'Profissional',
	currentXp = 2450,
	nextXp = 3000,
}: MiniLevelCardProps) {
	const pct = Math.min(100, Math.round((currentXp / nextXp) * 100));

	return (
		<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
			<div className="flex items-center gap-3 mb-3">
				<div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shrink-0">
					<Star className="w-4 h-4 text-white fill-white" />
				</div>
				<div className="min-w-0">
					<p className="text-xs text-slate-500 dark:text-gray-400">Seu nível</p>
					<p className="text-sm font-bold text-slate-900 dark:text-white truncate">
						{level}
					</p>
				</div>
			</div>
			<div className="space-y-1.5">
				<div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
					<div
						className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all"
						style={{ width: `${pct}%` }}
					/>
				</div>
				<p className="text-xs text-slate-500 dark:text-gray-400 text-right">
					{currentXp.toLocaleString('pt-BR')} / {nextXp.toLocaleString('pt-BR')}{' '}
					XP
				</p>
			</div>
		</div>
	);
}
