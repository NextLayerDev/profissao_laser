'use client';

import {
	ArrowDown,
	ArrowUp,
	Check,
	Database,
	ImageIcon,
	Loader2,
	Pencil,
	Plus,
	Settings2,
	Sparkles,
	Trash2,
	Upload,
	X,
} from 'lucide-react';
import { type ReactNode, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateBankEntry,
	useDeleteBankEntry,
	useReorderBank,
	useToolBank,
	useUpdateBankEntry,
} from '@/modules/tools/hooks/use-tool-bank';
import type { ToolBankEntry } from '@/modules/tools/services/tool-bank.service';
import type {
	BankConfig,
	BankFieldDef,
} from '@/modules/tools/services/tool-definitions.service';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { inputCls } from './builder-ui';

/**
 * Gerenciador do Banco de uma tool (admin). Renderiza o form de cada registro
 * GENERICAMENTE a partir de `definition.bank.fields` (text/textarea/enum/image)
 * + os campos universais de card (título/descrição/categoria/exemplos). Lista os
 * registros com thumbnail, título, categoria, toggle ativo, editar, apagar e
 * reordenar. Salvar monta uma `FormData` (campos do banco em `data` JSON +
 * exemplos) e chama o serviço.
 */

const labelCls = 'mb-1.5 block text-[13px] font-medium text-slate-300';
const areaCls =
	'w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/30';

interface BankFormValues {
	title: string;
	description: string;
	category: string;
	active: boolean;
	/** Valores dos campos do banco (texto/enum guardados aqui; imagens vão em `dataImages`). */
	data: Record<string, string>;
	/** Arquivos dos campos de imagem do banco (name → File). */
	dataImages: Record<string, File>;
	exampleBefore: File | null;
	exampleAfter: File | null;
	/** Marcar pra limpar um exemplo existente na edição. */
	removeBefore: boolean;
	removeAfter: boolean;
}

function emptyForm(): BankFormValues {
	return {
		title: '',
		description: '',
		category: '',
		active: true,
		data: {},
		dataImages: {},
		exampleBefore: null,
		exampleAfter: null,
		removeBefore: false,
		removeAfter: false,
	};
}

function formFromEntry(entry: ToolBankEntry): BankFormValues {
	const data: Record<string, string> = {};
	for (const [k, v] of Object.entries(entry.data ?? {})) {
		if (typeof v === 'string') data[k] = v;
	}
	return {
		title: entry.title,
		description: entry.description ?? '',
		category: entry.category ?? '',
		active: entry.active,
		data,
		dataImages: {},
		exampleBefore: null,
		exampleAfter: null,
		removeBefore: false,
		removeAfter: false,
	};
}

/** Upload visual reutilizável (escolher arquivo). */
function ImagePick({
	label,
	file,
	currentUrl,
	onPick,
	onClear,
}: {
	label: string;
	file: File | null;
	currentUrl?: string | null;
	onPick: (f: File) => void;
	onClear?: () => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const previewUrl = file ? URL.createObjectURL(file) : (currentUrl ?? null);
	return (
		<div>
			<span className={labelCls}>{label}</span>
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-black/30 text-slate-500 transition-colors hover:border-emerald-400/50 hover:text-emerald-300"
				>
					{previewUrl ? (
						// <img> intencional: preview local / CDN dinâmico
						<img
							src={previewUrl}
							alt={label}
							className="h-full w-full object-cover"
						/>
					) : (
						<Upload className="h-5 w-5" />
					)}
					<input
						ref={inputRef}
						type="file"
						accept="image/*"
						onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) onPick(f);
							e.target.value = '';
						}}
						className="hidden"
					/>
				</button>
				{previewUrl && onClear && (
					<button
						type="button"
						onClick={onClear}
						className="text-xs text-slate-500 hover:text-rose-400"
					>
						remover
					</button>
				)}
			</div>
		</div>
	);
}

