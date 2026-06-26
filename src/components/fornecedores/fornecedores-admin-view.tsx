'use client';

import { Eye, EyeOff, Pencil, Plus, Store, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { PageHeader } from '@/components/ui/page-header';
import {
	useCreateFornecedor,
	useDeleteFornecedor,
	useFornecedores,
	useUpdateFornecedor,
} from '@/hooks/use-fornecedores';
import type { Fornecedor } from '@/types/fornecedor';

interface FormState {
	company: string;
	content: string;
	imageUrl: string;
	isActive: boolean;
}

const EMPTY_FORM: FormState = {
	company: '',
	content: '',
	imageUrl: '',
	isActive: true,
};

const CONTENT_PLACEHOLDER = `🏢 Empresa: Nome da empresa
📞 Contato: Nome
WhatsApp: (11) 90000-0000

🛒 Produtos Disponíveis

Produto 1
Produto 2
📌 Observação opcional.`;

const inputCls =
	'w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40';

export function FornecedoresAdminView() {
	const { data, isLoading } = useFornecedores();
	const createMut = useCreateFornecedor();
	const updateMut = useUpdateFornecedor();
	const deleteMut = useDeleteFornecedor();

	const [editing, setEditing] = useState<Fornecedor | null>(null);
	const [creating, setCreating] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState<Fornecedor | null>(null);
	const [form, setForm] = useState<FormState>(EMPTY_FORM);

	const fornecedores = data ?? [];
	const activeCount = fornecedores.filter((f) => f.isActive).length;
	const isModalOpen = creating || !!editing;
	const saving = createMut.isPending || updateMut.isPending;

	function openCreate() {
		setForm(EMPTY_FORM);
		setEditing(null);
		setCreating(true);
	}

	function openEdit(f: Fornecedor) {
		setForm({
			company: f.company,
			content: f.content,
			imageUrl: f.imageUrl ?? '',
			isActive: f.isActive,
		});
		setCreating(false);
		setEditing(f);
	}

	function closeModal() {
		setCreating(false);
		setEditing(null);
	}

	async function submit() {
		if (!form.company.trim() || !form.content.trim()) {
			toast.error('Preencha a empresa e o conteúdo.');
			return;
		}
		const body = {
			company: form.company.trim(),
			content: form.content,
			imageUrl: form.imageUrl.trim() || null,
			isActive: form.isActive,
		};
		try {
			if (editing) {
				await updateMut.mutateAsync({ id: editing.id, body });
				toast.success('Fornecedor atualizado.');
			} else {
				await createMut.mutateAsync(body);
				toast.success('Fornecedor adicionado.');
			}
			closeModal();
		} catch {
			toast.error('Não foi possível salvar.');
		}
	}

	async function doDelete() {
		if (!confirmDelete) return;
		try {
			await deleteMut.mutateAsync(confirmDelete.id);
			toast.success('Fornecedor removido.');
		} catch {
			toast.error('Não foi possível remover.');
		}
		setConfirmDelete(null);
	}

	return (
		<div>
			<div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
				<PageHeader
					title="Fornecedores"
					subtitle="Gerencie os fornecedores exibidos para os alunos."
					icon={Store}
				/>
				<button
					type="button"
					onClick={openCreate}
					className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm rounded-lg transition-colors shrink-0"
				>
					<Plus className="w-4 h-4" />
					Adicionar fornecedor
				</button>
			</div>

			{!isLoading && fornecedores.length > 0 && (
				<p className="text-xs text-slate-500 dark:text-gray-400 mb-4">
					{fornecedores.length}{' '}
					{fornecedores.length === 1 ? 'fornecedor' : 'fornecedores'} ·{' '}
					{activeCount} {activeCount === 1 ? 'ativo' : 'ativos'}
				</p>
			)}

			{isLoading ? (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={i}
							className="h-40 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 animate-pulse"
						/>
					))}
				</div>
			) : fornecedores.length === 0 ? (
				<EmptyState
					icon={Store}
					title="Nenhum fornecedor ainda"
					description="Adicione o primeiro fornecedor para os alunos."
					action={{ label: 'Adicionar fornecedor', onClick: openCreate }}
				/>
			) : (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{fornecedores.map((f) => (
						<div
							key={f.id}
							className={`group relative flex flex-col rounded-xl border bg-white dark:bg-[#1a1a1d] p-4 transition-colors ${
								f.isActive
									? 'border-slate-200 dark:border-white/10'
									: 'border-dashed border-slate-300 dark:border-white/15 opacity-70'
							}`}
						>
							<div className="flex items-start gap-2.5 mb-2">
								<div className="w-9 h-9 rounded-lg bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
									<Store className="w-4 h-4" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
										{f.company}
									</p>
									<span
										className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
											f.isActive
												? 'text-emerald-600 dark:text-emerald-400'
												: 'text-slate-400 dark:text-gray-500'
										}`}
									>
										{f.isActive ? (
											<Eye className="w-3 h-3" />
										) : (
											<EyeOff className="w-3 h-3" />
										)}
										{f.isActive ? 'Visível' : 'Oculto'}
									</span>
								</div>
								<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<button
										type="button"
										onClick={() => openEdit(f)}
										className="p-1.5 rounded-md text-slate-500 hover:text-violet-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
										aria-label="Editar"
									>
										<Pencil className="w-4 h-4" />
									</button>
									<button
										type="button"
										onClick={() => setConfirmDelete(f)}
										className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
										aria-label="Excluir"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</div>
							<p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap line-clamp-4 break-words">
								{f.content}
							</p>
						</div>
					))}
				</div>
			)}

			{isModalOpen && (
				<ModalOverlay
					onClose={closeModal}
					tone="tools"
					widthClassName="max-w-2xl"
				>
					<div className="p-6">
						<div className="flex items-center justify-between mb-5">
							<h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
								{editing ? 'Editar fornecedor' : 'Novo fornecedor'}
							</h2>
							<button
								type="button"
								onClick={closeModal}
								className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
								aria-label="Fechar"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label
									htmlFor="forn-company"
									className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5"
								>
									Empresa
								</label>
								<input
									id="forn-company"
									value={form.company}
									onChange={(e) =>
										setForm((s) => ({ ...s, company: e.target.value }))
									}
									placeholder="Nome da empresa"
									className={inputCls}
								/>
							</div>

							<div>
								<label
									htmlFor="forn-content"
									className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5"
								>
									Conteúdo
								</label>
								<textarea
									id="forn-content"
									value={form.content}
									onChange={(e) =>
										setForm((s) => ({ ...s, content: e.target.value }))
									}
									rows={10}
									placeholder={CONTENT_PLACEHOLDER}
									className={`${inputCls} resize-y font-mono leading-relaxed`}
								/>
								<p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1">
									Links (https://…) viram clicáveis na tela do aluno.
								</p>
							</div>

							<div>
								<label
									htmlFor="forn-image"
									className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5"
								>
									Imagem (URL opcional)
								</label>
								<input
									id="forn-image"
									value={form.imageUrl}
									onChange={(e) =>
										setForm((s) => ({ ...s, imageUrl: e.target.value }))
									}
									placeholder="https://…"
									className={inputCls}
								/>
							</div>

							<label className="flex items-center gap-2 cursor-pointer select-none">
								<input
									type="checkbox"
									checked={form.isActive}
									onChange={(e) =>
										setForm((s) => ({ ...s, isActive: e.target.checked }))
									}
									className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
								/>
								<span className="text-sm text-slate-700 dark:text-gray-300">
									Visível para os alunos
								</span>
							</label>
						</div>

						<div className="flex justify-end gap-2 mt-6">
							<button
								type="button"
								onClick={closeModal}
								className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={submit}
								disabled={saving}
								className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-medium text-sm rounded-lg transition-colors"
							>
								{saving ? 'Salvando…' : editing ? 'Salvar' : 'Adicionar'}
							</button>
						</div>
					</div>
				</ModalOverlay>
			)}

			{confirmDelete && (
				<ModalOverlay
					onClose={() => setConfirmDelete(null)}
					widthClassName="max-w-sm"
				>
					<div className="p-6">
						<h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2">
							Excluir fornecedor?
						</h2>
						<p className="text-sm text-slate-600 dark:text-gray-400 mb-6">
							"{confirmDelete.company}" será removido permanentemente.
						</p>
						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setConfirmDelete(null)}
								className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={doDelete}
								disabled={deleteMut.isPending}
								className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-medium text-sm rounded-lg transition-colors"
							>
								{deleteMut.isPending ? 'Removendo…' : 'Excluir'}
							</button>
						</div>
					</div>
				</ModalOverlay>
			)}
		</div>
	);
}
