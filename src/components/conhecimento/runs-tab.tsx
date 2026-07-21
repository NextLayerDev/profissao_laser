'use client';

import { CheckCircle2, Clock, Loader2, Unlock, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
	isRunStuck,
	useAbortKbSyncRun,
	useKbSyncRuns,
} from '@/hooks/use-ai-knowledge';
import {
	type KbSyncRun,
	KIND_LABELS,
	SYNC_STATUS_LABELS,
} from '@/types/ai-knowledge';
import { ConfirmDialog } from './confirm-dialog';
import { NO_EDIT_HINT } from './permission-hints';

function formatDate(iso: string | null): string {
	if (!iso) return '—';
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR');
}

function duration(run: KbSyncRun): string {
	const start = new Date(run.startedAt).getTime();
	const end = run.finishedAt ? new Date(run.finishedAt).getTime() : Date.now();
	if (Number.isNaN(start) || Number.isNaN(end)) return '—';
	const s = Math.max(0, Math.round((end - start) / 1000));
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	return m < 60 ? `${m}min` : `${Math.floor(m / 60)}h ${m % 60}min`;
}

function StatusIcon({ status }: { status: KbSyncRun['status'] }) {
	if (status === 'running')
		return <Loader2 className="w-4 h-4 animate-spin text-violet-500" />;
	if (status === 'done')
		return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
	if (status === 'canceled')
		return <XCircle className="w-4 h-4 text-slate-400" />;
	return <XCircle className="w-4 h-4 text-red-500" />;
}

/** Histórico de varreduras — para entender o que a IA leu e quando. */
export function RunsTab({ canEdit }: { canEdit: boolean }) {
	const { data: runs = [], isLoading } = useKbSyncRuns(30);
	const abortRun = useAbortKbSyncRun();
	const [toUnlock, setToUnlock] = useState<KbSyncRun | null>(null);

	function handleUnlock() {
		if (!toUnlock) return;
		abortRun.mutate(toUnlock.id, {
			onSuccess: () => {
				toast.success('Destravado. Pode rodar de novo.');
				setToUnlock(null);
			},
			onError: () => toast.error('Não foi possível destravar.'),
		});
	}

	if (isLoading) return <LoadingState text="Carregando histórico..." />;

	if (runs.length === 0) {
		return (
			<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d]">
				<EmptyState
					icon={Clock}
					title="Nenhum aprendizado registrado"
					description="Quando você mandar a IA ler a plataforma, o histórico aparece aqui."
				/>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-lg font-bold text-slate-900 dark:text-white">
					Histórico de aprendizados
				</h2>
				<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
					Cada vez que a IA leu a plataforma e o que ela encontrou.
				</p>
			</div>

			<div className="space-y-2.5">
				{runs.map((run) => {
					const stuck = isRunStuck(run);
					return (
						<div
							key={run.id}
							className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4"
						>
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div className="flex items-start gap-2.5 min-w-0">
									<span className="mt-0.5 shrink-0">
										<StatusIcon status={run.status} />
									</span>
									<div className="min-w-0">
										<p className="text-sm font-semibold text-slate-900 dark:text-white">
											{SYNC_STATUS_LABELS[run.status]}
											{stuck && (
												<span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
													parece travado
												</span>
											)}
										</p>
										<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
											{formatDate(run.startedAt)} · durou {duration(run)}
										</p>
										{run.error && (
											<p className="text-xs text-red-600 dark:text-red-400 mt-1">
												{run.error}
											</p>
										)}
									</div>
								</div>

								{stuck && (
									<button
										type="button"
										onClick={() => setToUnlock(run)}
										disabled={!canEdit || abortRun.isPending}
										title={canEdit ? undefined : NO_EDIT_HINT}
										className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
									>
										<Unlock className="w-3.5 h-3.5" />
										Destravar
									</button>
								)}
							</div>

							<div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
								{[
									['Lidos', run.counts.scanned],
									['Novos', run.counts.created],
									['Atualizados', run.counts.updated],
									['Sem mudança', run.counts.unchanged],
									['Arquivados', run.counts.archived],
									['Falharam', run.counts.failed],
									['Trechos', run.counts.chunks],
								].map(([label, value]) => (
									<span
										key={label as string}
										className="text-xs text-slate-500 dark:text-gray-400"
									>
										{label}:{' '}
										<strong className="text-slate-900 dark:text-white tabular-nums">
											{value}
										</strong>
									</span>
								))}
							</div>

							{!!run.scopes?.length && (
								<p className="text-[11px] text-slate-400 dark:text-gray-500 mt-2">
									Leu: {run.scopes.map((s) => KIND_LABELS[s]).join(', ')}
								</p>
							)}
						</div>
					);
				})}
			</div>

			{toUnlock && (
				<ConfirmDialog
					title="Destravar o aprendizado?"
					description="Isso encerra o processo que ficou parado. Nada do que já foi aprendido se perde — depois é só rodar de novo."
					confirmLabel="Destravar"
					loading={abortRun.isPending}
					onConfirm={handleUnlock}
					onCancel={() => setToUnlock(null)}
				/>
			)}
		</div>
	);
}