/** Renderiza UM campo do banco (text/textarea/enum/image). */
function BankFieldControl({
	field,
	value,
	imageFile,
	onText,
	onImage,
}: {
	field: BankFieldDef;
	value: string;
	imageFile?: File;
	onText: (v: string) => void;
	onImage: (f: File) => void;
}) {
	const label = field.label ?? field.name;
	if (field.type === 'textarea') {
		return (
			<div>
				<span className={labelCls}>
					{label}
					{field.required && <span className="text-rose-400"> *</span>}
				</span>
				<textarea
					value={value}
					onChange={(e) => onText(e.target.value)}
					rows={4}
					placeholder={field.placeholder}
					className={`${areaCls} font-mono text-[12px]`}
				/>
			</div>
		);
	}
	if (field.type === 'enum') {
		return (
			<div>
				<span className={labelCls}>
					{label}
					{field.required && <span className="text-rose-400"> *</span>}
				</span>
				<select
					value={value}
					onChange={(e) => onText(e.target.value)}
					className={inputCls}
				>
					<option value="">— escolha —</option>
					{(field.options ?? []).map((o) => (
						<option key={o} value={o}>
							{o}
						</option>
					))}
				</select>
			</div>
		);
	}
	if (field.type === 'image') {
		return (
			<ImagePick
				label={`${label}${field.required ? ' *' : ''}`}
				file={imageFile ?? null}
				onPick={onImage}
			/>
		);
	}
	return (
		<div>
			<span className={labelCls}>
				{label}
				{field.required && <span className="text-rose-400"> *</span>}
			</span>
			<input
				value={value}
				onChange={(e) => onText(e.target.value)}
				placeholder={field.placeholder}
				className={inputCls}
			/>
		</div>
	);
}

