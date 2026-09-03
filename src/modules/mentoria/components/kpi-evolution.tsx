'use client';

// Gráfico de evolução multi-KPI e helpers de formatação, compartilhados entre
// o dashboard ("Minha Empresa") e a página de Indicadores — os dois precisam
// da mesma leitura de KPI (valor formatado, delta, cor do semáforo).

import { useMemo } from 'react';
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import type { MntKpi, MntKpiMeasurement } from '@/modules/mentoria/types';

// O recharts pinta com cor crua — `stroke` não aceita className —, então os
// valores dos tokens do DS aparecem literais aqui. É a mesma limitação que o
// próprio DS tem nas cores lidas por JS (spinner do Button, placeholder do
// Input). Registrado em docs/mentoria-360-design-system.md.
export const SERIES_COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#dc2626'];

export const SEMAPHORE_TONE = {
	green: 'success',
	yellow: 'warning',
	red: 'danger',
	unmeasured: 'brand',
} as const;

/**
 * A unidade do KPI é texto livre no contrato ("R$", "%", "un", "clientes"…),
 * então a formatação é por heurística e não por enum.
 */
export function formatKpiValue(
	value: number | null | undefined,
	unit: string | null,
) {
	if (value === null || value === undefined) return '—';

	const u = (unit ?? '').trim().toLowerCase();

	if (u.includes('r$') || u.includes('reais') || u === 'brl') {
		return value.toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL',
			maximumFractionDigits: value >= 1000 ? 0 : 2,
		});
	}

	const formatted = value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
	if (u === '%' || u.includes('percent')) return `${formatted}%`;
	return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Variação entre as duas últimas medições.
 *
 * A cor não sai do sinal do número: um KPI de custo tem `direction:
 * 'down_good'`, e nele uma queda é a boa notícia.
 */
export function computeDelta(
	kpi: MntKpi,
	history: MntKpiMeasurement[] | undefined,
) {
	if (!history || history.length < 2) return null;

	const measured = history
		.filter((m) => m.value !== null)
		.sort((a, b) => a.measured_at.localeCompare(b.measured_at));

	if (measured.length < 2) return null;

	const current = measured[measured.length - 1].value as number;
	const previous = measured[measured.length - 2].value as number;
	if (previous === 0) return null;

	return {
		pct: ((current - previous) / Math.abs(previous)) * 100,
		caption: 'vs medição anterior',
		upIsGood: kpi.direction === 'up_good',
	};
}

export function KpiEvolutionChart({
	kpis,
	histories,
	months,
}: {
	kpis: MntKpi[];
	histories: Array<MntKpiMeasurement[] | undefined>;
	months: number;
}) {
	const { rows, series } = useMemo(
		() => buildSeries(kpis, histories, months),
		[kpis, histories, months],
	);

	if (series.length === 0 || rows.length === 0) {
		return (
			<p className="text-body text-muted py-12 text-center">
				Ainda não há medições suficientes para desenhar a evolução.
			</p>
		);
	}

	return (
		<>
			<div className="flex flex-wrap items-center gap-4 mb-3">
				{series.map((s, i) => (
					<span
						key={s.key}
						className="inline-flex items-center gap-1.5 text-caption text-secondary"
					>
						<span
							className="w-2 h-2 rounded-full"
							style={{
								backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length],
							}}
							aria-hidden
						/>
						{s.label}
					</span>
				))}
			</div>
			<ResponsiveContainer width="100%" height={220}>
				<LineChart
					data={rows}
					margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
				>
					<CartesianGrid
						strokeDasharray="4 4"
						stroke="currentColor"
						className="text-subtle"
						vertical={false}
					/>
					<XAxis
						dataKey="label"
						tickLine={false}
						axisLine={false}
						stroke="currentColor"
						className="text-muted"
						fontSize={12}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						stroke="currentColor"
						className="text-muted"
						fontSize={12}
					/>
					<Tooltip
						contentStyle={{
							borderRadius: 12,
							border: '1px solid var(--color-subtle)',
							background: 'var(--color-surface)',
							color: 'var(--color-primary)',
							fontSize: 12,
						}}
					/>
					{series.map((s, i) => (
						<Line
							key={s.key}
							type="monotone"
							dataKey={s.key}
							name={s.label}
							stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
							strokeWidth={2}
							dot={false}
							connectNulls
						/>
					))}
				</LineChart>
			</ResponsiveContainer>
		</>
	);
}

/**
 * Achata N históricos em uma tabela mês × KPI, que é o formato que o recharts
 * consome. Meses sem medição ficam ausentes de propósito: `connectNulls` liga
 * os pontos em vez de desenhar um vale falso até o zero.
 */
function buildSeries(
	kpis: MntKpi[],
	histories: Array<MntKpiMeasurement[] | undefined>,
	months: number,
) {
	const cutoff = new Date();
	cutoff.setMonth(cutoff.getMonth() - months);

	const byMonth = new Map<string, Record<string, number | string>>();
	const series: Array<{ key: string; label: string }> = [];

	kpis.forEach((kpi, i) => {
		const measurements = histories[i];
		if (!measurements?.length) return;

		const key = `k${i}`;
		let used = false;

		for (const m of measurements) {
			if (m.value === null) continue;
			const at = new Date(m.measured_at);
			if (Number.isNaN(at.getTime()) || at < cutoff) continue;

			const monthKey = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}`;
			const row = byMonth.get(monthKey) ?? {
				monthKey,
				label: at.toLocaleDateString('pt-BR', { month: 'short' }),
			};
			// Mais de uma medição no mês: fica a mais recente.
			row[key] = m.value;
			byMonth.set(monthKey, row);
			used = true;
		}

		if (used) series.push({ key, label: kpi.name });
	});

	const rows = [...byMonth.values()].sort((a, b) =>
		String(a.monthKey).localeCompare(String(b.monthKey)),
	);

	return { rows, series };
}
