'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Plus, X } from 'lucide-react';
import { useState } from 'react';
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { toast } from 'sonner';
import {
	createFinancialEntry,
	listFinancialEntries,
} from '@/modules/mentoria/service';
import type { MntFinancialEntry } from '@/modules/mentoria/types';
import {
	BTN_GHOST,
	BTN_PRIMARY,
	CARD,
	EmptyState,
	fmtMoney,
	INPUT,
	LABEL,
	MntSkeleton,
} from '../shared';

const MONEY_FIELDS: Array<{ key: keyof EntryForm; label: string }> = [
	{ key: 'revenue', label: 'Faturamento' },
	{ key: 'fixed_costs', label: 'Custos fixos' },
	{ key: 'variable_costs', label: 'Custos variáveis' },
	{ key: 'payroll', label: 'Folha de pagamento' },
	{ key: 'marketing', label: 'Marketing' },
	{ key: 'taxes', label: 'Impostos' },
	{ key: 'pro_labore', label: 'Pró-labore' },
	{ key: 'investments', label: 'Investimentos' },
];

type EntryForm = {
	month: string;
	revenue: string;
	fixed_costs: string;
	variable_costs: string;
	payroll: string;
	marketing: string;
	taxes: string;
	pro_labore: string;
	investments: string;
	notes: string;
};

const EMPTY_FORM: EntryForm = {
	month: '',
	revenue: '',
	fixed_costs: '',
	variable_costs: '',
	payroll: '',
	marketing: '',
	taxes: '',
	pro_labore: '',
	investments: '',
	notes: '',
};

function num(v: string): number | null {
	if (v.trim() === '') return null;
	const n = Number(v.replace(',', '.'));
	return Number.isFinite(n) ? n : null;
}

function fmtMonth(month: string): string {
	// month vem como YYYY-MM ou YYYY-MM-DD
	const [y, m] = month.split('-');
	return y && m ? `${m}/${y}` : month;
}