function FieldShell({ children }: { children: ReactNode }) {
	return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

interface ToolBankManagerProps {
	toolKey: string;
	bank?: BankConfig;
	/** Abre o editor da config do banco (enable + fields + inject). */
	onConfigure?: () => void;
}

export function ToolBankManager({
	toolKey,
	bank,
	onConfigure,
}: ToolBankManagerProps) {
	const list = useToolBank(toolKey);
	const createMut = useCreateBankEntry(toolKey);
	const updateMut = useUpdateBankEntry(toolKey);
	const deleteMut = useDeleteBankEntry(toolKey);
	const reorderMut = useReorderBank(toolKey);

	const fields = useMemo(() => bank?.fields ?? [], [bank]);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	const [form, setForm] = useState<BankFormValues>(emptyForm);

	const entries = list.data ?? [];
	const saving = createMut.isPending || updateMut.isPending;

	const startCreate = () => {
		setForm(emptyForm());
		setEditingId(null);
		setCreating(true);
	};
	const startEdit = (entry: ToolBankEntry) => {
		setForm(formFromEntry(entry));
		setEditingId(entry.id);
		setCreating(false);
	};
	const cancel = () => {
		setCreating(false);
		setEditingId(null);
	};

	const patchForm = (p: Partial<BankFormValues>) =>
		setForm((f) => ({ ...f, ...p }));

	const buildFormData = (): FormData => {
		const fd = new FormData();
		fd.append('title', form.title.trim());
		fd.append('description', form.description.trim());
		fd.append('category', form.category.trim());
		fd.append('active', String(form.active));
		// Campos do banco: textos/enum vão no `data` JSON; imagens viram file fields.
		fd.append('data', JSON.stringify(form.data));
		for (const [name, file] of Object.entries(form.dataImages)) {
			fd.append(name, file);
		}
		if (form.exampleBefore) fd.append('example_before', form.exampleBefore);
		if (form.exampleAfter) fd.append('example_after', form.exampleAfter);
		if (editingId) {
			if (form.removeBefore) fd.append('removeExampleBefore', 'true');
			if (form.removeAfter) fd.append('removeExampleAfter', 'true');
		}
		return fd;
	};

	const submit = async () => {
		if (!form.title.trim()) {
			toast.error('O título é obrigatório.');
			return;
		}
		// Valida obrigatórios dos campos do banco (texto/enum).
		for (const f of fields) {
			if (!f.required) continue;
			if (f.type === 'image') {
				const editingEntry = entries.find((e) => e.id === editingId);
				const hasExisting =
					!!editingEntry &&
					typeof editingEntry.data?.[f.name] === 'string' &&
					!!editingEntry.data[f.name];
				if (!form.dataImages[f.name] && !hasExisting) {
					toast.error(`O campo "${f.label ?? f.name}" é obrigatório.`);
					return;
				}
			} else if (!form.data[f.name]?.trim()) {
				toast.error(`O campo "${f.label ?? f.name}" é obrigatório.`);
				return;
			}
		}
		try {
			const fd = buildFormData();
			if (editingId) await updateMut.mutateAsync({ id: editingId, body: fd });
			else await createMut.mutateAsync(fd);
			toast.success(editingId ? 'Registro atualizado.' : 'Registro criado.');
			cancel();
		} catch (err) {
			toast.error(getApiErrorMessage(err, 'Falha ao salvar o registro.'));
		}
	};

	const toggleActive = async (entry: ToolBankEntry) => {
		const fd = new FormData();
		fd.append('active', String(!entry.active));
		try {
			await updateMut.mutateAsync({ id: entry.id, body: fd });
		} catch (err) {
			toast.error(getApiErrorMessage(err, 'Falha ao alterar o status.'));
		}
	};

	const remove = async (entry: ToolBankEntry) => {
		if (!window.confirm(`Apagar "${entry.title}"?`)) return;
		try {
			await deleteMut.mutateAsync(entry.id);
			toast.success('Registro apagado.');
			if (editingId === entry.id) cancel();
		} catch (err) {
			toast.error(getApiErrorMessage(err, 'Falha ao apagar.'));
		}
	};

	const move = (index: number, dir: -1 | 1) => {
		const j = index + dir;
		if (j < 0 || j >= entries.length) return;
		const ids = entries.map((e) => e.id);
		[ids[index], ids[j]] = [ids[j], ids[index]];
		reorderMut.mutate(ids, {
			onError: (err) =>
				toast.error(getApiErrorMessage(err, 'Falha ao reordenar.')),
		});
	};

	const editingEntry = entries.find((e) => e.id === editingId) ?? null;
	const showForm = creating || !!editingId;

	return (
		<div className="space-y-5">
			{/* Cabeçalho */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2.5">
					<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-400/20">
						<Database className="h-4 w-4" />
					</span>
					<div>
						<h2 className="text-sm font-semibold text-white">Banco do Admin</h2>
						<p className="font-mono text-[11px] text-slate-500">
							{entries.length} registro{entries.length === 1 ? '' : 's'}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{onConfigure && (
						<button
							type="button"
							onClick={onConfigure}
							className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
						>
							<Settings2 className="h-4 w-4" /> Configurar banco
						</button>
					)}
					{!showForm && (
						<button
							type="button"
							onClick={startCreate}
							className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/20"
						>
							<Plus className="h-4 w-4" /> Novo registro
						</button>
					)}
				</div>
			</div>

			{!bank?.enabled && (
				<div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/5 p-4">
					<Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
					<p className="text-[13px] text-amber-200/90">
						O banco desta ferramenta está <strong>desativado</strong>. Os
						registros não aparecem pro cliente até você ativar o banco em{' '}
						<em>Configurar banco</em>.
					</p>
				</div>
			)}

			{/* Form (criar / editar) */}
			{showForm && (
				<div className="space-y-5 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#0e1217] to-[#0a0c10] p-6">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold text-white">
							{editingId ? 'Editar registro' : 'Novo registro'}
						</h3>
						<button
							type="button"
							onClick={cancel}
							className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					{/* Campos universais de card */}
					<FieldShell>
						<div className="sm:col-span-2">
							<span className={labelCls}>
								Título <span className="text-rose-400">*</span>
							</span>
							<input
								value={form.title}
								onChange={(e) => patchForm({ title: e.target.value })}
								placeholder="Nome que aparece no card"
								className={inputCls}
							/>
						</div>
						<div>
							<span className={labelCls}>Categoria</span>
							<input
								value={form.category}
								onChange={(e) => patchForm({ category: e.target.value })}
								placeholder="Ex.: Logos, Personagens…"
								className={inputCls}
							/>
						</div>
						<div className="flex items-end">
							<button
								type="button"
								onClick={() => patchForm({ active: !form.active })}
								className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
									form.active
										? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30'
										: 'bg-white/5 text-slate-400'
								}`}
							>
								<Check className="h-4 w-4" />
								{form.active ? 'Ativo (visível)' : 'Inativo (oculto)'}
							</button>
						</div>
						<div className="sm:col-span-2">
							<span className={labelCls}>Descrição</span>
							<textarea
								value={form.description}
								onChange={(e) => patchForm({ description: e.target.value })}
								rows={2}
								placeholder="Uma linha sobre o que esse modelo faz."
								className={areaCls}
							/>
						</div>
					</FieldShell>

					{/* Campos próprios do banco (genéricos) */}
					{fields.length > 0 && (
						<div className="space-y-4 border-t border-white/[0.06] pt-5">
							<p className="font-mono text-[11px] uppercase tracking-widest text-fuchsia-300/80">
								Campos do registro
							</p>
							<FieldShell>
								{fields.map((f) => (
									<div
										key={f.name}
										className={
											f.type === 'textarea' ? 'sm:col-span-2' : undefined
										}
									>
										<BankFieldControl
											field={f}
											value={form.data[f.name] ?? ''}
											imageFile={form.dataImages[f.name]}
											onText={(v) =>
												patchForm({ data: { ...form.data, [f.name]: v } })
											}
											onImage={(file) =>
												patchForm({
													dataImages: { ...form.dataImages, [f.name]: file },
												})
											}
										/>
									</div>
								))}
							</FieldShell>
						</div>
					)}

					{/* Exemplos antes/depois */}
					<div className="space-y-4 border-t border-white/[0.06] pt-5">
						<p className="font-mono text-[11px] uppercase tracking-widest text-slate-400/80">
							Imagens de exemplo
						</p>
						<div className="grid gap-4 sm:grid-cols-2">
							<ImagePick
								label="Exemplo (antes)"
								file={form.exampleBefore}
								currentUrl={
									form.removeBefore ? null : editingEntry?.example_before_url
								}
								onPick={(f) =>
									patchForm({ exampleBefore: f, removeBefore: false })
								}
								onClear={() =>
									patchForm({ exampleBefore: null, removeBefore: true })
								}
							/>
							<ImagePick
								label="Exemplo (depois) — capa do card"
								file={form.exampleAfter}
								currentUrl={
									form.removeAfter ? null : editingEntry?.example_after_url
								}
								onPick={(f) =>
									patchForm({ exampleAfter: f, removeAfter: false })
								}
								onClear={() =>
									patchForm({ exampleAfter: null, removeAfter: true })
								}
							/>
						</div>
					</div>

					<div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-4">
						<button
							type="button"
							onClick={cancel}
							className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
						>
							Cancelar
						</button>
						<button
							type="button"
							onClick={submit}
							disabled={saving}
							className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/20 disabled:opacity-50"
						>
							{saving ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Check className="h-4 w-4" />
							)}
							{editingId ? 'Salvar' : 'Criar registro'}
						</button>
					</div>
				</div>
			)}

			{/* Lista de registros */}
			{list.isLoading ? (
				<div className="flex justify-center p-10">
					<Loader2 className="h-5 w-5 animate-spin text-fuchsia-400" />
				</div>
			) : entries.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-white/10 py-14 text-center">
					<Database className="mx-auto mb-3 h-8 w-8 text-slate-600" />
					<p className="text-sm text-slate-400">Nenhum registro ainda.</p>
					<p className="mt-1 text-xs text-slate-500">
						Crie o primeiro pra ele aparecer na galeria do cliente.
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{entries.map((entry, i) => {
						const thumb =
							entry.example_after_url ?? entry.example_before_url ?? null;
						return (
							<div
								key={entry.id}
								className={`flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 transition-colors hover:border-white/20 ${
									editingId === entry.id ? 'ring-1 ring-fuchsia-400/40' : ''
								}`}
							>
								<div className="flex shrink-0 flex-col">
									<button
										type="button"
										disabled={i === 0 || reorderMut.isPending}
										onClick={() => move(i, -1)}
										className="rounded p-0.5 text-slate-500 hover:text-slate-200 disabled:opacity-20"
									>
										<ArrowUp className="h-3.5 w-3.5" />
									</button>
									<button
										type="button"
										disabled={i === entries.length - 1 || reorderMut.isPending}
										onClick={() => move(i, 1)}
										className="rounded p-0.5 text-slate-500 hover:text-slate-200 disabled:opacity-20"
									>
										<ArrowDown className="h-3.5 w-3.5" />
									</button>
								</div>
								<div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/5">
									{thumb ? (
										// <img> intencional: CDN dinâmico
										<img
											src={thumb}
											alt={entry.title}
											className="h-full w-full object-cover"
										/>
									) : (
										<ImageIcon className="h-4 w-4 text-slate-600" />
									)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold text-white">
										{entry.title}
									</p>
									{entry.category && (
										<span className="text-[11px] text-fuchsia-300/80">
											{entry.category}
										</span>
									)}
								</div>
								<button
									type="button"
									onClick={() => toggleActive(entry)}
									title={entry.active ? 'Visível' : 'Oculto'}
									className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase transition-colors ${
										entry.active
											? 'bg-emerald-500/15 text-emerald-300'
											: 'bg-white/5 text-slate-500'
									}`}
								>
									{entry.active ? 'ativo' : 'oculto'}
								</button>
								<button
									type="button"
									onClick={() => startEdit(entry)}
									className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
								>
									<Pencil className="h-4 w-4" />
								</button>
								<button
									type="button"
									onClick={() => remove(entry)}
									className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
