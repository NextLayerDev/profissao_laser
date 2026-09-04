'use client';

// Container da Evolução: gate de acesso, consultas, mutações e toasts. A
// apresentação mora em `_components/evolucao-view.tsx` (comparador + lista) e
// `_components/raiox-view.tsx` (o relatório), que a rota de conferência
// (`app/(dev)/mentoria-evolucao-check`) renderiza com fixtures — mesmo padrão
// de `tarefas/page.tsx`.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import {
	useComparison,
	useReports,
	useSnapshots,
} from '@/modules/mentoria/hooks';
import { createSnapshot, generateRaiox } from '@/modules/mentoria/service';
import type { MntReport } from '@/modules/mentoria/types';
import {
	apiErrorCode,
	fmtDate,
	JourneyGate,
	MntSkeleton,
} from '../_components/shared';
import type { ComparisonState } from './_components/evolucao-view';
import { EvolucaoView } from './_components/evolucao-view';

export default function EvolucaoPage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>
				{({ journeyId }) => <Content journeyId={journeyId} />}
			</JourneyGate>
		</SubscriptionGate>
	);
}

function Content({ journeyId }: { journeyId: string }) {
	const qc = useQueryClient();
	const { data: snapshots, isLoading: loadingSnapshots } =
		useSnapshots(journeyId);
	const [from, setFrom] = useState('foto_zero');
	const [to, setTo] = useState('current');
	const {
		data: comparison,
		isLoading: loadingCompare,
		isError,
	} = useComparison(journeyId, from, to);
	const { data: reports } = useReports(journeyId);
	const [openReport, setOpenReport] = useState<MntReport | null>(null);

	const snapshot = useMutation({
		mutationFn: () => createSnapshot(journeyId, { kind: 'monthly' }),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['mentoria', 'snapshots', journeyId] });
			toast.success('Snapshot congelado! Ele fica disponível no comparador.');
		},
		onError: () => toast.error('Não foi possível congelar o snapshot.'),
	});

	const raiox = useMutation({
		mutationFn: () => generateRaiox(journeyId),
		onSuccess: (report) => {
			qc.invalidateQueries({ queryKey: ['mentoria', 'reports', journeyId] });
			setOpenReport(report);
			toast.success('Raio-X Empresarial 360° gerado!');
		},
		onError: (e) =>
			toast.error(
				apiErrorCode(e) === 'foto_zero_missing'
					? 'Complete o diagnóstico inicial (Foto Zero) antes de gerar o relatório.'
					: 'Não foi possível gerar o relatório.',
			),
	});

	// Foto Zero e "Agora" são âncoras fixas; os snapshots mensais entram no meio,
	// em ordem de chegada.
	const options = useMemo(
		() => [
			{ value: 'foto_zero', label: 'Foto Zero' },
			...(snapshots ?? [])
				.filter((s) => s.kind !== 'foto_zero')
				.map((s) => ({
					value: s.id,
					label: `${s.label ?? s.kind} — ${fmtDate(s.taken_at)}`,
				})),
			{ value: 'current', label: 'Agora' },
		],
		[snapshots],
	);

	if (loadingSnapshots) return <MntSkeleton />;

	// Os quatro estados do comparador viram um só valor: a view não deve
	// remontar essa regra a partir de flags soltas.
	const comparisonState: ComparisonState = loadingCompare
		? 'loading'
		: isError || !comparison
			? 'error'
			: Object.keys(comparison.deltas).length === 0
				? 'empty'
				: 'ready';

	return (
		<EvolucaoView
			options={options}
			from={from}
			to={to}
			onFromChange={setFrom}
			onToChange={setTo}
			comparisonState={comparisonState}
			comparison={comparison}
			reports={reports ?? []}
			openReport={openReport}
			onToggleReport={(report) =>
				setOpenReport((open) => (open?.id === report.id ? null : report))
			}
			snapshotting={snapshot.isPending}
			onSnapshot={() => snapshot.mutate()}
			generating={raiox.isPending}
			onGenerate={() => raiox.mutate()}
		/>
	);
}
