'use client';

import { Check, Flame, Star } from 'lucide-react';

const DAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] as const;
const COMPLETED = [true, true, true, true, true, false, false];
const TODAY_INDEX = 5; // sabado

export function LearningStreak() {
	return (
		<div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
			<div className="flex items-center gap-3 mb-3">
				<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
					<Flame className="w-5 h-5 text-white" />
				</div>
				<div>
					<p className="text-lg font-bold text-slate-900 dark:text-white">
						12 dias seguidos
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-500">
						Voce esta mandando muito bem!
					</p>
				</div>
			</div>

			<div className="flex items-center justify-between mt-4">
				{DAYS.map((day, i) => {
					const isToday = i === TODAY_INDEX;
					const isCompleted = COMPLETED[i];

					return (
						<div
							key={`skeleton-${i}`}
							className="flex flex-col items-center gap-1.5"
						>
							<span className="text-[10px] font-medium text-slate-400 dark:text-gray-500 uppercase">
								{day}
							</span>
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
									isToday
										? 'bg-gradient-to-br from-violet-400 to-yellow-500 shadow-lg shadow-violet-400/30'
										: isCompleted
											? 'bg-gradient-to-br from-emerald-400 to-green-500'
											: 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10'
								}`}
							>
								{isToday ? (
									<Star className="w-3.5 h-3.5 text-white" />
								) : isCompleted ? (
									<Check className="w-3.5 h-3.5 text-white" />
								) : null}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
