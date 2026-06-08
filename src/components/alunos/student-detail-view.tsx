'use client';

import { useQuery } from '@tanstack/react-query';
import {
	Activity,
	ArrowUpDown,
	CalendarClock,
	CreditCard,
	Flame,
	FlaskConical,
	Hash,
	KeyRound,
	Layers,
	Loader2,
	Mail,
	MessageCircle,
	Phone,
	Plus,
	ShieldCheck,
	ShieldOff,
	Trash2,
	Trophy,
	User,
	Wrench,
	XCircle,
} from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { StatCard } from '@/components/ui/stat-card';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import {
	useGrantStudentVoxes,
	useSetStudentTestUnlimited,
	useStudentActivity,
} from '@/hooks/use-students';
import { formatVox } from '@/lib/format';
import { useCourses } from '@/modules/courses';
import { listModuleLessons } from '@/modules/courses/services/lessons.service';
import { listCourseModules } from '@/modules/courses/services/modules.service';
import { systemToolFor } from '@/modules/tools/system-tools';
import { getCourseProgress } from '@/services/progress';
import type {
	StudentDetail,
	ToolUsageItem,
	VoxxysLedgerItem,
	VoxxysLedgerReason,
} from '@/services/students';
import { BlockCustomerModal } from './block-customer-modal';
import { CancelSubscriptionModal } from './cancel-subscription-modal';
import { ChangePasswordModal } from './change-password-modal';
import { ChangePlanModal } from './change-plan-modal';
import { DeleteCustomerModal } from './delete-customer-modal';
import { statusColor, statusLabel } from './status-maps';

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

