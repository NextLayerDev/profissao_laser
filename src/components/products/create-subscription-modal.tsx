'use client';

import {
	CheckCircle2,
	FileUp,
	Loader2,
	Upload,
	X,
	XCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCreateSubscription } from '@/hooks/use-subscription';
import {
	type CsvSubscriptionRow,
	parseSubscriptionCsv,
} from '@/utils/parse-subscription-csv';

interface CreateSubscriptionModalProps {
	stripeProductId: string;
	onClose: () => void;
}

type Tab = 'manual' | 'csv';

type CsvRow = CsvSubscriptionRow;
type CsvResult = { row: CsvRow; status: 'success' | 'error'; error?: string };

const CSV_EXAMPLE = `email,amount,interval,intervalCount,endsAt
cliente@email.com,99.90,month,1,2026-12-31T23:59:59
outro@email.com,49.90,month,1,`;

export function CreateSubscriptionModal({
	stripeProductId,
	onClose,
}: CreateSubscriptionModalProps) {
	const [tab, setTab] = useState<Tab>('manual');
	const [form, setForm] = useState({
		email: '',
		stripeProductId,
		amount: '',
		interval: 'month' as 'day' | 'week' | 'month' | 'year',
		intervalCount: '1',
		endsAt: '',
	});

	// CSV state
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
	const [csvParseErrors, setCsvParseErrors] = useState<string[]>([]);
	const [csvResults, setCsvResults] = useState<CsvResult[]>([]);
	const [csvImporting, setCsvImporting] = useState(false);

	const mutation = useCreateSubscription();

	const handleSubmit = async () => {
		if (!form.email.trim()) {
			toast.error('Informe o e-mail do cliente');
			return;
		}
		if (!form.amount) {
			toast.error('Informe o valor da assinatura');
			return;
		}

		try {
			await mutation.mutateAsync({
				email: form.email,
				stripeProductId: form.stripeProductId,
				amount: parseFloat(form.amount),
				interval: form.interval,
				intervalCount: parseInt(form.intervalCount, 10) || 1,
				endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : '',
			});
			toast.success('Assinatura criada com sucesso!');
			onClose();
		} catch {
			toast.error('Erro ao criar assinatura');
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setCsvResults([]);

		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target?.result as string;
			const { rows, errors } = parseSubscriptionCsv(text, stripeProductId);
			setCsvRows(rows);
			setCsvParseErrors(errors);
		};
		reader.readAsText(file);
	};

	const handleCsvImport = async () => {
		if (csvRows.length === 0) return;
		setCsvImporting(true);
		const results: CsvResult[] = [];

		for (const row of csvRows) {
			const { _line, ...payload } = row;
			try {
				await mutation.mutateAsync(payload);
				results.push({ row, status: 'success' });
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : 'Erro desconhecido';
				results.push({ row, status: 'error', error: msg });
			}
		}

		setCsvResults(results);
		setCsvImporting(false);

		const succeeded = results.filter((r) => r.status === 'success').length;
		const failed = results.filter((r) => r.status === 'error').length;

		if (failed === 0) {
			toast.success(`${succeeded} assinatura(s) importada(s) com sucesso!`);
		} else {
			toast.warning(`${succeeded} importada(s), ${failed} com erro.`);
		}
	};

	const resetCsv = () => {
		setCsvRows([]);
		setCsvParseErrors([]);
		setCsvResults([]);
		if (fileInputRef.current) fileInputRef.current.value = '';
	};

	return (
		<div className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-lg">
				{/* Header */}
				<div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-gray-700">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						Criar Assinatura
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-4 h-4 text-slate-500 dark:text-gray-400" />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-slate-200 dark:border-gray-700 px-5">
					<button
						type="button"
						onClick={() => setTab('manual')}
						className={`py-3 px-1 mr-5 text-sm font-medium border-b-2 transition-colors ${
							tab === 'manual'
								? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
								: 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
						}`}
					>
						Manual
					</button>
					<button
						type="button"
						onClick={() => setTab('csv')}
						className={`flex items-center gap-1.5 py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
							tab === 'csv'
								? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
								: 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200'
						}`}
					>
						<FileUp className="w-4 h-4" />
						Importar CSV
					</button>
				</div>

				{/* Manual tab */}
				{tab === 'manual' && (
					<>
						<div className="p-5 space-y-4">
							<div>
								<label
									htmlFor="sub-email"
									className="text-sm font-medium text-slate-600 dark:text-gray-300 mb-1.5 block"
								>
									E-mail do cliente
								</label>
								<input
									id="sub-email"
									type="email"
									value={form.email}
									onChange={(e) => setForm({ ...form, email: e.target.value })}
									placeholder="cliente@email.com"
									className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
								/>
							</div>

							<div>
								<label
									htmlFor="sub-amount"
									className="text-sm font-medium text-slate-600 dark:text-gray-300 mb-1.5 block"
								>
									Valor (R$)
								</label>
								<input
									id="sub-amount"
									type="number"
									min={0}
									step="0.01"
									value={form.amount}
									onChange={(e) => setForm({ ...form, amount: e.target.value })}
									placeholder="0.00"
									className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label
										htmlFor="sub-interval"
										className="text-sm font-medium text-slate-600 dark:text-gray-300 mb-1.5 block"
									>
										Intervalo
									</label>
									<select
										id="sub-interval"
										value={form.interval}
										onChange={(e) =>
											setForm({
												...form,
												interval: e.target.value as typeof form.interval,
											})
										}
										className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
									>
										<option value="day">Diário</option>
										<option value="week">Semanal</option>
										<option value="month">Mensal</option>
										<option value="year">Anual</option>
									</select>
								</div>

								<div>
									<label
										htmlFor="sub-interval-count"
										className="text-sm font-medium text-slate-600 dark:text-gray-300 mb-1.5 block"
									>
										Quantidade
									</label>
									<input
										id="sub-interval-count"
										type="number"
										min={1}
										value={form.intervalCount}
										onChange={(e) =>
											setForm({ ...form, intervalCount: e.target.value })
										}
										className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
									/>
								</div>
							</div>

							<div>
								<label
									htmlFor="sub-ends-at"
									className="text-sm font-medium text-slate-600 dark:text-gray-300 mb-1.5 block"
								>
									Expira em (opcional)
								</label>
								<input
									id="sub-ends-at"
									type="datetime-local"
									value={form.endsAt}
									onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
									className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
								/>
							</div>
						</div>

						<div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-gray-700">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-sm"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleSubmit}
								disabled={mutation.isPending}
								className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors text-sm disabled:opacity-50"
							>
								{mutation.isPending && (
									<Loader2 className="w-4 h-4 animate-spin" />
								)}
								Criar assinatura
							</button>
						</div>
					</>
				)}

				{/* CSV tab */}
				{tab === 'csv' && (
					<>
						<div className="p-5 space-y-4">
							{/* Format hint */}
							<div className="bg-slate-100 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-lg p-3">
								<p className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-1.5">
									Formato esperado do CSV:
								</p>
								<pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap break-all">
									{CSV_EXAMPLE}
								</pre>
								<ul className="mt-2 space-y-0.5 text-xs text-slate-500 dark:text-gray-500">
									<li>
										<span className="text-slate-600 dark:text-gray-300">
											interval
										</span>{' '}
										— day | week | month | year
									</li>
									<li>
										<span className="text-gray-300">intervalCount</span> —
										inteiro ≥ 1
									</li>
									<li>
										<span className="text-gray-300">endsAt</span> — ISO 8601 ou
										vazio (opcional)
									</li>
								</ul>
							</div>

							{/* File picker */}
							<div>
								<input
									ref={fileInputRef}
									type="file"
									accept=".csv,text/csv"
									onChange={handleFileChange}
									className="hidden"
									id="csv-upload"
								/>
								<label
									htmlFor="csv-upload"
									className="flex flex-col items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-gray-600 hover:border-emerald-500 rounded-lg cursor-pointer transition-colors"
								>
									<Upload className="w-6 h-6 text-slate-400 dark:text-gray-400" />
									<span className="text-sm text-slate-500 dark:text-gray-400">
										Clique para selecionar o arquivo CSV
									</span>
								</label>
							</div>

							{/* Parse errors */}
							{csvParseErrors.length > 0 && (
								<div className="bg-red-950/40 border border-red-700 rounded-lg p-3 space-y-1">
									<p className="text-xs font-medium text-red-400">
										Erros encontrados no CSV:
									</p>
									{csvParseErrors.map((e) => (
										<p key={e} className="text-xs text-red-300">
											{e}
										</p>
									))}
								</div>
							)}

							{/* Preview */}
							{csvRows.length > 0 && csvResults.length === 0 && (
								<div>
									<p className="text-xs font-medium text-gray-400 mb-1.5">
										{csvRows.length} assinatura(s) encontrada(s) — prévia:
									</p>
									<div className="max-h-40 overflow-y-auto space-y-1">
										{csvRows.map((row) => (
											<div
												key={row._line}
												className="flex items-center justify-between text-xs bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded px-3 py-1.5"
											>
												<span className="text-slate-700 dark:text-gray-300 truncate">
													{row.email}
												</span>
												<span className="text-slate-500 dark:text-gray-500 shrink-0 ml-2">
													R$ {row.amount.toFixed(2)} / {row.intervalCount}×
													{row.interval}
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Import results */}
							{csvResults.length > 0 && (
								<div>
									<p className="text-xs font-medium text-gray-400 mb-1.5">
										Resultado:
									</p>
									<div className="max-h-40 overflow-y-auto space-y-1">
										{csvResults.map((r) => (
											<div
												key={r.row._line}
												className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded px-3 py-1.5"
											>
												{r.status === 'success' ? (
													<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
												) : (
													<XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
												)}
												<span
													className={`truncate ${r.status === 'success' ? 'text-slate-700 dark:text-gray-300' : 'text-red-500 dark:text-red-300'}`}
												>
													{r.row.email}
												</span>
												{r.error && (
													<span className="text-slate-500 dark:text-gray-500 shrink-0 ml-auto">
														{r.error}
													</span>
												)}
											</div>
										))}
									</div>
								</div>
							)}
						</div>

						<div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-gray-700">
							{csvResults.length > 0 ? (
								<>
									<button
										type="button"
										onClick={resetCsv}
										className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-sm"
									>
										Novo import
									</button>
									<button
										type="button"
										onClick={onClose}
										className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors text-sm"
									>
										Fechar
									</button>
								</>
							) : (
								<>
									<button
										type="button"
										onClick={onClose}
										className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-sm"
									>
										Cancelar
									</button>
									<button
										type="button"
										onClick={handleCsvImport}
										disabled={csvRows.length === 0 || csvImporting}
										className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors text-sm disabled:opacity-50"
									>
										{csvImporting && (
											<Loader2 className="w-4 h-4 animate-spin" />
										)}
										Importar {csvRows.length > 0 ? `(${csvRows.length})` : ''}
									</button>
								</>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
