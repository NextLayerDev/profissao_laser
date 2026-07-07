'use client';

import { CheckCircle2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import {
	useAdminLessonDoubts,
	useLessonsIndexMap,
} from '@/hooks/use-lesson-doubts-admin';
import { usePermissions } from '@/modules/access';

const PREVIEW_COUNT = 4;

function timeAgo(iso: string): string {
	const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
	if (mins < 1) return 'agora';
	if (mins < 60) return `${mins}min atrás`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h atrás`;
	return `${Math.floor(hours / 24)}d atrás`;
}

export function DoubtsPreview() {
	const { can } = usePermissions();
	const enabled = can('suporte.view');

	const { data, isLoading } = useAdminLessonDoubts(
		{ status: 'unanswered', page: 1, limit: PREVIEW_COUNT },
		enabled,
	);
	const { map: lessonMap } = useLessonsIndexMap(enabled);

	if (!enabled) return null;

	const doubts = data?.doubts ?? [];
	const unansweredCount = data?.unansweredCount ?? 0;

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">
					Dúvidas
				</h3>
				<Link
					href="/suporte"
					className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
				>
					Ver todas
				</Link>
			</div>
			<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-gray-800/50 overflow-hidden shadow-sm dark:shadow-none">
				{isLoading && (
					<div className="p-6 text-center text-slate-500 dark:text-gray-500 text-sm">
						Carregando...
					</div>
				)}
				{!isLoading && doubts.length === 0 && (
					<div className="flex flex-col items-center py-8 text-slate-400 dark:text-gray-600">
						<CheckCircle2 className="w-6 h-6 mb-2 text-emerald-500/70" />
						<p className="text-sm">Nenhuma dúvida aguardando resposta.</p>
					</div>
				)}
				{!isLoading &&
					doubts.map((doubt, idx) => {
						const lesson = lessonMap.get(doubt.lessonId);
						const isLast = idx === doubts.length - 1;
						return (
							<Link
								key={doubt.id}
								href="/suporte"
								className={`flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${
									!isLast ? 'border-b border-slate-100 dark:border-white/5' : ''
								}`}
							>
								<HelpCircle className="w-4 h-4 mt-0.5 text-red-500 shrink-0" />
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2">
										<p className="text-sm font-medium text-slate-900 dark:text-white truncate">
											{doubt.authorName}
										</p>
										<span className="text-xs text-slate-400 dark:text-gray-600 shrink-0">
											{timeAgo(doubt.createdAt)}
										</span>
									</div>
									<p className="text-xs text-slate-500 dark:text-gray-500 truncate">
										{lesson
											? `${lesson.course.title} › ${lesson.title}`
											: doubt.content}
									</p>
								</div>
							</Link>
						);
					})}
			</div>
			{unansweredCount > PREVIEW_COUNT && (
				<p className="text-xs text-slate-400 dark:text-gray-600 mt-2 text-right">
					+{unansweredCount - PREVIEW_COUNT} outras aguardando resposta
				</p>
			)}
		</div>
	);
}
