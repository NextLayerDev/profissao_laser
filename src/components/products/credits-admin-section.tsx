'use client';

import { Coins, Plus, SlidersHorizontal, UserCog } from 'lucide-react';
import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import {
	useAdjustVox,
	useAllVoxPackages,
	useCreateVoxPackage,
	useSetVoxPackageStatus,
	useUpdateVoxCost,
	useUpdateVoxPackage,
	useVoxCosts,
} from '@/hooks/use-credits';
import type { VoxFeature, VoxPackage } from '@/types/credits';

type Sub = 'pacotes' | 'custos' | 'ajuste';

const FEATURES: { key: VoxFeature; label: string }[] = [
	{ key: 'previa', label: 'Prévia IA' },
	{ key: 'vectorize', label: 'Vetorização' },
	{ key: 'editor-ai', label: 'Editor IA' },
];

export function CreditsAdminSection() {
	const [sub, setSub] = useState<Sub>('pacotes');

	return (
		<div>
			<div className="flex items-center gap-2 mb-6">
				{(
					[
						['pacotes', 'Pacotes', Coins],
						['custos', 'Custos', SlidersHorizontal],
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
			{sub === 'custos' && <CostsPanel />}
			{sub === 'ajuste' && <AdjustPanel />}
		</div>
	);
}

function PackagesPanel() {
	const { data: packages, isLoading } = useAllVoxPackages();
	const createMut = useCreateVoxPackage();
	const updateMut = useUpdateVoxPackage();
	const statusMut = useSetVoxPackageStatus();
	const [editing, setEditing] = useState<VoxPackage | null>(null);
	const [open, setOpen] = useState(false);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<p className="text-sm text-slate-600 dark:text-gray-400">
					Pacotes de voxes. Criar gera produto/preço no Stripe automaticamente.
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
							className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-5"
						>
							<div className="flex items-start justify-between">
								<p className="font-bold text-slate-900 dark:text-white">
									{p.name}
								</p>
								<span
									className={`text-xs px-2 py-1 rounded-md ${p.active === false ? 'bg-slate-500/15 text-slate-500' : 'bg-emerald-500/15 text-emerald-600'}`}
								>
									{p.active === false ? 'Inativo' : 'Ativo'}
								</span>
							</div>
							<p className="text-sm text-slate-500 mt-1">
								{p.credits} voxes · R$ {p.price.toFixed(2)}
							</p>
							<div className="flex gap-2 mt-4">
								<button
									type="button"
									onClick={() => {
										setEditing(p);
										setOpen(true);
									}}
									className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10"
								>
									Editar
								</button>
								<button
									type="button"
									onClick={() =>
										statusMut.mutate({
											id: p.id,
											active: p.active === false,
										})
									}
									className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10"
								>
									{p.active === false ? 'Ativar' : 'Desativar'}
								</button>
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
		description?: string;
		credits: number;
		price: number;
	}) => void;
}) {
	const [name, setName] = useState(editing?.name ?? '');
	const [description, setDescription] = useState(editing?.description ?? '');
	const [credits, setCredits] = useState(String(editing?.credits ?? ''));
	const [price, setPrice] = useState(String(editing?.price ?? ''));

	return (
		<ModalOverlay onClose={onClose}>
			<div className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{editing ? 'Editar pacote' : 'Novo pacote'}
				</h3>
				<Field label="Nome">
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
					/>
				</Field>
				<Field label="Descrição (opcional)">
					<input
						value={description ?? ''}
						onChange={(e) => setDescription(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
					/>
				</Field>
				<div className="grid grid-cols-2 gap-3">
					<Field label="Voxes">
						<input
							type="number"
							value={credits}
							onChange={(e) => setCredits(e.target.value)}
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
						/>
					</Field>
					<Field label="Preço (R$)">
						<input
							type="number"
							step="0.01"
							value={price}
							onChange={(e) => setPrice(e.target.value)}
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
						/>
					</Field>
				</div>
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
						disabled={pending || !name || !credits || !price}
						onClick={() =>
							onSubmit({
								name: name.trim(),
								description: description?.trim() || undefined,
								credits: Number(credits),
								price: Number(price),
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

function CostsPanel() {
	const { data: costs } = useVoxCosts();
	const updateMut = useUpdateVoxCost();
	const [draft, setDraft] = useState<Record<string, string>>({});

	return (
		<div className="max-w-md space-y-4">
			{FEATURES.map((f) => {
				const current = costs?.find((c) => c.feature === f.key)?.cost ?? 0;
				return (
					<div
						key={f.key}
						className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 p-4"
					>
						<span className="flex-1 text-sm font-medium text-slate-700 dark:text-gray-200">
							{f.label}
						</span>
						<input
							type="number"
							defaultValue={current}
							onChange={(e) =>
								setDraft((d) => ({ ...d, [f.key]: e.target.value }))
							}
							className="w-24 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
						/>
						<button
							type="button"
							disabled={updateMut.isPending}
							onClick={() =>
								updateMut.mutate({
									feature: f.key,
									cost: Number(draft[f.key] ?? current),
								})
							}
							className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white disabled:opacity-60"
						>
							Salvar
						</button>
					</div>
				);
			})}
		</div>
	);
}

function AdjustPanel() {
	const adjustMut = useAdjustVox();
	const [customerId, setCustomerId] = useState('');
	const [amount, setAmount] = useState('');
	const [reason, setReason] = useState('');

	return (
		<div className="max-w-md space-y-4">
			<Field label="Customer ID">
				<input
					value={customerId}
					onChange={(e) => setCustomerId(e.target.value)}
					className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
				/>
			</Field>
			<Field label="Quantidade (use negativo para debitar)">
				<input
					type="number"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
				/>
			</Field>
			<Field label="Motivo">
				<input
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
				/>
			</Field>
			<button
				type="button"
				disabled={adjustMut.isPending || !customerId || !amount || !reason}
				onClick={() =>
					adjustMut.mutate(
						{
							customerId: customerId.trim(),
							amount: Number(amount),
							reason: reason.trim(),
						},
						{
							onSuccess: () => {
								setCustomerId('');
								setAmount('');
								setReason('');
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
