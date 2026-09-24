'use client';

import { CheckCircle2, Wrench } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { areaLabel } from '@/modules/mentoria/components/company-map-radar';
import {
	useCompleteTool,
	useJourneyTools,
	useStartTool,
} from '@/modules/mentoria/hooks';
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

const REDIRECTS: Record<string, string> = {
	kpi_board: '/course/mentoria/indicadores',
	goal_action: '/course/mentoria/desenvolvimento',
	maslow: '/course/mentoria/desenvolvimento',
	good_news: '/course/mentoria/desenvolvimento',
	business_plan: '/course/mentoria/desenvolvimento',
};

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
			<div className="p-4 md:p-8">
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

	if (!tool.instance) return <MntSkeleton />;

	return (
		<div className="p-4 md:p-8 space-y-6">
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

	return (
		<div
			className={`${CARD} p-4 flex flex-wrap items-center justify-between gap-3`}
		>
			<p className="text-sm text-slate-500 dark:text-gray-400">
				{done
					? 'Ferramenta concluída — ela conta 100% no Mapa da Minha Empresa.'
					: 'Terminou de aplicar esta ferramenta na sua empresa? Marque como concluída.'}
			</p>
			{!done && (
				<button
					type="button"
					className={BTN_PRIMARY}
					disabled={complete.isPending}
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
					{complete.isPending
						? 'Concluindo...'
						: 'Marcar ferramenta como concluída'}
				</button>
			)}
		</div>
	);
}
