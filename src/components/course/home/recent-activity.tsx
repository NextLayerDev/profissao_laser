'use client';

import Link from 'next/link';
import { useCommunityActivity } from '@/hooks/use-community';
import type { ActivityType } from '@/types/community';

const ACTIVITY_LABELS: Record<ActivityType, string> = {
	lesson_completed: 'completou uma aula',
	badge_earned: 'conquistou uma badge',
	forum_post: 'publicou no forum',
	forum_reply: 'respondeu no forum',
	challenge_completed: 'completou um desafio',
	member_joined: 'entrou na comunidade',
};

const GRADIENTS = [
	'from-pink-500 to-rose-500',
	'from-blue-500 to-cyan-500',
	'from-emerald-500 to-teal-500',
	'from-violet-600 to-violet-600',
];

function getInitials(name: string): string {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return 'agora';
	if (mins < 60) return `ha ${mins}min`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `ha ${hours}h`;
	const days = Math.floor(hours / 24);
	return `ha ${days}d`;
}

export function RecentActivity() {
	const { data: activities, isLoading } = useCommunityActivity(1, 4);

	return (
		<section className="bg-white dark:bg-[#12121a] border border-slate-200 dark:border-white/5 rounded-2xl p-6">
			<div className="flex justify-between items-center mb-5">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					Atividade Recente
				</h3>
			</div>

			<div className="space-y-3">
				{isLoading ? (
					Array.from({ length: 4 }).map((_, i) => (
						<div key={`skeleton-${i}`} className="flex items-start gap-3 p-3">
							<div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse shrink-0" />
							<div className="flex-1 space-y-2">
								<div className="h-4 bg-slate-200 dark:bg-white/10 rounded animate-pulse w-3/4" />
								<div className="h-3 bg-slate-200 dark:bg-white/10 rounded animate-pulse w-1/4" />
							</div>
						</div>
					))
				) : !activities?.length ? (
					<p className="text-sm text-slate-400 dark:text-gray-500 text-center py-4">
						Nenhuma atividade recente
					</p>
				) : (
					activities.map((activity, i) => (
						<div
							key={activity.id}
							className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
						>
							{activity.user.avatar ? (
								<img
									src={activity.user.avatar}
									alt={activity.user.name}
									className="w-9 h-9 rounded-full object-cover shrink-0"
								/>
							) : (
								<div
									className={`w-9 h-9 rounded-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}
								>
									{getInitials(activity.user.name)}
								</div>
							)}
							<div className="min-w-0 flex-1">
								<p className="text-sm text-slate-700 dark:text-gray-300 leading-snug">
									<span className="font-semibold text-slate-900 dark:text-white">
										{activity.user.name}
									</span>{' '}
									{ACTIVITY_LABELS[activity.type] ?? activity.type}
								</p>
								<span className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
									{timeAgo(activity.createdAt)}
								</span>
							</div>
						</div>
					))
				)}
			</div>

			<Link
				href="/comunity"
				className="mt-4 block text-center text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-600 transition-colors"
			>
				Ver todas as atividades
			</Link>
		</section>
	);
}
