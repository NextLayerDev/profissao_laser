'use client';

import {
	FileText,
	Film,
	Image as ImageIcon,
	Link2,
	Loader2,
	Plus,
	Trash2,
	Upload,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/dashboard/header';
import type { MntMaterial } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useCohortsAdmin,
	useMaterialMutations,
	useMaterialsAdmin,
} from '../_components/admin-hooks';
import {
	Badge,
	Card,
	EmptyState,
	Field,
	formatDate,
	inputClass,
	Modal,
	PageTitle,
	primaryBtn,
	Spinner,
	secondaryBtn,
} from '../_components/ui';

const KIND_META: Record<
	MntMaterial['kind'],
	{ label: string; icon: typeof FileText }
> = {
	doc: { label: 'Documento', icon: FileText },
	video: { label: 'Vídeo', icon: Film },
	photo: { label: 'Imagem', icon: ImageIcon },
	link: { label: 'Link', icon: Link2 },
};

type ModalState = 'upload' | 'link' | null;

export default function MateriaisPage() {
	const materials = useMaterialsAdmin();
	const cohorts = useCohortsAdmin();
	const { remove } = useMaterialMutations();
	const [modal, setModal] = useState<ModalState>(null);
	const [deleting, setDeleting] = useState<MntMaterial | null>(null);

	const cohortName = useMemo(() => {
		const map = new Map<string, string>();
		for (const c of cohorts.data ?? []) map.set(c.id, c.name);
		return map;
	}, [cohorts.data]);

	const doDelete = async () => {
		if (!deleting) return;
		try {
			await remove.mutateAsync(deleting.id);
			toast.success('Material excluído');
			setDeleting(null);
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao excluir o material'));
		}
	};

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
				<PageTitle
					title="Materiais"
					description="Arquivos e links de apoio. Materiais sem turma são globais — visíveis a todos os alunos."
					backHref="/mentoria-admin"
					actions={
						<>
							<button
								type="button"
								className={secondaryBtn}
								onClick={() => setModal('link')}
							>
								<Link2 className="w-4 h-4" />
								Cadastrar link
							</button>
							<button
								type="button"
								className={primaryBtn}
								onClick={() => setModal('upload')}
							>
								<Upload className="w-4 h-4" />
								Enviar arquivo
							</button>
						</>
					}
				/>

				<Card>
					{materials.isLoading ? (
						<Spinner />
					) : !materials.data?.length ? (
						<EmptyState message="Nenhum material cadastrado." />
					) : (
						<ul className="divide-y divide-slate-100 dark:divide-white/5">
							{materials.data.map((m) => {
								const meta = KIND_META[m.kind] ?? KIND_META.doc;
								return (
									<li key={m.id} className="flex items-center gap-4 px-5 py-4">
										<div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
											<meta.icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
										</div>
										<div className="min-w-0 flex-1">
											<a
												href={m.url}
												target="_blank"
												rel="noreferrer"
												className="font-medium text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 truncate block"
											>
												{m.title}
											</a>
											{m.description && (
												<p className="text-xs text-slate-500 dark:text-gray-400 truncate">
													{m.description}
												</p>
											)}
											<div className="flex items-center gap-2 mt-1 flex-wrap">
												<Badge tone="blue">{meta.label}</Badge>
												<Badge tone={m.cohort_id ? 'violet' : 'green'}>
													{m.cohort_id
														? (cohortName.get(m.cohort_id) ?? 'Turma')
														: 'Global (todas as turmas)'}
												</Badge>
												<span className="text-xs text-slate-500 dark:text-gray-500">
													{formatDate(m.created_at)}
												</span>
											</div>
										</div>
										<button
											type="button"
											className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0"
											onClick={() => setDeleting(m)}
											aria-label={`Excluir ${m.title}`}
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</Card>
			</main>

			{modal === 'upload' && <UploadModal onClose={() => setModal(null)} />}
			{modal === 'link' && <LinkModal onClose={() => setModal(null)} />}

			{deleting && (
				<Modal title="Excluir material" onClose={() => setDeleting(null)}>
					<p className="text-sm text-slate-600 dark:text-gray-400">
						Tem certeza que deseja excluir <b>{deleting.title}</b>? Os alunos
						deixarão de vê-lo.
					</p>
					<div className="flex justify-end gap-2 pt-4">
						<button
							type="button"
							className={secondaryBtn}
							onClick={() => setDeleting(null)}
						>
							Cancelar
						</button>
						<button
							type="button"
							className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60"
							onClick={doDelete}
							disabled={remove.isPending}
						>
							{remove.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Trash2 className="w-4 h-4" />
							)}
							Excluir
						</button>
					</div>
				</Modal>
			)}
		</div>
	);
}

function CohortSelect({
	value,
	onChange,
}: {
	value: string;
	onChange: (v: string) => void;
}) {
	const cohorts = useCohortsAdmin();
	return (
		<Field
			label="Turma"
			hint="Deixe em branco para material global, visível a todas as turmas."
		>
			<select
				className={inputClass}
				value={value}
				onChange={(e) => onChange(e.target.value)}
			>
				<option value="">Global (todas as turmas)</option>
				{(cohorts.data ?? []).map((c) => (
					<option key={c.id} value={c.id}>
						{c.name}
					</option>
				))}
			</select>
		</Field>
	);
}

function UploadModal({ onClose }: { onClose: () => void }) {
	const { upload } = useMaterialMutations();
	const fileRef = useRef<HTMLInputElement>(null);
	const [title, setTitle] = useState('');
	const [cohortId, setCohortId] = useState('');
	const [fileName, setFileName] = useState('');

	const save = async () => {
		const file = fileRef.current?.files?.[0];
		if (!file) {
			toast.error('Escolha um arquivo');
			return;
		}
		if (!title.trim()) {
			toast.error('Informe o título do material');
			return;
		}
		try {
			await upload.mutateAsync({
				file,
				params: {
					title: title.trim(),
					...(cohortId ? { cohort_id: cohortId } : {}),
				},
			});
			toast.success('Material enviado');
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao enviar o material'));
		}
	};

	return (
		<Modal title="Enviar arquivo" onClose={onClose}>
			<div className="space-y-4">
				<Field label="Arquivo" required>
					<input
						ref={fileRef}
						type="file"
						className={inputClass}
						onChange={(e) => {
							const f = e.target.files?.[0];
							setFileName(f?.name ?? '');
							if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''));
						}}
					/>
					{fileName && (
						<p className="text-xs text-slate-500 dark:text-gray-500 mt-1">
							{fileName}
						</p>
					)}
				</Field>
				<Field label="Título" required>
					<input
						className={inputClass}
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
				</Field>
				<CohortSelect value={cohortId} onChange={setCohortId} />
				<div className="flex justify-end gap-2 pt-2">
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className={primaryBtn}
						onClick={save}
						disabled={upload.isPending}
					>
						{upload.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Upload className="w-4 h-4" />
						)}
						Enviar
					</button>
				</div>
			</div>
		</Modal>
	);
}

function LinkModal({ onClose }: { onClose: () => void }) {
	const { createLink } = useMaterialMutations();
	const [form, setForm] = useState({
		title: '',
		url: '',
		kind: 'link' as MntMaterial['kind'],
		description: '',
		cohort_id: '',
	});
	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [key]: value }));

	const save = async () => {
		if (!form.title.trim()) {
			toast.error('Informe o título do material');
			return;
		}
		if (!/^https?:\/\//.test(form.url.trim())) {
			toast.error('Informe uma URL válida (http/https)');
			return;
		}
		try {
			await createLink.mutateAsync({
				title: form.title.trim(),
				url: form.url.trim(),
				kind: form.kind,
				description: form.description.trim() || null,
				...(form.cohort_id ? { cohort_id: form.cohort_id } : {}),
			});
			toast.success('Material cadastrado');
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao cadastrar o material'));
		}
	};

	return (
		<Modal title="Cadastrar link" onClose={onClose}>
			<div className="space-y-4">
				<Field label="Título" required>
					<input
						className={inputClass}
						value={form.title}
						onChange={(e) => set('title', e.target.value)}
					/>
				</Field>
				<Field label="URL" required>
					<input
						className={inputClass}
						value={form.url}
						onChange={(e) => set('url', e.target.value)}
						placeholder="https://..."
					/>
				</Field>
				<Field label="Tipo">
					<select
						className={inputClass}
						value={form.kind}
						onChange={(e) => set('kind', e.target.value as MntMaterial['kind'])}
					>
						<option value="link">Link</option>
						<option value="video">Vídeo</option>
						<option value="doc">Documento</option>
						<option value="photo">Imagem</option>
					</select>
				</Field>
				<Field label="Descrição">
					<textarea
						className={`${inputClass} min-h-16`}
						value={form.description}
						onChange={(e) => set('description', e.target.value)}
					/>
				</Field>
				<CohortSelect
					value={form.cohort_id}
					onChange={(v) => set('cohort_id', v)}
				/>
				<div className="flex justify-end gap-2 pt-2">
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className={primaryBtn}
						onClick={save}
						disabled={createLink.isPending}
					>
						{createLink.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Plus className="w-4 h-4" />
						)}
						Cadastrar
					</button>
				</div>
			</div>
		</Modal>
	);
}
