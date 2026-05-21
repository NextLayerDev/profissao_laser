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
 * Card combinado: streak (flame) + nível/XP (star) na MESMA linha,
 * sem divisor cinza no meio — sensação de um bloco único. XP bar
 * full-width embaixo dos dois.
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
		<div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
			{/* Atmospheric flares — bem sutis nos cantos opostos */}
			<div
				className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-orange-500/10 dark:bg-orange-500/15 blur-3xl"
				aria-hidden
			/>
			<div
				className="pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-violet-500/10 dark:bg-violet-500/15 blur-3xl"
				aria-hidden
			/>

			{/* Linha única: Streak | Nível */}
			<div className="relative grid grid-cols-2 gap-3 p-4">
				{/* Streak */}
				<div className="flex items-start gap-2.5 min-w-0">
					<div className="relative shrink-0">
						<div
							className="absolute inset-0 rounded-xl bg-orange-500 blur-md opacity-40"
							aria-hidden
						/>
						<div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
							<Flame className="w-4 h-4 text-white" />
						</div>
					</div>
					<div className="min-w-0">
						<div className="flex items-baseline gap-1">
							<p className="font-display text-xl font-bold leading-none bg-gradient-to-br from-orange-500 to-red-600 dark:from-orange-400 dark:to-red-500 bg-clip-text text-transparent">
								{currentStreak}
							</p>
							<p className="text-[11px] font-semibold text-slate-700 dark:text-gray-200">
								dias
							</p>
						</div>
						<p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium mt-0.5 leading-tight">
							{motivationalMessage(currentStreak)}
						</p>
					</div>
				</div>

				{/* Nível */}
				<div className="flex items-start gap-2.5 min-w-0">
					<div className="relative shrink-0">
						<div
							className="absolute inset-0 rounded-xl bg-violet-500 blur-md opacity-40"
							aria-hidden
						/>
						<div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
							<Star className="w-4 h-4 text-white fill-white" />
						</div>
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-gray-400 leading-tight">
							Seu nível
						</p>
						<p className="font-display text-sm font-bold text-slate-900 dark:text-white truncate leading-tight mt-0.5">
							{level}
						</p>
					</div>
				</div>
			</div>

			{/* XP bar full-width — uma só pro bloco inteiro */}
			<div className="relative px-4 pb-4 space-y-1.5">
				<div className="h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
					<div
						className="h-full rounded-full bg-gradient-to-r from-violet-500 via-violet-400 to-fuchsia-400 shadow-sm shadow-violet-500/40 transition-all duration-500"
						style={{ width: `${pct}%` }}
					/>
				</div>
				<div className="flex items-center justify-between">
					<p className="text-[10px] text-slate-500 dark:text-gray-400">
						{pct}% até o próximo
					</p>
					<p className="text-[10px] font-semibold text-slate-700 dark:text-gray-300">
						{currentXp.toLocaleString('pt-BR')} /{' '}
						{nextXp.toLocaleString('pt-BR')} XP
					</p>
				</div>
			</div>
		</div>
	);
}
