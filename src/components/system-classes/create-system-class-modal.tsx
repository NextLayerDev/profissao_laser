'use client';

import { Check, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateSystemClass,
	useUpdateSystemClass,
} from '@/hooks/use-system-classes';
import type { CreateSystemClassModalProps } from '@/types/components/create-system-class-modal';
import { SC_OPTIONS } from '@/utils/constants/system-class-options';

export function CreateSystemClassModal({
	isOpen,
	onClose,
	editing,
}: CreateSystemClassModalProps) {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
	const [options, setOptions] = useState({
		sistemaGerenciamento: false,
		iaPrevias: false,
		iaWhatsappPrevias: false,
	});

	const createMutation = useCreateSystemClass();
	const updateMutation = useUpdateSystemClass();

	const isEditing = !!editing;
	const isPending = createMutation.isPending || updateMutation.isPending;

	const resetForm = useCallback(() => {
		setName('');
		setDescription('');
		setStatus('ativo');
		setOptions({
			sistemaGerenciamento: false,
			iaPrevias: false,
			iaWhatsappPrevias: false,
		});
	}, []);

	useEffect(() => {
		if (editing) {
			setName(editing.name);
			setDescription(editing.description ?? '');
			setStatus(editing.status);
			setOptions({
				sistemaGerenciamento: editing.sistemaGerenciamento,
				iaPrevias: editing.iaPrevias,
				iaWhatsappPrevias: editing.iaWhatsappPrevias,
			});
		} else {
			resetForm();
		}
	}, [editing, resetForm]);

	if (!isOpen) return null;

	function handleClose() {
		resetForm();
		onClose();
	}

	function toggleOption(
		key: 'sistemaGerenciamento' | 'iaPrevias' | 'iaWhatsappPrevias',
	) {
		setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
	}

	async function handleSubmit() {
		if (!name.trim()) {
			toast.error('Informe o nome da system class');
			return;
		}

		const payload = {
			name: name.trim(),
			...(description.trim() ? { description: description.trim() } : {}),
			status,
			sistemaGerenciamento: options.sistemaGerenciamento,
			iaPrevias: options.iaPrevias,
			iaWhatsappPrevias: options.iaWhatsappPrevias,
		};

		try {
			if (isEditing) {
				await updateMutation.mutateAsync({
					id: editing.id,
					payload,
				});
				toast.success('System class atualizada!');
			} else {
				await createMutation.mutateAsync(payload);
				toast.success('System class criada!');
			}
			handleClose();
		} catch {
			toast.error(
				isEditing
					? 'Erro ao atualizar system class'
					: 'Erro ao criar system class',
			);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={handleClose}
			>
				<span className="sr-only">Fechar modal</span>
			</button>

			<div className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl max-h-[90vh] flex flex-col">
				<div className="flex items-center justify-between mb-6 shrink-0">
					<h2 className="text-xl font-bold text-slate-900 dark:text-white">
						{isEditing ? 'Editar System Class' : 'Nova System Class'}
					</h2>
					<button
						type="button"
						onClick={handleClose}
						className="p-2 text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#252528]"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="overflow-y-auto flex-1 space-y-5">
					<div>
						<label
							htmlFor="sc-name"
							className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
						>
							Nome
						</label>
						<input
							id="sc-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ex: Plano Pro"
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
						/>
					</div>

					<div>
						<label
							htmlFor="sc-description"
							className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
						>
							Descrição (opcional)
						</label>
						<textarea
							id="sc-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Descreva o que está incluído..."
							rows={3}
							className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
						/>
					</div>

					<div>
						<p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
							Status
						</p>
						<div className="flex gap-3">
							{(['ativo', 'inativo'] as const).map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => setStatus(s)}
									className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
										status === s
											? 'bg-violet-600 text-white'
											: 'bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:border-slate-300 dark:hover:border-gray-600'
									}`}
								>
									{s === 'ativo' ? 'Ativo' : 'Inativo'}
								</button>
							))}
						</div>
					</div>

					<div>
						<p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
							Opções
						</p>
						<div className="grid grid-cols-1 gap-2">
							{SC_OPTIONS.map((opt) => (
								<button
									key={opt.key}
									type="button"
									onClick={() =>
										toggleOption(
											opt.key as
												| 'sistemaGerenciamento'
												| 'iaPrevias'
												| 'iaWhatsappPrevias',
										)
									}
									className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
										options[opt.key]
											? 'bg-violet-600/20 border border-violet-500/50 text-violet-600 dark:text-violet-300'
											: 'bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:border-slate-300 dark:hover:border-gray-600'
									}`}
								>
									<span
										className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
											options[opt.key]
												? 'bg-violet-600 border-violet-600'
												: 'border-slate-300 dark:border-gray-600'
										}`}
									>
										{options[opt.key] && (
											<Check className="w-3 h-3 text-white" />
										)}
									</span>
									{opt.label}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className="flex items-center gap-3 mt-6 shrink-0">
					<button
						type="button"
						onClick={handleClose}
						className="flex-1 px-5 py-3 rounded-xl font-medium text-sm bg-slate-100 dark:bg-[#252528] hover:bg-slate-200 dark:hover:bg-[#2a2a2d] text-slate-700 dark:text-gray-300 transition-colors"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={isPending || !name.trim()}
						className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
					>
						{isPending && <Loader2 className="w-4 h-4 animate-spin" />}
						{isEditing ? 'Salvar alterações' : 'Criar'}
					</button>
				</div>
			</div>
		</div>
	);
}
