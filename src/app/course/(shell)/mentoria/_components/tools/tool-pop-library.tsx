'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	BookOpen,
	ChevronDown,
	ChevronUp,
	FileText,
	Link2,
	Paperclip,
	Plus,
	Trash2,
	Upload,
	X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	addPopAttachmentLink,
	createPop,
	deletePop,
	listPops,
	uploadPopAttachment,
} from '@/modules/mentoria/service';
import type { MntPop } from '@/modules/mentoria/types';
import {
	BTN_GHOST,
	BTN_PRIMARY,
	CARD,
	EmptyState,
	fmtDate,
	INPUT,
	LABEL,
	MntSkeleton,
} from '../shared';

type PopForm = {
	title: string;
	objective: string;
	owner_name: string;
	materials: string;
	control_point: string;
	expected_result: string;
	stepsText: string;
};

const EMPTY_FORM: PopForm = {
	title: '',
	objective: '',
	owner_name: '',
	materials: '',
	control_point: '',
	expected_result: '',
	stepsText: '',
};

/** Ferramenta pop_library: biblioteca de POPs (procedimentos operacionais padrão). */
export function ToolPopLibrary({ instanceId }: { instanceId: string }) {
	const qc = useQueryClient();
	const queryKey = ['mentoria', 'pops', instanceId];
	const invalidate = () => qc.invalidateQueries({ queryKey });

	const { data: pops, isLoading } = useQuery({
		queryKey,
		queryFn: () => listPops(instanceId),
	});

	const [adding, setAdding] = useState(false);
	const [form, setForm] = useState<PopForm>(EMPTY_FORM);

	const create = useMutation({
		mutationFn: () =>
			createPop(instanceId, {
				title: form.title.trim(),
				objective: form.objective || null,
				owner_name: form.owner_name || null,
				materials: form.materials || null,
				control_point: form.control_point || null,
				expected_result: form.expected_result || null,
				steps: form.stepsText
					.split('\n')
					.map((s) => s.trim())
					.filter(Boolean),
			}),
		onSuccess: () => {
			setForm(EMPTY_FORM);
			setAdding(false);
			invalidate();
			toast.success('POP criado!');
		},
		onError: () => toast.error('Não foi possível criar o POP.'),
	});

	const remove = useMutation({
		mutationFn: deletePop,
		onSuccess: invalidate,
		onError: () => toast.error('Não foi possível excluir o POP.'),
	});

	if (isLoading) return <MntSkeleton />;

	return (
		<div className="space-y-5">
			{(pops ?? []).length === 0 && !adding ? (
				<EmptyState
					icon={BookOpen}
					title="Nenhum POP ainda"
					description="Documente o passo a passo das atividades importantes da empresa — assim elas deixam de depender só da sua cabeça."
				>
					<button
						type="button"
						className={BTN_PRIMARY}
						onClick={() => setAdding(true)}
					>
						<Plus className="w-4 h-4" />
						Criar primeiro POP
					</button>
				</EmptyState>
			) : (
				(pops ?? []).map((pop) => (
					<PopCard
						key={pop.id}
						pop={pop}
						onDelete={() => remove.mutate(pop.id)}
						onChanged={invalidate}
					/>
				))
			)}

			{adding ? (
				<div className={`${CARD} p-5 space-y-3 max-w-2xl`}>
					<div className="flex items-center justify-between">
						<p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							Novo POP
						</p>
						<button
							type="button"
							className="text-slate-400 hover:text-slate-600"
							onClick={() => {
								setAdding(false);
								setForm(EMPTY_FORM);
							}}
						>
							<X className="w-4 h-4" />
						</button>
					</div>
					<input
						className={INPUT}
						value={form.title}
						onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
						placeholder="Título do procedimento * (ex.: Gravação em taça)"
					/>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<input
							className={INPUT}
							value={form.objective}
							onChange={(e) =>
								setForm((f) => ({ ...f, objective: e.target.value }))
							}
							placeholder="Objetivo"
						/>
						<input
							className={INPUT}
							value={form.owner_name}
							onChange={(e) =>
								setForm((f) => ({ ...f, owner_name: e.target.value }))
							}
							placeholder="Responsável"
						/>
						<input
							className={INPUT}
							value={form.materials}
							onChange={(e) =>
								setForm((f) => ({ ...f, materials: e.target.value }))
							}
							placeholder="Materiais/equipamentos"
						/>
						<input
							className={INPUT}
							value={form.control_point}
							onChange={(e) =>
								setForm((f) => ({ ...f, control_point: e.target.value }))
							}
							placeholder="Ponto de controle (o que conferir)"
						/>
					</div>
					<input
						className={INPUT}
						value={form.expected_result}
						onChange={(e) =>
							setForm((f) => ({ ...f, expected_result: e.target.value }))
						}
						placeholder="Resultado esperado"
					/>
					<div>
						<label className={LABEL} htmlFor="mnt-pop-steps">
							Passo a passo (um passo por linha)
						</label>
						<textarea
							id="mnt-pop-steps"
							className={INPUT}
							rows={5}
							value={form.stepsText}
							onChange={(e) =>
								setForm((f) => ({ ...f, stepsText: e.target.value }))
							}
							placeholder={
								'Posicionar a peça no gabarito\nConferir foco\nRodar o arquivo de gravação'
							}
						/>
					</div>
					<button
						type="button"
						className={BTN_PRIMARY}
						disabled={!form.title.trim() || create.isPending}
						onClick={() => create.mutate()}
					>
						{create.isPending ? 'Criando...' : 'Criar POP'}
					</button>
				</div>
			) : (
				(pops ?? []).length > 0 && (
					<button
						type="button"
						className={BTN_GHOST}
						onClick={() => setAdding(true)}
					>
						<Plus className="w-4 h-4" />
						Novo POP
					</button>
				)
			)}
		</div>
	);
}

