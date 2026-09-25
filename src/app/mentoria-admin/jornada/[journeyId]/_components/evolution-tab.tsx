'use client';

import { FileText, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
	ComparisonBlock,
	type ComparisonState,
} from '@/app/course/(shell)/mentoria/evolucao/_components/evolucao-view';
import { RaioxView } from '@/app/course/(shell)/mentoria/evolucao/_components/raiox-view';
import type { MntReport } from '@/modules/mentoria/types';
import {
	useMentorComparison,
	useMentorReports,
	useMentorSnapshots,
} from '../../../_components/admin-hooks';
import {
	Card,
	formatDate,
	inputClass,
	secondaryBtn,
} from '../../../_components/ui';
import { QueryState, SectionTitle } from './common';

export function EvolutionTab({ journeyId }: { journeyId: string }) {
	const snapshots = useMentorSnapshots(journeyId);
	const reports = useMentorReports(journeyId);
	const [from, setFrom] = useState('foto_zero');
	const [to, setTo] = useState('current');
	const [openReport, setOpenReport] = useState<MntReport | null>(null);

	// Sem Foto Zero, comparar com ela só dá 404: nem consulta.
	const missingFotoZero =
		!!snapshots.data &&
		!snapshots.data.some((s) => s.kind === 'foto_zero') &&
		(from === 'foto_zero' || to === 'foto_zero');
	const comparison = useMentorComparison(
		journeyId,
		from,
		to,
		!!snapshots.data && !missingFotoZero,
	);

	const options = useMemo(
		() => [
			{ value: 'foto_zero', label: 'Foto Zero' },
			...(snapshots.data ?? [])
				.filter((s) => s.kind !== 'foto_zero')
				.map((s) => ({
					value: s.id,
					label: `${s.label ?? s.kind} — ${formatDate(s.taken_at)}`,
				})),
			{ value: 'current', label: 'Agora' },
		],
		[snapshots.data],
	);

	const state: ComparisonState = missingFotoZero
		? 'no_foto_zero'
		: comparison.isLoading || snapshots.isLoading
			? 'loading'
			: comparison.isError || !comparison.data
				? 'error'
				: Object.keys(comparison.data.deltas).length === 0
					? 'empty'
					: 'ready';

	return (
		<div className="space-y-10">
			<section>
				<SectionTitle icon={TrendingUp}>Comparador</SectionTitle>
				<Card className="p-5">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
						<PeriodSelect
							id="mentor-evo-from"
							label="Período A"
							value={from}
							options={options}
							onChange={setFrom}
						/>
						<PeriodSelect
							id="mentor-evo-to"
							label="Período B"
							value={to}
							options={options}
							onChange={setTo}
						/>
					</div>
					<div data-testid="mentor-comparison">
						<ComparisonBlock
							state={state}
							comparison={comparison.data}
							noFotoZeroText="O aluno ainda não enviou o diagnóstico."
						/>
					</div>
				</Card>
			</section>

			<section>
				<SectionTitle icon={FileText}>Raio-X 360°</SectionTitle>
				<QueryState
					loading={reports.isLoading}
					error={reports.isError}
					empty={!reports.data?.length}
					errorText="Não foi possível carregar os relatórios."
					emptyText="Nenhum Raio-X gerado."
				>
					<div className="flex flex-wrap gap-2" data-testid="mentor-reports">
						{reports.data?.map((r) => (
							<button
								key={r.id}
								type="button"
								className={secondaryBtn}
								aria-pressed={openReport?.id === r.id}
								onClick={() =>
									setOpenReport(openReport?.id === r.id ? null : r)
								}
							>
								<FileText className="w-3.5 h-3.5" />
								Raio-X de {formatDate(r.generated_at)}
							</button>
						))}
					</div>
					{openReport && <RaioxView report={openReport} />}
				</QueryState>
			</section>
		</div>
	);
}

function PeriodSelect({
	id,
	label,
	value,
	options,
	onChange,
}: {
	id: string;
	label: string;
	value: string;
	options: Array<{ value: string; label: string }>;
	onChange: (v: string) => void;
}) {
	return (
		<div>
			<label className="mb-1.5 block text-label text-primary" htmlFor={id}>
				{label}
			</label>
			<select
				id={id}
				className={inputClass}
				value={value}
				onChange={(e) => onChange(e.target.value)}
			>
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
		</div>
	);
}
