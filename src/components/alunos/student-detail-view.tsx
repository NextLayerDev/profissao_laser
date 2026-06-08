'use client';

import {
	ArrowUpDown,
	CreditCard,
	FlaskConical,
	Hash,
	KeyRound,
	Layers,
	Loader2,
	Mail,
	Phone,
	ShieldCheck,
	ShieldOff,
	Sparkles,
	Trash2,
	User,
	XCircle,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { useSetStudentTestUnlimited } from '@/hooks/use-students';
import type { StudentDetail } from '@/services/students';
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

	const setTestUnlimited = useSetStudentTestUnlimited();

	const displayName = student.name ?? 'Sem nome';
	const sub = student.subscription;

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
			</header>

			{/* ---------------------------------------------------------- */}
			{/* Stat row                                                   */}
			{/* ---------------------------------------------------------- */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<StatCard
					value={student.voxes_balance.toLocaleString('pt-BR')}
					label="Saldo de Voxxys"
					icon={Sparkles}
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
				<SectionCard title="Voxxys" icon={Sparkles} tone="voxes">
					<div className="flex items-baseline gap-2">
						<span className="font-mono text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
							{student.voxes_balance.toLocaleString('pt-BR')}
						</span>
						<span className="text-sm text-slate-500 dark:text-gray-400">
							Voxxys disponíveis
						</span>
					</div>
					<p className="text-xs text-slate-400 dark:text-gray-500 mt-3">
						O histórico de consumo e os entitlements detalhados serão
						adicionados futuramente.
					</p>
				</SectionCard>
			</div>

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
} as const;

const SECTION_BLOB = {
	plans: 'bg-violet-500/15 dark:bg-violet-500/10',
	voxes: 'bg-amber-500/15 dark:bg-amber-500/10',
} as const;

function SectionCard({
	title,
	icon: Icon,
	tone = 'plans',
	children,
}: {
	title: string;
	icon: typeof User;
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
					<Icon className="w-4 h-4 text-violet-500" aria-hidden="true" />
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
