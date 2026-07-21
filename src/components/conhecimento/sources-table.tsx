'use client';

import {
	AlertCircle,
	CheckCircle2,
	Loader2,
	Pin,
	RefreshCw,
	Trash2,
} from 'lucide-react';
import type { KbSource, KbSourceStatus } from '@/types/ai-knowledge';
import { KindBadge } from './kind-badge';
import { NO_DELETE_HINT, NO_EDIT_HINT } from './permission-hints';

function StatusCell({ source }: { source: KbSource }) {
	const map: Record<KbSourceStatus, { text: string; cls: string }> = {
		ready: {
			text: 'Pronto',
			cls: 'text-emerald-600 dark:text-emerald-400',
		},
		processing: {
			text: 'Preparando',
			cls: 'text-violet-600 dark:text-violet-400',
		},
		error: { text: 'Com problema', cls: 'text-red-600 dark:text-red-400' },
		archived: { text: 'Arquivado', cls: 'text-slate-400 dark:text-gray-500' },
	};
	const s = map[source.status];
	return (
		<span
			className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.cls}`}
			title={source.error ?? undefined}
		>
			{source.status === 'processing' ? (
				<Loader2 className="w-3.5 h-3.5 animate-spin" />
			) : source.status === 'error' ? (
				<AlertCircle className="w-3.5 h-3.5" />
			) : source.status === 'ready' ? (
				<CheckCircle2 className="w-3.5 h-3.5" />
			) : null}
			{s.text}
		</span>
	);
}

export function SourcesTable({
	items,
	canEdit,
	canDelete,
	busyId,
	onOpen,
	onReprocess,
	onToggleEnabled,
	onDelete,
}: {
	items: KbSource[];
	canEdit: boolean;
	canDelete: boolean;
	/** Id em operação — desabilita os botões daquela linha. */
	busyId: string | null;
	onOpen: (source: KbSource) => void;
	onReprocess: (source: KbSource) => void;
	onToggleEnabled: (source: KbSource) => void;
	onDelete: (source: KbSource) => void;
}) {
	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full text-left">
					<thead>
						<tr className="border-b border-slate-200 dark:border-white/10">
							<th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
								Conhecimento
							</th>
							<th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
								Origem
							</th>
							<th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
								Trechos
							</th>
							<th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
								Situação
							</th>
							<th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide text-right whitespace-nowrap">
								Ações
							</th>
						</tr>
					</thead>
					<tbody>
						{items.map((s) => {
							const busy = busyId === s.id;
							return (
								<tr
									key={s.id}
									className={`border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${
										s.enabled ? '' : 'opacity-55'
									}`}
								>
									<td className="px-4 py-3 max-w-md">
										<button
											type="button"
											onClick={() => onOpen(s)}
											className="text-left group"
										>
											<span className="flex items-center gap-1.5">
												{s.pinned && (
													<Pin
														className="w-3.5 h-3.5 text-violet-500 shrink-0"
														aria-label="Destacado"
													/>
												)}
												<span className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
													{s.title}
												</span>
											</span>
											{s.label && (
												<span className="block text-xs text-slate-500 dark:text-gray-400 mt-0.5 line-clamp-1">
													{s.label}
												</span>
											)}
										</button>
									</td>
									<td className="px-4 py-3">
										<KindBadge kind={s.kind} />
									</td>
									<td className="px-4 py-3 text-sm text-slate-600 dark:text-gray-400 tabular-nums">
										{s.chunkCount}
									</td>
									<td className="px-4 py-3">
										<StatusCell source={s} />
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-end gap-1">
											<button
												type="button"
												onClick={() => onReprocess(s)}
												disabled={!canEdit || busy}
												title={
													canEdit
														? 'Reprocessar este conhecimento'
														: NO_EDIT_HINT
												}
												aria-label="Reprocessar"
												className="p-1.5 rounded-lg text-slate-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
											>
												<RefreshCw
													className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`}
												/>
											</button>
											<button
												type="button"
												onClick={() => onToggleEnabled(s)}
												disabled={!canEdit || busy}
												title={
													canEdit
														? s.enabled
															? 'Desativar (a IA para de usar)'
															: 'Ativar (a IA volta a usar)'
														: NO_EDIT_HINT
												}
												className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-gray-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
											>
												{s.enabled ? 'Desativar' : 'Ativar'}
											</button>
											<button
												type="button"
												onClick={() => onDelete(s)}
												disabled={!canDelete || busy}
												title={canDelete ? 'Excluir' : NO_DELETE_HINT}
												aria-label="Excluir"
												className="p-1.5 rounded-lg text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
