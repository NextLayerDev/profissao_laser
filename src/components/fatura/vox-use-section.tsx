'use client';

import { Coins, Gift, ReceiptText, Wallet } from 'lucide-react';
import { useVoxUseSummary } from '@/hooks/use-vox-use';
import type { VoxUseStatement } from '@/types/vox-use';

const brl = (cents: number) =>
	(cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const voxes = (value: number) =>
	value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

const STATUS: Record<string, { label: string; className: string }> = {
	reserved: {
		label: 'Reservado',
		className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
	},
	applied: {
		label: 'Descontado',
		className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
	},
	reversed: {
		label: 'Estornado',
		className: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
	},
	released: {
		label: 'Liberado',
		className: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
	},
};

function Stat({
	Icon,
	label,
	value,
	hint,
}: {
	Icon: typeof Coins;
	label: string;
	value: string;
	hint?: string;
}) {
	return (
		<div className="rounded-2xl border border-slate-200 dark:border-gray-800/50 bg-white dark:bg-white/[0.02] p-5">
			<div className="flex items-center justify-between text-sm text-slate-600 dark:text-gray-400">
				{label}
				<Icon className="w-4 h-4" aria-hidden="true" />
			</div>
			<div className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
				{value}
			</div>
			{hint && (
				<div className="mt-1 text-xs text-slate-500 dark:text-gray-500">
					{hint}
				</div>
			)}
		</div>
	);
}

function StatementRow({ row }: { row: VoxUseStatement }) {
	const status = STATUS[row.status] ?? STATUS.released;
	return (
		<tr className="border-t border-slate-100 dark:border-white/5">
			<td className="py-2 pr-3">
				{new Date(row.created_at).toLocaleDateString('pt-BR', {
					timeZone: 'America/Sao_Paulo',
				})}
			</td>
			<td className="py-2 pr-3 text-right tabular-nums">
				{row.method === 'boleto' ? 'Boleto' : brl(row.payment_cents)}
			</td>
			<td className="py-2 pr-3 text-right tabular-nums">
				{row.method === 'boleto' ? '—' : brl(row.fee_cents)}
			</td>
			<td className="py-2 pr-3 text-right tabular-nums font-medium">
				{brl(row.retained_cents)}
			</td>
			<td className="py-2 pr-3 text-right tabular-nums">
				{brl(row.carried_cents)}
			</td>
			<td className="py-2 text-right">
				<span
					className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${status?.className}`}
				>
					{status?.label}
				</span>
			</td>
		</tr>
	);
}

/**
 * Vox por Uso: o expert vê de cara o que foi concedido, usado, o que ainda vai
 * ser descontado e o que já saiu do repasse. Some quando o tenant paga o Vox
 * na concessão (modo `on_grant`).
 */
export function VoxUseSection({ from, to }: { from?: string; to?: string }) {
	const { data } = useVoxUseSummary({ from, to });
	if (!data || data.mode !== 'on_use') return null;

	return (
		<section className="space-y-4" aria-label="Vox por uso">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Stat
					Icon={Gift}
					label="Voxes concedidos"
					value={voxes(data.granted_voxes)}
					hint="Só registro, não cobra"
				/>
				<Stat
					Icon={Coins}
					label="Voxes usados"
					value={voxes(data.used_voxes)}
				/>
				<Stat
					Icon={Wallet}
					label="Cobrado no uso"
					value={brl(data.used_cents)}
					hint="Entra na fatura"
				/>
				<Stat
					Icon={ReceiptText}
					label="Economia"
					value={brl(data.savings_cents)}
					hint="vs. cobrar na concessão"
				/>
			</div>

			{data.statements.length > 0 && (
				<div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/[0.02] p-5 overflow-x-auto">
					<table className="w-full text-sm text-slate-700 dark:text-gray-300">
						<thead className="text-xs text-slate-500 dark:text-gray-500">
							<tr>
								<th className="text-left font-medium pb-2">Data</th>
								<th className="text-right font-medium pb-2">Pagamento</th>
								<th className="text-right font-medium pb-2">Taxa</th>
								<th className="text-right font-medium pb-2">Vox descontado</th>
								<th className="text-right font-medium pb-2">Saldo</th>
								<th className="text-right font-medium pb-2">Status</th>
							</tr>
						</thead>
						<tbody>
							{data.statements.map((row) => (
								<StatementRow key={row.id} row={row} />
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
