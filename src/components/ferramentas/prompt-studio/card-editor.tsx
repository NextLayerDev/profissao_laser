'use client';

import {
	ChevronLeft,
	FlaskConical,
	ImageIcon,
	Loader2,
	Trash2,
	Upload,
	X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateBankEntry,
	useDeleteBankEntry,
	useUpdateBankEntry,
} from '@/modules/tools/hooks/use-tool-bank';
import {
	activeModels,
	groupModelsByBrand,
	parseFormats,
	serializeFormats,
} from '@/modules/tools/lib/creation-template';
import { modeUsesImage, modeUsesText } from '@/modules/tools/lib/prompt-bank';
import type { ToolBankEntry } from '@/modules/tools/services/tool-bank.service';
import {
	type AiToolDefinition,
	runToolEngine,
} from '@/modules/tools/services/tool-definitions.service';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { IdeaBox } from './idea-box';
import { PromptField } from './prompt-field';
import {
	chipCls,
	fieldCls,
	ghostBtn,
	hintCls,
	labelCls,
	panelCls,
	primaryBtn,
} from './ui';

const MODES = [
	{ value: 'texto', label: 'Texto', hint: 'O aluno descreve o que quer.' },
	{ value: 'imagem', label: 'Foto', hint: 'O aluno envia uma foto.' },
	{ value: 'texto_imagem', label: 'Texto + foto', hint: 'Os dois, opcionais.' },
] as const;

interface CardForm {
	title: string;
	description: string;
	category: string;
	active: boolean;
	mode: string;
	prompt: string;
	formats: string[];
	before: File | null;
	after: File | null;
	removeBefore: boolean;
	removeAfter: boolean;
}

function formOf(entry: ToolBankEntry | null): CardForm {
	const d = entry?.data ?? {};
	return {
		title: entry?.title ?? '',
		description: entry?.description ?? '',
		category: entry?.category ?? '',
		// Card novo nasce rascunho: o admin testa antes de o aluno ver.
		active: entry?.active ?? false,
		mode: typeof d.mode === 'string' ? d.mode : 'texto',
		prompt: typeof d.prompt_script === 'string' ? d.prompt_script : '',
		formats: parseFormats(d.formats),
		before: null,
		after: null,
		removeBefore: false,
		removeAfter: false,
	};
}

/** `data:` URL do resultado do teste → File, para virar o exemplo "depois". */
async function dataUrlToFile(url: string, name: string): Promise<File> {
	const blob = await (await fetch(url)).blob();
	return new File([blob], name, { type: blob.type || 'image/png' });
}

/**
 * Ficha de UM card: o que o aluno vê (título, categoria, exemplos), o que a IA
 * recebe (prompt com `{tema}`) e onde ele vale (formatos). Ao lado, o TESTE:
 * gera com o texto que está na tela — salvo ou não — no formato escolhido,
 * sem cobrar e sem publicar. O resultado pode virar o exemplo do card.
 */
