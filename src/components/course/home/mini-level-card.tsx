'use client';

import { Flame, Star } from 'lucide-react';
import { useStreak } from '@/hooks/use-gamification';

interface MiniLevelCardProps {
	level?: string;
	currentXp?: number;
	nextXp?: number;
}

function motivationalMessage(streak: number) {
	if (streak === 0) return 'Comece hoje!';
	if (streak <= 3) return 'Bom começo!';
	if (streak <= 7) return 'Excelente ritmo!';
	return 'Você está mandando muito bem!';
}

/**
 * Card combinado: streak (dias seguidos) + nível/XP. Substitui o
 * antigo MiniLevelCard isolado + o LearningStreak na sidebar.
 */
export function MiniLevelCard({
	level = 'Profissional',
	currentXp = 2450,
	nextXp = 3000,
}: MiniLevelCardProps) {
	const { data: streakData } = useStreak();
	const currentStreak = streakData?.currentStreak ?? 0;
	const pct = Math.min(100, Math.round((currentXp / nextXp) * 100));

	return (
		<div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
			{/* Topo: Streak (dias seguidos) */}
			<div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100 dark:border-white/5">
				<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
					<Flame className="w-5 h-5 text-white" />
				</div>
				<div className="min-w-0">
					<p className="text-sm font-bold text-slate-900 dark:text-white">
						{currentStreak} dias seguidos
					</p>
					<p className="text-[11px] text-slate-500 dark:text-gray-400">
						{motivationalMessage(currentStreak)}
					</p>
				</div>
			</div>

			{/* Base: Nível + XP */}
			<div className="px-4 py-3 space-y-2.5">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
						<Star className="w-5 h-5 text-white fill-white" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-[11px] text-slate-500 dark:text-gray-400">
							Seu nível
						</p>
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
					<p className="text-[10px] text-slate-500 dark:text-gray-400 text-right">
						{currentXp.toLocaleString('pt-BR')} /{' '}
						{nextXp.toLocaleString('pt-BR')} XP
					</p>
				</div>
			</div>
		</div>
	);
}
