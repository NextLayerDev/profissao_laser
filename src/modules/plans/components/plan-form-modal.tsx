'use client';

import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import type {
	CreatePlanPayload,
	Plan,
	UpdatePlanPayload,
} from '../types/plans';

interface Props {
	editing: Plan | null;
	pending: boolean;
	onClose: () => void;
	onSubmit: (payload: CreatePlanPayload | UpdatePlanPayload) => void;
}

export function PlanFormModal({ editing, pending, onClose, onSubmit }: Props) {
	const [key, setKey] = useState(editing?.key ?? '');
	const [name, setName] = useState(editing?.name ?? '');
	const [description, setDescription] = useState(editing?.description ?? '');
	const [published, setPublished] = useState(editing?.published ?? false);
	const [monthly, setMonthly] = useState(
		centsToReais(editing?.price_monthly_cents ?? null),
	);
	const [yearly, setYearly] = useState(
		centsToReais(editing?.price_yearly_cents ?? null),
	);

	const isCreating = editing === null;

	const canSubmit =
		!pending &&
		!!name.trim() &&
		(!isCreating ||
			(!!key.trim() && (monthly.trim() !== '' || yearly.trim() !== '')));

	return (
		<ModalOverlay onClose={onClose} tone="plans">
			<div className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{isCreating ? 'Novo plano' : 'Editar plano'}
				</h3>

				<Field label="Key (snake_case)">
					<input
						value={key}
						onChange={(e) => setKey(e.target.value)}
						placeholder="basic, pro, max..."
						disabled={!isCreating}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm disabled:opacity-60 font-mono"
					/>
				</Field>

				<Field label="Nome">
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Plano Pro"
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
					/>
				</Field>

				<Field label="Descrição (opcional)">
					<textarea
						value={description ?? ''}
						onChange={(e) => setDescription(e.target.value)}
						rows={3}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
					/>
				</Field>

				<div className="grid grid-cols-2 gap-3">
					<Field label="Preço mensal (R$)">
						<input
							type="number"
							min={0}
							step="0.01"
							value={monthly}
							onChange={(e) => setMonthly(e.target.value)}
							placeholder="29.90"
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
						/>
					</Field>
					<Field label="Preço anual (R$)">
						<input
							type="number"
							min={0}
							step="0.01"
							value={yearly}
							onChange={(e) => setYearly(e.target.value)}
							placeholder="299.00"
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
						/>
					</Field>
				</div>
				{isCreating && (
					<p className="text-xs text-slate-500">
						Pelo menos um dos preços precisa ser informado. Os Products/Prices
						do Stripe são criados automaticamente.
					</p>
				)}

				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={published}
						onChange={(e) => setPublished(e.target.checked)}
					/>
					Publicado
				</label>

				<div className="flex gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10"
					>
						Cancelar
					</button>
					<button
						type="button"
						disabled={!canSubmit}
						onClick={() => {
							const prices = {
								...(monthly.trim() !== '' && {
									price_monthly_cents: reaisToCents(monthly) ?? 0,
								}),
								...(yearly.trim() !== '' && {
									price_yearly_cents: reaisToCents(yearly) ?? 0,
								}),
							};
							const base = {
								name: name.trim(),
								description: description?.trim() || undefined,
								published,
								...prices,
							};
							if (!isCreating) {
								onSubmit(base);
								return;
							}
							onSubmit({
								...base,
								key: key.trim(),
								price_monthly_cents: reaisToCents(monthly) ?? 0,
								price_yearly_cents: reaisToCents(yearly) ?? 0,
							});
						}}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white disabled:opacity-60"
					>
						{pending ? 'Salvando...' : 'Salvar'}
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}

function centsToReais(cents: number | null | undefined): string {
	if (cents == null) return '';
	return (cents / 100).toFixed(2);
}

function reaisToCents(raw: string): number | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const n = Number(trimmed);
	if (!Number.isFinite(n) || n < 0) return null;
	return Math.round(n * 100);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: label wraps children implicitly
		<label className="block">
			<span className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">
				{label}
			</span>
			{children}
		</label>
	);
}
