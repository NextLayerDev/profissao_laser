'use client';

// Central de indicadores — KPIs com semáforo, meta e histórico.
//
// Este arquivo é só o CONTAINER: gates, busca e mutações. O desenho da tela
// mora em `_components/indicadores-view.tsx`, separado para que a rota de
// conferência (`app/(dev)/mentoria-indicadores-check`) consiga montar os
// estados com fixtures — vazio, várias categorias/semáforos, KPI selecionado
// com histórico — sem depender de uma jornada real com medições acumuladas.
//
// O histórico é buscado para TODOS os KPIs de uma vez (não só os do gráfico):
// é o que permite trocar de categoria, selecionar outro KPI ou abrir o
// formulário de medição sem a vista precisar chamar mais nenhum hook de rede.

import { toast } from 'sonner';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import {
	useKpiHistories,
	useKpiMutations,
	useKpis,
} from '@/modules/mentoria/hooks';
import type { MntKpiMeasurement } from '@/modules/mentoria/types';
import { JourneyGate, MntSkeleton } from '../_components/shared';
import {
	IndicadoresView,
	type NewKpiBody,
	type NewMeasurementBody,
} from './_components/indicadores-view';

export default function IndicadoresPage() {
	return (
		<SubscriptionGate toolKey="mentoria_360">
			<JourneyGate>
				{({ journeyId }) => <IndicadoresContent journeyId={journeyId} />}
			</JourneyGate>
		</SubscriptionGate>
	);
}

function IndicadoresContent({ journeyId }: { journeyId: string }) {
	const { data: kpis, isLoading } = useKpis(journeyId);
	const { create, addMeasurement } = useKpiMutations(journeyId);
	const histories = useKpiHistories((kpis ?? []).map((k) => k.id));

	if (isLoading) return <MntSkeleton />;

	const historyByKpiId: Record<string, MntKpiMeasurement[] | undefined> = {};
	(kpis ?? []).forEach((k, i) => {
		historyByKpiId[k.id] = histories[i]?.data;
	});

	return (
		<IndicadoresView
			kpis={kpis ?? []}
			historyByKpiId={historyByKpiId}
			creating={create.isPending}
			onCreateKpi={(body: NewKpiBody, { onSuccess }) =>
				create.mutate(body, {
					onSuccess: () => {
						toast.success('Indicador criado!');
						onSuccess();
					},
					onError: () => toast.error('Não foi possível criar o indicador.'),
				})
			}
			addingMeasurement={addMeasurement.isPending}
			onAddMeasurement={(
				kpiId: string,
				body: NewMeasurementBody,
				{ onSuccess },
			) =>
				addMeasurement.mutate(
					{ kpiId, body },
					{
						onSuccess: () => {
							toast.success('Medição registrada!');
							onSuccess();
						},
						onError: () => toast.error('Não foi possível registrar a medição.'),
					},
				)
			}
		/>
	);
}
