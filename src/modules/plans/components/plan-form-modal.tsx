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
	const [voxGrant, setVoxGrant] = useState(
		editing?.vox_monthly_grant ? String(editing.vox_monthly_grant) : '0',
	);

	const voxGrantNum = Math.max(0, Math.trunc(Number(voxGrant) || 0));

	const canSubmit =
		!pending && !!name.trim() && (editing !== null || !!key.trim());

	return (
		<ModalOverlay onClose={onClose} tone="plans">
			<div className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{editing ? 'Editar plano' : 'Novo plano'}
				</h3>

				<Field label="Key (snake_case)">
					<input
						value={key}
						onChange={(e) => setKey(e.target.value)}
						placeholder="basic, pro, max..."
						disabled={editing !== null}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white disabled:opacity-60 font-mono"
					/>
				</Field>

				<Field label="Nome">
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Plano Pro"
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
					/>
				</Field>

				<Field label="Descrição (opcional)">
					<textarea
						value={description ?? ''}
						onChange={(e) => setDescription(e.target.value)}
						rows={3}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
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
							placeholder="opcional"
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
						/>
					</Field>
					<Field label="Preço anual (R$)">
						<input
							type="number"
							min={0}
							step="0.01"
							value={yearly}
							onChange={(e) => setYearly(e.target.value)}
							placeholder="opcional"
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
						/>
					</Field>
				</div>
				<p className="text-xs text-slate-500">
					Pelo menos um dos preços precisa ser informado. Stripe Product/Prices
					são criados automaticamente pelo backend.
				</p>

				<Field label="Voxxys grátis por mês">
					<input
						type="number"
						min={0}
						step={1}
						value={voxGrant}
						onChange={(e) => setVoxGrant(e.target.value)}
						placeholder="0 = nenhum"
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
					/>
					<p className="text-xs text-slate-500 mt-1">
						Creditados ao assinante na compra e em cada renovação paga.
					</p>
				</Field>

				{voxGrantNum > 0 && (
					<div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-300 leading-snug">
						<span className="font-semibold">
							Cada voxxy doado entra na fatura aberta a R$ 1,20
						</span>
						, cobrado da empresa no ato de cada concessão (compra e renovações).
						Este plano gera{' '}
						<span className="font-semibold">
							R$ {((voxGrantNum * 120) / 100).toFixed(2).replace('.', ',')}
							/assinante/mês
						</span>{' '}
						na fatura.
					</div>
				)}

				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={published}
						onChange={(e) => setPublished(e.target.checked)}
					/>
					<span className="text-slate-700 dark:text-white">Publicado</span>
				</label>

				<div className="flex gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white"
					>
						Cancelar
					</button>
					<button
						type="button"
						disabled={!canSubmit}
						onClick={() => {
							const base = {
								name: name.trim(),
								description: description?.trim() || undefined,
								published,
								price_monthly_cents: reaisToCents(monthly),
								price_yearly_cents: reaisToCents(yearly),
								vox_monthly_grant: voxGrantNum,
							};
							onSubmit(editing ? base : { ...base, key: key.trim() });
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

function centsToReais(cents: number | null): string {
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