export function CardEditor({
	definition,
	entry,
	categories,
	onClose,
}: {
	definition: AiToolDefinition;
	entry: ToolBankEntry | null;
	categories: string[];
	onClose: () => void;
}) {
	const key = definition.tool_key;
	const createMut = useCreateBankEntry(key);
	const updateMut = useUpdateBankEntry(key);
	const deleteMut = useDeleteBankEntry(key);
	const [form, setForm] = useState<CardForm>(() => formOf(entry));
	const [exampleTemas, setExampleTemas] = useState<string[]>([]);
	// Card novo começa só com a caixa de ideia; o formulário aparece quando a
	// IA preencher (ou se o admin preferir escrever do zero).
	const [showForm, setShowForm] = useState(!!entry);
	const patch = (p: Partial<CardForm>) => setForm((f) => ({ ...f, ...p }));
	const saving = createMut.isPending || updateMut.isPending;

	const creations = useMemo(
		() =>
			(definition.definition.creations ?? []).filter((c) => c.active !== false),
		[definition],
	);

	const save = async () => {
		if (!form.title.trim()) return toast.error('Dê um título ao card.');
		if (!form.prompt.trim()) return toast.error('Escreva o prompt.');
		const fd = new FormData();
		fd.append('title', form.title.trim());
		fd.append('description', form.description.trim());
		fd.append('category', form.category.trim());
		fd.append('active', String(form.active));
		// `data` é o registro INTEIRO: preserva o que este editor não mostra
		// (especificações, tamanho, nº de fotos) do editor avançado.
		fd.append(
			'data',
			JSON.stringify({
				...(entry?.data ?? {}),
				mode: form.mode,
				prompt_script: form.prompt,
				formats: serializeFormats(form.formats),
			}),
		);
		if (form.before) fd.append('example_before', form.before);
		if (form.after) fd.append('example_after', form.after);
		if (entry && form.removeBefore) fd.append('removeExampleBefore', 'true');
		if (entry && form.removeAfter) fd.append('removeExampleAfter', 'true');
		try {
			if (entry) await updateMut.mutateAsync({ id: entry.id, body: fd });
			else await createMut.mutateAsync(fd);
			toast.success(
				form.active ? 'Card publicado para os alunos.' : 'Rascunho salvo.',
			);
			onClose();
		} catch (err) {
			toast.error(getApiErrorMessage(err, 'Não foi possível salvar o card.'));
		}
	};

	const remove = async () => {
		if (!entry) return;
		if (
			!window.confirm(`Excluir o card "${entry.title}"? Não dá para desfazer.`)
		)
			return;
		try {
			await deleteMut.mutateAsync(entry.id);
			toast.success('Card excluído.');
			onClose();
		} catch (err) {
			toast.error(getApiErrorMessage(err, 'Não foi possível excluir.'));
		}
	};

	return (
		<div className="space-y-4">
			<button
				type="button"
				onClick={onClose}
				className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
			>
				<ChevronLeft className="h-4 w-4" /> Todos os cards
			</button>

			<IdeaBox
				compact={showForm}
				formats={creations.map((c) => ({ id: c.id, label: c.label }))}
				categories={categories}
				onSuggest={(s) => {
					patch({
						title: s.title,
						category: s.category,
						description: s.description,
						mode: s.mode,
						prompt: s.prompt_script,
						formats: s.formats,
					});
					setExampleTemas(s.example_temas);
					setShowForm(true);
				}}
			/>
			{!showForm ? (
				<button
					type="button"
					onClick={() => setShowForm(true)}
					className="text-[12px] text-slate-500 underline-offset-2 hover:text-slate-200 hover:underline"
				>
					Prefiro escrever do zero
				</button>
			) : (
				<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
					<div className={`${panelCls} space-y-5 p-5`}>
						<div className="grid gap-3 sm:grid-cols-[1fr_220px]">
							<label>
								<span className={labelCls}>Título do card</span>
								<input
									value={form.title}
									onChange={(e) => patch({ title: e.target.value })}
									placeholder="Ex.: Nome em flores aquarela"
									className={fieldCls}
								/>
							</label>
							<label>
								<span className={labelCls}>Categoria</span>
								<input
									value={form.category}
									list="categorias-cards"
									onChange={(e) => patch({ category: e.target.value })}
									placeholder="Ex.: Pets"
									className={fieldCls}
								/>
								<datalist id="categorias-cards">
									{categories.map((c) => (
										<option key={c} value={c} />
									))}
								</datalist>
							</label>
						</div>
						<label className="block">
							<span className={labelCls}>Descrição (o aluno vê)</span>
							<input
								value={form.description}
								onChange={(e) => patch({ description: e.target.value })}
								placeholder="Ex.: O nome do cliente cercado de flores."
								className={fieldCls}
							/>
						</label>

						<div>
							<span className={labelCls}>O que o aluno manda</span>
							<div className="flex flex-wrap gap-1.5">
								{MODES.map((m) => (
									<button
										key={m.value}
										type="button"
										title={m.hint}
										className={chipCls(form.mode === m.value)}
										onClick={() => patch({ mode: m.value })}
									>
										{m.label}
									</button>
								))}
							</div>
						</div>

						<PromptField
							value={form.prompt}
							onChange={(prompt) => patch({ prompt })}
							needsTema={modeUsesText(form.mode)}
						/>

						<div>
							<span className={labelCls}>Aparece em</span>
							<div className="flex flex-wrap gap-1.5">
								<button
									type="button"
									className={chipCls(form.formats.length === 0)}
									onClick={() => patch({ formats: [] })}
								>
									Todos
								</button>
								{creations.map((c) => {
									const on = form.formats.includes(c.id);
									return (
										<button
											key={c.id}
											type="button"
											className={chipCls(on)}
											onClick={() =>
												patch({
													formats: on
														? form.formats.filter((f) => f !== c.id)
														: [...form.formats, c.id],
												})
											}
										>
											{c.label}
										</button>
									);
								})}
							</div>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							<ExamplePick
								label="Exemplo — antes (opcional)"
								currentUrl={
									form.removeBefore ? null : entry?.example_before_url
								}
								file={form.before}
								onFile={(f) => patch({ before: f, removeBefore: false })}
								onClear={() => patch({ before: null, removeBefore: true })}
							/>
							<ExamplePick
								label="Exemplo — depois (capa do card)"
								currentUrl={form.removeAfter ? null : entry?.example_after_url}
								file={form.after}
								onFile={(f) => patch({ after: f, removeAfter: false })}
								onClear={() => patch({ after: null, removeAfter: true })}
							/>
						</div>

						<div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
							<label className="flex items-center gap-2 text-sm text-slate-300">
								<input
									type="checkbox"
									checked={form.active}
									onChange={(e) => patch({ active: e.target.checked })}
									className="h-4 w-4 accent-emerald-400"
								/>
								Publicado para os alunos
							</label>
							<div className="flex gap-2">
								{entry && (
									<button
										type="button"
										onClick={remove}
										className={`${ghostBtn} hover:text-rose-300`}
										disabled={deleteMut.isPending}
									>
										<Trash2 className="h-4 w-4" /> Excluir
									</button>
								)}
								<button
									type="button"
									onClick={save}
									className={primaryBtn}
									disabled={saving}
								>
									{saving && <Loader2 className="h-4 w-4 animate-spin" />}
									{form.active ? 'Salvar e publicar' : 'Salvar rascunho'}
								</button>
							</div>
						</div>
					</div>

					<TestPanel
						definition={definition}
						form={form}
						exampleTemas={exampleTemas}
						creations={
							form.formats.length
								? creations.filter((c) => form.formats.includes(c.id))
								: creations
						}
						onUseAsExample={async (url) => {
							patch({ after: await dataUrlToFile(url, 'exemplo.png') });
							toast.success('Vai virar a capa do card quando você salvar.');
						}}
					/>
				</div>
			)}
		</div>
	);
}

