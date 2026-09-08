'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Filter } from 'lucide-react';
import { toast } from 'sonner';
import { listFunnelStages, seedFunnelStages } from '@/modules/mentoria/service';
import { BTN_PRIMARY, CARD, EmptyState, MntSkeleton } from '../shared';

/** Ferramenta sales_funnel: funil de vendas com etapas em largura decrescente. */
export function ToolSalesFunnel({ instanceId }: { instanceId: string }) {
	const qc = useQueryClient();
	const queryKey = ['mentoria', 'funnel-stages', instanceId];

	const { data: stages, isLoading } = useQuery({
		queryKey,
		queryFn: () => listFunnelStages(instanceId),
	});

	const seed = useMutation({
		mutationFn: () => seedFunnelStages(instanceId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey });
			toast.success('Funil criado com as etapas padrão!');
		},
		onError: () => toast.error('Não foi possível criar o funil.'),
	});

	if (isLoading) return <MntSkeleton />;

	const sorted = [...(stages ?? [])].sort((a, b) => a.position - b.position);

	if (sorted.length === 0) {
		return (
			<EmptyState
				icon={Filter}
				title="Seu funil de vendas ainda não foi montado"
				description="Crie o funil com as etapas padrão da mentoria — da atração do cliente até a recompra — e use-o como mapa do seu processo comercial."
			>
				<button
					type="button"
					className={BTN_PRIMARY}
					disabled={seed.isPending}
					onClick={() => seed.mutate()}
				>
					{seed.isPending ? 'Criando...' : 'Criar etapas padrão'}
				</button>
			</EmptyState>
		);
	}

	const maxW = 100;
	const minW = 40;
	const step = sorted.length > 1 ? (maxW - minW) / (sorted.length - 1) : 0;

	return (
		<section className={`${CARD} p-5`}>
			<h3 className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 mb-1">
				<Filter className="w-4 h-4 text-teal-600 dark:text-teal-400" />
				Funil de vendas
			</h3>
			<p className="text-sm text-slate-500 dark:text-gray-400 mb-6">
				Cada etapa é um degrau da jornada do seu cliente. Identifique onde os
				clientes se perdem e trabalhe essa etapa.
			</p>
			<div className="flex flex-col items-center gap-2">
				{sorted.map((s, idx) => (
					<div
						key={s.id}
						className="rounded-xl border border-teal-500/30 bg-teal-500/10 dark:bg-teal-500/15 px-4 py-3 text-center transition"
						style={{ width: `${maxW - step * idx}%` }}
					>
						<p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{idx + 1}. {s.name}
						</p>
						{s.description && (
							<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
								{s.description}
							</p>
						)}
					</div>
				))}
			</div>
			<p className="text-xs text-slate-400 dark:text-gray-500 mt-6 text-center">
				Dica: crie indicadores na Central de KPIs para medir cada etapa (ex.:
				orçamentos enviados, taxa de fechamento, recompra).
			</p>
		</section>
	);
}
