'use client';

import { useQuery } from '@tanstack/react-query';
import {
	ArrowLeft,
	Check,
	Infinity as InfinityIcon,
	Loader2,
	Lock,
	ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CouponCodeInput } from '@/components/checkout/coupon-code-input';
import { PlanAuthForm } from '@/components/checkout/plan-auth-form';
import { usePlanCheckout } from '@/hooks/use-landing-plans';
import { usePackage } from '@/hooks/use-packages';
import { getCoursesMe } from '@/services/courses-auth';
import type { PlanInterval } from '@/services/landing-plans';

function fmt(cents: number): string {
	return (cents / 100).toFixed(2).replace('.', ',');
}

export default function PackageCheckoutPage() {
	const params = useParams<{ key: string }>();
	const search = useSearchParams();
	const packageKey = params.key;

	const { data, isLoading } = usePackage(packageKey);
	const checkout = usePlanCheckout();
	const [couponCode, setCouponCode] = useState<string | null>(null);

	const plan = data?.plan;
	const course = data?.courses[0]?.course;
	const isLifetime = plan?.billing_mode === 'lifetime';

	// Pacote vitalício ignora o intervalo; o recorrente respeita a query string.
	const [interval, setInterval] = useState<PlanInterval>(
		search.get('interval') === 'monthly' ? 'monthly' : 'yearly',
	);

	const priceCents = !plan
		? null
		: isLifetime
			? (plan.price_lifetime_cents ?? 0)
			: interval === 'yearly'
				? (plan.price_yearly_cents ?? 0)
				: (plan.price_monthly_cents ?? 0);

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
	const [authTransition, setAuthTransition] = useState(false);
	const checkingAuth = !mounted || meQuery.isLoading || authTransition;

	const trust = [
		{ Icon: Lock, label: 'Pagamento seguro via Stripe' },
		{ Icon: ShieldCheck, label: '7 dias de garantia' },
		isLifetime
			? { Icon: InfinityIcon, label: 'Acesso vitalício' }
			: { Icon: ShieldCheck, label: 'Cancele quando quiser' },
	];

	function startCheckout() {
		checkout.mutate(
			{
				plan_key: packageKey,
				interval,
				coupon_code: couponCode ?? undefined,
			},
			{
				onError: () =>
					toast.error('Erro ao iniciar o pagamento. Tente novamente.'),
			},
		);
	}

	async function handleAuthenticated() {
		setAuthTransition(true);
		try {
			await meQuery.refetch();
		} finally {
			setAuthTransition(false);
		}
	}

	return (
		<div className="relative min-h-screen overflow-hidden bg-ink-950 text-white antialiased">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-[10%] left-[8%] w-[460px] h-[460px] rounded-full bg-violet-800/20 blur-3xl" />
				<div className="absolute bottom-0 right-[4%] w-[380px] h-[380px] rounded-full bg-indigo-900/20 blur-3xl" />
				<div className="absolute inset-0 bg-grid opacity-[0.04] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
			</div>

			<header className="relative border-b border-white/[0.06]">
				<div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
					<Link
						href="/#planos"
						className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Ver todos os planos
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
						Garanta seu <span className="grad-brand">curso</span>
					</h1>
					<p className="text-gray-400 text-sm mt-2">
						Crie sua conta e libere o acesso após o pagamento.
					</p>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center min-h-[40vh]">
						<Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
					</div>
				) : !plan || !course ? (
					<div className="text-center min-h-[40vh] flex flex-col items-center justify-center">
						<p className="text-gray-300 text-lg font-semibold mb-2">
							Pacote não encontrado
						</p>
						<p className="text-gray-500 text-sm mb-6">
							Este pacote não existe ou não está mais disponível.
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
						{/* Resumo: um pacote mostra UM curso */}
						<div className="relative card-dark rounded-2xl border border-white/10 p-7 overflow-hidden">
							<div className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b from-violet-500/25 to-transparent" />
							<div className="relative">
								<div className="relative h-36 rounded-xl overflow-hidden mb-5 border border-white/10 bg-ink-900">
									{course.image_url ? (
										<Image
											src={course.image_url}
											alt={course.title}
											fill
											sizes="(max-width: 1024px) 100vw, 520px"
											className="object-cover"
										/>
									) : (
										<div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 to-indigo-900/30" />
									)}
									<div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent" />
									<div className="absolute bottom-3 left-4 right-4">
										<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/90">
											Curso
										</p>
										<p className="font-display text-white font-extrabold leading-tight">
											{course.title}
										</p>
									</div>
								</div>

								<span className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">
									{isLifetime ? 'Acesso vitalício' : 'Acesso ao curso'}
								</span>
								<h2 className="font-display text-3xl font-black mt-1.5">
									{plan.name}
								</h2>
								{plan.description && (
									<p className="text-sm text-gray-400 mt-1">
										{plan.description}
									</p>
								)}

								{/* Recorrente ainda escolhe mensal/anual; vitalício não tem escolha. */}
								{!isLifetime && (
									<div className="mt-5 inline-flex rounded-xl border border-white/10 p-1">
										{(['monthly', 'yearly'] as const).map((opt) => (
											<button
												key={opt}
												type="button"
												onClick={() => setInterval(opt)}
												className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
													interval === opt
														? 'bg-violet-600 text-white'
														: 'text-gray-400 hover:text-white'
												}`}
											>
												{opt === 'monthly' ? 'Mensal' : 'Anual'}
											</button>
										))}
									</div>
								)}

								<div className="mt-6 pt-6 border-t border-white/10">
									<div className="flex items-baseline gap-1.5">
										<span className="text-gray-400 text-lg font-bold">R$</span>
										<span className="font-display text-5xl font-black tracking-tight tabular-nums">
											{fmt(priceCents ?? 0)}
										</span>
										{!isLifetime && (
											<span className="text-gray-400 text-sm font-bold">
												/{interval === 'yearly' ? 'ano' : 'mês'}
											</span>
										)}
									</div>
									<p className="text-xs text-gray-500 mt-2">
										{isLifetime
											? 'Pagamento único · acesso ao curso para sempre'
											: interval === 'yearly'
												? `Cobrado uma vez por ano · ou 12x de R$ ${fmt((priceCents ?? 0) / 12)}`
												: 'Cobrado todo mês'}
									</p>
								</div>

								{data.tools.length > 0 && (
									<ul className="mt-6 space-y-2.5">
										{data.tools.map((t) => (
											<li
												key={t.tool_key}
												className="flex items-start gap-2.5 text-sm text-slate-200"
											>
												<span className="w-4 h-4 rounded-full mt-0.5 grid place-items-center shrink-0 bg-violet-500/20">
													<Check className="w-2.5 h-2.5 text-violet-300" />
												</span>
												<span className="leading-snug">
													{t.tool.name}
													{t.free_quota === null ? (
														<span className="text-violet-300">
															{' '}
															· ilimitado
														</span>
													) : t.free_quota > 0 ? (
														<span className="text-gray-500">
															{' '}
															· {t.free_quota}x grátis por mês
														</span>
													) : null}
												</span>
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
									{/* ponytail: cupom só no recorrente — a validação do backend
									    calcula o total por interval, então o vitalício mostraria
									    desconto errado. Liberar quando /coupon/validate aceitar
									    billing_mode 'lifetime'. */}
									{!isLifetime && (
										<CouponCodeInput
											context="plan"
											planKey={packageKey}
											interval={interval}
											onApplied={setCouponCode}
											className="mb-4"
										/>
									)}
									<button
										type="button"
										onClick={startCheckout}
										className="btn-accent w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl shadow-brand cursor-pointer"
									>
										Ir para o pagamento
									</button>
								</div>
							) : (
								<PlanAuthForm onAuthenticated={handleAuthenticated} />
							)}

							<div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
								{trust.map(({ Icon, label }) => (
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
