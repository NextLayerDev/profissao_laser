'use client';

import { useQuery } from '@tanstack/react-query';
import {
	BadgeCheck,
	Check,
	Gift,
	Loader2,
	Lock,
	RefreshCw,
	ShieldCheck,
	Sparkles,
	XCircle,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PlanAuthForm } from '@/components/checkout/plan-auth-form';
import { usePlanLinkPublic, useRedeemPlanLink } from '@/hooks/use-plan-links';
import { isValidCpf, maskCpf } from '@/lib/cpf';
import { getCoursesMe } from '@/services/courses-auth';
import type { PublicPlanLinkPlan } from '@/types/plan-link';
import { PLAN_TAGLINES } from '@/utils/constants/plans-content';

function fmtBRL(cents: number): string {
	return (cents / 100).toLocaleString('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	});
}

const TRUST = [
	{ Icon: Lock, label: 'Pagamento seguro via Stripe' },
	{ Icon: ShieldCheck, label: '7 dias de garantia' },
	{ Icon: RefreshCw, label: 'Cancele quando quiser' },
];

const UNAVAILABLE_COPY: Record<string, { title: string; detail: string }> = {
	disabled: {
		title: 'Link desativado',
		detail: 'Este link especial foi desativado. Fale com quem te enviou.',
	},
	expired: {
		title: 'Link expirado',
		detail: 'O prazo deste link especial acabou.',
	},
	exhausted: {
		title: 'Link esgotado',
		detail: 'Todas as vagas deste link especial já foram usadas.',
	},
	notfound: {
		title: 'Link inválido',
		detail: 'Este link não existe ou foi removido.',
	},
};

function redeemErrorMessage(err: unknown): string {
	const message =
		typeof err === 'object' &&
		err !== null &&
		'response' in err &&
		typeof (err as { response?: { data?: { message?: string } } }).response
			?.data?.message === 'string'
			? (err as { response: { data: { message: string } } }).response.data
					.message
			: '';
	if (
		message.includes('cpf_already_redeemed') ||
		message.includes('cpf_in_use')
	)
		return 'Este CPF já utilizou um link especial. O desconto vale uma única vez por pessoa.';
	if (message.includes('invalid_cpf'))
		return 'CPF inválido. Confira os números.';
	if (message.includes('no_discount_available'))
		return 'Este plano está sem desconto disponível no momento.';
	if (message.includes('plan_link_'))
		return 'Este link não está mais disponível.';
	return 'Erro ao iniciar o pagamento. Tente novamente.';
}

export default function PlanLinkPage() {
	const params = useParams<{ token: string }>();
	const token = params.token;

	const { data, isLoading, isError } = usePlanLinkPublic(token);
	const redeem = useRedeemPlanLink(token);

	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [cpf, setCpf] = useState('');
	const [cpfTouched, setCpfTouched] = useState(false);

	// Auth igual ao checkout de plano: /v1/me na upvox valida o token salvo.
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const meQuery = useQuery({
		queryKey: ['courses-me'],
		queryFn: getCoursesMe,
		enabled: mounted,
		retry: false,
		staleTime: 60_000,
	});
	const authed = meQuery.isSuccess;
	const checkingAuth = !mounted || meQuery.isLoading;

	const eligiblePlans = data?.plans.filter((p) => p.eligible) ?? [];
	const selected =
		eligiblePlans.find((p) => p.key === selectedKey) ??
		eligiblePlans[0] ??
		null;
	const cpfOk = isValidCpf(cpf);

	function startRedeem() {
		if (!selected) return;
		if (!cpfOk) {
			setCpfTouched(true);
			toast.error('Informe um CPF válido para continuar.');
			return;
		}
		redeem.mutate(
			{ cpf, plan_key: selected.key },
			{
				onSuccess: ({ checkout_url }) => {
					window.location.href = checkout_url;
				},
				onError: (err) => toast.error(redeemErrorMessage(err)),
			},
		);
	}

	const unavailable =
		isError || !data
			? isLoading
				? null
				: UNAVAILABLE_COPY.notfound
			: data.status !== 'ok'
				? UNAVAILABLE_COPY[data.status]
				: null;

	return (
		<div className="relative min-h-screen overflow-hidden bg-ink-950 text-white antialiased">
			{/* Background atmosférico (mesmo do checkout) */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-[10%] left-[8%] w-[460px] h-[460px] rounded-full bg-violet-800/20 blur-3xl" />
				<div className="absolute bottom-0 right-[4%] w-[380px] h-[380px] rounded-full bg-indigo-900/20 blur-3xl" />
				<div className="absolute inset-0 bg-grid opacity-[0.04] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
			</div>

			<header className="relative border-b border-white/[0.06]">
				<div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
					<span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300">
						<Sparkles className="w-4 h-4" />
						Convite especial
					</span>
					<div className="flex items-center gap-2 text-sm text-gray-300">
						<Lock className="w-4 h-4 text-violet-400" />
						Checkout 100% seguro
					</div>
				</div>
			</header>

			<main className="relative max-w-5xl mx-auto px-6 py-10 md:py-14">
				{isLoading ? (
					<div className="flex items-center justify-center min-h-[50vh]">
						<Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
					</div>
				) : unavailable ? (
					<div className="text-center min-h-[50vh] flex flex-col items-center justify-center">
						<XCircle className="w-12 h-12 text-red-400/70 mb-4" />
						<p className="text-gray-200 text-xl font-bold mb-2">
							{unavailable.title}
						</p>
						<p className="text-gray-500 text-sm">{unavailable.detail}</p>
					</div>
				) : (
					<>
						<div className="text-center mb-9">
							<h1 className="font-display text-2xl md:text-[2rem] font-black leading-tight">
								Seu <span className="grad-brand">1º mês a preço de custo</span>
							</h1>
							<p className="text-gray-400 text-sm mt-2">
								Você recebeu um link especial: escolha o plano, pague quase nada
								no primeiro mês e depois siga no valor normal.
							</p>
							{data && data.vox_grant > 0 && (
								<div className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-300">
									<Gift className="w-4 h-4" />
									Você ganha {data.vox_grant.toLocaleString('pt-BR')} voxxys ao
									assinar
								</div>
							)}
						</div>

						{/* Planos */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-9">
							{(data?.plans ?? []).map((plan) => (
								<PlanCard
									key={plan.key}
									plan={plan}
									selected={selected?.key === plan.key}
									onSelect={() => plan.eligible && setSelectedKey(plan.key)}
								/>
							))}
						</div>

						{/* Ação */}
						<div className="max-w-lg mx-auto space-y-5">
							{redeem.isPending ? (
								<div className="card-dark rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center min-h-[200px]">
									<Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
									<p className="text-gray-300 text-sm font-medium">
										Redirecionando para o pagamento seguro...
									</p>
								</div>
							) : checkingAuth ? (
								<div className="card-dark rounded-2xl border border-white/10 p-6 flex items-center justify-center min-h-[200px]">
									<Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
								</div>
							) : !authed ? (
								<>
									<p className="text-center text-sm text-gray-400">
										Crie sua conta (ou entre) para continuar.
									</p>
									<PlanAuthForm onAuthenticated={() => meQuery.refetch()} />
								</>
							) : (
								<div className="card-dark rounded-2xl border border-white/10 p-6">
									<h3 className="font-display text-lg font-bold text-white mb-1 flex items-center gap-2">
										<BadgeCheck className="w-5 h-5 text-emerald-400" />
										Quase lá!
									</h3>
									<p className="text-sm text-gray-400 mb-5">
										Plano{' '}
										<span className="text-white font-semibold">
											{selected?.name ?? '—'}
										</span>
										{selected && (
											<>
												{' '}
												· 1º mês por{' '}
												<span className="text-emerald-400 font-semibold">
													{fmtBRL(selected.first_month_cents)}
												</span>
											</>
										)}
									</p>

									<label
										htmlFor="plan-link-cpf"
										className="block text-sm font-medium text-gray-300 mb-1.5"
									>
										Seu CPF
									</label>
									<input
										id="plan-link-cpf"
										inputMode="numeric"
										autoComplete="off"
										value={cpf}
										onChange={(e) => setCpf(maskCpf(e.target.value))}
										onBlur={() => setCpfTouched(true)}
										placeholder="000.000.000-00"
										className={`w-full bg-ink-950 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none transition-colors ${
											cpfTouched && !cpfOk
												? 'border-red-500/60'
												: 'border-white/10 focus:border-violet-500/60'
										}`}
									/>
									{cpfTouched && !cpfOk && (
										<p className="text-xs text-red-400 mt-1.5">
											CPF inválido. Confira os números.
										</p>
									)}
									<p className="text-xs text-gray-500 mt-1.5">
										O desconto é limitado a um uso por CPF.
									</p>

									<button
										type="button"
										onClick={startRedeem}
										disabled={!selected || !cpfOk}
										className="btn-accent w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl shadow-brand cursor-pointer mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Assinar com desconto
									</button>
								</div>
							)}

							<div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
								{TRUST.map(({ Icon, label }) => (
									<span
										key={label}
										className="inline-flex items-center gap-1.5 text-xs text-gray-400"
									>
										<Icon className="w-3.5 h-3.5 text-violet-400" />
										{label}
									</span>
								))}
							</div>
						</div>
					</>
				)}
			</main>
		</div>
	);
}

function PlanCard({
	plan,
	selected,
	onSelect,
}: {
	plan: PublicPlanLinkPlan;
	selected: boolean;
	onSelect: () => void;
}) {
	const tagline = PLAN_TAGLINES[plan.key] ?? plan.description ?? '';

	return (
		<button
			type="button"
			onClick={onSelect}
			disabled={!plan.eligible}
			className={`relative text-left card-dark rounded-2xl border p-5 transition-all ${
				selected
					? 'border-violet-500/70 ring-2 ring-violet-500/30'
					: plan.eligible
						? 'border-white/10 hover:border-violet-500/40 cursor-pointer'
						: 'border-white/5 opacity-60 cursor-not-allowed'
			}`}
		>
			{selected && (
				<span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-violet-500 grid place-items-center">
					<Check className="w-3.5 h-3.5 text-white" />
				</span>
			)}
			<p className="font-display text-lg font-extrabold">{plan.name}</p>
			{tagline && <p className="text-xs text-gray-500 mt-0.5">{tagline}</p>}

			<div className="mt-4">
				{plan.eligible ? (
					<>
						<p className="text-xs text-gray-500 line-through tabular-nums">
							{fmtBRL(plan.price_monthly_cents)}
						</p>
						<p className="text-2xl font-black tabular-nums text-emerald-400">
							{fmtBRL(plan.first_month_cents)}
							<span className="text-xs font-semibold text-emerald-500/70">
								{' '}
								no 1º mês
							</span>
						</p>
						<p className="text-[11px] text-gray-500 mt-1">
							depois {fmtBRL(plan.price_monthly_cents)}/mês
						</p>
					</>
				) : (
					<>
						<p className="text-2xl font-black tabular-nums text-white">
							{fmtBRL(plan.price_monthly_cents)}
							<span className="text-xs font-semibold text-gray-500">/mês</span>
						</p>
						<p className="text-[11px] text-gray-500 mt-1">
							sem desconto disponível
						</p>
					</>
				)}
			</div>
		</button>
	);
}
