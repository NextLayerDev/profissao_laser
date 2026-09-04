'use client';

// Apresentação da Evolução: o comparador de períodos e a lista de relatórios.
// Recebe tudo resolvido e devolve eventos — quem busca, muta e avisa (toast) é
// o `page.tsx`.
//
// Os estados interessantes daqui dependem de uma jornada com histórico: sem
// Foto Zero enviada não há comparação nenhuma, e ver deltas positivos,
// negativos e nulos na mesma tabela exige meses de snapshots.
// `app/(dev)/mentoria-evolucao-check` monta os cenários com fixtures.

import { Badge, Button, buttonLabel, Table } from '@upvox-dev/ui';
import { Camera, FileText, TrendingUp } from 'lucide-react';
import { Text } from 'react-native-css/components/Text';
import {
	DeltaPill,
	ListRow,
	SectionCard,
} from '@/modules/mentoria/components/ui';
import type { Comparison, MntReport } from '@/modules/mentoria/types';
import {
	EmptyState,
	fmtDate,
	INPUT,
	LABEL,
	MntHeader,
} from '../../_components/shared';
import { RaioxView } from './raiox-view';

/** Rótulos das métricas do comparador. Chave desconhecida cai na própria chave. */
const METRIC_LABEL: Record<string, string> = {
	faturamento: 'Faturamento',
	custos_fixos: 'Custos fixos',
	margem: 'Margem (%)',
	ticket: 'Ticket médio',
	vendas: 'Vendas/mês',
	clientes: 'Clientes',
	funcionarios: 'Funcionários',
	recorrencia: 'Clientes recorrentes (%)',
	maturidade_geral: 'Maturidade geral (%)',
};

/**
 * Métricas em que SUBIR é ruim. A cor da variação não pode sair só do sinal do
 * número: custo fixo crescendo é o oposto de faturamento crescendo.
 *
 * `funcionarios` fica de fora de propósito — cresce por contratar (bom) ou por
 * inchaço (ruim), e essa leitura não se decide aqui.
 */
const DOWN_IS_GOOD = new Set(['custos_fixos']);

/** Os quatro estados do comparador, resolvidos no container. */
export type ComparisonState = 'loading' | 'error' | 'empty' | 'ready';

export type PeriodOption = { value: string; label: string };

type DeltaRow = {
	key: string;
	label: string;
	from: number | null;
	to: number | null;
	delta: number | null;
	deltaPct: number | null;
};

