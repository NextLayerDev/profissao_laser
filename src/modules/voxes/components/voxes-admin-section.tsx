'use client';

import { Coins, Plus, UserCog } from 'lucide-react';
import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useAdjustVoxes } from '../hooks/use-adjust-voxes';
import {
	useAllVoxPackages,
	useCreateVoxPackage,
	useSetVoxPackagePublished,
	useUpdateVoxPackage,
} from '../hooks/use-vox-packages-admin';
import type { VoxPackage } from '../types/voxes';

type Sub = 'pacotes' | 'ajuste';

export function VoxesAdminSection() {
	const [sub, setSub] = useState<Sub>('pacotes');

	return (
		<div>
			<div className="flex items-center gap-2 mb-6">
				{(
					[
						['pacotes', 'Pacotes', Coins],
						['ajuste', 'Ajuste manual', UserCog],
					] as const
				).map(([key, label, Icon]) => (
					<button
						key={key}
						type="button"
						onClick={() => setSub(key)}
						className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
							sub === key
								? 'bg-violet-600 text-white'
								: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800'
						}`}
					>
						<Icon className="w-4 h-4" />
						{label}
					</button>
				))}
			</div>

			{sub === 'pacotes' && <PackagesPanel />}
			{sub === 'ajuste' && <AdjustPanel />}
		</div>
	);
}

function PackagesPanel() {
	const { data: packages, isLoading } = useAllVoxPackages();
	const createMut = useCreateVoxPackage();
	const updateMut = useUpdateVoxPackage();
	const publishMut = useSetVoxPackagePublished();
	const [editing, setEditing] = useState<VoxPackage | null>(null);
	const [open, setOpen] = useState(false);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<p className="text-sm text-slate-600 dark:text-gray-400">
					Pacotes de voxxys. Stripe é integrado via{' '}
					<code className="text-xs">stripe_price_id</code>.
				</p>
				<button
					type="button"
					onClick={() => {
						setEditing(null);
						setOpen(true);
					}}
					className="flex items-center gap-2 bg-violet-600 rounded-xl px-5 py-3 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
				>
					<Plus className="w-4 h-4" />
					Novo pacote
				</button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{(packages ?? []).map((p) => (
						<div
							key={p.id}
							className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-linear-to-br from-white via-amber-50/40 to-orange-50/30 dark:from-[#1a1a1d] dark:via-amber-950/20 dark:to-orange-950/10 p-5 flex flex-col"
						>
							<div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-amber-500/15 dark:bg-amber-500/10 blur-3xl" />
							<div className="pointer-events-none absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-orange-500/10 dark:bg-orange-500/10 blur-3xl" />

							<div className="relative flex flex-col flex-1">
								<div className="flex items-start justify-between gap-2">
									<p className="font-bold text-slate-900 dark:text-white truncate">
										{p.name}
									</p>
									<span
										className={`shrink-0 text-xs px-2 py-1 rounded-md ${
											p.published
												? 'bg-emerald-500/15 text-emerald-600'
												: 'bg-slate-500/15 text-slate-500'
										}`}
									>
										{p.published ? 'Publicado' : 'Despublicado'}
									</span>
								</div>

								<div className="mt-3 flex items-baseline gap-2">
									<span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
										{p.vox_amount}
									</span>
									<span className="text-sm text-slate-500">voxxys</span>
								</div>
								<p className="text-sm text-slate-600 dark:text-gray-300 tabular-nums">
									<span className="text-xs text-slate-500 mr-0.5">R$</span>
									{(p.price_cents / 100).toFixed(2)}
								</p>

								{!p.stripe_price_id && (
									<p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
										⚠ sem stripe_price_id — checkout indisponível
									</p>
								)}

								<div className="mt-auto pt-4 flex gap-2">
									<button
										type="button"
										onClick={() => {
											setEditing(p);
											setOpen(true);
										}}
										className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
									>
										Editar
									</button>
									<button
										type="button"
										disabled={publishMut.isPending}
										onClick={() =>
											publishMut.mutate({
												id: p.id,
												published: !p.published,
											})
										}
										className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60"
									>
										{p.published ? 'Despublicar' : 'Publicar'}
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{open && (
				<PackageModal
					editing={editing}
					pending={createMut.isPending || updateMut.isPending}
					onClose={() => setOpen(false)}
					onSubmit={(payload) => {
						if (editing) {
							updateMut.mutate(
								{ id: editing.id, payload },
								{ onSuccess: () => setOpen(false) },
							);
						} else {
							createMut.mutate(payload, { onSuccess: () => setOpen(false) });
						}
					}}
				/>
			)}
		</div>
	);
}

function PackageModal({
	editing,
	pending,
	onClose,
	onSubmit,
}: {
	editing: VoxPackage | null;
	pending: boolean;
	onClose: () => void;
	onSubmit: (p: {
		name: string;
		vox_amount: number;
		price_cents: number;
		published: boolean;
	}) => void;
}) {
	const [name, setName] = useState(editing?.name ?? '');
	const [voxAmount, setVoxAmount] = useState(String(editing?.vox_amount ?? ''));
	const [priceReais, setPriceReais] = useState(
		editing ? (editing.price_cents / 100).toFixed(2) : '',
	);
	const [published, setPublished] = useState(editing?.published ?? true);

	const canSubmit =
		!!name.trim() &&
		Number(voxAmount) > 0 &&
		Number(priceReais) >= 0 &&
		!pending;

	return (
		<ModalOverlay onClose={onClose} tone="voxes">
			<div className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{editing ? 'Editar pacote' : 'Novo pacote'}
				</h3>
				<Field label="Nome">
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
					/>
				</Field>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Voxxys">
						<input
							type="number"
							min={1}
							value={voxAmount}
							onChange={(e) => setVoxAmount(e.target.value)}
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
						/>
					</Field>
					<Field label="Preço (R$)">
						<input
							type="number"
							min={0}
							step="0.01"
							value={priceReais}
							onChange={(e) => setPriceReais(e.target.value)}
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
						/>
					</Field>
				</div>
				<label className="flex items-center gap-2 text-sm text-slate-900 dark:text-white">
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
						className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
					>
						Cancelar
					</button>
					<button
						type="button"
						disabled={!canSubmit}
						onClick={() =>
							onSubmit({
								name: name.trim(),
								vox_amount: Number(voxAmount),
								price_cents: Math.round(Number(priceReais) * 100),
								published,
							})
						}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white disabled:opacity-60"
					>
						{pending ? 'Salvando...' : 'Salvar'}
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}

function AdjustPanel() {
	const adjustMut = useAdjustVoxes();
	const [customerId, setCustomerId] = useState('');
	const [delta, setDelta] = useState('');
	const [note, setNote] = useState('');

	const canSubmit =
		!adjustMut.isPending &&
		customerId.trim().length > 0 &&
		delta.trim().length > 0 &&
		Number.isInteger(Number(delta));

	return (
		<div className="max-w-md space-y-4">
			<Field label="Customer ID">
				<input
					value={customerId}
					onChange={(e) => setCustomerId(e.target.value)}
					placeholder="uuid do customer"
					className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
				/>
			</Field>
			<Field label="Delta (use negativo para debitar)">
				<input
					type="number"
					value={delta}
					onChange={(e) => setDelta(e.target.value)}
					className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
				/>
			</Field>
			<Field label="Nota (opcional)">
				<input
					value={note}
					onChange={(e) => setNote(e.target.value)}
					placeholder="contexto do ajuste"
					className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
				/>
			</Field>
			<button
				type="button"
				disabled={!canSubmit}
				onClick={() =>
					adjustMut.mutate(
						{
							customer_id: customerId.trim(),
							delta: Number(delta),
							note: note.trim() || undefined,
						},
						{
							onSuccess: () => {
								setCustomerId('');
								setDelta('');
								setNote('');
							},
						},
					)
				}
				className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white disabled:opacity-60"
			>
				{adjustMut.isPending ? 'Aplicando...' : 'Aplicar ajuste'}
			</button>
			<p className="text-xs text-slate-400">
				O saldo nunca fica abaixo de zero (validado no backend).
			</p>
		</div>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: label wraps input children implicitly
		<label className="block">
			<span className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">
				{label}
			</span>
			{children}
		</label>
	);
}