function ExamplePick({
	label,
	currentUrl,
	file,
	onFile,
	onClear,
}: {
	label: string;
	currentUrl?: string | null;
	file: File | null;
	onFile: (f: File) => void;
	onClear: () => void;
}) {
	const input = useRef<HTMLInputElement>(null);
	const [blobUrl, setBlobUrl] = useState<string | null>(null);
	useEffect(() => {
		if (!file) return setBlobUrl(null);
		const u = URL.createObjectURL(file);
		setBlobUrl(u);
		return () => URL.revokeObjectURL(u);
	}, [file]);
	const shown = blobUrl ?? currentUrl ?? null;
	return (
		<div>
			<span className={labelCls}>{label}</span>
			<div className="relative flex h-36 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/10 bg-black/30">
				{shown ? (
					<>
						{/* <img> intencional: blob local / CDN dinâmico */}
						<img src={shown} alt="" className="h-full w-full object-contain" />
						<button
							type="button"
							onClick={onClear}
							aria-label="Remover exemplo"
							className="absolute right-2 top-2 rounded-lg bg-black/70 p-1.5 text-slate-200 hover:text-white"
						>
							<X className="h-3.5 w-3.5" />
						</button>
					</>
				) : (
					<button
						type="button"
						onClick={() => input.current?.click()}
						className="flex flex-col items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-300"
					>
						<Upload className="h-5 w-5" />
						Enviar imagem
					</button>
				)}
				<input
					ref={input}
					type="file"
					accept="image/png,image/jpeg,image/webp"
					className="hidden"
					onChange={(e) => {
						const f = e.target.files?.[0];
						if (f) onFile(f);
						e.target.value = '';
					}}
				/>
			</div>
		</div>
	);
}

