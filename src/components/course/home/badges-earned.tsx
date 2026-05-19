'use client';

import { Award } from 'lucide-react';
import Link from 'next/link';

const BADGES = [
	{ name: 'Mestre em MDF', gradient: 'from-violet-600 to-violet-700' },
	{ name: 'Ajuda Nota 10', gradient: 'from-blue-500 to-cyan-500' },
	{ name: 'Top Colaborador', gradient: 'from-emerald-500 to-teal-500' },
	{ name: 'Expert em Acrilico', gradient: 'from-pink-500 to-rose-500' },
	{ name: 'Veterano', gradient: 'from-violet-600 to-orange-500' },
	{ name: 'Desafio Cumprido', gradient: 'from-violet-600 to-violet-600' },
];

export function BadgesEarned() {
	return (
		<div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<Award className="w-4 h-4 text-violet-600" />
					<h3 className="text-sm font-bold text-slate-900 dark:text-white">
						Badges conquistadas
					</h3>
				</div>
				<Link
					href="/course/jornada"
					className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-600 font-medium transition-colors"
				>
					Ver todas
				</Link>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
				{BADGES.map((badge) => (
					<div
						key={badge.name}
						className="flex flex-col items-center text-center"
					>
						<div
							className={`w-10 h-10 rounded-full bg-gradient-to-br ${badge.gradient} flex items-center justify-center mb-1.5 shadow-lg`}
						>
							<Award className="w-4 h-4 text-white" />
						</div>
						<span className="text-[10px] font-medium text-slate-600 dark:text-gray-400 leading-tight">
							{badge.name}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
