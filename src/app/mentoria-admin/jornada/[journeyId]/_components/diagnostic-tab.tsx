'use client';

import { Camera, History, Loader2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DynamicForm } from '@/modules/mentoria/components/dynamic-form';
import type { DiagnosticReopen } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useIsMentoriaAdmin,
	useMentorDiagnostic,
	useMentorDiagnosticReopens,
	useReopenDiagnostic,
} from '../../../_components/admin-hooks';
import {
	Badge,
	Card,
	Field,
	formatDateTime,
	inputClass,
	Modal,
	primaryBtn,
	secondaryBtn,
} from '../../../_components/ui';
import {
	AnswersList,
	diagnosticLabels,
	QueryState,
	SectionTitle,
} from './common';

export function DiagnosticTab({ journeyId }: { journeyId: string }) {
	const diagnostic = useMentorDiagnostic(journeyId);
	const reopens = useMentorDiagnosticReopens(journeyId);
	const { isAdmin } = useIsMentoriaAdmin();
	const [reopening, setReopening] = useState(false);

	const state = diagnostic.data;
	const labels = diagnosticLabels(state);
	// O que o aluno enviou (Foto Zero) ou, sem envio, o rascunho em andamento.
	const answers = state?.submitted?.answers ?? state?.draft?.answers ?? null;
	const status = state?.foto_zero
		? {
				tone: 'green' as const,
				label: `Foto Zero em ${formatDateTime(state.foto_zero.taken_at)}`,
			}
		: state?.draft
			? {
					tone: 'amber' as const,
					label: `Rascunho de ${formatDateTime(state.draft.updated_at)}`,
				}
			: { tone: 'slate' as const, label: 'Não iniciado' };

	return (
		<div className="space-y-10">
			<section>
				<SectionTitle icon={Camera}>Diagnóstico (Foto Zero)</SectionTitle>
				<QueryState
					loading={diagnostic.isLoading}
					error={diagnostic.isError}
					empty={false}
					errorText="Não foi possível carregar o diagnóstico."
					emptyText=""
				>
					<div className="space-y-4">
						<Card className="p-4 flex flex-wrap items-center justify-between gap-3">
							<Badge tone={status.tone}>{status.label}</Badge>
							{/* Reabrir é só do admin (a API recusa o staff). */}
							{isAdmin && state?.foto_zero && (
								<button
									type="button"
									className={secondaryBtn}
									onClick={() => setReopening(true)}
								>
									<RotateCcw className="w-3.5 h-3.5" />
									Reabrir diagnóstico
								</button>
							)}
						</Card>
						{answers &&
							(state?.template ? (
								<div data-testid="mentor-diagnostic-answers">
									<DynamicForm
										template={state.template}
										initialAnswers={answers}
										readOnly
									/>
								</div>
							) : (
								<Card className="p-4">
									<AnswersList answers={answers} labels={labels} />
								</Card>
							))}
					</div>
				</QueryState>
			</section>

			<section>
				<SectionTitle icon={History}>Reaberturas</SectionTitle>
				<QueryState
					loading={reopens.isLoading}
					error={reopens.isError}
					empty={!reopens.data?.length}
					errorText="Não foi possível carregar as reaberturas."
					emptyText="Nenhuma reabertura."
				>
					<div className="space-y-3" data-testid="diagnostic-reopens">
						{reopens.data?.map((r) => (
							<ReopenCard key={r.id} reopen={r} labels={labels} />
						))}
					</div>
				</QueryState>
			</section>

			{reopening && (
				<ReopenDiagnosticModal
					journeyId={journeyId}
					onClose={() => setReopening(false)}
				/>
			)}
		</div>
	);
}

function ReopenCard({
	reopen,
	labels,
}: {
	reopen: DiagnosticReopen;
	labels: Record<string, string>;
}) {
	const [open, setOpen] = useState(false);
	return (
		<Card className="p-4">
			<div className="flex items-start justify-between gap-3 flex-wrap">
				<div>
					<p className="font-medium text-slate-900 dark:text-white">
						{formatDateTime(reopen.reopened_at)}
						{reopen.reopened_by_name ? ` · ${reopen.reopened_by_name}` : ''}
					</p>
					<p className="text-sm text-muted mt-0.5">
						{reopen.reason || 'Sem motivo'}
						{reopen.foto_zero_taken_at
							? ` · Foto Zero de ${formatDateTime(reopen.foto_zero_taken_at)}`
							: ''}
					</p>
				</div>
				{reopen.answers && (
					<button
						type="button"
						className="text-sm text-violet-600 dark:text-violet-400"
						onClick={() => setOpen((v) => !v)}
					>
						{open ? 'Ocultar' : 'Respostas arquivadas'}
					</button>
				)}
			</div>
			{open && reopen.answers && (
				<div className="mt-4 border-t border-slate-100 dark:border-white/5 pt-4">
					<AnswersList answers={reopen.answers} labels={labels} />
				</div>
			)}
		</Card>
	);
}

function ReopenDiagnosticModal({
	journeyId,
	onClose,
}: {
	journeyId: string;
	onClose: () => void;
}) {
	const reopen = useReopenDiagnostic(journeyId);
	const [reason, setReason] = useState('');
	const submit = async () => {
		try {
			await reopen.mutateAsync(reason.trim() || null);
			toast.success('Diagnóstico reaberto.');
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao reabrir o diagnóstico'));
		}
	};
	return (
		<Modal title="Reabrir diagnóstico?" onClose={onClose}>
			<div className="space-y-4">
				<p className="text-sm text-slate-600 dark:text-gray-300">
					A Foto Zero é arquivada e o aluno reenvia.
				</p>
				<Field label="Motivo (opcional)">
					<textarea
						className={`${inputClass} min-h-16`}
						value={reason}
						maxLength={500}
						onChange={(e) => setReason(e.target.value)}
						placeholder="Ex.: enviado vazio por engano"
					/>
				</Field>
				<div className="flex justify-end gap-2">
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className={primaryBtn}
						disabled={reopen.isPending}
						onClick={submit}
					>
						{reopen.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
						Reabrir
					</button>
				</div>
			</div>
		</Modal>
	);
}
