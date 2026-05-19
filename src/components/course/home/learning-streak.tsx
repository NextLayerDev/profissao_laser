'use client';

import { useState } from 'react';
import { Check, Flame, Star, Trophy, X } from 'lucide-react';
import { useStreak } from '@/hooks/use-gamification';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import type { StreakDay } from '@/types/gamification';

function getMotivationalMessage(streak: number) {
	if (streak === 0) return 'Comece hoje!';
	if (streak <= 3) return 'Bom comeco!';
	if (streak <= 7) return 'Excelente ritmo!';
	return 'Voce esta mandando muito bem!';
}

function isToday(dateStr: string) {
	const today = new Date();
	const y = today.getFullYear();
	const m = String(today.getMonth() + 1).padStart(2, '0');
	const d = String(today.getDate()).padStart(2, '0');
	return dateStr === `${y}-${m}-${d}`;
}

function DayCircle({
	day,
	large,
}: {
	day: StreakDay;
	large?: boolean;
}) {
	const today = isToday(day.date);
	const size = large ? 'w-10 h-10' : 'w-8 h-8';
	const iconSize = large ? 'w-4 h-4' : 'w-3.5 h-3.5';

	return (
		<div className="flex flex-col items-center gap-1.5">
			<span className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase">
				{day.day}
			</span>
			<div
				className={`${size} rounded-full flex items-center justify-center transition-all ${
					today
						? 'bg-gradient-to-br from-violet-400 to-yellow-500 shadow-lg shadow-violet-400/30'
						: day.completed
							? 'bg-gradient-to-br from-emerald-400 to-green-500'
							: 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10'
				}`}
			>
				{today ? (
					<Star className={`${iconSize} text-white`} />
				) : day.completed ? (
					<Check className={`${iconSize} text-white`} />
				) : null}
			</div>
		</div>
	);
}

function StreakSkeleton() {
	return (
		<div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
			<div className="flex items-center gap-3 mb-3">
				<div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/10 animate-pulse" />
				<div className="space-y-2">
					<div className="h-5 w-32 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
					<div className="h-3 w-44 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
				</div>
			</div>
			<div className="flex items-center justify-between mt-4">
				{Array.from({ length: 7 }).map((_, i) => (
					<div key={i} className="flex flex-col items-center gap-1.5">
						<div className="h-3 w-3 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
						<div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
					</div>
				))}
			</div>
		</div>
	);
}

function StreakDetailModal({
	currentStreak,
	bestStreak,
	weekMap,
	onClose,
}: {
	currentStreak: number;
	bestStreak: number;
	weekMap: StreakDay[];
	onClose: () => void;
}) {
	const progressPct = bestStreak > 0 ? Math.min((currentStreak / bestStreak) * 100, 100) : 0;

	return (
		<ModalOverlay onClose={onClose}>
			<div className="p-6">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
							<Flame className="w-6 h-6 text-white" />
						</div>
						<h2 className="text-xl font-bold text-slate-900 dark:text-white">
							Dias Frequentes
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
					>
						<X className="w-5 h-5 text-slate-400" />
					</button>
				</div>

				{/* Stat cards */}
				<div className="grid grid-cols-2 gap-3 mb-6">
					<div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 text-center">
						<Flame className="w-5 h-5 text-orange-500 mx-auto mb-2" />
						<p className="text-2xl font-bold text-slate-900 dark:text-white">
							{currentStreak}
						</p>
						<p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
							Sequencia atual
						</p>
					</div>
					<div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 text-center">
						<Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
						<p className="text-2xl font-bold text-slate-900 dark:text-white">
							{bestStreak}
						</p>
						<p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
							Melhor sequencia
						</p>
					</div>
				</div>

				{/* WeekMap */}
				<div className="flex items-center justify-between mb-6">
					{weekMap.map((day) => (
						<DayCircle key={day.date} day={day} large />
					))}
				</div>

				{/* Progress bar */}
				<div className="mb-4">
					<div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-500 mb-1.5">
						<span>Progresso vs melhor sequencia</span>
						<span>
							{currentStreak}/{bestStreak}
						</span>
					</div>
					<div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
						<div
							className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500"
							style={{ width: `${progressPct}%` }}
						/>
					</div>
				</div>

				{/* Motivational message */}
				<p className="text-sm text-center text-slate-500 dark:text-gray-400">
					{getMotivationalMessage(currentStreak)}
				</p>
			</div>
		</ModalOverlay>
	);
}

export function LearningStreak() {
	const [modalOpen, setModalOpen] = useState(false);
	const { data, isLoading } = useStreak();

	if (isLoading) return <StreakSkeleton />;

	const currentStreak = data?.currentStreak ?? 0;
	const bestStreak = data?.bestStreak ?? 0;
	const weekMap = data?.weekMap ?? [];

	return (
		<>
			<button
				type="button"
				onClick={() => setModalOpen(true)}
				className="w-full text-left bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/5 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-white/10 transition-colors cursor-pointer"
			>
				<div className="flex items-center gap-3 mb-3">
					<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
						<Flame className="w-5 h-5 text-white" />
					</div>
					<div>
						<p className="text-lg font-bold text-slate-900 dark:text-white">
							{currentStreak} dias seguidos
						</p>
						<p className="text-xs text-slate-500 dark:text-gray-500">
							{getMotivationalMessage(currentStreak)}
						</p>
					</div>
				</div>

				<div className="flex items-center justify-between mt-4">
					{weekMap.map((day) => (
						<DayCircle key={day.date} day={day} />
					))}
				</div>
			</button>

			{modalOpen && (
				<StreakDetailModal
					currentStreak={currentStreak}
					bestStreak={bestStreak}
					weekMap={weekMap}
					onClose={() => setModalOpen(false)}
				/>
			)}
		</>
	);
}
