'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, FilePlus2, Loader2, Rocket, Save, Wrench } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { DynamicToolView } from '@/modules/tools/components/dynamic-tool-view';
import {
	type AiToolDefinition,
	createToolDefinition,
	listToolDefinitions,
	publishToolDefinition,
	type ToolDefinitionDoc,
	toolDefinitionDocSchema,
	updateToolDefinition,
} from '@/modules/tools/services/tool-definitions.service';
import { getApiErrorMessage } from '@/shared/lib/api-error';

const STARTER: ToolDefinitionDoc = {
	schemaVersion: 1,
	input: {
		image: { type: 'image', required: true },
		threshold: { type: 'int', min: 0, max: 255, default: 128 },
	},
	pipeline: [
		{ id: 'src', block: 'image.input', params: { from: 'input.image' } },
		{
			id: 'vec',
			block: 'image.vectorize',
			params: { image: 'src.buffer', threshold: 'input.threshold' },
		},
		{
			id: 'store',
			block: 'output.upload_svg',
			params: { from: 'vec.svg', folder: 'tool-output' },
		},
	],
	output: { primary: 'store.url', savable: true },
	ui: {
		layout: 'image-tool',
		controls: [
			{ bind: 'input.image', widget: 'file-drop', label: 'Sua imagem' },
			{
				bind: 'input.threshold',
				widget: 'slider',
				label: 'Limiar',
				min: 0,
				max: 255,
				step: 1,
			},
		],
		action: { label: 'Vetorizar', showCostNotice: true },
		result: { kind: 'image', downloadFrom: 'output.primary', showMeta: false },
	},
	billing: {
		vox_cost: 0,
		free_quota: { max: null, avan: null, pro: null, basic: null },
	},
};

const STATUS_STYLE: Record<string, string> = {
	published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15',
	draft: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15',
	archived: 'bg-slate-200 text-slate-600 dark:bg-white/10',
};

