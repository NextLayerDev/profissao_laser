'use client';

import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
} from 'recharts';
import type { CompanyMap } from '../types';

const AREA_LABELS: Record<string, string> = {
	estrategia: 'Estratégia',
	processos: 'Processos',
	pessoas: 'Pessoas',
	indicadores: 'Indicadores',
	financeiro: 'Financeiro',
	comercial: 'Comercial',
	melhoria: 'Melhoria',
	pessoal: 'Pessoal',
};

export function areaLabel(area: string): string {
	return AREA_LABELS[area] ?? area;
}

/** Radar do Mapa da Empresa — maturidade (%) por área. */
export function CompanyMapRadar({ map }: { map: CompanyMap }) {
	const data = map.areas.map((a) => ({
		area: areaLabel(a.area),
		pct: a.maturity_pct,
	}));

	return (
		<ResponsiveContainer width="100%" height={300}>
			<RadarChart data={data} outerRadius="70%">
				<PolarGrid stroke="currentColor" className="text-slate-200 dark:text-white/10" />
				<PolarAngleAxis
					dataKey="area"
					tick={{ fontSize: 11, fill: 'currentColor' }}
					className="text-slate-500 dark:text-gray-400"
				/>
				<PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
				<Radar
					dataKey="pct"
					stroke="#14b8a6"
					fill="#14b8a6"
					fillOpacity={0.35}
				/>
			</RadarChart>
		</ResponsiveContainer>
	);
}
