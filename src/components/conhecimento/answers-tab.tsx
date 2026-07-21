'use client';

import { History, MessageSquare } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { useKbAnswers } from '@/hooks/use-ai-knowledge';
import { MODE_LABELS, REASON_LABELS } from '@/types/ai-knowledge';

type Filter = 'all' | 'handoff' | 'degraded';

const FILTERS: Array<{ key: Filter; label: string }> = [
	{ key: 'all', label: 'Todas' },
	{ key: 'handoff', label: 'Passaram para humano' },
	{ key: 'degraded', label: 'Com problema na busca' },
];

function formatDate(iso: string): string {
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR');
}

/**
 * Auditoria: o que a IA respondeu de verdade nos atendimentos. É aqui que a
 * staff descobre buracos na base — resposta ruim = conhecimento faltando.
 */
export function AnswersTab() {
	const [filter, setFilter] = useState<Filter>('all');
	const [expanded, setExpanded] = useState<Set<string>>(new Set());

	const params = useMemo(
		() => ({ limit: 100, ...(filter === 'handoff' ? { handoff: true } : {}) }),
		[filter],
	);
	const { data: answers = [], isLoading } = useKbAnswers(params);

	// 'degraded' não tem filtro direto na API (reason aceita um valor só), então
	// filtramos no cliente sobre a última página.
	const visible = useMemo(
		() =>
			filter === 'degraded'
				? answers.filter((a) => a.reason !== 'ok')
				: answers,
		[answers, filter],
	);

	function toggle(id: string) {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-bold text-slate-900 dark:text-white">
					O que a IA respondeu
				</h2>
				<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
					Respostas reais dadas nos atendimentos. Se alguma estiver ruim, é
					sinal de que falta conhecimento na base.
				</p>
			</div>

			<div className="flex flex-wrap gap-1.5">
				{FILTERS.map((f) => (
					<button
						key={f.key}
						type="button"
						onClick={() => setFilter(f.key)}
						className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
							filter === f.key
								? 'bg-violet-600 text-white'
								: 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
						}`}
					>
						{f.label}
					</button>
				))}
			</div>

			{isLoading ? (
				<LoadingState text="Carregando respostas..." />
			) : visible.length === 0 ? (
				<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d]">
					<EmptyState
						icon={MessageSquare}
						title="Nenhuma resposta por aqui"
						description="Assim que a IA atender alguém no chat ao vivo, as respostas aparecem nesta lista."
					/>
				</div>
			) : (
				<div className="space-y-2.5">
					{visible.map((a) => {
						const open = expanded.has(a.id);
						return (
							<div
								key={a.id}
								className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden"
							>
								<button
									type="button"
									onClick={() => toggle(a.id)}
									className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
								>
									<div className="flex items-start justify-between gap-3">
										<p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2 min-w-0">
											{a.question}
										</p>
										<div className="flex items-center gap-1.5 shrink-0">
											{a.handoff && (
												<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 whitespace-nowrap">
													Passou para humano
												</span>
											)}
											{a.reason !== 'ok' && (
												<span
													title={REASON_LABELS[a.reason]}
													className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 whitespace-nowrap"
												>
													{REASON_LABELS[a.reason]}
												</span>
											)}
										</div>
									</div>
									<p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
										{formatDate(a.createdAt)} · {MODE_LABELS[a.mode]} ·{' '}
										{a.latencyMs}ms
									</p>
								</button>

								{open && (
									<div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-white/5">
										<p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 mt-3">
											Resposta
										</p>
										<p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
											{a.answer}
										</p>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{filter === 'degraded' && !isLoading && (
				<p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-gray-500">
					<History className="w-3.5 h-3.5" />
					Mostrando as 100 respostas mais recentes.
				</p>
			)}
		</div>
	);
}
