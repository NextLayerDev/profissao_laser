'use client';

import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { useCommunityRanking } from '@/hooks/use-community';

const POSITION_STYLES: Record<number, string> = {
	0: 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white',
	1: 'bg-gradient-to-br from-slate-300 to-slate-400 text-white',
	2: 'bg-gradient-to-br from-orange-400 to-amber-600 text-white',
};

const AVATAR_GRADIENTS = [
	'linear-gradient(135deg, #8b5cf6, #d946ef)',
	'linear-gradient(135deg, #3b82f6, #06b6d4)',
	'linear-gradient(135deg, #ec4899, #f43f5e)',
	'linear-gradient(135deg, #10b981, #14b8a6)',
	'linear-gradient(135deg, #f59e0b, #ef4444)',
];

export function CommunityRanking() {
	const { data, isLoading } = useCommunityRanking();

	const topMembers = data?.top?.slice(0, 5) ?? [];

	return (
		<div className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<Trophy className="w-4 h-4 text-amber-500" />
					<h3 className="text-sm font-bold text-slate-900 dark:text-white">
						Ranking da Comunidade
					</h3>
				</div>
				<Link
					href="/course/membros"
					className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 font-medium transition-colors"
				>
					Ver todos
				</Link>
			</div>

			<div className="space-y-3">
				{isLoading ? (
					Array.from({ length: 5 }).map((_, i) => (
						<div key={`skeleton-${i}`} className="flex items-center gap-3">
							<div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse shrink-0" />
							<div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse shrink-0" />
							<div className="flex-1 space-y-1">
								<div className="h-4 bg-slate-200 dark:bg-white/10 rounded animate-pulse w-3/4" />
								<div className="h-3 bg-slate-200 dark:bg-white/10 rounded animate-pulse w-1/2" />
							</div>
						</div>
					))
				) : !topMembers.length ? (
					<p className="text-xs text-slate-400 dark:text-gray-500 text-center py-4">
						Nenhum dado de ranking disponivel
					</p>
				) : (
					topMembers.map((member, i) => (
						<div key={member.name} className="flex items-center gap-3">
							<div
								className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
									POSITION_STYLES[i] ??
									'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400'
								}`}
							>
								{member.pos}
							</div>
							<div
								className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
								style={{
									background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
								}}
							>
								{member.name.charAt(0)}
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
									{member.name}
								</p>
							</div>
							<span className="text-xs font-bold text-violet-600 dark:text-violet-400 shrink-0">
								{member.pts.toLocaleString('pt-BR')} XP
							</span>
						</div>
					))
				)}
			</div>
		</div>
	);
}
