'use client';

import { ArrowLeftRight, Check } from 'lucide-react';
import { useState } from 'react';
import { type LandingPlan, useLandingPlans } from '@/hooks/use-landing-plans';
import type { SubscriptionInterval } from '@/modules/subscriptions/types/subscriptions';

const brl = (value: number) =>
	new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
		value,
	);

interface ChangePlanSectionProps {
	currentPlanKey: string | null;
	currentInterval: SubscriptionInterval;
	onSelect: (plan: LandingPlan, interval: SubscriptionInterval) => void;
}

/**
 * Todos os planos, no mensal ou no anual, para o aluno trocar o dele. Quem
 * decide se é "paga a diferença agora" ou "troca na renovação" é o backend —
 * o modal mostra o valor exato antes de confirmar.
 */
export function ChangePlanSection({
	currentPlanKey,
	currentInterval,
	onSelect,
}: ChangePlanSectionProps) {
	const { data: plans } = useLandingPlans();
	const [interval, setInterval] =
		useState<SubscriptionInterval>(currentInterval);

	if (!plans?.length) return null;

	const currentIndex = plans.findIndex((p) => p.key === currentPlanKey);

	return (
		<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden">
			<div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6 pb-4">
				<div className="flex items-center gap-3">
					<div className="bg-violet-500/10 dark:bg-violet-500/20 rounded-lg p-2.5">
						<ArrowLeftRight className="w-5 h-5 text-violet-600 dark:text-violet-400" />
					</div>
					<div>
						<h3 className="font-display font-bold text-slate-900 dark:text-slate-100">
							Trocar de plano
						</h3>
						<p className="text-xs text-slate-500 dark:text-gray-400">
							Subiu de plano? Você paga só a diferença. Desceu? Muda na
							renovação.
						</p>
					</div>
				</div>

				<div
					role="tablist"
					aria-label="Período"
					className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 p-0.5 text-sm"
				>
					{(['monthly', 'yearly'] as const).map((value) => (
						<button
							key={value}
							type="button"
							role="tab"
							aria-selected={interval === value}
							onClick={() => setInterval(value)}
							className={`px-3.5 py-1.5 rounded-md font-semibold transition-colors ${
								interval === value
									? 'bg-violet-600 text-white'
									: 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
							}`}
						>
							{value === 'monthly' ? 'Mensal' : 'Anual'}
						</button>
					))}
				</div>
			</div>

			<div className="p-6 pt-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				{plans.map((plan, index) => {
					const price = interval === 'yearly' ? plan.annual : plan.monthly;
					if (price == null) return null;
					const isCurrent =
						plan.key === currentPlanKey && interval === currentInterval;
					const isHigher = currentIndex >= 0 && index > currentIndex;
					return (
						<div
							key={plan.key}
							className={`rounded-lg border flex flex-col p-5 ${
								isCurrent
									? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/[0.06]'
									: 'border-slate-200 dark:border-white/10'
							}`}
						>
							<h4 className="font-display font-bold text-slate-900 dark:text-slate-100">
								{plan.name}
							</h4>
							<p className="mt-1 mb-1">
								<span className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">
									{brl(price)}
								</span>
								<span className="text-sm text-slate-500 dark:text-gray-400">
									/{interval === 'yearly' ? 'ano' : 'mês'}
								</span>
							</p>
							{interval === 'yearly' && plan.installment != null && (
								<p className="text-xs text-slate-500 dark:text-gray-400">
									equivale a {brl(plan.installment)}/mês
								</p>
							)}
							<div className="flex-1 min-h-4" />
							{isCurrent ? (
								<span className="mt-4 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
									<Check size={14} />
									Seu plano atual
								</span>
							) : (
								<button
									type="button"
									onClick={() => onSelect(plan, interval)}
									className={`mt-4 w-full py-2.5 text-sm font-semibold rounded-lg transition-colors ${
										isHigher
											? 'bg-violet-600 hover:bg-violet-500 text-white'
											: 'border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-violet-500/50 hover:text-violet-700 dark:hover:text-violet-400'
									}`}
								>
									{plan.key === currentPlanKey
										? interval === 'yearly'
											? 'Mudar para anual'
											: 'Mudar para mensal'
										: isHigher
											? 'Fazer upgrade'
											: 'Trocar para este'}
								</button>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
