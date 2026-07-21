'use client';

import {
	AlertTriangle,
	CheckCircle2,
	Loader2,
	Sparkles,
	Unlock,
	X,
	XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import {
	isRunStuck,
	useAbortKbSyncRun,
	useKbSyncRun,
	useStartKbSync,
} from '@/hooks/use-ai-knowledge';
import {
	type KbSourceKind,
	type KbSyncRun,
	KIND_LABELS,
	OPT_IN_KINDS,
	TEACHABLE_KINDS,
} from '@/types/ai-knowledge';
import { ConfirmDialog } from './confirm-dialog';
import { NO_EDIT_HINT } from './permission-hints';

/** Todos marcados por padrão, menos os sensíveis (conteúdo de aluno). */
function defaultScopes(): Set<KbSourceKind> {
	return new Set(TEACHABLE_KINDS.filter((k) => !OPT_IN_KINDS.includes(k)));
}

// ── Modal de escopos ──────────────────────────────────────────────────────

function ScopeModal({
	onClose,
	onStart,
	starting,
	preselectedScopes,
}: {
	onClose: () => void;
	onStart: (scopes: KbSourceKind[]) => void;
	starting: boolean;
	/**
	 * Escopo vindo de um ponto cego do topo ("Ensinar isso"): abre com só aquelas
	 * origens marcadas, pra a pessoa não ter que desmarcar 10 caixas na mão.
	 */
	preselectedScopes?: KbSourceKind[] | null;
}) {
	const [selected, setSelected] = useState<Set<KbSourceKind>>(() =>
		preselectedScopes?.length ? new Set(preselectedScopes) : defaultScopes(),
	);

	function toggle(kind: KbSourceKind) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(kind)) next.delete(kind);
			else next.add(kind);
			return next;
		});
	}

	const allSelected = selected.size === TEACHABLE_KINDS.length;

	return (
		<ModalOverlay onClose={onClose} tone="plans" widthClassName="max-w-2xl">
			<div className="p-6">
				<div className="flex items-start justify-between gap-3 mb-1">
					<h2 className="text-xl font-bold text-slate-900 dark:text-white">
						Ensinar sobre a plataforma
					</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Fechar"
						className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<p className="text-sm text-slate-600 dark:text-gray-400">
					A IA vai ler o que existe hoje na plataforma e transformar em
					conhecimento. Pode rodar quantas vezes quiser — só atualiza o que
					mudou, nada é duplicado.
				</p>

				<div className="flex items-center justify-between mt-5 mb-2">
					<h3 className="text-sm font-semibold text-slate-900 dark:text-white">
						O que a IA deve ler
					</h3>
					<button
						type="button"
						onClick={() =>
							setSelected(allSelected ? new Set() : new Set(TEACHABLE_KINDS))
						}
						className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
					>
						{allSelected ? 'Desmarcar todos' : 'Marcar todos'}
					</button>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
					{TEACHABLE_KINDS.map((kind) => {
						const checked = selected.has(kind);
						const sensitive = OPT_IN_KINDS.includes(kind);
						return (
							<label
								key={kind}
								className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
									checked
										? 'border-violet-400 dark:border-violet-500/40 bg-violet-50 dark:bg-violet-500/10'
										: 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
								}`}
							>
								<input
									type="checkbox"
									checked={checked}
									onChange={() => toggle(kind)}
									className="mt-0.5 w-4 h-4 accent-violet-600"
								/>
								<span className="min-w-0">
									<span className="block text-sm font-medium text-slate-900 dark:text-white">
										{KIND_LABELS[kind]}
									</span>
									{sensitive && (
										<span className="block text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
											Conteúdo escrito por alunos — marque só se quiser que a IA
											aprenda com atendimentos anteriores.
										</span>
									)}
								</span>
							</label>
						);
					})}
				</div>

				<div className="flex items-center justify-end gap-2 mt-6">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={() => onStart([...selected])}
						disabled={selected.size === 0 || starting}
						className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{starting ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Sparkles className="w-4 h-4" />
						)}
						Começar
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}

// ── Card de progresso ─────────────────────────────────────────────────────

const COUNT_LABELS: Array<{ key: keyof KbSyncRun['counts']; label: string }> = [
	{ key: 'created', label: 'Novos' },
	{ key: 'updated', label: 'Atualizados' },
	{ key: 'unchanged', label: 'Sem mudança' },
	{ key: 'archived', label: 'Arquivados' },
	{ key: 'failed', label: 'Falharam' },
];

function ProgressCard({
	run,
	canEdit,
	onDismiss,
	onUnlock,
	aborting,
}: {
	run: KbSyncRun;
	canEdit: boolean;
	onDismiss: () => void;
	onUnlock: () => void;
	aborting: boolean;
}) {
	const running = run.status === 'running';
	const stuck = isRunStuck(run);

	const tone =
		run.status === 'done'
			? 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10'
			: run.status === 'error'
				? 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10'
				: run.status === 'canceled'
					? 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5'
					: 'border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/10';

	return (
		<div className={`rounded-xl border p-4 ${tone}`}>
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-2.5 min-w-0">
					{running ? (
						<Loader2 className="w-5 h-5 animate-spin text-violet-600 dark:text-violet-400 shrink-0" />
					) : run.status === 'done' ? (
						<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
					) : (
						<XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
					)}
					<div className="min-w-0">
						<p className="text-sm font-semibold text-slate-900 dark:text-white">
							{running
								? 'A IA está aprendendo sobre a plataforma...'
								: run.status === 'done'
									? 'Pronto! A IA já está por dentro.'
									: run.status === 'canceled'
										? 'Aprendizado cancelado.'
										: 'O aprendizado falhou.'}
						</p>
						<p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
							{running
								? `${run.counts.scanned} itens lidos · ${run.counts.chunks} trechos criados`
								: run.error
									? run.error
									: `${run.counts.scanned} itens lidos`}
						</p>
					</div>
				</div>

				{!running && (
					<button
						type="button"
						onClick={onDismiss}
						aria-label="Fechar aviso"
						className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 transition-colors shrink-0"
					>
						<X className="w-4 h-4" />
					</button>
				)}
			</div>

			{running && (
				<div className="mt-3 h-1.5 rounded-full bg-violet-200/60 dark:bg-violet-500/20 overflow-hidden">
					{/* Indeterminado: a API não expõe um total previsível. */}
					<div className="h-full w-1/3 rounded-full bg-violet-600 animate-pulse" />
				</div>
			)}

			{!running && (
				<div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
					{COUNT_LABELS.map(({ key, label }) => (
						<span
							key={key}
							className="text-xs text-slate-600 dark:text-gray-400"
						>
							{label}:{' '}
							<strong className="text-slate-900 dark:text-white tabular-nums">
								{run.counts[key]}
							</strong>
						</span>
					))}
				</div>
			)}

			{/* Travou: sem batimento há mais de 30min. */}
			{stuck && (
				<div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-amber-300/50 dark:border-amber-500/20">
					<span className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
						<AlertTriangle className="w-4 h-4 shrink-0" />
						Isso está parado há mais de 30 minutos. Provavelmente travou.
					</span>
					<button
						type="button"
						onClick={onUnlock}
						disabled={!canEdit || aborting}
						title={canEdit ? undefined : NO_EDIT_HINT}
						className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{aborting ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Unlock className="w-3.5 h-3.5" />
						)}
						Destravar
					</button>
				</div>
			)}
		</div>
	);
}

// ── Painel ────────────────────────────────────────────────────────────────

export function TeachPanel({
	open,
	onClose,
	activeRunId,
	onRunChange,
	canEdit,
	preselectedScopes,
}: {
	open: boolean;
	onClose: () => void;
	/** Varredura em foco (adotada no mount ou recém-disparada). */
	activeRunId: string | null;
	onRunChange: (runId: string | null) => void;
	canEdit: boolean;
	/** Origens já marcadas ao abrir (vem de "Ensinar isso" num ponto cego). */
	preselectedScopes?: KbSourceKind[] | null;
}) {
	const [confirmUnlock, setConfirmUnlock] = useState(false);
	const { data: run } = useKbSyncRun(activeRunId);
	const startSync = useStartKbSync();
	const abortRun = useAbortKbSyncRun();

	function handleStart(scopes: KbSourceKind[]) {
		startSync.mutate(scopes, {
			onSuccess: (res) => {
				onRunChange(res.runId);
				onClose();
				if (res.adopted) {
					// 409: já tinha uma rodando — a tela passa a acompanhar aquela.
					toast.info(
						res.message ??
							'Já havia um aprendizado em andamento. Acompanhando ele.',
					);
				} else {
					toast.success('A IA começou a aprender.');
				}
			},
			onError: () => toast.error('Não foi possível começar agora.'),
		});
	}

	function handleUnlock() {
		if (!activeRunId) return;
		abortRun.mutate(activeRunId, {
			onSuccess: () => {
				setConfirmUnlock(false);
				toast.success('Destravado. Pode rodar de novo.');
			},
			onError: () => toast.error('Não foi possível destravar.'),
		});
	}

	return (
		<>
			{open && (
				<ScopeModal
					onClose={onClose}
					onStart={handleStart}
					starting={startSync.isPending}
					preselectedScopes={preselectedScopes}
				/>
			)}

			{run && (
				<ProgressCard
					run={run}
					canEdit={canEdit}
					onDismiss={() => onRunChange(null)}
					onUnlock={() => setConfirmUnlock(true)}
					aborting={abortRun.isPending}
				/>
			)}

			{confirmUnlock && (
				<ConfirmDialog
					title="Destravar o aprendizado?"
					description="Isso encerra o processo que ficou parado. Nada do que já foi aprendido se perde — depois é só rodar de novo."
					confirmLabel="Destravar"
					tone="danger"
					loading={abortRun.isPending}
					onConfirm={handleUnlock}
					onCancel={() => setConfirmUnlock(false)}
				/>
			)}
		</>
	);
}