function PopCard({
	pop,
	onDelete,
	onChanged,
}: {
	pop: MntPop;
	onDelete: () => void;
	onChanged: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [linkUrl, setLinkUrl] = useState('');
	const fileRef = useRef<HTMLInputElement>(null);

	const addLink = useMutation({
		mutationFn: () =>
			addPopAttachmentLink(pop.id, { kind: 'link', url: linkUrl.trim() }),
		onSuccess: () => {
			setLinkUrl('');
			onChanged();
			toast.success('Link anexado!');
		},
		onError: () => toast.error('Não foi possível anexar o link.'),
	});

	const upload = useMutation({
		mutationFn: (file: File) => uploadPopAttachment(pop.id, file),
		onSuccess: () => {
			onChanged();
			toast.success('Arquivo anexado!');
		},
		onError: () => toast.error('Não foi possível enviar o arquivo.'),
	});

	const steps = [...pop.steps].sort((a, b) => a.position - b.position);

	return (
		<section className={`${CARD} p-5`}>
			<div className="flex items-start justify-between gap-3">
				<button
					type="button"
					className="text-left min-w-0 flex-1"
					onClick={() => setOpen((o) => !o)}
				>
					<p className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
						<FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
						{pop.title}
						{open ? (
							<ChevronUp className="w-4 h-4 text-slate-400" />
						) : (
							<ChevronDown className="w-4 h-4 text-slate-400" />
						)}
					</p>
					<p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
						{pop.owner_name ? `Responsável: ${pop.owner_name} · ` : ''}
						{steps.length} passo{steps.length === 1 ? '' : 's'}
						{pop.reviewed_at
							? ` · Revisado em ${fmtDate(pop.reviewed_at)}`
							: ''}
					</p>
				</button>
				<button
					type="button"
					className="text-slate-400 hover:text-red-500 transition shrink-0"
					onClick={onDelete}
					title="Excluir POP"
				>
					<Trash2 className="w-4 h-4" />
				</button>
			</div>

			{open && (
				<div className="mt-4 space-y-4">
					<dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
						{pop.objective && (
							<InfoRow label="Objetivo" value={pop.objective} />
						)}
						{pop.materials && (
							<InfoRow label="Materiais" value={pop.materials} />
						)}
						{pop.control_point && (
							<InfoRow label="Ponto de controle" value={pop.control_point} />
						)}
						{pop.expected_result && (
							<InfoRow label="Resultado esperado" value={pop.expected_result} />
						)}
					</dl>

					{steps.length > 0 && (
						<ol className="space-y-1.5">
							{steps.map((s, idx) => (
								<li
									key={s.id}
									className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
								>
									<span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
										{idx + 1}
									</span>
									{s.instruction}
								</li>
							))}
						</ol>
					)}

					{pop.attachments.length > 0 && (
						<ul className="space-y-1">
							{pop.attachments.map((a) => (
								<li key={a.id}>
									<a
										href={a.url}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1.5 text-sm text-teal-600 dark:text-teal-400 hover:underline"
									>
										<Paperclip className="w-3.5 h-3.5" />
										{a.name ?? a.url}
									</a>
								</li>
							))}
						</ul>
					)}

					<div className="flex flex-wrap items-center gap-2 pt-1">
						<input
							className={`${INPUT} flex-1 min-w-48`}
							value={linkUrl}
							onChange={(e) => setLinkUrl(e.target.value)}
							placeholder="https://... (vídeo, foto ou documento)"
						/>
						<button
							type="button"
							className={BTN_GHOST}
							disabled={!linkUrl.trim() || addLink.isPending}
							onClick={() => addLink.mutate()}
						>
							<Link2 className="w-4 h-4" />
							Anexar link
						</button>
						<input
							ref={fileRef}
							type="file"
							className="hidden"
							onChange={(e) => {
								const file = e.target.files?.[0];
								if (file) upload.mutate(file);
								e.target.value = '';
							}}
						/>
						<button
							type="button"
							className={BTN_GHOST}
							disabled={upload.isPending}
							onClick={() => fileRef.current?.click()}
						>
							<Upload className="w-4 h-4" />
							{upload.isPending ? 'Enviando...' : 'Enviar arquivo'}
						</button>
					</div>
				</div>
			)}
		</section>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-gray-500">
				{label}
			</dt>
			<dd className="text-slate-700 dark:text-slate-300">{value}</dd>
		</div>
	);
}
