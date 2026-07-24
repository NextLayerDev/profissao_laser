'use client';

import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
	useCreateImageSizePreset,
	useDeleteImageSizePreset,
	useImageSizePresets,
	useUpdateImageSizePreset,
} from '@/modules/tools/hooks/use-image-size-presets';
import type { ImageSizePreset } from '@/modules/tools/services/image-size-preset.service';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { inputCls } from './builder-ui';

const labelCls = 'mb-1.5 block text-[13px] font-medium text-slate-300';

interface PresetFormState {
	name: string;
	width: string;
	height: string;
}

const emptyPresetForm: PresetFormState = { name: '', width: '', height: '' };

/**
 * Modal admin: CRUD das resoluções padrão (`pl_image_size_preset`) usadas no
 * seletor "Padrão" de `ImageSizeControl`. Globais — servem qualquer tool com banco.
 */
export function ImageSizePresetModal({ onClose }: { onClose: () => void }) {
	const presets = useImageSizePresets();
	const createMut = useCreateImageSizePreset();
	const updateMut = useUpdateImageSizePreset();
	const deleteMut = useDeleteImageSizePreset();

	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState<PresetFormState>(emptyPresetForm);
	const saving = createMut.isPending || updateMut.isPending;

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onClose]);

	const startEdit = (p: ImageSizePreset) => {
		setEditingId(p.id);
		setForm({ name: p.name, width: String(p.width), height: String(p.height) });
	};
	const cancelEdit = () => {
		setEditingId(null);
		setForm(emptyPresetForm);
	};

	const save = async () => {
		const width = Number(form.width);
		const height = Number(form.height);
		if (!form.name.trim()) {
			toast.error('Dê um nome pra resolução.');
			return;
		}
		if (!width || !height) {
			toast.error('Preencha largura e altura.');
			return;
		}
		try {
			if (editingId) {
				await updateMut.mutateAsync({
					id: editingId,
					name: form.name.trim(),
					width,
					height,
				});
				toast.success('Resolução atualizada.');
			} else {
				await createMut.mutateAsync({ name: form.name.trim(), width, height });
				toast.success('Resolução criada.');
			}
			cancelEdit();
		} catch (err) {
			toast.error(getApiErrorMessage(err, 'Falha ao salvar a resolução.'));
		}
	};

	const remove = async (p: ImageSizePreset) => {
		if (!window.confirm(`Apagar "${p.name}"?`)) return;
		try {
			await deleteMut.mutateAsync(p.id);
			toast.success('Resolução apagada.');
			if (editingId === p.id) cancelEdit();
		} catch (err) {
			toast.error(getApiErrorMessage(err, 'Falha ao apagar.'));
		}
	};

	return createPortal(
		<div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
			<div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0c0f12] shadow-2xl">
				<header className="flex items-center justify-between border-b border-white/5 px-5 py-3">
					<span className="text-sm font-semibold text-white">
						Resoluções padrão
					</span>
					<button
						type="button"
						onClick={onClose}
						className="rounded p-1 text-slate-500 hover:text-slate-200"
					>
						<X className="h-4 w-4" />
					</button>
				</header>

				<div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
					{/* form criar/editar */}
					<div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
						<div>
							<span className={labelCls}>Nome</span>
							<input
								value={form.name}
								onChange={(e) =>
									setForm((f) => ({ ...f, name: e.target.value }))
								}
								placeholder="Ex.: Quadrado grande"
								className={inputCls}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<span className={labelCls}>Largura (px)</span>
								<input
									type="number"
									value={form.width}
									onChange={(e) =>
										setForm((f) => ({ ...f, width: e.target.value }))
									}
									className={inputCls}
								/>
							</div>
							<div>
								<span className={labelCls}>Altura (px)</span>
								<input
									type="number"
									value={form.height}
									onChange={(e) =>
										setForm((f) => ({ ...f, height: e.target.value }))
									}
									className={inputCls}
								/>
							</div>
						</div>
						<div className="flex items-center justify-end gap-2">
							{editingId && (
								<button
									type="button"
									onClick={cancelEdit}
									className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
								>
									Cancelar
								</button>
							)}
							<button
								type="button"
								onClick={save}
								disabled={saving}
								className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
							>
								{saving ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : editingId ? (
									<Check className="h-3.5 w-3.5" />
								) : (
									<Plus className="h-3.5 w-3.5" />
								)}
								{editingId ? 'Salvar' : 'Adicionar'}
							</button>
						</div>
					</div>

					{/* lista */}
					{presets.isLoading ? (
						<div className="flex justify-center p-6">
							<Loader2 className="h-5 w-5 animate-spin text-fuchsia-400" />
						</div>
					) : (presets.data ?? []).length === 0 ? (
						<p className="py-4 text-center text-xs text-slate-500">
							Nenhuma resolução cadastrada ainda.
						</p>
					) : (
						<div className="space-y-1.5">
							{(presets.data ?? []).map((p) => (
								<div
									key={p.id}
									className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
								>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-white">
											{p.name}
										</p>
										<p className="font-mono text-[11px] text-slate-500">
											{p.width}×{p.height}px
										</p>
									</div>
									<div className="flex shrink-0 items-center gap-1">
										<button
											type="button"
											onClick={() => startEdit(p)}
											className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
										>
											<Pencil className="h-3.5 w-3.5" />
										</button>
										<button
											type="button"
											onClick={() => remove(p)}
											className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
										>
											<Trash2 className="h-3.5 w-3.5" />
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>,
		document.body,
	);
}
