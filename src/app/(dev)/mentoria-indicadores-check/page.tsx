'use client';

/**
 * Conferência visual da Central de indicadores (Mentoria 360°).
 *
 * Renderiza `IndicadoresView` com fixtures, sem backend. Existe porque os
 * estados interessantes — várias categorias com semáforo verde/amarelo/
 * vermelho/sem medição, histórico acumulado em vários meses — são caros de
 * reproduzir de propósito numa jornada real.
 *
 * Página de desenvolvimento, descartável — mesmo padrão de
 * `app/(dev)/mentoria-desenvolvimento-check`. Não está em `PUBLIC_PATHS` do
 * `AuthGuard`, então é preciso estar logado para abrir.
 */

import { useState } from 'react';
import { IndicadoresView } from '@/app/course/(shell)/mentoria/indicadores/_components/indicadores-view';
import {
	kpiHistoryEmptyFixture,
	kpiHistoryListFixture,
	kpiHistorySingleUnmeasuredFixture,
	kpisEmptyFixture,
	kpisListFixture,
	kpisSingleUnmeasuredFixture,
} from '@/modules/mentoria/__fixtures__/indicadores';

function Section({
	title,
	note,
	children,
}: {
	title: string;
	note: string;
	children: React.ReactNode;
}) {
	return (
		<section>
			<div className="mb-3 border-subtle border-b pb-2">
				<h2 className="text-section text-primary">{title}</h2>
				<p className="text-caption text-muted">{note}</p>
			</div>
			{children}
		</section>
	);
}

export default function IndicadoresCheckPage() {
	// Só para ver o efeito de `disabled`/"..." sem rede.
	const [pending, setPending] = useState(false);

	return (
		<div className="p-4 md:p-8">
			<header className="mb-8 max-w-5xl mx-auto">
				<h1 className="text-page text-primary">
					Central de indicadores — conferência
				</h1>
				<p className="mt-1 text-body text-secondary">
					Estados da tela com fixtures. Alterne o tema para caçar texto
					ilegível. "Novo KPI", "Medir" e o seletor de categoria funcionam de
					verdade dentro de cada estado — só não chegam a nenhum backend.
				</p>
				<div className="mt-3 flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => setPending((v) => !v)}
						aria-pressed={pending}
						className={`rounded-chip border px-3 py-1 text-caption transition ${
							pending
								? 'border-brand bg-brand-wash text-brand dark:text-violet-400'
								: 'border-subtle text-muted'
						}`}
					>
						{pending ? 'enviando (ligado)' : 'ocioso'}
					</button>
				</div>
			</header>

			<div className="space-y-14">
				<Section title="1. Nenhum indicador ainda" note="Estado vazio.">
					<IndicadoresView
						kpis={kpisEmptyFixture}
						historyByKpiId={kpiHistoryEmptyFixture}
						creating={pending}
						onCreateKpi={(body, { onSuccess }) => {
							console.log('[check] criar KPI', body);
							onSuccess();
						}}
						addingMeasurement={pending}
						onAddMeasurement={(kpiId, body, { onSuccess }) => {
							console.log('[check] registrar medição', kpiId, body);
							onSuccess();
						}}
					/>
				</Section>

				<Section
					title="2. Um KPI recém-criado, sem medição"
					note="Semáforo 'sem medição' e cartão de estatística vazio — antes da primeira medição existir."
				>
					<IndicadoresView
						kpis={kpisSingleUnmeasuredFixture}
						historyByKpiId={kpiHistorySingleUnmeasuredFixture}
						creating={pending}
						onCreateKpi={(body, { onSuccess }) => {
							console.log('[check] criar KPI', body);
							onSuccess();
						}}
						addingMeasurement={pending}
						onAddMeasurement={(kpiId, body, { onSuccess }) => {
							console.log('[check] registrar medição', kpiId, body);
							onSuccess();
						}}
					/>
				</Section>

				<Section
					title="3. Várias categorias e semáforos"
					note="Verde, amarelo, vermelho e sem medição lado a lado; um KPI com direção invertida (custo — menor é melhor); histórico de 3-4 meses para o gráfico de evolução."
				>
					<IndicadoresView
						kpis={kpisListFixture}
						historyByKpiId={kpiHistoryListFixture}
						creating={pending}
						onCreateKpi={(body, { onSuccess }) => {
							console.log('[check] criar KPI', body);
							onSuccess();
						}}
						addingMeasurement={pending}
						onAddMeasurement={(kpiId, body, { onSuccess }) => {
							console.log('[check] registrar medição', kpiId, body);
							onSuccess();
						}}
					/>
				</Section>
			</div>
		</div>
	);
}
