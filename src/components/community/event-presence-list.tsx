'use client';

import { Users } from 'lucide-react';
import type { EventAttendee } from '@/types/community';

interface EventPresenceListProps {
	attendees: EventAttendee[];
	className?: string;
}

function formatJoinedAgo(iso: string): string {
	const diffMs = Date.now() - new Date(iso).getTime();
	const min = Math.floor(diffMs / 60_000);
	if (min < 1) return 'agora';
	if (min < 60) return `${min}min`;
	const h = Math.floor(min / 60);
	return `${h}h`;
}

export function EventPresenceList({
	attendees,
	className = '',
}: EventPresenceListProps) {
	return (
		<div
			className={`rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4 ${className}`}
		>
			<div className="flex items-center gap-2 mb-3">
				<Users className="w-4 h-4 text-violet-600" />
				<h3 className="font-semibold text-slate-900 dark:text-white text-sm">
					Na sala agora ({attendees.length})
				</h3>
			</div>
			{attendees.length === 0 ? (
				<p className="text-sm text-slate-500 dark:text-gray-400 py-4 text-center">
					Seja a primeira pessoa a entrar!
				</p>
			) : (
				<ul className="space-y-2 max-h-80 overflow-y-auto">
					{attendees.map((a) => (
						<li
							key={a.customerId}
							className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
						>
							<div className="w-9 h-9 rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-semibold shrink-0 overflow-hidden">
								{a.customerImage ? (
									<img
										src={a.customerImage}
										alt={a.customerName ?? ''}
										className="w-full h-full object-cover"
									/>
								) : (
									(a.customerName?.charAt(0)?.toUpperCase() ?? '?')
								)}
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-slate-900 dark:text-white truncate">
									{a.customerName ?? 'Sem nome'}
								</p>
								<p className="text-xs text-slate-500 dark:text-gray-400">
									entrou {formatJoinedAgo(a.joinedAt)}
								</p>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
