'use client';

import { Infinity as InfinityIcon, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { useTools } from '@/modules/tools';

interface Props {
	excludeKeys: string[];
	pending: boolean;
	onClose: () => void;
	onAdd: (args: { toolKey: string; free_quota: number | null }) => void;
}

type QuotaMode = 'unlimited' | 'gated' | 'int';

export function AddToolModal({ excludeKeys, pending, onClose, onAdd }: Props) {
	const tools = useTools();
	const [search, setSearch] = useState('');
	const [pickedKey, setPickedKey] = useState<string | null>(null);
	const [quotaMode, setQuotaMode] = useState<QuotaMode>('unlimited');
	const [quotaValue, setQuotaValue] = useState('');

	const available = useMemo(() => {
		const excluded = new Set(excludeKeys);
		const q = search.trim().toLowerCase();
		return (tools.data ?? [])
			.filter((t) => !excluded.has(t.key))
			.filter(
				(t) =>
					!q ||
					t.name.toLowerCase().includes(q) ||
					t.key.toLowerCase().includes(q),
			);
	}, [tools.data, excludeKeys, search]);

	function quotaFromState(): number | null {
		if (quotaMode === 'unlimited') return null;
		if (quotaMode === 'gated') return 0;
		const n = Number(quotaValue);
		return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
	}

	function confirm() {
		if (!pickedKey) return;
		onAdd({ toolKey: pickedKey, free_quota: quotaFromState() });
	}

	return (
		<ModalOverlay onClose={onClose} tone="tools">
			<div className="flex flex-col max-h-[80vh]">
				<div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-white/10">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						Adicionar funcionalidade ao plano
					</h3>
					<p className="text-sm text-slate-500 mt-1">
						Tools registradas no sistema que ainda não estão neste plano.
					</p>

					<div className="relative mt-3">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Buscar por nome ou key..."
							className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
						/>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto px-6 py-4">
					{tools.isLoading ? (
						<div className="flex justify-center py-12">
							<div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
						</div>
					) : tools.error ? (
						<p className="text-sm text-red-500 text-center py-8">
							Erro ao carregar tools
						</p>
					) : available.length === 0 ? (
						<p className="text-sm text-slate-500 text-center py-8">
							{search
								? 'Nenhuma tool encontrada.'
								: 'Todas as tools já foram adicionadas a este plano.'}
						</p>
					) : (
						<div className="space-y-2">
							{available.map((t) => {
								const picked = pickedKey === t.key;
								return (
									<button
										key={t.key}
										type="button"
										onClick={() => setPickedKey(t.key)}
										className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
											picked
												? 'border-violet-500 bg-violet-500/5'
												: 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-violet-500/40'
										}`}
									>
										<input
											type="radio"
											readOnly
											checked={picked}
											className="shrink-0"
										/>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<p className="font-medium text-slate-900 dark:text-white truncate">
													{t.name}
												</p>
												{!t.enabled && (
													<span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600">
														desabilitada
													</span>
												)}
											</div>
											<p className="text-xs text-slate-500 font-mono">
												{t.key}
											</p>
											{t.description && (
												<p className="text-xs text-slate-500 mt-1 line-clamp-2">
													{t.description}
												</p>
											)}
										</div>
										<div className="flex items-center gap-1 text-sm text-slate-500 tabular-nums shrink-0">
											<VoxxysIcon className="w-3.5 h-3.5" />
											{t.vox_cost}
										</div>
									</button>
								);
							})}
						</div>
					)}
				</div>

				<div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 space-y-3">
					<div>
						<p className="text-xs font-medium text-slate-500 mb-2">
							Cota grátis no plano
						</p>
						<div className="grid grid-cols-3 gap-2">
							<QuotaModeButton
								active={quotaMode === 'unlimited'}
								onClick={() => setQuotaMode('unlimited')}
								icon={<InfinityIcon className="w-3.5 h-3.5" />}
								label="Ilimitado"
								hint="nunca cobra voxxys"
							/>
							<QuotaModeButton
								active={quotaMode === 'int'}
								onClick={() => setQuotaMode('int')}
								icon={<span className="text-xs font-bold">N</span>}
								label="Quantidade"
								hint="N usos/mês grátis"
							/>
							<QuotaModeButton
								active={quotaMode === 'gated'}
								onClick={() => setQuotaMode('gated')}
								icon={<VoxxysIcon className="w-3.5 h-3.5" />}
								label="Sem cota"
								hint="sempre cobra voxxys"
							/>
						</div>
						{quotaMode === 'int' && (
							<input
								type="number"
								min={1}
								value={quotaValue}
								onChange={(e) => setQuotaValue(e.target.value)}
								placeholder="ex: 10"
								className="mt-2 w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
							/>
						)}
					</div>

					<div className="flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
						>
							Cancelar
						</button>
						<button
							type="button"
							disabled={!pickedKey || pending}
							onClick={confirm}
							className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white disabled:opacity-60"
						>
							{pending ? 'Adicionando...' : 'Adicionar'}
						</button>
					</div>
				</div>
			</div>
		</ModalOverlay>
	);
}

function QuotaModeButton({
	active,
	onClick,
	icon,
	label,
	hint,
}: {
	active: boolean;
	onClick: () => void;
	icon: React.ReactNode;
	label: string;
	hint: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition-colors ${
				active
					? 'border-violet-500 bg-violet-500/5'
					: 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-violet-500/40'
			}`}
		>
			<div className="flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-white">
				{icon}
				{label}
			</div>
			<p className="text-xs text-slate-500">{hint}</p>
		</button>
	);
}
