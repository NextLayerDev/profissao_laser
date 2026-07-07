'use client';

import { useQuery } from '@tanstack/react-query';
import {
	ArrowLeft,
	Check,
	Loader2,
	Lock,
	RefreshCw,
	ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CouponCodeInput } from '@/components/checkout/coupon-code-input';
import { PlanAuthForm } from '@/components/checkout/plan-auth-form';
import { useLandingPlans, usePlanCheckout } from '@/hooks/use-landing-plans';
import { getCoursesMe } from '@/services/courses-auth';
import type { PlanInterval } from '@/services/landing-plans';
import { PLAN_FEATURES, PLAN_TAGLINES } from '@/utils/constants/plans-content';

function fmt(v: number): string {
	return v.toFixed(2).replace('.', ',');
}

const TRUST = [
	{ Icon: Lock, label: 'Pagamento seguro via Stripe' },
	{ Icon: ShieldCheck, label: '7 dias de garantia' },
	{ Icon: RefreshCw, label: 'Cancele quando quiser' },
];

export default function PlanCheckoutPage() {
	const params = useParams<{ key: string }>();
	const search = useSearchParams();
	const planKey = params.key;
	const interval: PlanInterval =
		search.get('interval') === 'monthly' ? 'monthly' : 'yearly';

	const { data, isLoading } = useLandingPlans();
	const checkout = usePlanCheckout();
	const [couponCode, setCouponCode] = useState<string | null>(null);

	// Só após montar (evita localStorage no SSR). /v1/me valida o token na upvox.
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

	const plan = data?.find((p) => p.key === planKey);
	const price =
		plan != null ? (interval === 'yearly' ? plan.annual : plan.monthly) : null;
	const features = PLAN_FEATURES[planKey] ?? [];
	const tagline = plan?.tagline || PLAN_TAGLINES[planKey] || '';

	function startSubscription() {
		checkout.mutate(
			{ plan_key: planKey, interval, coupon_code: couponCode ?? undefined },
			{
				onError: () =>
					toast.error('Erro ao iniciar o pagamento. Tente novamente.'),
			},
		);
	}

	return (
		<div className="relative min-h-screen overflow-hidden bg-ink-950 text-white antialiased">
			{/* Background atmosférico */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-[10%] left-[8%] w-[460px] h-[460px] rounded-full bg-violet-800/20 blur-3xl" />
				<div className="absolute bottom-0 right-[4%] w-[380px] h-[380px] rounded-full bg-indigo-900/20 blur-3xl" />
				<div className="absolute inset-0 bg-grid opacity-[0.04] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
			</div>

			{/* Header */}
			<header className="relative border-b border-white/[0.06]">
				<div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
					<Link
						href="/#planos"
						className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Voltar aos planos
					</Link>
					<div className="flex items-center gap-2 text-sm text-gray-300">
						<Lock className="w-4 h-4 text-violet-400" />
						Checkout 100% seguro
					</div>
				</div>
			</header>

			<main className="relative max-w-5xl mx-auto px-6 py-10 md:py-14">
				<div className="text-center mb-9">
					<h1 className="font-display text-2xl md:text-[2rem] font-black leading-tight">
						Finalize sua <span className="grad-brand">assinatura</span>
					</h1>
					<p className="text-gray-400 text-sm mt-2">
						Crie sua conta e libere o acesso após o pagamento.
					</p>
				</div>

				{isLoading && !plan ? (
					<div className="flex items-center justify-center min-h-[40vh]">
						<Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
					</div>
				) : !plan ? (
					<div className="text-center min-h-[40vh] flex flex-col items-center justify-center">
						<p className="text-gray-300 text-lg font-semibold mb-2">
							Plano não encontrado
						</p>
						<p className="text-gray-500 text-sm mb-6">
							O plano que você procura não existe ou não está disponível.
						</p>
						<Link
							href="/#planos"
							className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							Ver planos
						</Link>
					</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
						{/* Resumo do plano */}
						<div className="relative card-dark rounded-2xl border border-white/10 p-7 overflow-hidden">
							<div className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b from-violet-500/25 to-transparent" />
							<div className="relative">
								{/* Banner do produto (a plataforma que o plano libera) */}
								<div className="relative h-32 rounded-xl overflow-hidden mb-5 border border-white/10">
									<Image
										src="/img/plataforma-desktop.png"
										alt="Plataforma Comunidade Profissão Laser"
										fill
										sizes="(max-width: 1024px) 100vw, 520px"
										className="object-cover object-left-top"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-violet-900/30" />
									<div className="absolute inset-0 flex items-center gap-3 px-4">
										<div className="relative w-11 h-11 rounded-full overflow-hidden border border-white/20 bg-ink-950 shrink-0">
											<Image
												src="/img/logo-profissao-laser.png"
												alt="Profissão Laser"
												fill
												sizes="44px"
												className="object-contain p-1"
											/>
										</div>
										<div className="leading-tight">
											<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/90">
												Comunidade
											</p>
											<p className="font-display text-white font-extrabold">
												Profissão Laser
											</p>
										</div>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<span className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">
										Plano selecionado
									</span>
									{plan.featured && (
										<span className="btn-accent text-white text-[10px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full shadow-brand">
											Mais escolhido
										</span>
									)}
								</div>
								<h2 className="font-display text-3xl font-black mt-1.5">
									{plan.name}
								</h2>
								{tagline && (
									<p className="text-sm text-gray-400 mt-1">{tagline}</p>
								)}

								<div className="mt-6 pt-6 border-t border-white/10">
									{price != null ? (
										<>
											<div className="flex items-baseline gap-1.5">
												<span className="text-gray-400 text-lg font-bold">
													R$
												</span>
												<span className="font-display text-5xl font-black tracking-tight tabular-nums">
													{fmt(price)}
												</span>
												<span className="text-gray-400 text-sm font-bold">
													/{interval === 'yearly' ? 'ano' : 'mês'}
												</span>
											</div>
											<p className="text-xs text-gray-500 mt-2">
												{interval === 'yearly'
													? plan.installment != null
														? `Plano anual · ou 12x de R$ ${fmt(plan.installment)}`
														: 'Plano anual'
													: 'Plano mensal · cobrado todo mês'}
											</p>
										</>
									) : (
										<div className="text-gray-400 font-bold">Sob consulta</div>
									)}
								</div>

								{features.length > 0 && (
									<ul className="mt-6 space-y-2.5">
										{features.map((line) => (
											<li
												key={line}
												className="flex items-start gap-2.5 text-sm text-slate-200"
											>
												<span className="w-4 h-4 rounded-full mt-0.5 grid place-items-center shrink-0 bg-violet-500/20">
													<Check className="w-2.5 h-2.5 text-violet-300" />
												</span>
												<span className="leading-snug">{line}</span>
											</li>
										))}
									</ul>
								)}
							</div>
						</div>

						{/* Ação: criar conta / login / confirmar */}
						<div className="space-y-5">
							{checkout.isPending ? (
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
							) : authed ? (
								<div className="card-dark rounded-2xl border border-white/10 p-6">
									<h3 className="font-display text-lg font-bold text-white mb-1">
										Tudo pronto,{' '}
										{meQuery.data?.name?.split(' ')[0] ?? 'tudo certo'}!
									</h3>
									<p className="text-sm text-gray-400 mb-5">
										Você já está logado. Confirme para ir ao pagamento seguro.
									</p>
									<CouponCodeInput
										context="plan"
										planKey={planKey}
										interval={interval}
										onApplied={setCouponCode}
										className="mb-4"
									/>
									<button
										type="button"
										onClick={startSubscription}
										className="btn-accent w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl shadow-brand cursor-pointer"
									>
										Ir para o pagamento
									</button>
								</div>
							) : (
								<PlanAuthForm onAuthenticated={startSubscription} />
							)}

							{/* Selos de confiança */}
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
					</div>
				)}
			</main>
		</div>
	);
}
