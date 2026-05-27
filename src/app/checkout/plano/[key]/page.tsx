'use client';

import { ArrowLeft, Check, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { CheckoutAuthForm } from '@/components/checkout/checkout-auth-form';
import { useLandingPlans, usePlanCheckout } from '@/hooks/use-landing-plans';
import { getCurrentUser } from '@/lib/auth';
import type { PlanInterval } from '@/services/landing-plans';
import { PLAN_FEATURES, PLAN_TAGLINES } from '@/utils/constants/plans-content';

function fmt(v: number): string {
	return v.toFixed(2).replace('.', ',');
}

export default function PlanCheckoutPage() {
	const params = useParams<{ key: string }>();
	const search = useSearchParams();
	const planKey = params.key;
	const interval: PlanInterval =
		search.get('interval') === 'monthly' ? 'monthly' : 'yearly';

	const { data, isLoading } = useLandingPlans();
	const checkout = usePlanCheckout();
	const [authed, setAuthed] = useState(() => !!getCurrentUser());

	const plan = data?.find((p) => p.key === planKey);
	const price =
		plan != null ? (interval === 'yearly' ? plan.annual : plan.monthly) : null;
	const features = PLAN_FEATURES[planKey] ?? [];
	const tagline = plan?.tagline || PLAN_TAGLINES[planKey] || '';

	function startSubscription() {
		setAuthed(true);
		checkout.mutate(
			{ plan_key: planKey, interval },
			{
				onError: () =>
					toast.error('Erro ao iniciar o pagamento. Tente novamente.'),
			},
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			<header className="border-b border-slate-200 dark:border-gray-800 bg-slate-50/80 dark:bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-10">
				<div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
					<Link
						href="/#planos"
						className="flex items-center gap-2 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Voltar aos planos
					</Link>
					<span className="text-lg font-bold tracking-tight">Checkout</span>
					<div className="w-28" />
				</div>
			</header>

			<main className="max-w-5xl mx-auto px-6 py-10">
				{isLoading && !plan ? (
					<div className="flex items-center justify-center min-h-[40vh]">
						<Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
					</div>
				) : !plan ? (
					<div className="text-center min-h-[40vh] flex flex-col items-center justify-center">
						<p className="text-slate-600 dark:text-gray-400 text-lg font-medium mb-2">
							Plano não encontrado
						</p>
						<p className="text-slate-500 dark:text-gray-500 text-sm mb-6">
							O plano que você procura não existe ou não está disponível.
						</p>
						<Link
							href="/#planos"
							className="inline-flex items-center gap-2 text-violet-500 hover:text-violet-400 text-sm font-medium transition-colors"
						>
							<ArrowLeft className="w-4 h-4" />
							Ver planos
						</Link>
					</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
						{/* Resumo do plano */}
						<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-white/10 p-6">
							<span className="inline-flex items-center text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
								Plano selecionado
							</span>
							<h2 className="font-display text-2xl font-black mt-1">
								{plan.name}
							</h2>
							{tagline && (
								<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
									{tagline}
								</p>
							)}

							<div className="mt-5 pt-5 border-t border-slate-200 dark:border-white/10">
								{price != null ? (
									<div className="flex items-baseline gap-1">
										<span className="text-slate-500 dark:text-gray-400 text-base font-bold">
											R$
										</span>
										<span className="font-display text-4xl font-black tracking-tight tabular-nums">
											{fmt(price)}
										</span>
										<span className="text-slate-500 dark:text-gray-400 text-sm font-bold">
											/{interval === 'yearly' ? 'ano' : 'mês'}
										</span>
									</div>
								) : (
									<div className="text-slate-500 dark:text-gray-400 font-bold">
										Sob consulta
									</div>
								)}
								<p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
									{interval === 'yearly' ? 'Cobrança anual' : 'Cobrança mensal'}{' '}
									· cancele quando quiser
								</p>
							</div>

							{features.length > 0 && (
								<ul className="mt-5 space-y-2.5">
									{features.map((line) => (
										<li
											key={line}
											className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200"
										>
											<span className="w-4 h-4 rounded-full mt-0.5 grid place-items-center shrink-0 bg-violet-500/15">
												<Check className="w-2.5 h-2.5 text-violet-600 dark:text-violet-400" />
											</span>
											<span className="leading-snug">{line}</span>
										</li>
									))}
								</ul>
							)}

							<div className="mt-5 flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
								<ShieldCheck className="w-4 h-4 text-violet-500" />7 dias de
								garantia incondicional.
							</div>
						</div>

						{/* Ação: criar conta / login / confirmar */}
						<div className="space-y-6">
							{checkout.isPending ? (
								<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-white/10 p-6 flex flex-col items-center justify-center min-h-[220px]">
									<Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
									<p className="text-slate-600 dark:text-gray-400 text-sm">
										Redirecionando para o pagamento...
									</p>
								</div>
							) : authed && getCurrentUser() ? (
								<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-white/10 p-6">
									<h3 className="text-lg font-bold mb-1">Tudo pronto!</h3>
									<p className="text-sm text-slate-500 dark:text-gray-400 mb-5">
										Você já está logado. Confirme para ir ao pagamento seguro.
									</p>
									<button
										type="button"
										onClick={startSubscription}
										className="btn-accent w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl"
									>
										Ir para o pagamento
									</button>
								</div>
							) : (
								<CheckoutAuthForm onAuthenticated={startSubscription} />
							)}
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
