'use client';

import {
	CheckCircle2,
	Info,
	Loader2,
	Pencil,
	Plus,
	Upload,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/dashboard/header';
import type { MntMeetingTemplate } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useMeetingTemplateMutations,
	useMeetingTemplatesAdmin,
} from '../_components/admin-hooks';
import {
	Badge,
	Card,
	EmptyState,
	Field,
	inputClass,
	Modal,
	PageTitle,
	primaryBtn,
	Spinner,
	secondaryBtn,
} from '../_components/ui';

type Editing = { template: MntMeetingTemplate | null } | null;

export default function EncontrosPage() {
	const templates = useMeetingTemplatesAdmin();
	const { publish } = useMeetingTemplateMutations();
	const [editing, setEditing] = useState<Editing>(null);

	// Agrupa por position; ordena versões desc dentro de cada grupo.
	const grouped = useMemo(() => {
		const map = new Map<number, MntMeetingTemplate[]>();
		for (const t of templates.data ?? []) {
			const list = map.get(t.position) ?? [];
			list.push(t);
			map.set(t.position, list);
		}
		for (const list of map.values()) {
			list.sort((a, b) => b.version - a.version);
		}
		return [...map.entries()].sort(([a], [b]) => a - b);
	}, [templates.data]);

	const doPublish = async (t: MntMeetingTemplate) => {
		try {
			await publish.mutateAsync(t.id);
			toast.success(`Encontro ${t.position} v${t.version} publicado`);
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao publicar o template'));
		}
	};

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
				<PageTitle
					title="Encontros"
					description="Templates dos encontros da metodologia, agrupados por posição (1 a 10)."
					backHref="/mentoria-admin"
					actions={
						<button
							type="button"
							className={primaryBtn}
							onClick={() => setEditing({ template: null })}
						>
							<Plus className="w-4 h-4" />
							Novo encontro
						</button>
					}
				/>

				<div className="mb-6 flex items-start gap-2 rounded-xl border border-blue-300/50 dark:border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
					<Info className="w-4 h-4 mt-0.5 shrink-0" />
					<p>
						Editar um encontro cria automaticamente uma <b>nova versão</b>. As
						edições valem para novas turmas; jornadas em andamento mantêm a
						versão da matrícula.
					</p>
				</div>

				{templates.isLoading ? (
					<Card>
						<Spinner />
					</Card>
				) : !grouped.length ? (
					<Card>
						<EmptyState message="Nenhum template de encontro cadastrado." />
					</Card>
				) : (
					<div className="space-y-4">
						{grouped.map(([position, versions]) => {
							const latest = versions[0];
							return (
								<Card key={position} className="p-5">
									<div className="flex items-start justify-between gap-4 flex-wrap">
										<div className="flex items-start gap-3 min-w-0">
											<div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center text-sm font-semibold text-violet-600 dark:text-violet-400 shrink-0">
												{position}
											</div>
											<div className="min-w-0">
												<p className="font-semibold text-slate-900 dark:text-white">
													{latest.title}
												</p>
												{latest.subtitle && (
													<p className="text-sm text-slate-500 dark:text-gray-400">
														{latest.subtitle}
													</p>
												)}
												<div className="flex items-center gap-2 mt-2 flex-wrap">
													{versions.map((v) => (
														<span
															key={v.id}
															className="inline-flex items-center gap-1"
														>
															<Badge tone={v.published ? 'green' : 'amber'}>
																v{v.version}{' '}
																{v.published ? 'publicada' : 'rascunho'}
															</Badge>
														</span>
													))}
													{latest.is_final && (
														<Badge tone="violet">Encontro final</Badge>
													)}
												</div>
											</div>
										</div>
										<div className="flex gap-2">
											{!latest.published && (
												<button
													type="button"
													className={secondaryBtn}
													onClick={() => doPublish(latest)}
													disabled={publish.isPending}
												>
													<Upload className="w-3.5 h-3.5" />
													Publicar v{latest.version}
												</button>
											)}
											<button
												type="button"
												className={secondaryBtn}
												onClick={() => setEditing({ template: latest })}
											>
												<Pencil className="w-3.5 h-3.5" />
												Editar (nova versão)
											</button>
										</div>
									</div>
								</Card>
							);
						})}
					</div>
				)}
			</main>

			{editing && (
				<MeetingTemplateModal
					template={editing.template}
					onClose={() => setEditing(null)}
				/>
			)}
		</div>
	);
}