export function EvolucaoView({
	options,
	from,
	to,
	onFromChange,
	onToChange,
	comparisonState,
	comparison,
	reports,
	openReport,
	onToggleReport,
	snapshotting,
	onSnapshot,
	generating,
	onGenerate,
}: {
	options: PeriodOption[];
	from: string;
	to: string;
	onFromChange: (value: string) => void;
	onToChange: (value: string) => void;
	comparisonState: ComparisonState;
	comparison: Comparison | undefined;
	reports: MntReport[];
	openReport: MntReport | null;
	onToggleReport: (report: MntReport) => void;
	snapshotting: boolean;
	onSnapshot: () => void;
	generating: boolean;
	onGenerate: () => void;
}) {
	return (
		<div className="p-4 md:p-8 max-w-5xl mx-auto">
			<MntHeader
				title="Evolução da empresa"
				subtitle="Compare períodos e gere o Raio-X Empresarial 360°"
				icon={TrendingUp}
				backHref="/course/mentoria"
				actions={
					// Ícone + texto é um ARRAY de children, e array bypassa o wrap
					// automático do Button em <Text> — o texto cru quebraria em runtime.
					<Button
						variant="secondary"
						onPress={onSnapshot}
						disabled={snapshotting}
					>
						<Camera className="h-4 w-4 text-secondary" aria-hidden />
						<Text className={buttonLabel({ variant: 'secondary' })}>
							{snapshotting ? 'Congelando...' : 'Congelar snapshot de agora'}
						</Text>
					</Button>
				}
			/>

			<SectionCard title="Comparar minha empresa" className="mb-8">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
					{/* `<select>` nativo, e não o `Select` do DS: o do DS publica só o
					    GATILHO fechado (sem `options`, sem lista), então usá-lo aqui
					    significaria construir o menu à mão — mais código e pior
					    acessibilidade que o nativo. `INPUT`/`LABEL` já são tokenizados. */}
					<div>
						<label className={LABEL} htmlFor="mnt-evo-from">
							Período A
						</label>
						<select
							id="mnt-evo-from"
							className={INPUT}
							value={from}
							onChange={(e) => onFromChange(e.target.value)}
						>
							{options.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className={LABEL} htmlFor="mnt-evo-to">
							Período B
						</label>
						<select
							id="mnt-evo-to"
							className={INPUT}
							value={to}
							onChange={(e) => onToChange(e.target.value)}
						>
							{options.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))}
						</select>
					</div>
				</div>

				<ComparisonBlock state={comparisonState} comparison={comparison} />
			</SectionCard>

			<SectionCard
				title="Raio-X Empresarial 360°"
				action={
					<Button variant="primary" onPress={onGenerate} disabled={generating}>
						<FileText className="h-4 w-4 text-on-brand" aria-hidden />
						<Text className={buttonLabel({ variant: 'primary' })}>
							{generating ? 'Gerando...' : 'Gerar Raio-X 360°'}
						</Text>
					</Button>
				}
			>
				{reports.length === 0 ? (
					<EmptyState
						icon={FileText}
						title="Nenhum relatório gerado ainda"
						description="O Raio-X consolida: onde comecei, o que diagnosticamos, o que planejamos, o que foi executado, resultados, pendências, evolução e os próximos 90 dias."
					/>
				) : (
					<div className="space-y-2">
						{reports.map((report) => (
							<ListRow
								key={report.id}
								boxed
								title="Raio-X Empresarial"
								description={`Gerado em ${fmtDate(report.generated_at)}`}
								onSelect={() => onToggleReport(report)}
								trailing={
									openReport?.id === report.id ? (
										<Badge tone="brand">Aberto</Badge>
									) : undefined
								}
							/>
						))}
					</div>
				)}
			</SectionCard>

			{openReport && <RaioxView report={openReport} />}
		</div>
	);
}

function ComparisonBlock({
	state,
	comparison,
}: {
	state: ComparisonState;
	comparison: Comparison | undefined;
}) {
	if (state === 'loading') {
		return (
			<div className="h-40 rounded-control bg-surface-sunken animate-pulse" />
		);
	}

	if (state === 'error' || !comparison) {
		return (
			<p className="text-body text-muted">
				Não foi possível comparar esses períodos. Envie o diagnóstico (Foto
				Zero) primeiro.
			</p>
		);
	}

	if (state === 'empty') {
		return (
			<p className="text-body text-muted">
				Sem métricas numéricas em comum entre os dois períodos ainda.
			</p>
		);
	}

	const rows: DeltaRow[] = Object.entries(comparison.deltas).map(
		([key, d]) => ({
			key,
			label: METRIC_LABEL[key] ?? key,
			from: d.from,
			to: d.to,
			delta: d.delta,
			deltaPct: d.delta_pct,
		}),
	);

	return (
		<Table
			rows={rows}
			keyExtractor={(row) => row.key}
			columns={[
				{ header: 'Métrica', align: 'left', flex: 2, cell: (row) => row.label },
				{
					header: comparison.from.label,
					cell: (row) => (row.from === null ? '—' : String(row.from)),
				},
				{
					header: comparison.to.label,
					cell: (row) => (row.to === null ? '—' : String(row.to)),
				},
				{
					header: 'Variação',
					cell: (row) =>
						row.delta === null ? (
							'—'
						) : (
							<DeltaPill
								pct={row.delta}
								unit=""
								upIsGood={!DOWN_IS_GOOD.has(row.key)}
								caption={
									row.deltaPct === null ? undefined : `(${row.deltaPct}%)`
								}
							/>
						),
				},
			]}
		/>
	);
}