function formatDate(value: string | null): string {
	if (!value) return '—';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return '—';
	return d.toLocaleDateString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

function formatDateTime(value: string | null): string {
	if (!value) return '—';
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return '—';
	return d.toLocaleString('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function formatPrice(cents: number): string {
	return `R$ ${(cents / 100).toFixed(2)}`;
}

/**
 * Formata uma data "pura" (`YYYY-MM-DD`, vinda de `last_seen_date`) em pt-BR sem
 * deslocamento de fuso (evita "voltar um dia"). Aceita também ISO completo.
 */
function formatDateOnly(value: string | null): string {
	if (!value) return '—';
	const ymd = value.slice(0, 10);
	const [y, m, d] = ymd.split('-').map(Number);
	if (!y || !m || !d) return formatDate(value);
	return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

/* ------------------------------------------------------------------ */
/*  Activity maps / constants                                          */
/* ------------------------------------------------------------------ */

const TOOLS_PAGE_SIZE = 10;
const VOXXYS_PAGE_SIZE = 10;

/** Motivos do ledger de voxxys → rótulo pt-BR. */
const LEDGER_REASON_LABELS: Record<VoxxysLedgerReason, string> = {
	plan_grant: 'Plano',
	spend: 'Uso',
	refund: 'Estorno',
	adjustment: 'Ajuste',
	purchase: 'Compra',
};

/** Rótulo pt-BR de um motivo do ledger, tolerante a motivos desconhecidos. */
function ledgerReasonLabel(reason: string): string {
	return LEDGER_REASON_LABELS[reason as VoxxysLedgerReason] ?? reason;
}

/** Cores de badge por status de uso de ferramenta. */
function toolStatusColor(status: string): string {
	switch (status) {
		case 'settled':
		case 'completed':
		case 'success':
			return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
		case 'pending':
		case 'reserved':
			return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
		case 'failed':
		case 'error':
		case 'refunded':
			return 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400';
		default:
			return 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-gray-300';
	}
}

/** Nome amigável de uma ferramenta a partir do `tool_key` (cai no key cru). */
function toolLabel(toolKey: string): string {
	return systemToolFor(toolKey)?.label ?? toolKey;
}

function initials(name: string | null, email: string): string {
	const source = name?.trim() || email;
	const parts = source.split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '?';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Stripe link: assinaturas manuais/cortesia usam o prefixo `manual:`. */
function isManualSubscription(stripeSubscriptionId: string): boolean {
	return stripeSubscriptionId.startsWith('manual:');
}

/* ------------------------------------------------------------------ */
/*  Detail view                                                        */
/* ------------------------------------------------------------------ */

export function StudentDetailView({ student }: { student: StudentDetail }) {
	/* modal open-state (mirrors the list view) */
	const [planOpen, setPlanOpen] = useState(false);
	const [cancelOpen, setCancelOpen] = useState(false);
	const [blockOpen, setBlockOpen] = useState(false);
	const [passwordOpen, setPasswordOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [voxesOpen, setVoxesOpen] = useState(false);

	/* activity pagination (uso de ferramentas + histórico de voxxys) */
	const [toolsPage, setToolsPage] = useState(1);
	const [voxxysPage, setVoxxysPage] = useState(1);

	const setTestUnlimited = useSetStudentTestUnlimited();

	const { data: activity, isFetching: activityFetching } = useStudentActivity(
		student.id,
		{
			tools_page: toolsPage,
			tools_limit: TOOLS_PAGE_SIZE,
			voxxys_page: voxxysPage,
			voxxys_limit: VOXXYS_PAGE_SIZE,
		},
	);

	const displayName = student.name ?? 'Sem nome';
	const sub = student.subscription;
	const whatsappDigits = student.phone?.replace(/\D/g, '') ?? '';

	return (
		<>
			{/* ---------------------------------------------------------- */}
			{/* Header block                                               */}
			{/* ---------------------------------------------------------- */}
			<header className="mb-8 flex flex-col sm:flex-row sm:items-start gap-4">
				<div
					aria-hidden="true"
					className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20"
				>
					{initials(student.name, student.email)}
				</div>
				<div className="min-w-0 flex-1">
					<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white break-words">
						{displayName}
					</h1>
					<p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5 break-all">
						{student.email}
					</p>
					<div className="mt-3 flex flex-wrap items-center gap-2">
						<BlockedBadge blocked={student.blocked} />
						{student.is_test_unlimited && (
							<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
								<FlaskConical className="w-3 h-3" aria-hidden="true" />
								Teste ilimitado
							</span>
						)}
						{student.subscription_status && (
							<span
								className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(
									student.subscription_status,
								)}`}
							>
								{statusLabel(student.subscription_status)}
							</span>
						)}
					</div>
				</div>

				{/* Header actions (WhatsApp) */}
				{whatsappDigits ? (
					<a
						href={`https://wa.me/${whatsappDigits}`}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`Falar com ${displayName} no WhatsApp`}
						className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors self-start"
					>
						<MessageCircle className="w-4 h-4" aria-hidden="true" />
						Falar no WhatsApp
					</a>
				) : (
					<span
						title="Aluno sem telefone cadastrado"
						className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-400 dark:text-gray-500 cursor-not-allowed self-start"
					>
						<MessageCircle className="w-4 h-4" aria-hidden="true" />
						Sem WhatsApp
					</span>
				)}
			</header>

			{/* ---------------------------------------------------------- */}
			{/* Stat row                                                   */}
			{/* ---------------------------------------------------------- */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<StatCard
					value={student.voxes_balance.toLocaleString('pt-BR')}
					label="Saldo de Voxxys"
					renderIcon={<VoxxysIcon className="w-5 h-5" />}
					color="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
				/>
				<StatCard
					value={statusLabel(student.subscription_status)}
					label="Status da assinatura"
					icon={CreditCard}
					color="bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
				/>
				<StatCard
					value={student.plan?.name ?? 'Sem plano'}
					label="Plano atual"
					icon={Layers}
					color="bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400"
				/>
				<StatCard
					value={student.is_test_unlimited ? 'Sim' : 'Não'}
					label="Teste ilimitado"
					icon={FlaskConical}
					color="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
				/>
			</div>

			{/* ---------------------------------------------------------- */}
			{/* Info sections                                              */}
			{/* ---------------------------------------------------------- */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
				{/* Conta */}
				<SectionCard title="Conta" icon={User}>
					<dl className="divide-y divide-slate-100 dark:divide-white/5">
						<InfoRow label="E-mail" icon={Mail} value={student.email} />
						<InfoRow
							label="Telefone"
							icon={Phone}
							value={student.phone ?? '—'}
						/>
						<InfoRow label="ID" icon={Hash} value={student.id} mono />
						<InfoRow
							label="Bloqueado"
							value={student.blocked ? 'Sim' : 'Não'}
						/>
						<InfoRow
							label="Teste ilimitado"
							value={student.is_test_unlimited ? 'Sim' : 'Não'}
						/>
					</dl>
				</SectionCard>

				{/* Plano & Assinatura */}
				<SectionCard title="Plano & Assinatura" icon={CreditCard}>
					{sub ? (
						<dl className="divide-y divide-slate-100 dark:divide-white/5">
							<InfoRow
								label="Plano"
								value={
									student.plan ? (
										<span className="flex flex-col items-end">
											<span>{student.plan.name}</span>
											<span className="text-xs font-mono text-slate-400 dark:text-gray-500">
												{student.plan.key}
											</span>
										</span>
									) : (
										'Sem plano'
									)
								}
							/>
							<InfoRow
								label="Status"
								value={
									<span
										className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(
											sub.status,
										)}`}
									>
										{statusLabel(sub.status)}
									</span>
								}
							/>
							<InfoRow label="Intervalo" value={sub.interval} />
							<InfoRow label="Preço" value={formatPrice(sub.price_cents)} />
							<InfoRow
								label="Início do período"
								value={formatDate(sub.current_period_start)}
							/>
							<InfoRow
								label="Fim do período"
								value={formatDate(sub.current_period_end)}
							/>
							<InfoRow
								label="Cancela no fim do período"
								value={sub.cancel_at_period_end ? 'Sim' : 'Não'}
							/>
							<InfoRow
								label="Vínculo"
								value={
									isManualSubscription(sub.stripe_subscription_id) ? (
										<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-gray-300">
											Manual / cortesia
										</span>
									) : (
										<span className="flex flex-col items-end">
											<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
												Stripe
											</span>
											<span className="text-xs font-mono text-slate-400 dark:text-gray-500 mt-0.5 break-all">
												{sub.stripe_subscription_id}
											</span>
										</span>
									)
								}
							/>
							<InfoRow label="Criado" value={formatDateTime(sub.created_at)} />
							<InfoRow
								label="Atualizado"
								value={formatDateTime(sub.updated_at)}
							/>
						</dl>
					) : (
						<p className="text-sm text-slate-500 dark:text-gray-500 py-2 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
							Sem assinatura.
						</p>
					)}
				</SectionCard>
			</div>

			{/* Voxxys */}
			<div className="mb-8">
				<SectionCard
					title="Voxxys"
					renderIcon={<VoxxysIcon className="w-4 h-4" />}
					tone="voxes"
				>
					<div className="flex flex-wrap items-end justify-between gap-4">
						<div className="flex items-baseline gap-2">
							<span className="font-mono text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
								{student.voxes_balance.toLocaleString('pt-BR')}
							</span>
							<span className="text-sm text-slate-500 dark:text-gray-400">
								Voxxys disponíveis
							</span>
						</div>
						<button
							type="button"
							onClick={() => setVoxesOpen(true)}
							aria-label={`Dar ou ajustar voxxys de ${displayName}`}
							className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
						>
							<Plus className="w-4 h-4" aria-hidden="true" />
							Dar voxxys
						</button>
					</div>
					<p className="text-xs text-slate-400 dark:text-gray-500 mt-3">
						O histórico de movimentações aparece em “Uso &amp; Atividade”
						abaixo.
					</p>
				</SectionCard>
			</div>

			{/* ---------------------------------------------------------- */}
			{/* Uso & Atividade                                            */}
			{/* ---------------------------------------------------------- */}
			<section aria-labelledby="atividade-heading" className="mb-8">
				<h2
					id="atividade-heading"
					className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400 mb-3"
				>
					<Activity className="w-4 h-4" aria-hidden="true" />
					Uso &amp; Atividade
				</h2>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<StreakCard student={student} />
					<CourseProgressCard student={student} />
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
					<ToolUsageCard
						items={activity?.tool_usage.items ?? []}
						total={activity?.tool_usage.total ?? 0}
						page={toolsPage}
						pageSize={TOOLS_PAGE_SIZE}
						onPage={setToolsPage}
						loading={activityFetching}
					/>
					<VoxxysLedgerCard
						items={activity?.voxxys_ledger.items ?? []}
						total={activity?.voxxys_ledger.total ?? 0}
						page={voxxysPage}
						pageSize={VOXXYS_PAGE_SIZE}
						onPage={setVoxxysPage}
						loading={activityFetching}
					/>
				</div>
			</section>

			{/* ---------------------------------------------------------- */}
			{/* Ações                                                      */}
			{/* ---------------------------------------------------------- */}
			<section aria-labelledby="acoes-heading" className="mb-4">
				<h2
					id="acoes-heading"
					className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400 mb-3"
				>
					Ações
				</h2>
				<div className="flex flex-wrap gap-3">
					<button
						type="button"
						onClick={() => setPlanOpen(true)}
						aria-label={`Alterar plano de ${displayName}`}
						className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
					>
						<ArrowUpDown className="w-4 h-4" aria-hidden="true" />
						Alterar plano
					</button>

					<button
						type="button"
						onClick={() => setVoxesOpen(true)}
						aria-label={`Dar ou ajustar voxxys de ${displayName}`}
						className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
					>
						<Plus className="w-4 h-4" aria-hidden="true" />
						Dar voxxys
					</button>

					{whatsappDigits && (
						<a
							href={`https://wa.me/${whatsappDigits}`}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`Falar com ${displayName} no WhatsApp`}
							className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:border-green-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
						>
							<MessageCircle className="w-4 h-4" aria-hidden="true" />
							WhatsApp
						</a>
					)}

					<button
						type="button"
						onClick={() => setCancelOpen(true)}
						aria-label={`Cancelar assinatura de ${displayName}`}
						className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:border-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
					>
						<XCircle className="w-4 h-4" aria-hidden="true" />
						Cancelar assinatura
					</button>

					<button
						type="button"
						onClick={() => setBlockOpen(true)}
						aria-label={`${student.blocked ? 'Desbloquear' : 'Bloquear'} ${displayName}`}
						className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
					>
						{student.blocked ? (
							<ShieldCheck className="w-4 h-4" aria-hidden="true" />
						) : (
							<ShieldOff className="w-4 h-4" aria-hidden="true" />
						)}
						{student.blocked ? 'Desbloquear' : 'Bloquear'}
					</button>

					<button
						type="button"
						onClick={() => setPasswordOpen(true)}
						aria-label={`Alterar senha de ${displayName}`}
						className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
					>
						<KeyRound className="w-4 h-4" aria-hidden="true" />
						Alterar senha
					</button>

					<button
						type="button"
						onClick={() =>
							setTestUnlimited.mutate({
								id: student.id,
								isTestUnlimited: !student.is_test_unlimited,
							})
						}
						disabled={setTestUnlimited.isPending}
						aria-pressed={student.is_test_unlimited}
						aria-label={
							student.is_test_unlimited
								? `Remover conta teste ilimitada de ${displayName}`
								: `Tornar ${displayName} conta teste ilimitada`
						}
						className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors disabled:opacity-60 ${
							student.is_test_unlimited
								? 'border-emerald-400 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
								: 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400'
						}`}
					>
						{setTestUnlimited.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
						) : (
							<FlaskConical className="w-4 h-4" aria-hidden="true" />
						)}
						{student.is_test_unlimited
							? 'Remover teste ilimitado'
							: 'Tornar teste ilimitado'}
					</button>

					<button
						type="button"
						onClick={() => setDeleteOpen(true)}
						aria-label={`Excluir ${displayName}`}
						className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors sm:ml-auto"
					>
						<Trash2 className="w-4 h-4" aria-hidden="true" />
						Excluir aluno
					</button>
				</div>
			</section>

			{/* ---------------------------------------------------------- */}
			{/* Modals (reuse the list-view modals; they self-wire to the */}
			{/* hooks and invalidate ['students'], which refreshes this    */}
			{/* detail query automatically)                                */}
			{/* ---------------------------------------------------------- */}
			{planOpen && (
				<ChangePlanModal student={student} onClose={() => setPlanOpen(false)} />
			)}
			{cancelOpen && (
				<CancelSubscriptionModal
					student={student}
					onClose={() => setCancelOpen(false)}
				/>
			)}
			{blockOpen && (
				<BlockCustomerModal
					student={student}
					onClose={() => setBlockOpen(false)}
				/>
			)}
			{passwordOpen && (
				<ChangePasswordModal
					student={student}
					onClose={() => setPasswordOpen(false)}
				/>
			)}
			{deleteOpen && (
				<DeleteCustomerModal
					student={student}
					onClose={() => setDeleteOpen(false)}
				/>
			)}
			{voxesOpen && (
				<GrantVoxesModal
					student={student}
					onClose={() => setVoxesOpen(false)}
				/>
			)}
		</>
	);
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function BlockedBadge({ blocked }: { blocked: boolean }) {
	if (blocked) {
		return (
			<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">
				<ShieldOff className="w-3 h-3" aria-hidden="true" />
				Bloqueado
			</span>
		);
	}
	return (
		<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400">
			<ShieldCheck className="w-3 h-3" aria-hidden="true" />
			Ativo
		</span>
	);
}

const SECTION_TONE = {
	plans:
		'from-white via-violet-50/40 to-fuchsia-50/30 dark:from-[#1a1a1d] dark:via-violet-950/20 dark:to-fuchsia-950/10',
	voxes:
		'from-white via-amber-50/40 to-orange-50/30 dark:from-[#1a1a1d] dark:via-amber-950/20 dark:to-orange-950/10',
	activity:
		'from-white via-sky-50/40 to-indigo-50/30 dark:from-[#1a1a1d] dark:via-sky-950/20 dark:to-indigo-950/10',
	tools:
		'from-white via-emerald-50/40 to-cyan-50/30 dark:from-[#1a1a1d] dark:via-emerald-950/20 dark:to-cyan-950/10',
} as const;

const SECTION_BLOB = {
	plans: 'bg-violet-500/15 dark:bg-violet-500/10',
	voxes: 'bg-amber-500/15 dark:bg-amber-500/10',
	activity: 'bg-sky-500/15 dark:bg-sky-500/10',
	tools: 'bg-emerald-500/15 dark:bg-emerald-500/10',
} as const;

function SectionCard({
	title,
	icon: Icon,
	renderIcon,
	tone = 'plans',
	children,
}: {
	title: string;
	icon?: typeof User;
	/** Ícone customizado (ex.: `<VoxxysIcon />`). Tem precedência sobre `icon`. */
	renderIcon?: ReactNode;
	tone?: keyof typeof SECTION_TONE;
	children: ReactNode;
}) {
	return (
		<section
			className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 p-5 h-full bg-gradient-to-br ${SECTION_TONE[tone]}`}
		>
			<div
				className={`pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl ${SECTION_BLOB[tone]}`}
			/>
			<div className="relative">
				<h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white mb-4">
					{renderIcon ??
						(Icon ? (
							<Icon className="w-4 h-4 text-violet-500" aria-hidden="true" />
						) : null)}
					{title}
				</h2>
				{children}
			</div>
		</section>
	);
}

function InfoRow({
	label,
	value,
	icon: Icon,
	mono,
}: {
	label: string;
	value: ReactNode;
	icon?: typeof User;
	mono?: boolean;
}) {
	return (
		<div className="flex items-start justify-between gap-4 py-2.5">
			<dt className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400 shrink-0">
				{Icon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
				{label}
			</dt>
			<dd
				className={`text-sm font-medium text-slate-900 dark:text-white text-right min-w-0 break-words ${
					mono ? 'font-mono text-xs break-all' : ''
				}`}
			>
				{value}
			</dd>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Uso & Atividade — sub-cards                                        */
/* ------------------------------------------------------------------ */

/** Mini-stat usado dentro dos cards de atividade. */
function MiniStat({
	icon: Icon,
	label,
	value,
	iconClass,
}: {
	icon: typeof User;
	label: string;
	value: ReactNode;
	iconClass: string;
}) {
	return (
		<div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2.5">
			<div
				className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}
			>
				<Icon className="w-4 h-4" aria-hidden="true" />
			</div>
			<div className="min-w-0">
				<p className="text-xs text-slate-500 dark:text-gray-400">{label}</p>
				<p className="text-sm font-bold text-slate-900 dark:text-white truncate">
					{value}
				</p>
			</div>
		</div>
	);
}

function StreakCard({ student }: { student: StudentDetail }) {
	const streak = student.streak;
	return (
		<SectionCard title="Ofensiva" icon={Flame} tone="activity">
			{streak ? (
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<MiniStat
						icon={Flame}
						label="Ofensiva atual"
						value={`${streak.current_streak.toLocaleString('pt-BR')} dia(s)`}
						iconClass="bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400"
					/>
					<MiniStat
						icon={Trophy}
						label="Recorde"
						value={`${streak.longest_streak.toLocaleString('pt-BR')} dia(s)`}
						iconClass="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
					/>
					<MiniStat
						icon={CalendarClock}
						label="Último acesso"
						value={formatDateOnly(streak.last_seen_date)}
						iconClass="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
					/>
				</div>
			) : (
				<p className="text-sm text-slate-500 dark:text-gray-500 py-2 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
					Sem atividade registrada.
				</p>
			)}
		</SectionCard>
	);
}

/* --- Progresso do curso ------------------------------------------- */

interface CourseProgressResult {
	total: number;
	watched: number;
}

/** Conta as lições de um curso (todos os módulos) — total do denominador. */
async function countCourseLessons(slug: string): Promise<string[]> {
	const modules = await listCourseModules(slug);
	const lessonsPerModule = await Promise.all(
		modules.map((m) => listModuleLessons(m.id)),
	);
	return lessonsPerModule.flat().map((l) => l.id);
}

function CourseProgressCard({ student }: { student: StudentDetail }) {
	const { data: courses } = useCourses();

	/* Curso do plano do aluno: aquele cujos `plans` contêm o plano atual. */
	const course = useMemo(() => {
		const planId = student.plan?.id;
		if (!planId || !courses) return undefined;
		return courses.find((c) => c.plans.some((p) => p.plan.id === planId));
	}, [courses, student.plan?.id]);

	const courseId = course?.id ?? '';
	const courseSlug = course?.slug ?? '';

	const { data, isLoading } = useQuery<CourseProgressResult>({
		queryKey: ['student-course-progress', student.id, courseId],
		enabled: !!courseId && !!courseSlug,
		queryFn: async () => {
			const [lessonIds, progress] = await Promise.all([
				countCourseLessons(courseSlug),
				getCourseProgress(courseId, student.id),
			]);
			const totalSet = new Set(lessonIds);
			const watched = progress.watchedLessonIds.filter((id) =>
				totalSet.has(id),
			).length;
			return { total: totalSet.size, watched };
		},
		staleTime: 60_000,
	});

	return (
		<SectionCard title="Progresso do curso" icon={Layers} tone="activity">
			{!course ? (
				<p className="text-sm text-slate-500 dark:text-gray-500 py-2 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-lg">
					O aluno não tem um curso associado ao plano.
				</p>
			) : isLoading || !data ? (
				<div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 py-2">
					<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
					Calculando progresso…
				</div>
			) : (
				<div>
					<div className="flex items-baseline justify-between gap-2 mb-1">
						<span className="text-sm font-medium text-slate-700 dark:text-gray-300">
							{course.title}
						</span>
						<span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
							{data.total === 0
								? '0%'
								: `${Math.round((data.watched / data.total) * 100)}%`}
						</span>
					</div>
					<div
						className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden"
						role="progressbar"
						aria-valuenow={data.watched}
						aria-valuemin={0}
						aria-valuemax={data.total}
						aria-label={`Progresso em ${course.title}`}
					>
						<div
							className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-500"
							style={{
								width:
									data.total === 0
										? '0%'
										: `${(data.watched / data.total) * 100}%`,
							}}
						/>
					</div>
					<p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
						<span className="font-semibold text-slate-700 dark:text-gray-300">
							{data.watched.toLocaleString('pt-BR')}
						</span>{' '}
						de{' '}
						<span className="font-semibold text-slate-700 dark:text-gray-300">
							{data.total.toLocaleString('pt-BR')}
						</span>{' '}
						aula(s) assistida(s)
					</p>
				</div>
			)}
		</SectionCard>
	);
}

/* --- Uso de ferramentas ------------------------------------------- */

function ToolUsageCard({
	items,
	total,
	page,
	pageSize,
	onPage,
	loading,
}: {
	items: ToolUsageItem[];
	total: number;
	page: number;
	pageSize: number;
	onPage: (p: number) => void;
	loading: boolean;
}) {
	return (
		<SectionCard title="Uso de ferramentas" icon={Wrench} tone="tools">
			{items.length === 0 ? (
				<EmptyState
					icon={Wrench}
					title="Nenhum uso registrado"
					description="As ferramentas usadas pelo aluno aparecem aqui."
				/>
			) : (
				<>
					<ul
						className={`divide-y divide-slate-100 dark:divide-white/5 transition-opacity ${
							loading ? 'opacity-60' : ''
						}`}
					>
						{items.map((it) => (
							<li
								key={it.id}
								className="flex items-center justify-between gap-3 py-2.5"
							>
								<div className="min-w-0">
									<p className="text-sm font-medium text-slate-900 dark:text-white truncate">
										{toolLabel(it.tool_key)}
									</p>
									<p className="text-xs text-slate-500 dark:text-gray-500">
										{formatDateTime(it.created_at)}
									</p>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
										<VoxxysIcon className="w-3 h-3" />
										{formatVox(it.voxes_spent)}
									</span>
									<span
										className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${toolStatusColor(
											it.status,
										)}`}
									>
										{it.status}
									</span>
								</div>
							</li>
						))}
					</ul>
					<ActivityPagination
						page={page}
						pageSize={pageSize}
						total={total}
						onPage={onPage}
						label="Paginação do uso de ferramentas"
					/>
				</>
			)}
		</SectionCard>
	);
}

/* --- Histórico de voxxys ------------------------------------------ */

function VoxxysLedgerCard({
	items,
	total,
	page,
	pageSize,
	onPage,
	loading,
}: {
	items: VoxxysLedgerItem[];
	total: number;
	page: number;
	pageSize: number;
	onPage: (p: number) => void;
	loading: boolean;
}) {
	return (
		<SectionCard
			title="Histórico de voxxys"
			renderIcon={<VoxxysIcon className="w-4 h-4" />}
			tone="voxes"
		>
			{items.length === 0 ? (
				<EmptyState
					icon={Wrench}
					title="Sem movimentações"
					description="Compras, usos e ajustes de voxxys aparecem aqui."
				/>
			) : (
				<>
					<ul
						className={`divide-y divide-slate-100 dark:divide-white/5 transition-opacity ${
							loading ? 'opacity-60' : ''
						}`}
					>
						{items.map((it) => {
							const positive = it.delta >= 0;
							return (
								<li
									key={it.id}
									className="flex items-center justify-between gap-3 py-2.5"
								>
									<div className="min-w-0">
										<p className="text-sm font-medium text-slate-900 dark:text-white">
											{ledgerReasonLabel(it.reason)}
										</p>
										<p className="text-xs text-slate-500 dark:text-gray-500">
											{formatDateTime(it.created_at)}
										</p>
									</div>
									<span
										className={`font-mono text-sm font-semibold tabular-nums shrink-0 ${
											positive
												? 'text-green-600 dark:text-green-400'
												: 'text-red-600 dark:text-red-400'
										}`}
									>
										{positive ? '+' : '−'}
										{formatVox(Math.abs(it.delta))}
									</span>
								</li>
							);
						})}
					</ul>
					<ActivityPagination
						page={page}
						pageSize={pageSize}
						total={total}
						onPage={onPage}
						label="Paginação do histórico de voxxys"
					/>
				</>
			)}
		</SectionCard>
	);
}

/* --- Paginação compartilhada (Anterior / Próximo) ----------------- */

function ActivityPagination({
	page,
	pageSize,
	total,
	onPage,
	label,
}: {
	page: number;
	pageSize: number;
	total: number;
	onPage: (p: number) => void;
	label: string;
}) {
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	if (totalPages <= 1) return null;
	return (
		<nav
			aria-label={label}
			className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/5"
		>
			<button
				type="button"
				disabled={page <= 1}
				onClick={() => onPage(page - 1)}
				className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-400 transition-colors"
			>
				Anterior
			</button>
			<span
				aria-current="page"
				className="text-xs text-slate-500 dark:text-gray-400 tabular-nums"
			>
				Página {page} de {totalPages}
			</span>
			<button
				type="button"
				disabled={page >= totalPages}
				onClick={() => onPage(page + 1)}
				className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-400 transition-colors"
			>
				Próximo
			</button>
		</nav>
	);
}

/* ------------------------------------------------------------------ */
/*  Dar / ajustar voxxys (modal)                                       */
/* ------------------------------------------------------------------ */

function GrantVoxesModal({
	student,
	onClose,
}: {
	student: StudentDetail;
	onClose: () => void;
}) {
	const [raw, setRaw] = useState('');
	const [note, setNote] = useState('');
	const grant = useGrantStudentVoxes();

	/* Aceita "+10", "-5", "2,5" → número assinado (≠ 0 valida o submit). */
	const delta = useMemo(() => {
		const n = Number.parseFloat(raw.replace(',', '.'));
		return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
	}, [raw]);

	const canSubmit = !grant.isPending && delta !== 0;
	const newBalance = student.voxes_balance + delta;

	function submit() {
		if (!canSubmit) return;
		grant.mutate(
			{ id: student.id, delta, note: note.trim() || undefined },
			{ onSuccess: onClose },
		);
	}

	return (
		<ModalOverlay onClose={onClose} tone="plans">
			<div className="p-6 space-y-4">
				<h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
					<VoxxysIcon className="w-5 h-5" />
					Dar / ajustar voxxys
				</h3>
				<p className="text-sm text-slate-500 dark:text-gray-400">
					Saldo atual de{' '}
					<span className="font-semibold text-slate-700 dark:text-gray-200">
						{student.name ?? student.email}
					</span>
					:{' '}
					<span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
						{student.voxes_balance.toLocaleString('pt-BR')}
					</span>
				</p>

				<label className="block">
					<span className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">
						Quantidade (use - para remover)
					</span>
					<input
						type="number"
						step="any"
						inputMode="decimal"
						value={raw}
						onChange={(e) => setRaw(e.target.value)}
						placeholder="Ex.: 50 ou -10"
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white font-mono"
					/>
				</label>

				<label className="block">
					<span className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">
						Nota (opcional)
					</span>
					<textarea
						value={note}
						onChange={(e) => setNote(e.target.value)}
						rows={2}
						placeholder="Motivo do ajuste"
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
					/>
				</label>

				{delta !== 0 && (
					<p className="text-xs text-slate-500 dark:text-gray-400">
						Novo saldo:{' '}
						<span
							className={`font-mono font-semibold ${
								newBalance < 0
									? 'text-red-600 dark:text-red-400'
									: 'text-amber-600 dark:text-amber-400'
							}`}
						>
							{newBalance.toLocaleString('pt-BR')}
						</span>
						{newBalance < 0 && ' (ficará negativo)'}
					</p>
				)}

				<div className="flex gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white"
					>
						Cancelar
					</button>
					<button
						type="button"
						disabled={!canSubmit}
						onClick={submit}
						className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-60"
					>
						{grant.isPending && (
							<Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
						)}
						{delta < 0 ? 'Remover voxxys' : 'Adicionar voxxys'}
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}
