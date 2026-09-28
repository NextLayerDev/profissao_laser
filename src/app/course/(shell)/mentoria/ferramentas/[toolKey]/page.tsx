'use client';

import { AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import {
	areaLabel,
	ValidatedMark,
} from '@/modules/mentoria/components/company-map-radar';
import {
	useCompleteTool,
	useJourneyTools,
	useStartTool,
} from '@/modules/mentoria/hooks';
import { TOOL_OWN_PAGE } from '@/modules/mentoria/nav';
import type { ToolWithInstance } from '@/modules/mentoria/types';
import {
	BTN_PRIMARY,
	CARD,
	EmptyState,
	JourneyGate,
	MntHeader,
	MntSkeleton,
} from '../../_components/shared';
import { ToolFinancialPanel } from '../../_components/tools/tool-financial';
import { ToolForm } from '../../_components/tools/tool-form';
import { ToolSalesFunnel } from '../../_components/tools/tool-funnel';
import { ToolImprovement } from '../../_components/tools/tool-improvement';
import { ToolOrgChart } from '../../_components/tools/tool-org-chart';
import { ToolPopLibrary } from '../../_components/tools/tool-pop-library';
import { ToolProcessFlow } from '../../_components/tools/tool-process-flow';

// KPIs e desenvolvimento pessoal moram em páginas próprias (nav.ts).
const REDIRECTS = TOOL_OWN_PAGE;

export default function FerramentaDetalhePage() {
	const params = useParams<{ toolKey: string }>();
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>
				{({ journeyId }) => (
					<ToolDetail journeyId={journeyId} toolKey={params.toolKey} />
				)}
			</JourneyGate>
		</SubscriptionGate>
	);
}

function ToolDetail({
	journeyId,
	toolKey,
}: {
	journeyId: string;
	toolKey: string;
}) {
	const router = useRouter();
	const { data: tools, isLoading } = useJourneyTools(journeyId);
	const start = useStartTool(journeyId);
	const startedRef = useRef(false);

	const tool = (tools ?? []).find((t) => t.key === toolKey);
	const redirect = tool ? REDIRECTS[tool.kind] : undefined;

	// kpi_board / desenvolvimento pessoal moram em páginas próprias
	useEffect(() => {
		if (redirect) router.replace(redirect);
	}, [redirect, router]);

	// Garante a instância criada ao abrir a ferramenta direto pela URL
	useEffect(() => {
		if (tool && !tool.instance && !redirect && !startedRef.current) {
			startedRef.current = true;
			start.mutate(tool.id);
		}
	}, [tool, redirect, start]);

	if (isLoading || (tool && redirect)) return <MntSkeleton />;

	if (!tool) {
		return (
			<div>
				<MntHeader
					title="Ferramenta"
					icon={Wrench}
					backHref="/course/mentoria/ferramentas"
				/>
				<EmptyState
					title="Ferramenta não encontrada"
					description="Volte à lista de ferramentas e escolha uma disponível."
				/>
			</div>
		);
	}

	// Sem isto, um start que falhou (rede, 403, definição inativa) deixava o
	// esqueleto pulsando para sempre: `startedRef` impede nova tentativa.
	if (!tool.instance && start.isError) {
		return (
			<EmptyState
				icon={AlertTriangle}
				title="Não foi possível abrir a ferramenta"
				description="Houve uma falha ao preparar a ferramenta. Tente de novo em instantes."
			>
				<button
					type="button"
					className={BTN_PRIMARY}
					disabled={start.isPending}
					onClick={() => start.mutate(tool.id)}
				>
					Tentar de novo
				</button>
			</EmptyState>
		);
	}

	if (!tool.instance) return <MntSkeleton />;

	return (
		<div className="space-y-6">
			<MntHeader
				title={tool.name}
				subtitle={`${areaLabel(tool.area)}${tool.description ? ` — ${tool.description}` : ''}`}
				icon={Wrench}
				backHref="/course/mentoria/ferramentas"
			/>

			<ToolBody tool={tool} journeyId={journeyId} />

			<CompleteToolFooter tool={tool} journeyId={journeyId} />
		</div>
	);
}

function ToolBody({
	tool,
	journeyId,
}: {
	tool: ToolWithInstance;
	journeyId: string;
}) {
	const instanceId = tool.instance?.id as string;
	switch (tool.kind) {
		case 'form':
			return <ToolForm tool={tool} journeyId={journeyId} />;
		case 'process_flow':
			return <ToolProcessFlow instanceId={instanceId} />;
		case 'org_chart':
			return <ToolOrgChart instanceId={instanceId} />;
		case 'pop_library':
			return <ToolPopLibrary instanceId={instanceId} />;
		case 'financial_panel':
			return <ToolFinancialPanel journeyId={journeyId} />;
		case 'sales_funnel':
			return <ToolSalesFunnel instanceId={instanceId} />;
		case 'continuous_improvement':
			return <ToolImprovement instanceId={instanceId} />;
		default:
			return (
				<EmptyState
					title="Ferramenta em construção"
					description="Este tipo de ferramenta ainda não tem uma tela dedicada."
				/>
			);
	}
}

/**
 * Progresso calculado pela API a partir do que foi preenchido. "Marcar como
 * concluída" segue como override manual (reabrir volta ao calculado).
 */
function CompleteToolFooter({
	tool,
	journeyId,
}: {
	tool: ToolWithInstance;
	journeyId: string;
}) {
	const complete = useCompleteTool(journeyId);
	const instance = tool.instance;
	if (!instance) return null;

	const done = instance.status === 'completed';
	const pct = Math.round(instance.completion_pct);

	return (
		<div
			className={`${CARD} p-4 flex flex-wrap items-center justify-between gap-3`}
		>
			<div className="flex-1 min-w-48" data-testid="tool-progress">
				<div className="flex items-center justify-between gap-2 text-sm mb-1">
					<span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
						{done ? 'Concluída' : 'Progresso'}
						{instance.mentor_validated_at && (
							<span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
								<ValidatedMark className="w-3 h-3" />
								Validada
							</span>
						)}
					</span>
					<span className="text-slate-500 dark:text-gray-400">{pct}%</span>
				</div>
				<div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
					<div
						className="h-full rounded-full bg-teal-500"
						style={{ width: `${Math.min(100, pct)}%` }}
					/>
				</div>
			</div>
			{!done && (
				<button
					type="button"
					className={BTN_PRIMARY}
					disabled={complete.isPending}
					title="Conta 100% no Mapa"
					onClick={() =>
						complete.mutate(
							{ instanceId: instance.id, completionPct: 100 },
							{
								onSuccess: () => toast.success('Ferramenta concluída!'),
								onError: () =>
									toast.error('Não foi possível concluir a ferramenta.'),
							},
						)
					}
				>
					<CheckCircle2 className="w-4 h-4" />
					{complete.isPending ? 'Concluindo...' : 'Marcar como concluída'}
				</button>
			)}
		</div>
	);
}
