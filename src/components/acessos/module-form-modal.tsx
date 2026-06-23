'use client';

import { useEffect, useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import type {
	PermissionModule,
	PermissionModulePayload,
} from '@/modules/access';

/** Ações conhecidas — espelham as colunas da matriz de permissões. */
const AVAILABLE_ACTIONS: { action: string; label: string }[] = [
	{ action: 'view', label: 'Ver' },
	{ action: 'edit', label: 'Editar' },
	{ action: 'delete', label: 'Excluir' },
	{ action: 'price', label: 'Preço' },
];

interface ModuleFormModalProps {
	module: PermissionModule | null;
	isOpen: boolean;
	isSaving: boolean;
	onClose: () => void;
	onSubmit: (payload: PermissionModulePayload, id?: string) => Promise<void>;
}

export function ModuleFormModal({
	module,
	isOpen,
	isSaving,
	onClose,
	onSubmit,
}: ModuleFormModalProps) {
	const [slug, setSlug] = useState('');
	const [label, setLabel] = useState('');
	const [actions, setActions] = useState<string[]>([]);

	const isEditing = !!module?.id;

	useEffect(() => {
		if (!isOpen) return;
		setSlug(module?.module ?? '');
		setLabel(module?.label ?? '');
		setActions(module?.actions ?? ['view']);
	}, [isOpen, module]);

	if (!isOpen) return null;

	const toggleAction = (action: string) => {
		setActions((prev) =>
			prev.includes(action)
				? prev.filter((a) => a !== action)
				: [...prev, action],
		);
	};

	const canSubmit = slug.trim() && label.trim() && actions.length > 0;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		await onSubmit(
			{
				module: slug.trim(),
				label: label.trim(),
				actions,
			},
			module?.id,
		);
	};

	return (
		<ModalOverlay onClose={onClose} widthClassName="max-w-lg">
			<form onSubmit={handleSubmit} className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{isEditing ? 'Editar módulo' : 'Novo módulo'}
				</h3>

				<div>
					<label
						htmlFor="module-slug"
						className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
					>
						Slug (identificador)
					</label>
					<input
						id="module-slug"
						type="text"
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						placeholder="ex: relatorios"
						disabled={isEditing}
						className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50 disabled:opacity-60"
					/>
					{isEditing && (
						<p className="mt-1.5 text-xs text-slate-400 dark:text-gray-500">
							O slug não pode mudar (as permissões dos cargos dependem dele).
						</p>
					)}
				</div>

				<div>
					<label
						htmlFor="module-label"
						className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-1.5"
					>
						Nome de exibição
					</label>
					<input
						id="module-label"
						type="text"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						placeholder="ex: Relatórios / Analytics"
						className="w-full bg-slate-50 dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
					/>
				</div>

				<div>
					<p className="block text-sm font-medium text-slate-600 dark:text-gray-400 mb-2">
						Ações
					</p>
					<div className="flex flex-wrap gap-2">
						{AVAILABLE_ACTIONS.map((a) => {
							const on = actions.includes(a.action);
							return (
								<button
									key={a.action}
									type="button"
									onClick={() => toggleAction(a.action)}
									className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
										on
											? 'bg-violet-600 border-violet-600 text-white'
											: 'bg-slate-50 dark:bg-[#0d0d0f] border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:border-violet-500/50'
									}`}
								>
									{a.label}
								</button>
							);
						})}
					</div>
					{actions.length === 0 && (
						<p className="mt-1.5 text-xs text-red-500">
							Selecione pelo menos uma ação.
						</p>
					)}
				</div>

				<div className="flex gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-[#252528] text-slate-700 dark:text-gray-300"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={isSaving || !canSubmit}
						className="flex-1 px-5 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
					>
						Guardar
					</button>
				</div>
			</form>
		</ModalOverlay>
	);
}
