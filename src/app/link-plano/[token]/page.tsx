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
import { motion } from 'motion/react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PlanAuthForm } from '@/components/checkout/plan-auth-form';
import { usePlanLinkPublic, useRedeemPlanLink } from '@/hooks/use-plan-links';
import { isValidCpf, maskCpf } from '@/lib/cpf';
import { getCoursesMe } from '@/services/courses-auth';
import type { PublicPlanLinkPlan } from '@/types/plan-link';
import { PLAN_FEATURES, PLAN_TAGLINES } from '@/utils/constants/plans-content';

// ─── Cores por plano — MESMO design da pricing da landing (/) ────────────────

interface PlanAccent {
	name: string;
	iconText: string;
	iconBg: string;
	glow: string;
	cta: string;
}

const ACCENTS: Record<string, PlanAccent> = {
	basic: {
		name: 'text-emerald-300',
		iconText: 'text-emerald-400',
		iconBg: 'bg-emerald-500/15',
		glow: 'from-emerald-500/20',
		cta: 'bg-white/[0.04] text-white border border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50',
	},
	pro: {
		name: 'text-sky-300',
		iconText: 'text-sky-400',
		iconBg: 'bg-sky-500/15',
		glow: 'from-sky-500/20',
		cta: 'bg-white/[0.04] text-white border border-sky-500/30 hover:bg-sky-500/10 hover:border-sky-500/50',
	},
	avan: {
		name: 'text-violet-200',
		iconText: 'text-violet-200',
		iconBg: 'bg-violet-400/25',
		glow: 'from-violet-500/25',
		cta: 'btn-accent text-white shadow-brand',
	},
	max: {
		name: 'text-amber-300',
		iconText: 'text-amber-400',
		iconBg: 'bg-amber-500/15',
		glow: 'from-amber-500/20',
		cta: 'bg-white/[0.04] text-white border border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50',
	},
};
const accentFor = (key: string): PlanAccent => ACCENTS[key] ?? ACCENTS.avan;

// Mesmo destaque da landing (use-landing-plans): avan = MAIS ESCOLHIDO.
const FEATURED_KEY = 'avan';

function fmt(cents: number): string {
	return (cents / 100).toFixed(2).replace('.', ',');
}

function splitCents(cents: number): { int: number; cents: string } {
	const v = cents / 100;
	const int = Math.floor(v);
	return {
		int,
		cents: Math.round((v - int) * 100)
			.toString()
			.padStart(2, '0'),
	};
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
		message.includes('cpf_in_use') ||
		message.includes('customer_already_redeemed')
	)
		return 'Este CPF (ou sua conta) já utilizou um link especial. O desconto vale uma única vez por pessoa.';
	if (message.includes('invalid_cpf'))
		return 'CPF inválido. Confira os números.';
	if (message.includes('no_discount_available'))
		return 'Este plano está sem desconto disponível no momento.';
	if (message.includes('plan_link_'))
		return 'Este link não está mais disponível.';
	return 'Erro ao iniciar o pagamento. Tente novamente.';
}

// ─── Banner do produto (mesma imagem da compra real) ──────────────────────────

function PlanBanner() {
	return (
		<div className="relative h-24 rounded-xl overflow-hidden mb-4 border border-white/10">
			<Image
				src="/img/plataforma-desktop.png"
				alt="Plataforma Comunidade Profissão Laser"
				fill
				sizes="(max-width: 1024px) 100vw, 320px"
				className="object-cover object-left-top"
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-violet-900/30" />
			<div className="absolute inset-0 flex items-center gap-2.5 px-3">
				<div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-ink-950 shrink-0">
					<Image
						src="/img/logo-profissao-laser.png"
						alt="Profissão Laser"
						fill
						sizes="36px"
						className="object-contain p-0.5"
					/>
				</div>
				<div className="leading-tight">
					<p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-violet-200/90">
						Comunidade
					</p>
					<p className="font-display text-white text-sm font-extrabold">
						Profissão Laser
					</p>
				</div>
			</div>
		</div>
	);
}

// ─── Card de plano (mesmo desenho da landing + preço do 1º mês) ───────────────

