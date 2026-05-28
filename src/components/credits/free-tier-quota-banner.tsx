'use client';

import { AlertTriangle, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { useVoxQuotas } from '@/hooks/use-credits';
import { useIsTestUnlimited } from '@/hooks/use-is-test-unlimited';
import type { VoxFeature } from '@/types/credits';

interface FreeTierQuotaBannerProps {
	/** A feature exibida no banner. */
	feature: VoxFeature;
	/** Texto do label da unidade ("prévias", "vetorizações", "edições IA"). */
	unitLabel: string;
	className?: string;
}

const FEATURE_LABEL: Record<VoxFeature, string> = {
	previa: 'prévias grátis',
	vectorize: 'vetorizações grátis',
	'editor-ai': 'edições IA grátis',
};

/**
 * Banner sutil que aparece apenas para usuários sem saldo (balance == 0),
 * mostrando "X de Y usos gratuitos restantes esta semana/hoje" e CTA pra
 * comprar voxxys. Para usuários com saldo, retorna null.
 */
export function FreeTierQuotaBanner({
	feature,
	unitLabel,
	className = '',
}: FreeTierQuotaBannerProps) {
	const { data, isLoading } = useVoxQuotas();
	const unlimited = useIsTestUnlimited();

	// Conta de teste ilimitada: sem limites grátis, sem banner.
	if (unlimited) return null;
	if (isLoading || !data) return null;
	// Usuários com saldo > 0 não veem o banner — não têm cota grátis.
	if (data.balance > 0) return null;

	const quota = data.quotas.find((q) => q.feature === feature);
	if (!quota) return null;

	const isAtLimit = quota.remaining <= 0;
	const pct = quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0;
	const periodLabel = quota.period === 'daily' ? 'hoje' : 'esta semana';

	const resetDate = new Date(quota.resetsAt);
	const resetText =
		quota.period === 'daily'
			? `Renova amanhã às ${resetDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
			: `Renova ${resetDate.toLocaleDateString('pt-BR', { weekday: 'long' })}`;

	const barColor = isAtLimit ? 'bg-red-600' : 'bg-violet-600';
	const borderColor = isAtLimit
		? 'border-red-300 dark:border-red-800/50'
		: 'border-violet-200 dark:border-violet-800/40';
	const bgColor = isAtLimit
		? 'bg-red-50 dark:bg-red-950/20'
		: 'bg-violet-50 dark:bg-violet-950/20';

	return (
		<div
			className={`rounded-xl border ${borderColor} ${bgColor} p-4 ${className}`}
		>
			<div className="flex items-center justify-between mb-2 gap-3">
				<div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 min-w-0">
					{isAtLimit ? (
						<AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
					) : (
						<Zap className="w-4 h-4 text-violet-600 shrink-0" />
					)}
					<span className="truncate">
						{isAtLimit
							? `Limite gratuito atingido — ${FEATURE_LABEL[feature]}`
							: `${quota.remaining} de ${quota.limit} ${unitLabel} restantes ${periodLabel}`}
					</span>
				</div>
				<Link
					href="/course/voxes"
					className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline shrink-0"
				>
					<Sparkles className="w-3 h-3" />
					Comprar voxxys
				</Link>
			</div>
			<div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden mb-1.5">
				<div
					className={`h-full rounded-full transition-all ${barColor}`}
					style={{ width: `${Math.min(pct, 100)}%` }}
				/>
			</div>
			<p className="text-xs text-slate-500 dark:text-gray-400">{resetText}</p>
		</div>
	);
}
