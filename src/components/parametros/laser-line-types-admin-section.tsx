'use client';

import {
	Image as ImgIcon,
	Loader2,
	Plus,
	Trash2,
	Upload,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import {
	useCreateLaserLineType,
	useDeleteLaserLineType,
	useLaserLineTypes,
} from '@/hooks/use-laser-line-types';
import type {
	LaserLineType,
	LaserLineTypeSoftware,
} from '@/types/laser-line-type';
import { LASER_LINE_TYPE_SOFTWARES } from '@/types/laser-line-type';

export function LaserLineTypesAdminSection() {
	const [tab, setTab] = useState<LaserLineTypeSoftware>('Ezcad');
	const [showModal, setShowModal] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<LaserLineType | null>(null);

	const { data: lineTypes = [], isLoading } = useLaserLineTypes(tab);
	const deleteMut = useDeleteLaserLineType();

	const handleDelete = (lt: LaserLineType) => {
		deleteMut.mutate(lt.id, {
			onSuccess: () => setDeleteTarget(null),
		});
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3 flex-wrap">
				<div>
					<h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
						Tipos de Linha
					</h2>
					<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
						Catálogo de opções por software. Use no form de Novo Parâmetro.
					</p>
				</div>
				<button
					type="button"
					onClick={() => setShowModal(true)}
					className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
				>
					<Plus className="w-4 h-4" />
					Novo tipo
				</button>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 border-b border-slate-200 dark:border-white/10">
				{LASER_LINE_TYPE_SOFTWARES.map((sw) => (
					<button
						key={sw}
						type="button"
						onClick={() => setTab(sw)}
						className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
							tab === sw
								? 'text-violet-600 dark:text-violet-400 border-violet-500'
								: 'text-slate-600 dark:text-gray-400 border-transparent hover:text-slate-900 dark:hover:text-white'
						}`}
					>
						{sw}
					</button>
				))}
			</div>

			{/* List */}
			{isLoading ? (
				<div className="flex justify-center py-12">
					<Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
				</div>
			) : lineTypes.length === 0 ? (
				<div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-12 text-center">
					<ImgIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Nenhum tipo de linha cadastrado para {tab}.
					</p>
					<button
						type="button"
						onClick={() => setShowModal(true)}
						className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl"
					>
						<Plus className="w-4 h-4" />
						Adicionar primeiro tipo
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{lineTypes.map((lt) => (
						<div
							key={lt.id}
							className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden"
						>
							<div className="aspect-video w-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
								{lt.imageUrl ? (
									<img
										src={lt.imageUrl}
										alt={lt.name}
										className="w-full h-full object-contain"
									/>
								) : (
									<ImgIcon className="w-8 h-8 text-slate-400" />
								)}
							</div>
							<div className="p-3 flex items-center justify-between gap-3">
								<div className="min-w-0">
									<p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
										{lt.name}
									</p>
									<p className="text-xs text-slate-500 dark:text-gray-400">
										Ordem: {lt.order}
									</p>
								</div>
								<button
									type="button"
									onClick={() => setDeleteTarget(lt)}
									className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
									aria-label="Remover"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{showModal && (
				<CreateLineTypeModal
					initialSoftware={tab}
					onClose={() => setShowModal(false)}
				/>
			)}

			{deleteTarget && (
				<ModalOverlay onClose={() => setDeleteTarget(null)}>
					<div className="p-6">
						<h3 className="text-lg font-bold text-slate-900 dark:text-white">
							Remover tipo de linha?
						</h3>
						<p className="text-sm text-slate-600 dark:text-gray-400 mt-2">
							"{deleteTarget.name}" ({deleteTarget.software}) será removido. A
							imagem também sai do CDN.
						</p>
						<div className="mt-6 flex gap-3 justify-end">
							<button
								type="button"
								onClick={() => setDeleteTarget(null)}
								className="px-4 py-2 rounded-lg text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={() => handleDelete(deleteTarget)}
								disabled={deleteMut.isPending}
								className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
							>
								{deleteMut.isPending ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									'Remover'
								)}
							</button>
						</div>
					</div>
				</ModalOverlay>
			)}
		</div>
	);
}

// ─── Create modal ───────────────────────────────────────────────────────

function CreateLineTypeModal({
	initialSoftware,
	onClose,
}: {
	initialSoftware: LaserLineTypeSoftware;
	onClose: () => void;
}) {
	const create = useCreateLaserLineType();
	const [software, setSoftware] =
		useState<LaserLineTypeSoftware>(initialSoftware);
	const [name, setName] = useState('');
	const [order, setOrder] = useState(0);
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);

	const handleFile = (f: File | null) => {
		setFile(f);
		if (f) {
			const reader = new FileReader();
			reader.onload = () => setPreview(reader.result as string);
			reader.readAsDataURL(f);
		} else {
			setPreview(null);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error('Preencha o nome.');
			return;
		}
		create.mutate(
			{
				software,
				name: name.trim(),
				order,
				file: file ?? undefined,
			},
			{ onSuccess: () => onClose() },
		);
	};

	return (
		<ModalOverlay onClose={onClose}>
			<form
				onSubmit={handleSubmit}
				className="p-6 max-h-[90vh] overflow-y-auto"
			>
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						Novo tipo de linha
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="space-y-4">
					<div>
						<label
							htmlFor="ll-software"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1"
						>
							Software *
						</label>
						<select
							id="ll-software"
							value={software}
							onChange={(e) =>
								setSoftware(e.target.value as LaserLineTypeSoftware)
							}
							className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
						>
							{LASER_LINE_TYPE_SOFTWARES.map((sw) => (
								<option key={sw} value={sw}>
									{sw}
								</option>
							))}
						</select>
					</div>

					<div>
						<label
							htmlFor="ll-name"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1"
						>
							Nome *
						</label>
						<input
							id="ll-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="ex: Linha aberta Bidirecional"
							className="w-full h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 px-3 focus:outline-none focus:border-violet-500"
						/>
					</div>

					<div>
						<label
							htmlFor="ll-order"
							className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1"
						>
							Ordem (menor aparece primeiro)
						</label>
						<input
							id="ll-order"
							type="number"
							min={0}
							value={order}
							onChange={(e) => setOrder(Number(e.target.value))}
							className="w-32 h-10 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white px-3 focus:outline-none focus:border-violet-500"
						/>
					</div>

					<div>
						<span className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1">
							Imagem (opcional)
						</span>
						<label className="block cursor-pointer rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-violet-500/50 dark:hover:border-violet-500/40 p-4 text-center transition-colors">
							<input
								type="file"
								accept="image/*"
								onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
								className="hidden"
							/>
							{preview ? (
								<img
									src={preview}
									alt="preview"
									className="max-h-40 mx-auto object-contain rounded"
								/>
							) : (
								<div className="flex flex-col items-center gap-2 py-4">
									<Upload className="w-6 h-6 text-slate-400" />
									<p className="text-sm text-slate-500 dark:text-gray-400">
										Clique pra escolher uma imagem
									</p>
								</div>
							)}
						</label>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 rounded-lg text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={!name.trim() || create.isPending}
							className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
						>
							{create.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
							Criar
						</button>
					</div>
				</div>
			</form>
		</ModalOverlay>
	);
}