function PlanCard({
	plan,
	selected,
	onSelect,
	hero = false,
}: {
	plan: PublicPlanLinkPlan;
	selected: boolean;
	onSelect: () => void;
	/** Card único (link anual): sempre em destaque. */
	hero?: boolean;
}) {
	const a = accentFor(plan.key);
	const features = PLAN_FEATURES[plan.key] ?? [];
	const tagline = PLAN_TAGLINES[plan.key] ?? plan.description ?? '';
	const featured = hero || plan.key === FEATURED_KEY;
	// Campos genéricos (interval/price_cents) com fallback nos legados (API antiga).
	const yearly = plan.interval === 'yearly';
	const per = yearly ? '/ano' : '/mês';
	const priceCents = plan.price_cents ?? plan.price_monthly_cents ?? 0;
	const firstCents =
		plan.first_period_cents ?? plan.first_month_cents ?? priceCents;
	const promo = plan.eligible ? splitCents(firstCents) : null;

	return (
		<motion.div
			animate={{ y: featured ? -8 : 0 }}
			whileHover={{ y: featured ? -14 : -6 }}
			transition={{ type: 'spring', stiffness: 260, damping: 20 }}
			className={`tile-hairline relative w-full h-full rounded-2xl border p-6 flex flex-col ${
				featured ? 'border-violet-500/50 aura' : 'card-dark shine'
			} ${selected ? 'ring-2 ring-violet-400/70' : ''} ${
				plan.eligible ? '' : 'opacity-70'
			}`}
			style={
				featured
					? {
							background:
								'linear-gradient(180deg, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0.06) 60%, #15121f 100%)',
						}
					: {}
			}
		>
			{/* glow colorido no topo (cor do plano) */}
			<div
				className={`pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b ${a.glow} to-transparent`}
			/>

			{featured && (
				<div className="btn-accent absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-white text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-1 rounded-full shadow-brand whitespace-nowrap">
					{hero ? 'PLANO ANUAL' : 'MAIS ESCOLHIDO'}
				</div>
			)}

			{selected && (
				<span className="absolute top-3 right-3 z-20 w-6 h-6 rounded-full bg-violet-500 grid place-items-center shadow-brand">
					<Check className="w-3.5 h-3.5 text-white" />
				</span>
			)}

			<div className="relative pt-2">
				<PlanBanner />

				<div className="text-center">
					<h3
						className={`font-display text-xl font-bold tracking-tight ${a.name}`}
					>
						{plan.name}
					</h3>
					<p className="text-slate-400 text-[13px] mt-1 min-h-[1.5rem]">
						{tagline}
					</p>
				</div>
			</div>

			<div className="relative text-center my-5">
				{promo ? (
					<>
						<div className="text-slate-500 text-sm line-through tabular-nums">
							R$ {fmt(priceCents)}
							{per}
						</div>
						<div className="flex items-baseline justify-center gap-1 mt-1">
							<span className="text-slate-400 text-base font-bold mr-1">
								R$
							</span>
							<span className="font-display text-white text-5xl font-black tracking-tight tabular-nums">
								{promo.int}
							</span>
							<span className="text-slate-400 text-sm font-bold">
								,{promo.cents}
							</span>
						</div>
						<div className="text-emerald-400 text-xs mt-1 font-bold uppercase tracking-wider">
							{yearly ? 'no 1º ano' : 'no 1º mês'}
						</div>
						<div className="text-slate-500 text-xs mt-1 font-mono">
							depois R$ {fmt(priceCents)}
							{per}
							{yearly && (
								<> · equivale a R$ {fmt(Math.round(priceCents / 12))}/mês</>
							)}
						</div>
					</>
				) : (
					<>
						<div className="flex items-baseline justify-center gap-1">
							<span className="text-slate-400 text-base font-bold mr-1">
								R$
							</span>
							<span className="font-display text-white text-5xl font-black tracking-tight tabular-nums">
								{splitCents(priceCents).int}
							</span>
							<span className="text-slate-400 text-sm font-bold">
								,{splitCents(priceCents).cents}
								{per}
							</span>
						</div>
						<div className="text-slate-500 text-xs mt-2 font-mono">
							sem desconto disponível
						</div>
					</>
				)}
			</div>

			<div className="relative border-t border-white/10 pt-5 mb-5 flex-1">
				<ul className="space-y-2.5">
					{features.map((line) => (
						<li key={line} className="flex items-start gap-2.5">
							<div
								className={`w-4 h-4 rounded-full mt-0.5 grid place-items-center shrink-0 ${a.iconBg}`}
							>
								<Check className={`w-2.5 h-2.5 ${a.iconText}`} />
							</div>
							<span className="text-slate-200 text-[13.5px] leading-snug">
								{line}
							</span>
						</li>
					))}
				</ul>
			</div>

			<button
				type="button"
				onClick={onSelect}
				disabled={!plan.eligible}
				className={`relative w-full font-bold uppercase tracking-wider text-[13px] py-3.5 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
					selected ? 'btn-accent text-white shadow-brand' : a.cta
				}`}
			>
				{selected ? 'Plano selecionado' : 'Quero este plano'}
			</button>
		</motion.div>
	);
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function PlanLinkPage() {
	const params = useParams<{ token: string }>();
	const token = params.token;

	const { data, isLoading, isError } = usePlanLinkPublic(token);
	const redeem = useRedeemPlanLink(token);

	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const [cpf, setCpf] = useState('');
	const [cpfTouched, setCpfTouched] = useState(false);
	const [showAuthForm, setShowAuthForm] = useState(false);
	const actionRef = useRef<HTMLDivElement>(null);

	// Auth igual ao checkout de plano: /v1/me na upvox valida o token salvo.
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const meQuery = useQuery({
		queryKey: ['courses-me', token],
		queryFn: getCoursesMe,
		enabled: mounted,
		retry: false,
		staleTime: 60_000,
	});
	const authed = meQuery.isSuccess;
	const checkingAuth = !mounted || meQuery.isLoading;

	// Link anual: plano único travado pelo admin; redeem dispensa plan_key.
	const isAnnual = data?.kind === 'annual_fixed';

	const eligiblePlans = data?.plans.filter((p) => p.eligible) ?? [];
	const selected =
		eligiblePlans.find((p) => p.key === selectedKey) ??
		eligiblePlans.find((p) => p.key === FEATURED_KEY) ??
		eligiblePlans[0] ??
		null;
	const cpfOk = isValidCpf(cpf);

	function selectPlan(key: string) {
		setSelectedKey(key);
		actionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	function handleSwitchAccount() {
		localStorage.removeItem('pl_customer_token');
		localStorage.removeItem('pl_refresh_token');
		setShowAuthForm(true);
	}

	function startRedeem() {
		if (!selected) return;
		if (!cpfOk) {
			setCpfTouched(true);
			toast.error('Informe um CPF válido para continuar.');
			return;
		}
		redeem.mutate(isAnnual ? { cpf } : { cpf, plan_key: selected.key }, {
			onSuccess: ({ checkout_url }) => {
				window.location.href = checkout_url;
			},
			onError: (err) => toast.error(redeemErrorMessage(err)),
		});
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
			{/* Background atmosférico (mesmo da landing/checkout) */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-[10%] left-[8%] w-[460px] h-[460px] rounded-full bg-violet-800/20 blur-3xl" />
				<div className="absolute bottom-0 right-[4%] w-[380px] h-[380px] rounded-full bg-indigo-900/20 blur-3xl" />
				<div className="absolute inset-0 bg-grid opacity-[0.04] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
			</div>

			<header className="relative border-b border-white/[0.06]">
				<div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
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

			<main className="relative max-w-[1600px] mx-auto px-5 md:px-8 py-12 md:py-16">
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
						<div className="text-center mb-8">
							<h2 className="font-display text-3xl md:text-[2.5rem] font-black text-white tracking-tight">
								Seu{' '}
								<span className="grad-brand">
									{isAnnual
										? '1º ano a preço de custo'
										: '1º mês a preço de custo'}
								</span>
							</h2>
							<p className="text-gray-400 text-sm mt-3 max-w-xl mx-auto">
								{isAnnual
									? 'Você recebeu um link especial: assine o plano anual pagando quase nada no primeiro ano e depois siga no valor normal.'
									: 'Você recebeu um link especial: escolha o plano ideal pra você, pague quase nada no primeiro mês e depois siga no valor normal.'}
							</p>
							{data && data.vox_grant > 0 && (
								<div className="mt-5 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-300">
									<Gift className="w-4 h-4" />
									Você ganha {data.vox_grant.toLocaleString('pt-BR')} voxxys ao
									assinar
								</div>
							)}
						</div>

						{/* Planos — grid adaptativo (mensal) ou card hero único (anual) */}
						<div className="flex flex-wrap justify-center gap-5 mb-12">
							{(data?.plans ?? []).map((plan) => (
								<div
									key={plan.key}
									className={
										isAnnual
											? 'flex w-full max-w-[400px]'
											: 'flex grow basis-[250px] min-w-[200px] max-w-[340px]'
									}
								>
									<PlanCard
										plan={plan}
										selected={selected?.key === plan.key}
										onSelect={() => selectPlan(plan.key)}
										hero={isAnnual}
									/>
								</div>
							))}
						</div>

						{/* Ação — mesmo fluxo da compra normal (conta → pagamento) */}
						<div ref={actionRef} className="max-w-lg mx-auto space-y-5">
							{redeem.isPending ? (
								<div className="card-dark rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center min-h-[260px]">
									<Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
									<p className="text-gray-300 text-sm font-medium">
										Redirecionando para o pagamento seguro...
									</p>
								</div>
							) : checkingAuth ? (
								<div className="card-dark rounded-2xl border border-white/10 p-6 flex items-center justify-center min-h-[260px]">
									<Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
								</div>
							) : !authed || showAuthForm ? (
								<PlanAuthForm
									onAuthenticated={() => {
										setShowAuthForm(false);
										meQuery.refetch();
									}}
								/>
							) : (
								<div className="card-dark rounded-2xl border border-white/10 p-6">
									<h3 className="font-display text-lg font-bold text-white mb-0.5 flex items-center gap-2">
										<BadgeCheck className="w-5 h-5 text-emerald-400" />
										Tudo pronto,{' '}
										{meQuery.data?.name?.split(' ')[0] ?? 'tudo certo'}!
									</h3>
									<button
										type="button"
										onClick={handleSwitchAccount}
										className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4"
									>
										Não é você? Trocar conta
									</button>
									<p className="text-sm text-gray-400 mb-5">
										Plano{' '}
										<span className="text-white font-semibold">
											{selected?.name ?? '—'}
										</span>
										{selected && (
											<>
												{' '}
												· {isAnnual ? '1º ano' : '1º mês'} por{' '}
												<span className="text-emerald-400 font-semibold">
													R${' '}
													{fmt(
														selected.first_period_cents ??
															selected.first_month_cents ??
															0,
													)}
												</span>{' '}
												· depois R${' '}
												{fmt(
													selected.price_cents ??
														selected.price_monthly_cents ??
														0,
												)}
												{isAnnual ? '/ano' : '/mês'}
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