function MeetingTemplateModal({
	template,
	onClose,
}: {
	template: MntMeetingTemplate | null;
	onClose: () => void;
}) {
	const { create } = useMeetingTemplateMutations();
	const [form, setForm] = useState({
		program_key: template?.program_key ?? 'mentoria_360',
		position: template?.position ?? 1,
		title: template?.title ?? '',
		subtitle: template?.subtitle ?? '',
		description: template?.description ?? '',
		objectives: template?.objectives ?? '',
		content_md: template?.content_md ?? '',
		expected_result: template?.expected_result ?? '',
		is_final: template?.is_final ?? false,
	});
	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [key]: value }));

	const save = async () => {
		if (!form.title.trim()) {
			toast.error('Informe o título do encontro');
			return;
		}
		if (form.position < 1 || form.position > 10) {
			toast.error('A posição deve estar entre 1 e 10');
			return;
		}
		try {
			await create.mutateAsync({
				program_key: form.program_key,
				position: form.position,
				title: form.title.trim(),
				subtitle: form.subtitle.trim() || null,
				description: form.description.trim() || null,
				objectives: form.objectives.trim() || null,
				content_md: form.content_md || null,
				expected_result: form.expected_result.trim() || null,
				is_final: form.is_final,
			});
			toast.success(
				template
					? 'Nova versão criada (rascunho). Publique quando estiver pronta.'
					: 'Encontro criado (rascunho). Publique quando estiver pronto.',
			);
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao salvar o encontro'));
		}
	};

	return (
		<Modal
			title={
				template
					? `Editar Encontro ${template.position} (gera v${template.version + 1})`
					: 'Novo encontro'
			}
			onClose={onClose}
			wide
		>
			<div className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<Field label="Programa">
						<input
							className={inputClass}
							value={form.program_key}
							onChange={(e) => set('program_key', e.target.value)}
						/>
					</Field>
					<Field label="Posição (1–10)" required>
						<input
							type="number"
							min={1}
							max={10}
							className={inputClass}
							value={form.position}
							onChange={(e) => set('position', Number(e.target.value))}
						/>
					</Field>
					<Field label="Encontro final?">
						<label className="flex items-center gap-2 h-9 text-sm text-slate-700 dark:text-slate-300">
							<input
								type="checkbox"
								checked={form.is_final}
								onChange={(e) => set('is_final', e.target.checked)}
								className="w-4 h-4 accent-violet-600"
							/>
							Marca o encerramento da jornada
						</label>
					</Field>
				</div>
				<Field label="Título" required>
					<input
						className={inputClass}
						value={form.title}
						onChange={(e) => set('title', e.target.value)}
					/>
				</Field>
				<Field label="Subtítulo">
					<input
						className={inputClass}
						value={form.subtitle}
						onChange={(e) => set('subtitle', e.target.value)}
					/>
				</Field>
				<Field label="Descrição">
					<textarea
						className={`${inputClass} min-h-20`}
						value={form.description}
						onChange={(e) => set('description', e.target.value)}
					/>
				</Field>
				<Field label="Objetivos">
					<textarea
						className={`${inputClass} min-h-20`}
						value={form.objectives}
						onChange={(e) => set('objectives', e.target.value)}
					/>
				</Field>
				<Field label="Conteúdo (Markdown)">
					<textarea
						className={`${inputClass} min-h-40 font-mono text-xs`}
						value={form.content_md}
						onChange={(e) => set('content_md', e.target.value)}
					/>
				</Field>
				<Field label="Resultado esperado">
					<textarea
						className={`${inputClass} min-h-20`}
						value={form.expected_result}
						onChange={(e) => set('expected_result', e.target.value)}
					/>
				</Field>
				<div className="flex justify-end gap-2 pt-2">
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className={primaryBtn}
						onClick={save}
						disabled={create.isPending}
					>
						{create.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<CheckCircle2 className="w-4 h-4" />
						)}
						{template ? 'Salvar nova versão' : 'Criar encontro'}
					</button>
				</div>
			</div>
		</Modal>
	);
}
