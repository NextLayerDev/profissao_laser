'use client';

import { CreditCard } from 'lucide-react';
import Link from 'next/link';

interface ProfileCardProps {
	name: string;
	email: string | null;
	coursesCount: number;
	overallProgress: number;
}

export function ProfileCard({
	name,
	email,
	coursesCount,
	overallProgress,
}: ProfileCardProps) {
	return (
		<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-5">
			<div className="flex items-center gap-3 mb-4">
				<div className="w-12 h-12 rounded-full bg-linear-to-br from-violet-600 to-violet-600 flex items-center justify-center text-xl font-black text-white shrink-0 shadow-lg shadow-violet-500/20">
					{(name || email || 'U')[0].toUpperCase()}
				</div>
				<div className="min-w-0">
					<p className="font-semibold text-slate-900 dark:text-white leading-tight">
						{name || 'Usuário'}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-500 truncate">
						{email}
					</p>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-3 mb-4">
				<div className="bg-slate-50 dark:bg-[#040405]/60 rounded-xl p-3 text-center">
					<p className="text-2xl font-black text-slate-900 dark:text-white">
						{coursesCount}
					</p>
					<p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-wider mt-0.5">
						Cursos
					</p>
				</div>
				<div className="bg-slate-50 dark:bg-[#040405]/60 rounded-xl p-3 text-center">
					<p className="text-2xl font-black text-violet-600 dark:text-violet-400">
						{overallProgress}%
					</p>
					<p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-wider mt-0.5">
						Progresso
					</p>
				</div>
			</div>
			<Link
				href="/course/assinatura"
				className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-gray-800/40 hover:bg-slate-100 dark:hover:bg-gray-800/60 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium py-2.5 rounded-xl transition-all"
			>
				<CreditCard className="w-4 h-4" />
				Minha assinatura
			</Link>
		</div>
	);
}