/** Ferramenta financial_panel: fechamento financeiro mensal com evolução. */
export function ToolFinancialPanel({ journeyId }: { journeyId: string }) {
	const qc = useQueryClient();
	const queryKey = ['mentoria', 'financial-entries', journeyId];

	const { data: entries, isLoading } = useQuery({
		queryKey,
		queryFn: () => listFinancialEntries(journeyId),
	});

	const [adding, setAdding] = useState(false);
	const [form, setForm] = useState<EntryForm>(EMPTY_FORM);

	const create = useMutation({
		mutationFn: () =>
			createFinancialEntry(journeyId, {
				month: form.month,
				revenue: num(form.revenue),
				fixed_costs: num(form.fixed_costs),
				variable_costs: num(form.variable_costs),
				payroll: num(form.payroll),
				marketing: num(form.marketing),
				taxes: num(form.taxes),
				pro_labore: num(form.pro_labore),
				investments: num(form.investments),
				notes: form.notes || null,
			}),
		onSuccess: () => {
			setForm(EMPTY_FORM);
			setAdding(false);
			qc.invalidateQueries({ queryKey });
			toast.success('Fechamento do mês registrado!');
		},
		onError: () => toast.error('Não foi possível registrar o fechamento.'),
	});

	if (isLoading) return <MntSkeleton />;

	// Última versão de cada mês, ordenada cronologicamente
	const byMonth = new Map<string, MntFinancialEntry>();
	for (const e of entries ?? []) {
		const prev = byMonth.get(e.month);
		if (!prev || e.version > prev.version) byMonth.set(e.month, e);
	}
	const rows = [...byMonth.values()].sort((a, b) =>
		a.month.localeCompare(b.month),
	);

	const chartData = rows.map((e) => ({
		month: fmtMonth(e.month),
		Faturamento: e.revenue ?? 0,
		Lucro: e.profit ?? 0,
	}));

	return (
		<div className="space-y-5">
			{rows.length === 0 ? (
				<EmptyState
					icon={DollarSign}
					title="Nenhum fechamento registrado"
					description="Registre o fechamento de cada mês (faturamento, custos, pró-labore) para enxergar o lucro e a margem real da empresa."
				/>
			) : (
				<>
					<section className={`${CARD} p-5`}>
						<h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
							Evolução: faturamento × lucro
						</h3>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={chartData}>
									<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
									<XAxis dataKey="month" tick={{ fontSize: 12 }} />
									<YAxis tick={{ fontSize: 12 }} width={80} />
									<Tooltip formatter={(v) => fmtMoney(Number(v))} />
									<Legend />
									<Line
										type="monotone"
										dataKey="Faturamento"
										stroke="#0d9488"
										strokeWidth={2}
										dot={{ r: 3 }}
									/>
									<Line
										type="monotone"
										dataKey="Lucro"
										stroke="#f59e0b"
										strokeWidth={2}
										dot={{ r: 3 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					</section>

					<section className={`${CARD} p-5 overflow-x-auto`}>
						<h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
							Fechamentos mensais
						</h3>
						<table className="w-full text-sm min-w-[640px]">
							<thead>
								<tr className="text-left text-xs uppercase tracking-wide text-slate-400 dark:text-gray-500 border-b border-slate-200 dark:border-white/10">
									<th className="py-2 pr-3">Mês</th>
									<th className="py-2 pr-3">Faturamento</th>
									<th className="py-2 pr-3">Custos fixos</th>
									<th className="py-2 pr-3">Custos variáveis</th>
									<th className="py-2 pr-3">Resultado</th>
									<th className="py-2 pr-3">Lucro</th>
									<th className="py-2">Margem</th>
								</tr>
							</thead>
							<tbody>
								{[...rows].reverse().map((e) => (
									<tr
										key={e.id}
										className="border-b border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300"
									>
										<td className="py-2 pr-3 font-medium">
											{fmtMonth(e.month)}
										</td>
										<td className="py-2 pr-3">{fmtMoney(e.revenue)}</td>
										<td className="py-2 pr-3">{fmtMoney(e.fixed_costs)}</td>
										<td className="py-2 pr-3">{fmtMoney(e.variable_costs)}</td>
										<td className="py-2 pr-3">
											{fmtMoney(e.operating_result)}
										</td>
										<td
											className={`py-2 pr-3 font-medium ${
												(e.profit ?? 0) < 0
													? 'text-red-600 dark:text-red-400'
													: 'text-emerald-600 dark:text-emerald-400'
											}`}
										>
											{fmtMoney(e.profit)}
										</td>
										<td className="py-2">
											{e.margin_pct !== null
												? `${e.margin_pct.toFixed(1)}%`
												: '—'}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</section>
				</>
			)}

			{adding ? (
				<div className={`${CARD} p-5 space-y-3 max-w-2xl`}>
					<div className="flex items-center justify-between">
						<p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							Fechamento do mês
						</p>
						<button
							type="button"
							className="text-slate-400 hover:text-slate-600"
							onClick={() => {
								setAdding(false);
								setForm(EMPTY_FORM);
							}}
						>
							<X className="w-4 h-4" />
						</button>
					</div>
					<div>
						<label className={LABEL} htmlFor="mnt-fin-month">
							Mês *
						</label>
						<input
							id="mnt-fin-month"
							type="month"
							className={INPUT}
							value={form.month}
							onChange={(e) =>
								setForm((f) => ({ ...f, month: e.target.value }))
							}
						/>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{MONEY_FIELDS.map((field) => (
							<div key={field.key}>
								<label className={LABEL} htmlFor={`mnt-fin-${field.key}`}>
									{field.label} (R$)
								</label>
								<input
									id={`mnt-fin-${field.key}`}
									type="number"
									step="0.01"
									className={INPUT}
									value={form[field.key]}
									onChange={(e) =>
										setForm((f) => ({ ...f, [field.key]: e.target.value }))
									}
									placeholder="Deixe vazio se não souber"
								/>
							</div>
						))}
					</div>
					<textarea
						className={INPUT}
						rows={2}
						value={form.notes}
						onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
						placeholder="Observações do mês"
					/>
					<button
						type="button"
						className={BTN_PRIMARY}
						disabled={!form.month || create.isPending}
						onClick={() => create.mutate()}
					>
						{create.isPending ? 'Registrando...' : 'Registrar fechamento'}
					</button>
				</div>
			) : (
				<button
					type="button"
					className={BTN_GHOST}
					onClick={() => setAdding(true)}
				>
					<Plus className="w-4 h-4" />
					Registrar fechamento do mês
				</button>
			)}
		</div>
	);
}
