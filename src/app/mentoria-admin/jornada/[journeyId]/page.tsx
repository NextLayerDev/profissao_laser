'use client';

import {
	Building2,
	Camera,
	Layers,
	ListTodo,
	Loader2,
	Lock,
	RotateCcw,
	Sprout,
	Target,
	TrendingUp,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/dashboard/header';
import { useJourneyOverview } from '@/modules/mentoria/hooks';
import type { MntJourney } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useIsMentoriaAdmin,
	useSetJourneyStatus,
} from '../../_components/admin-hooks';
import {
	Badge,
	Card,
	dangerBtn,
	EmptyState,
	formatDate,
	Modal,
	PageTitle,
	ProgressBar,
	primaryBtn,
	Spinner,
	secondaryBtn,
} from '../../_components/ui';
import { DevelopmentTab } from './_components/development-tab';
import { DiagnosticTab } from './_components/diagnostic-tab';
import { EvolutionTab } from './_components/evolution-tab';
import { MeetingsTab } from './_components/meetings-tab';
import { TasksTab } from './_components/tasks-tab';
import { ToolsTab } from './_components/tools-tab';

// Cada aba só monta (e só busca) quando está aberta.
const TABS = [
	{ key: 'encontros', label: 'Encontros', Icon: Target },
	{ key: 'diagnostico', label: 'Diagnóstico', Icon: Camera },
	{ key: 'ferramentas', label: 'Ferramentas', Icon: Layers },
	{ key: 'desenvolvimento', label: 'Desenvolvimento', Icon: Sprout },
	{ key: 'evolucao', label: 'Evolução', Icon: TrendingUp },
	{ key: 'tarefas', label: 'Tarefas', Icon: ListTodo },
] as const;
type TabKey = (typeof TABS)[number]['key'];

const JOURNEY_STATUS: Record<
	MntJourney['status'],
	{ tone: 'green' | 'slate' | 'red'; label: string }
> = {
	active: { tone: 'green', label: 'Ativa' },
	completed: { tone: 'slate', label: 'Encerrada' },
	abandoned: { tone: 'red', label: 'Cancelada' },
};

function isTab(v: string): v is TabKey {
	return TABS.some((t) => t.key === v);
}