export function ToolBuilderView() {
	const qc = useQueryClient();
	const list = useQuery({
		queryKey: ['tool-definitions'],
		queryFn: listToolDefinitions,
	});

	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [toolKey, setToolKey] = useState('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [json, setJson] = useState(JSON.stringify(STARTER, null, 2));
	const [jsonError, setJsonError] = useState<string | null>(null);
	const [preview, setPreview] = useState<AiToolDefinition | null>(null);

	const parseDoc = (): ToolDefinitionDoc | null => {
		try {
			const parsed = toolDefinitionDocSchema.parse(JSON.parse(json));
			setJsonError(null);
			return parsed;
		} catch (err) {
			setJsonError(err instanceof Error ? err.message : 'JSON inválido');
			return null;
		}
	};

	const loadInto = (def: AiToolDefinition) => {
		setSelectedId(def.id);
		setToolKey(def.tool_key);
		setTitle(def.title);
		setDescription(def.description ?? '');
		setJson(JSON.stringify(def.definition, null, 2));
		setJsonError(null);
		setPreview(null);
	};

	const startNew = () => {
		setSelectedId(null);
		setToolKey('');
		setTitle('');
		setDescription('');
		setJson(JSON.stringify(STARTER, null, 2));
		setJsonError(null);
		setPreview(null);
	};

	const saveMut = useMutation({
		mutationFn: async () => {
			const definition = parseDoc();
			if (!definition) throw new Error('JSON inválido');
			if (selectedId) {
				return updateToolDefinition(selectedId, {
					title,
					description: description || null,
					definition,
				});
			}
			return createToolDefinition({
				tool_key: toolKey,
				title,
				description: description || undefined,
				definition,
			});
		},
		onSuccess: (def) => {
			toast.success('Definição salva.');
			qc.invalidateQueries({ queryKey: ['tool-definitions'] });
			loadInto(def);
		},
		onError: (err) => toast.error(getApiErrorMessage(err, 'Falha ao salvar.')),
	});

	const publishMut = useMutation({
		mutationFn: () => {
			if (!selectedId) throw new Error('Salve antes de publicar.');
			return publishToolDefinition(selectedId);
		},
		onSuccess: (res) => {
			toast.success(`Publicada: ${res.tool_key} v${res.version}`);
			qc.invalidateQueries({ queryKey: ['tool-definitions'] });
			qc.invalidateQueries({ queryKey: ['entitlements'] });
		},
		onError: (err) =>
			toast.error(getApiErrorMessage(err, 'Falha ao publicar.')),
	});

	const onPreview = () => {
		const definition = parseDoc();
		if (!definition) {
			toast.error('Corrija o JSON antes de pré-visualizar.');
			return;
		}
		setPreview({
			id: selectedId ?? 'draft',
			tool_key: toolKey || 'draft',
			version: 0,
			status: 'draft',
			title: title || 'Pré-visualização',
			description: description || null,
			engine_runtime: 'blocks_v1',
			definition,
		});
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Fábrica de Tools"
				subtitle="Crie e publique ferramentas como dado (definição JSON), sem deploy."
				icon={Wrench}
			/>

			<div className="grid lg:grid-cols-[260px_1fr] gap-6">
				{/* Lista */}
				<aside className="space-y-2">
					<button
						type="button"
						onClick={startNew}
						className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold"
					>
						<FilePlus2 className="w-4 h-4" /> Nova ferramenta
					</button>
					<div className="rounded-xl border border-slate-200 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
						{list.isLoading && (
							<div className="p-4 flex justify-center">
								<Loader2 className="w-4 h-4 animate-spin text-violet-500" />
							</div>
						)}
						{list.data?.map((def) => (
							<button
								key={def.id}
								type="button"
								onClick={() => loadInto(def)}
								className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 ${
									selectedId === def.id
										? 'bg-violet-50 dark:bg-violet-500/10'
										: ''
								}`}
							>
								<div className="flex items-center justify-between gap-2">
									<span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
										{def.title}
									</span>
									<span
										className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[def.status] ?? STATUS_STYLE.archived}`}
									>
										{def.status}
									</span>
								</div>
								<span className="text-[11px] text-slate-400 font-mono">
									{def.tool_key} · v{def.version}
								</span>
							</button>
						))}
						{list.data?.length === 0 && (
							<p className="p-4 text-xs text-slate-400">Nenhuma definição.</p>
						)}
					</div>
				</aside>

				{/* Editor */}
				<section className="space-y-4">
					<div className="grid sm:grid-cols-3 gap-3">
						<div className="space-y-1">
							<label
								htmlFor="tb-key"
								className="text-xs font-medium text-slate-500"
							>
								tool_key
							</label>
							<input
								id="tb-key"
								value={toolKey}
								disabled={!!selectedId}
								onChange={(e) => setToolKey(e.target.value)}
								placeholder="ex.: vetor_basico"
								className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] font-mono disabled:opacity-60"
							/>
						</div>
						<div className="space-y-1 sm:col-span-2">
							<label
								htmlFor="tb-title"
								className="text-xs font-medium text-slate-500"
							>
								Título
							</label>
							<input
								id="tb-title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Nome da ferramenta"
								className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111]"
							/>
						</div>
					</div>

					<div className="space-y-1">
						<label
							htmlFor="tb-desc"
							className="text-xs font-medium text-slate-500"
						>
							Descrição
						</label>
						<input
							id="tb-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111]"
						/>
					</div>

					<div className="space-y-1">
						<label
							htmlFor="tb-json"
							className="text-xs font-medium text-slate-500"
						>
							Definição (JSON)
						</label>
						<textarea
							id="tb-json"
							value={json}
							onChange={(e) => {
								setJson(e.target.value);
								setJsonError(null);
							}}
							spellCheck={false}
							rows={20}
							className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0d0d0d] font-mono text-slate-700 dark:text-slate-300"
						/>
						{jsonError && (
							<p className="text-xs text-red-500">JSON inválido: {jsonError}</p>
						)}
					</div>

					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => saveMut.mutate()}
							disabled={saveMut.isPending || !toolKey || !title}
							className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 dark:bg-white/10 text-white text-sm font-semibold disabled:opacity-50"
						>
							{saveMut.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Save className="w-4 h-4" />
							)}
							{selectedId ? 'Salvar' : 'Criar rascunho'}
						</button>
						<button
							type="button"
							onClick={onPreview}
							className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-700 dark:text-slate-200"
						>
							<Eye className="w-4 h-4" /> Pré-visualizar
						</button>
						<button
							type="button"
							onClick={() => publishMut.mutate()}
							disabled={publishMut.isPending || !selectedId}
							className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-50"
						>
							{publishMut.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Rocket className="w-4 h-4" />
							)}
							Publicar
						</button>
					</div>

					{preview && (
						<div className="rounded-2xl border border-violet-200 dark:border-violet-500/30 bg-violet-50/40 dark:bg-violet-500/5 mt-4">
							<div className="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
								Pré-visualização (não cobra)
							</div>
							<DynamicToolView
								toolKey={preview.tool_key}
								definitionOverride={preview}
							/>
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
