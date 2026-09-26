'use client';

import { ShieldCheck } from 'lucide-react';
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
				<PolarGrid
					stroke="currentColor"
					className="text-slate-200 dark:text-white/10"
				/>
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

/**
 * Selo da base do score: com ferramenta validada pelo mentor, o Mapa conta
 * só as validadas; sem nenhuma, é o que o aluno preencheu (autodeclarado).
 */
export function MaturityBasisBadge({ map }: { map: CompanyMap }) {
	const validated = map.basis === 'validated';
	return (
		<span
			data-testid="maturity-basis"
			title={
				validated
					? `Conta só o que o mentor validou (${map.validated_count ?? 0}). Autodeclarado: ${Math.round(map.self_declared_pct ?? 0)}%`
					: 'Ainda sem validação do mentor'
			}
			className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
				validated
					? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
					: 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400'
			}`}
		>
			{validated && <ShieldCheck className="w-3 h-3" aria-hidden />}
			{validated ? 'Validado' : 'Autodeclarado'}
		</span>
	);
}

/** Ícone do selo por ferramenta. */
export function ValidatedMark({ className = '' }: { className?: string }) {
	return (
		<ShieldCheck
			className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${className}`}
			aria-label="Validada pelo mentor"
		/>
	);
}
