'use client';

import { CheckCircle2, Map as MapIcon, Play, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import {
	areaLabel,
	CompanyMapRadar,
} from '@/modules/mentoria/components/company-map-radar';
import {
	useCompanyMap,
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
} from '../_components/shared';

export default function FerramentasPage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>
				{({ journeyId }) => <FerramentasContent journeyId={journeyId} />}
			</JourneyGate>
		</SubscriptionGate>
	);
}

function FerramentasContent({ journeyId }: { journeyId: string }) {
	const { data: tools, isLoading } = useJourneyTools(journeyId);
	const { data: map } = useCompanyMap(journeyId);
	const start = useStartTool(journeyId);
	const router = useRouter();

	if (isLoading) return <MntSkeleton />;

	const openTool = (tool: ToolWithInstance) => {
		const go = () => router.push(`/course/mentoria/ferramentas/${tool.key}`);
		if (tool.instance) {
			go();
			return;
		}
		start.mutate(tool.id, {
			onSuccess: go,
			onError: () => toast.error('Não foi possível iniciar a ferramenta.'),
		});
	};

	const sorted = [...(tools ?? [])].sort((a, b) => a.position - b.position);

	return (
		<div className="p-4 md:p-8 space-y-6">
			<MntHeader
				title="Ferramentas de Gestão"
				subtitle="As ferramentas práticas que constroem o Mapa da Minha Empresa"
				icon={Wrench}
				backHref="/course/mentoria"
			/>

			{sorted.length === 0 ? (
				<EmptyState
					title="Nenhuma ferramenta disponível ainda"
					description="As ferramentas são liberadas conforme sua jornada avança."
				/>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{sorted.map((tool) => (
						<div key={tool.id} className={`${CARD} p-4 flex flex-col`}>
							<div className="flex items-center justify-between gap-2 mb-1">
								<span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400">
									{areaLabel(tool.area)}
								</span>
								{tool.instance?.status === 'completed' && (
									<span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
										<CheckCircle2 className="w-3.5 h-3.5" />
										Concluída
									</span>
								)}
							</div>
							<p className="font-semibold text-slate-900 dark:text-slate-100">
								{tool.name}
							</p>
							{tool.description && (
								<p className="text-xs text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">
									{tool.description}
								</p>
							)}
							<div className="mt-3 mb-3">
								<div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 mb-1">
									<span>Progresso</span>
									<span>{Math.round(tool.instance?.completion_pct ?? 0)}%</span>
								</div>
								<div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
									<div
										className="h-full rounded-full bg-teal-500"
										style={{
											width: `${Math.min(100, tool.instance?.completion_pct ?? 0)}%`,
										}}
									/>
								</div>
							</div>
							<button
								type="button"
								className={`${BTN_PRIMARY} mt-auto`}
								onClick={() => openTool(tool)}
								disabled={start.isPending}
							>
								<Play className="w-4 h-4" />
								{tool.instance
									? tool.instance.status === 'completed'
										? 'Rever'
										: 'Continuar'
									: 'Iniciar'}
							</button>
						</div>
					))}
				</div>
			)}

			<section className={`${CARD} p-5`}>
				<h2 className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 mb-1">
					<MapIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
					Mapa da Minha Empresa
				</h2>
				<p className="text-sm text-slate-500 dark:text-gray-400 mb-3">
					A maturidade de cada área cresce conforme você completa as
					ferramentas.
				</p>
				{map && map.areas.length > 0 ? (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
						<CompanyMapRadar map={map} />
						<div className="space-y-3">
							{map.areas.map((area) => (
								<div key={area.area}>
									<div className="flex items-center justify-between text-sm mb-1">
										<span className="font-medium text-slate-700 dark:text-slate-300">
											{areaLabel(area.area)}
										</span>
										<span className="text-slate-500 dark:text-gray-400">
											{Math.round(area.maturity_pct)}%
										</span>
									</div>
									<div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
										<div
											className="h-full rounded-full bg-teal-500"
											style={{ width: `${Math.min(100, area.maturity_pct)}%` }}
										/>
									</div>
									{area.tools.length > 0 && (
										<div className="mt-1 flex flex-wrap gap-1.5">
											{area.tools.map((t) => (
												<Link
													key={t.key}
													href={`/course/mentoria/ferramentas/${t.key}`}
													className="text-[11px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:border-teal-500/50 hover:text-teal-600 dark:hover:text-teal-400 transition"
												>
													{t.name} · {Math.round(t.completion_pct)}%
												</Link>
											))}
										</div>
									)}
								</div>
							))}
							<p className="text-sm font-semibold text-slate-900 dark:text-slate-100 pt-1">
								Maturidade geral: {Math.round(map.overall_pct)}%
							</p>
						</div>
					</div>
				) : (
					<p className="text-sm text-slate-400 dark:text-gray-500 py-8 text-center">
						Comece uma ferramenta para construir o seu mapa.
					</p>
				)}
			</section>
		</div>
	);
}