/**
 * TESTE do card: roda o motor com a definition inline (preview de staff — o
 * motor não cobra) e o prompt JÁ com o `{tema}` trocado, então vale para texto
 * ainda não salvo. Mede o tempo: é o que o aluno vai esperar.
 */
function TestPanel({
	definition,
	form,
	creations,
	exampleTemas,
	onUseAsExample,
}: {
	definition: AiToolDefinition;
	form: CardForm;
	/** Exemplos da IA: um clique vira o tema do teste. */
	exampleTemas: string[];
	creations: NonNullable<AiToolDefinition['definition']['creations']>;
	onUseAsExample: (url: string) => void;
}) {
	const [tema, setTema] = useState('');
	useEffect(() => {
		if (exampleTemas[0]) setTema(exampleTemas[0]);
	}, [exampleTemas]);
	const [foto, setFoto] = useState<File | null>(null);
	const [creationId, setCreationId] = useState<string>(creations[0]?.id ?? '');
	const [modelId, setModelId] = useState<string>('');
	const [running, setRunning] = useState(false);
	const [elapsed, setElapsed] = useState(0);
	const [result, setResult] = useState<{ url: string; ms: number } | null>(
		null,
	);
	const fotoInput = useRef<HTMLInputElement>(null);

	const creation = creations.find((c) => c.id === creationId);
	const models = activeModels(creation);
	useEffect(() => {
		if (creationId && !creations.some((c) => c.id === creationId))
			setCreationId(creations[0]?.id ?? '');
	}, [creations, creationId]);
	useEffect(() => {
		setModelId(models[0]?.id ?? '');
	}, [models[0]?.id]);

	useEffect(() => {
		if (!running) return;
		const t0 = performance.now();
		const id = window.setInterval(
			() => setElapsed(Math.round((performance.now() - t0) / 1000)),
			250,
		);
		return () => window.clearInterval(id);
	}, [running]);

	const usesText = modeUsesText(form.mode);
	const usesImage = modeUsesImage(form.mode);
	const canRun =
		!!form.prompt.trim() &&
		(!creations.length || !!creationId) &&
		(!models.length || !!modelId) &&
		(form.mode !== 'imagem' || !!foto);

	const run = async () => {
		setRunning(true);
		setElapsed(0);
		setResult(null);
		const t0 = performance.now();
		try {
			const prompt = form.prompt.replace(
				/\{tema\}/g,
				tema.trim() || 'um tema livre',
			);
			const r = await runToolEngine(definition.tool_key, {
				values: {},
				inputSpec: {},
				draftDefinition: definition.definition,
				bankInputs: {
					prompt,
					tema: tema.trim(),
					...(creationId ? { creation_id: creationId } : {}),
					...(modelId && models.length ? { creation_model_id: modelId } : {}),
					...(usesImage && foto ? { referencia: foto } : {}),
				},
			});
			const out = r.output;
			const url =
				(typeof out.preview === 'string' && out.preview) ||
				(typeof out.primary === 'string' && out.primary) ||
				null;
			if (!url) throw new Error('O teste terminou sem imagem.');
			setResult({ url, ms: performance.now() - t0 });
		} catch (err) {
			toast.error(getApiErrorMessage(err, 'O teste falhou.'));
		} finally {
			setRunning(false);
		}
	};

	return (
		<aside className={`${panelCls} h-fit space-y-4 p-5 lg:sticky lg:top-4`}>
			<div>
				<h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
					<FlaskConical className="h-4 w-4 text-emerald-300" />
					Testar antes de publicar
				</h3>
				<p className={hintCls}>
					Gera com o prompt da tela, como o aluno veria. Não cobra voxxys.
				</p>
			</div>
			{usesText && (
				<label className="block">
					<span className={labelCls}>Tema de teste</span>
					<input
						value={tema}
						onChange={(e) => setTema(e.target.value)}
						placeholder="Ex.: Ana Clara"
						className={fieldCls}
					/>
					{exampleTemas.length > 0 && (
						<span className="mt-1.5 flex flex-wrap gap-1">
							{exampleTemas.map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => setTema(t)}
									className={chipCls(tema === t)}
								>
									{t}
								</button>
							))}
						</span>
					)}
				</label>
			)}
			{usesImage && (
				<div>
					<span className={labelCls}>
						Foto de teste{form.mode === 'imagem' ? '' : ' (opcional)'}
					</span>
					<button
						type="button"
						onClick={() => fotoInput.current?.click()}
						className={`${ghostBtn} w-full justify-start`}
					>
						<ImageIcon className="h-4 w-4" />
						<span className="truncate">
							{foto ? foto.name : 'Escolher foto…'}
						</span>
					</button>
					<input
						ref={fotoInput}
						type="file"
						accept="image/png,image/jpeg,image/webp"
						className="hidden"
						onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
					/>
				</div>
			)}
			{creations.length > 0 && (
				<div className="grid grid-cols-2 gap-2">
					<label className={models.length ? '' : 'col-span-2'}>
						<span className={labelCls}>Formato</span>
						<select
							value={creationId}
							onChange={(e) => setCreationId(e.target.value)}
							className={fieldCls}
						>
							{creations.map((c) => (
								<option key={c.id} value={c.id}>
									{c.label}
								</option>
							))}
						</select>
					</label>
					{models.length > 0 && (
						<label>
							<span className={labelCls}>Modelo</span>
							<select
								value={modelId}
								onChange={(e) => setModelId(e.target.value)}
								className={fieldCls}
							>
								{groupModelsByBrand(models).map(([brand, list]) => (
									<optgroup key={brand} label={brand}>
										{list.map((m) => (
											<option key={m.id} value={m.id}>
												{m.label}
											</option>
										))}
									</optgroup>
								))}
							</select>
						</label>
					)}
				</div>
			)}
			<button
				type="button"
				onClick={run}
				disabled={!canRun || running}
				className={`${primaryBtn} w-full`}
			>
				{running ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" /> Gerando… {elapsed}s
					</>
				) : (
					<>
						<FlaskConical className="h-4 w-4" /> Testar
					</>
				)}
			</button>

			<div
				className="flex min-h-48 items-center justify-center overflow-hidden rounded-xl border border-white/[0.07]"
				style={{
					backgroundImage:
						'repeating-conic-gradient(rgb(148 163 184 / 0.18) 0% 25%, transparent 0% 50%)',
					backgroundSize: '16px 16px',
				}}
			>
				{result ? (
					// <img> intencional: data URL do teste
					<img
						src={result.url}
						alt="Resultado do teste"
						className="max-h-[420px] w-full object-contain"
					/>
				) : (
					<p className="px-6 text-center text-[12px] text-slate-500">
						{running
							? 'A IA está desenhando. Costuma levar de 20 a 60 segundos.'
							: 'O resultado aparece aqui. O xadrez mostra o que sai transparente.'}
					</p>
				)}
			</div>
			{result && (
				<div className="flex flex-wrap items-center justify-between gap-2">
					<span className="text-[12px] tabular-nums text-slate-400">
						Pronto em {(result.ms / 1000).toFixed(1).replace('.', ',')} s
					</span>
					<button
						type="button"
						className={ghostBtn}
						onClick={() => onUseAsExample(result.url)}
					>
						Usar como capa do card
					</button>
				</div>
			)}
		</aside>
	);
}