export default function JourneyDrilldownPage() {
	const { journeyId } = useParams<{ journeyId: string }>();
	const overview = useJourneyOverview(journeyId);
	const { isAdmin } = useIsMentoriaAdmin();
	const [tab, setTab] = useState<TabKey>('encontros');
	const [confirming, setConfirming] = useState<'completed' | 'active' | null>(
		null,
	);

	// A aba vai no #hash: recarregar ou mandar o link abre no mesmo lugar.
	useEffect(() => {
		const sync = () => {
			const hash = window.location.hash.slice(1);
			if (isTab(hash)) setTab(hash);
		};
		sync();
		window.addEventListener('hashchange', sync);
		return () => window.removeEventListener('hashchange', sync);
	}, []);
	const selectTab = (key: TabKey) => {
		setTab(key);
		window.history.replaceState(null, '', `#${key}`);
	};

	const data = overview.data;
	const company = data?.company;
	const journey = data?.journey;
	// Volta para a turma do aluno: a lista de Turmas é só de admin e o mentor
	// staff caía em "Erro ao carregar as turmas".
	const cohortId = data?.cohort?.id ?? journey?.cohort_id;
	const status = journey ? JOURNEY_STATUS[journey.status] : null;

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
				<PageTitle
					title={company ? company.name : 'Mentoria da empresa'}
					backHref={
						cohortId ? `/mentoria-admin/turmas/${cohortId}` : '/mentoria-admin'
					}
					actions={
						isAdmin && journey ? (
							journey.status === 'active' ? (
								<button
									type="button"
									className={dangerBtn}
									onClick={() => setConfirming('completed')}
								>
									<Lock className="w-3.5 h-3.5" />
									Encerrar jornada
								</button>
							) : (
								<button
									type="button"
									className={secondaryBtn}
									onClick={() => setConfirming('active')}
								>
									<RotateCcw className="w-3.5 h-3.5" />
									Reativar
								</button>
							)
						) : undefined
					}
				/>

				{overview.isLoading ? (
					<Spinner />
				) : overview.isError ? (
					<Card>
						<EmptyState message="Erro ao carregar. Você é mentor desta turma?" />
					</Card>
				) : !data ? (
					<Card>
						<EmptyState message="Jornada não encontrada." />
					</Card>
				) : (
					<div className="space-y-6">
						{/* Cabeçalho da empresa */}
						<Card className="p-5">
							<div className="flex items-start justify-between gap-4 flex-wrap">
								<div className="flex items-start gap-3">
									<div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
										<Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
									</div>
									<div>
										<div className="flex items-center gap-2 flex-wrap">
											<p className="font-semibold text-slate-900 dark:text-white">
												{company?.name ?? '—'}
											</p>
											{status && (
												<span data-testid="journey-status">
													<Badge tone={status.tone}>{status.label}</Badge>
												</span>
											)}
										</div>
										<p className="text-sm text-slate-500 dark:text-gray-400">
											{[company?.segment, company?.city, company?.state]
												.filter(Boolean)
												.join(' · ') || 'Sem dados cadastrais'}
										</p>
										{company?.email && (
											<p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
												{company.email}
												{company.phone ? ` · ${company.phone}` : ''}
											</p>
										)}
										{journey?.completed_at && journey.status !== 'active' && (
											<p className="text-xs text-muted mt-0.5">
												Encerrada em {formatDate(journey.completed_at)}
											</p>
										)}
									</div>
								</div>
								<div className="min-w-52">
									<p className="text-xs text-slate-500 dark:text-gray-400 mb-1">
										{data.progress.meetings_done}/{data.progress.meetings_total}{' '}
										encontros
									</p>
									<ProgressBar pct={data.progress.progress_pct} />
									{journey?.maturity_score != null && (
										<p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
											Maturidade: {Math.round(journey.maturity_score)}%
										</p>
									)}
								</div>
							</div>
						</Card>

						<div
							role="tablist"
							aria-label="Seções da jornada"
							className="flex flex-wrap gap-2"
						>
							{TABS.map(({ key, label, Icon }) => {
								const active = tab === key;
								return (
									<button
										key={key}
										type="button"
										role="tab"
										aria-selected={active}
										onClick={() => selectTab(key)}
										className={`inline-flex items-center gap-2 rounded-control border px-4 py-2 text-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
											active
												? 'border-brand-border bg-brand-wash text-brand dark:text-violet-400'
												: 'border-subtle text-secondary hover:text-primary hover:bg-surface-sunken'
										}`}
									>
										<Icon className="h-4 w-4 shrink-0" aria-hidden />
										{label}
									</button>
								);
							})}
						</div>

						<div role="tabpanel">
							{tab === 'encontros' && (
								<MeetingsTab journeyId={journeyId} meetings={data.meetings} />
							)}
							{tab === 'diagnostico' && <DiagnosticTab journeyId={journeyId} />}
							{tab === 'ferramentas' && <ToolsTab journeyId={journeyId} />}
							{tab === 'desenvolvimento' && (
								<DevelopmentTab journeyId={journeyId} />
							)}
							{tab === 'evolucao' && <EvolutionTab journeyId={journeyId} />}
							{tab === 'tarefas' && <TasksTab journeyId={journeyId} />}
						</div>
					</div>
				)}
			</main>

			{confirming && (
				<JourneyStatusModal
					journeyId={journeyId}
					target={confirming}
					onClose={() => setConfirming(null)}
				/>
			)}
		</div>
	);
}

function JourneyStatusModal({
	journeyId,
	target,
	onClose,
}: {
	journeyId: string;
	target: 'completed' | 'active';
	onClose: () => void;
}) {
	const setStatus = useSetJourneyStatus(journeyId);
	const closing = target === 'completed';
	const submit = async () => {
		try {
			await setStatus.mutateAsync(target);
			toast.success(closing ? 'Jornada encerrada' : 'Jornada reativada');
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Não foi possível salvar.'));
		}
	};
	return (
		<Modal
			title={closing ? 'Encerrar a jornada?' : 'Reativar a jornada?'}
			onClose={onClose}
		>
			<div className="space-y-4">
				<p className="text-sm text-slate-600 dark:text-gray-300">
					{closing
						? 'A matrícula deixa de liberar a Mentoria. O histórico fica.'
						: 'O aluno volta a acessar a Mentoria por esta turma.'}
				</p>
				<div className="flex justify-end gap-2">
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className={closing ? dangerBtn : primaryBtn}
						disabled={setStatus.isPending}
						onClick={submit}
					>
						{setStatus.isPending && (
							<Loader2 className="w-4 h-4 animate-spin" />
						)}
						{closing ? 'Encerrar' : 'Reativar'}
					</button>
				</div>
			</div>
		</Modal>
	);
}
