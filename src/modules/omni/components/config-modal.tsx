'use client';

import {
	Bot,
	Building2,
	FileText,
	Loader2,
	Plus,
	Search,
	Trash2,
	Upload,
	X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	useOmniAgentMutations,
	useOmniAgents,
	useOmniConfig,
	useOmniKb,
} from '../hooks/use-omni';
import {
	DEFAULT_OMNI_BUSINESS_CONFIG,
	type OmniAgent,
	type OmniBusinessConfig,
	type OmniKbChunk,
} from '../types/omni';

type Tab = 'negocio' | 'agentes' | 'conhecimento';

const CONFIG_FIELDS: Array<{
	key: keyof OmniBusinessConfig;
	label: string;
	kind: 'input' | 'textarea' | 'switch';
}> = [
	{
		key: 'company_description',
		label: 'Descrição da empresa',
		kind: 'textarea',
	},
	{ key: 'product_categories', label: 'Categorias de produtos', kind: 'input' },
	{ key: 'greeting_message', label: 'Saudação padrão', kind: 'textarea' },
	{ key: 'payment_method', label: 'Formas de pagamento', kind: 'input' },
	{ key: 'payment_terms', label: 'Condições de pagamento', kind: 'input' },
	{ key: 'local_pickup_city', label: 'Retirada local (cidade)', kind: 'input' },
	{
		key: 'delivery_policy',
		label: 'Política de entrega/frete',
		kind: 'textarea',
	},
	{ key: 'business_location', label: 'Localização', kind: 'input' },
	{ key: 'business_hours', label: 'Horário de atendimento', kind: 'input' },
	{ key: 'issues_invoice', label: 'Emite nota fiscal', kind: 'switch' },
	{ key: 'marketplace_url', label: 'Loja/marketplace (URL)', kind: 'input' },
	{ key: 'exchange_policy', label: 'Política de trocas', kind: 'textarea' },
	{
		key: 'engraving_included',
		label: 'Gravação inclusa no preço',
		kind: 'switch',
	},
	{
		key: 'accepted_formats',
		label: 'Formatos de arquivo aceitos',
		kind: 'input',
	},
	{
		key: 'human_transfer_priority',
		label: 'Quando transferir para humano',
		kind: 'textarea',
	},
	{ key: 'tone_of_voice', label: 'Tom de voz', kind: 'textarea' },
];

const MODEL_SUGGESTIONS = [
	'google/gemini-2.5-flash',
	'openai/gpt-4o-mini',
	'anthropic/claude-3-5-haiku',
	'x-ai/grok-4-fast',
];

export function ConfigModal({
	instanceId,
	onClose,
}: {
	instanceId: string;
	onClose: () => void;
}) {
	const [tab, setTab] = useState<Tab>('negocio');
	const TABS: { key: Tab; label: string; icon: typeof Bot }[] = [
		{ key: 'negocio', label: 'Negócio', icon: Building2 },
		{ key: 'agentes', label: 'Agentes', icon: Bot },
		{ key: 'conhecimento', label: 'Conhecimento', icon: FileText },
	];
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
			<div className="flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141416]">
				<div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-5 py-4">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						Configurar IA
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
				<div className="flex gap-1 border-b border-slate-200 dark:border-white/10 px-5 pt-3">
					{TABS.map((t) => (
						<button
							key={t.key}
							type="button"
							onClick={() => setTab(t.key)}
							className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
								tab === t.key
									? 'border-violet-500 text-violet-600 dark:text-violet-400'
									: 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
							}`}
						>
							<t.icon className="h-4 w-4" />
							{t.label}
						</button>
					))}
				</div>
				<div className="flex-1 overflow-y-auto p-5">
					{tab === 'negocio' && <BusinessTab instanceId={instanceId} />}
					{tab === 'agentes' && <AgentsTab instanceId={instanceId} />}
					{tab === 'conhecimento' && <KbTab instanceId={instanceId} />}
				</div>
			</div>
		</div>
	);
}

/* ─────────────────────────── Negócio ─────────────────────────── */

function BusinessTab({ instanceId }: { instanceId: string }) {
	const { data, isLoading, save } = useOmniConfig(instanceId);
	const [form, setForm] = useState<OmniBusinessConfig>(
		DEFAULT_OMNI_BUSINESS_CONFIG,
	);
	useEffect(() => {
		if (data) setForm({ ...DEFAULT_OMNI_BUSINESS_CONFIG, ...data });
	}, [data]);

	if (isLoading) {
		return (
			<Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-violet-500" />
		);
	}
	return (
		<div className="space-y-4">
			<p className="text-xs text-slate-500 dark:text-gray-400">
				Essas informações entram no prompt da IA — quanto mais completo, melhor
				o atendimento.
			</p>
			{CONFIG_FIELDS.map((f) => (
				// biome-ignore lint/a11y/noLabelWithoutControl: label envolve o controle implicitamente
				<label key={f.key} className="block">
					<span className="mb-1 block text-xs font-medium text-slate-500 dark:text-gray-400">
						{f.label}
					</span>
					{f.kind === 'switch' ? (
						<input
							type="checkbox"
							checked={Boolean(form[f.key])}
							onChange={(e) =>
								setForm((p) => ({ ...p, [f.key]: e.target.checked }))
							}
							className="h-4 w-4 accent-violet-600"
						/>
					) : f.kind === 'textarea' ? (
						<textarea
							value={String(form[f.key] ?? '')}
							onChange={(e) =>
								setForm((p) => ({ ...p, [f.key]: e.target.value }))
							}
							rows={2}
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
						/>
					) : (
						<input
							value={String(form[f.key] ?? '')}
							onChange={(e) =>
								setForm((p) => ({ ...p, [f.key]: e.target.value }))
							}
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
						/>
					)}
				</label>
			))}
			<button
				type="button"
				disabled={save.isPending}
				onClick={() =>
					save.mutate(form, {
						onSuccess: () => toast.success('Configuração salva'),
						onError: (e) =>
							toast.error(e instanceof Error ? e.message : 'Erro ao salvar'),
					})
				}
				className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
			>
				{save.isPending ? 'Salvando…' : 'Salvar configuração'}
			</button>
		</div>
	);
}

/* ─────────────────────────── Agentes ─────────────────────────── */

const DEFAULT_ROUTER_PROMPT = `Você é o atendente virtual da empresa no WhatsApp. Cumprimente, resolva o simples, consulte a base de conhecimento antes de responder fatos, acione especialistas quando o assunto for deles e transfira para humano quando necessário. Nunca invente preço/prazo/política. Respostas curtas, estilo WhatsApp, em português.`;

function AgentsTab({ instanceId }: { instanceId: string }) {
	const { data: agents = [], isLoading } = useOmniAgents(instanceId);
	const { create, update, remove } = useOmniAgentMutations(instanceId);
	const [editing, setEditing] = useState<
		OmniAgent | 'new-router' | 'new' | null
	>(null);
	const router = agents.find((a) => a.role === 'router');

	if (isLoading) {
		return (
			<Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-violet-500" />
		);
	}

	if (editing) {
		const isNew = editing === 'new' || editing === 'new-router';
		const base =
			isNew || !editing
				? {
						name: editing === 'new-router' ? 'Roteador' : '',
						role:
							editing === 'new-router'
								? ('router' as const)
								: ('specialist' as const),
						system_prompt:
							editing === 'new-router' ? DEFAULT_ROUTER_PROMPT : '',
						tool_description: '',
						model: 'google/gemini-2.5-flash',
						temperature: 0.4,
						enabled: true,
					}
				: (editing as OmniAgent);
		return (
			<AgentForm
				base={base}
				isRouter={base.role === 'router'}
				onCancel={() => setEditing(null)}
				onSave={async (payload) => {
					try {
						if (isNew) await create.mutateAsync(payload);
						else {
							await update.mutateAsync({
								agentId: (editing as OmniAgent).id,
								patch: payload,
							});
						}
						toast.success('Agente salvo');
						setEditing(null);
					} catch (e) {
						toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
					}
				}}
			/>
		);
	}

	return (
		<div className="space-y-3">
			{!router && (
				<button
					type="button"
					onClick={() => setEditing('new-router')}
					className="w-full rounded-2xl border-2 border-dashed border-violet-500/40 bg-violet-500/5 p-5 text-center"
				>
					<Bot className="mx-auto mb-2 h-6 w-6 text-violet-500" />
					<p className="text-sm font-semibold text-violet-600 dark:text-violet-300">
						Criar agente roteador
					</p>
					<p className="mt-1 text-xs text-slate-500">
						O roteador conversa com o cliente e aciona os especialistas. Sem ele
						a IA usa um prompt padrão.
					</p>
				</button>
			)}
			{agents.map((a) => (
				<div
					key={a.id}
					className={`flex items-center gap-3 rounded-2xl border p-4 ${
						a.role === 'router'
							? 'border-violet-500/40 bg-violet-500/5'
							: 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5'
					}`}
				>
					<Bot
						className={`h-5 w-5 shrink-0 ${a.role === 'router' ? 'text-violet-500' : 'text-slate-400'}`}
					/>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
								{a.name}
							</p>
							{a.role === 'router' && (
								<span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-300">
									ROTEADOR
								</span>
							)}
							{!a.enabled && (
								<span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] text-slate-500">
									desativado
								</span>
							)}
						</div>
						<p className="truncate font-mono text-xs text-slate-400">
							{a.slug} · {a.model}
						</p>
					</div>
					<button
						type="button"
						onClick={() => setEditing(a)}
						className="shrink-0 rounded-lg bg-slate-100 dark:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-white"
					>
						Editar
					</button>
					<button
						type="button"
						onClick={() => {
							if (confirm(`Remover o agente "${a.name}"?`)) {
								remove.mutate(a.id, {
									onError: (e) =>
										toast.error(
											e instanceof Error ? e.message : 'Erro ao remover',
										),
								});
							}
						}}
						className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-red-500"
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>
			))}
			{router && (
				<button
					type="button"
					onClick={() => setEditing('new')}
					className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 py-2.5 text-sm font-semibold text-slate-600 dark:text-gray-300 hover:border-violet-500/40"
				>
					<Plus className="h-4 w-4" /> Novo especialista
				</button>
			)}
		</div>
	);
}

function AgentForm({
	base,
	isRouter,
	onSave,
	onCancel,
}: {
	base: Partial<OmniAgent>;
	isRouter: boolean;
	onSave: (payload: {
		name: string;
		role: 'router' | 'specialist';
		system_prompt: string;
		tool_description: string;
		model: string;
		temperature: number;
		enabled: boolean;
	}) => void;
	onCancel: () => void;
}) {
	const [form, setForm] = useState({
		name: base.name ?? '',
		system_prompt: base.system_prompt ?? '',
		tool_description: base.tool_description ?? '',
		model: base.model ?? 'google/gemini-2.5-flash',
		temperature: Number(base.temperature ?? 0.4),
		enabled: base.enabled !== false,
	});
	return (
		<div className="space-y-3">
			<label className="block">
				<span className="mb-1 block text-xs font-medium text-slate-500">
					Nome
				</span>
				<input
					value={form.name}
					onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
					className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
				/>
			</label>
			<label className="block">
				<span className="mb-1 block text-xs font-medium text-slate-500">
					Prompt do sistema (personalidade + instruções)
				</span>
				<textarea
					value={form.system_prompt}
					onChange={(e) =>
						setForm((p) => ({ ...p, system_prompt: e.target.value }))
					}
					rows={10}
					className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 font-mono text-xs text-slate-900 dark:text-white"
				/>
			</label>
			{!isRouter && (
				<label className="block">
					<span className="mb-1 block text-xs font-medium text-slate-500">
						Como o roteador enxerga este especialista (quando acionar)
					</span>
					<input
						value={form.tool_description}
						onChange={(e) =>
							setForm((p) => ({ ...p, tool_description: e.target.value }))
						}
						placeholder="ex.: Especialista em vendas: preços, orçamentos e catálogo"
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
					/>
				</label>
			)}
			<div className="grid grid-cols-2 gap-3">
				<label className="block">
					<span className="mb-1 block text-xs font-medium text-slate-500">
						Modelo (OpenRouter)
					</span>
					<input
						list="omni-models"
						value={form.model}
						onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 font-mono text-xs text-slate-900 dark:text-white"
					/>
					<datalist id="omni-models">
						{MODEL_SUGGESTIONS.map((m) => (
							<option key={m} value={m} />
						))}
					</datalist>
				</label>
				<label className="block">
					<span className="mb-1 block text-xs font-medium text-slate-500">
						Temperatura: {form.temperature.toFixed(2)}
					</span>
					<input
						type="range"
						min={0}
						max={1}
						step={0.05}
						value={form.temperature}
						onChange={(e) =>
							setForm((p) => ({ ...p, temperature: Number(e.target.value) }))
						}
						className="w-full accent-violet-600"
					/>
				</label>
			</div>
			<label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white">
				<input
					type="checkbox"
					checked={form.enabled}
					onChange={(e) =>
						setForm((p) => ({ ...p, enabled: e.target.checked }))
					}
					className="h-4 w-4 accent-violet-600"
				/>
				Ativo
			</label>
			<div className="flex gap-2 pt-2">
				<button
					type="button"
					onClick={onCancel}
					className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 py-2.5 text-sm text-slate-700 dark:text-white"
				>
					Cancelar
				</button>
				<button
					type="button"
					disabled={!form.name.trim()}
					onClick={() =>
						onSave({
							...form,
							role: isRouter ? 'router' : 'specialist',
						})
					}
					className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
				>
					Salvar
				</button>
			</div>
		</div>
	);
}

/* ─────────────────────────── Conhecimento (RAG) ─────────────────────────── */

function KbTab({ instanceId }: { instanceId: string }) {
	const { files, upload, remove, search } = useOmniKb(instanceId);
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState('');

	return (
		<div className="space-y-4">
			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				className="w-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/15 p-6 text-center hover:border-violet-500/50"
			>
				<Upload className="mx-auto mb-2 h-6 w-6 text-slate-400" />
				<p className="text-sm font-semibold text-slate-700 dark:text-white">
					Enviar arquivo pra base de conhecimento
				</p>
				<p className="mt-1 text-xs text-slate-400">
					PDF, DOCX, TXT ou MD · até 20MB · a IA consulta via busca semântica
				</p>
			</button>
			<input
				ref={inputRef}
				type="file"
				accept=".pdf,.docx,.txt,.md"
				className="hidden"
				onChange={(e) => {
					const f = e.target.files?.[0];
					if (f) {
						upload.mutate(f, {
							onSuccess: () => toast.success('Arquivo em processamento'),
							onError: (err) =>
								toast.error(
									err instanceof Error ? err.message : 'Falha no upload',
								),
						});
					}
					e.target.value = '';
				}}
			/>

			{files.data?.map((f) => (
				<div
					key={f.id}
					className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3"
				>
					<FileText className="h-5 w-5 shrink-0 text-slate-400" />
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium text-slate-900 dark:text-white">
							{f.name}
						</p>
						<p className="text-xs text-slate-400">
							{((f.size_bytes ?? 0) / 1024).toFixed(0)} KB
							{f.status === 'ready' && ` · ${f.chunk_count} trechos indexados`}
						</p>
					</div>
					{f.status === 'processing' && (
						<span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
							<Loader2 className="h-3 w-3 animate-spin" /> processando
						</span>
					)}
					{f.status === 'ready' && (
						<span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
							pronto
						</span>
					)}
					{f.status === 'error' && (
						<span
							title={f.error ?? ''}
							className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-500"
						>
							erro
						</span>
					)}
					<button
						type="button"
						onClick={() => remove.mutate(f.id)}
						className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-red-500"
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>
			))}

			<div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4">
				<p className="mb-2 text-xs font-semibold text-slate-500 dark:text-gray-400">
					Testar busca (o que a IA encontraria)
				</p>
				<div className="flex gap-2">
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && query.trim()) search.mutate(query);
						}}
						placeholder="ex.: qual o prazo de entrega?"
						className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white"
					/>
					<button
						type="button"
						disabled={!query.trim() || search.isPending}
						onClick={() => search.mutate(query)}
						className="rounded-lg bg-violet-600 px-3 py-2 text-white disabled:opacity-50"
					>
						{search.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Search className="h-4 w-4" />
						)}
					</button>
				</div>
				{search.data && (
					<div className="mt-3 space-y-2">
						{search.data.length === 0 ? (
							<p className="text-xs text-slate-400">Nada encontrado.</p>
						) : (
							search.data.map((c: OmniKbChunk | string, i: number) => (
								<pre
									key={`kb-${i}`}
									className="whitespace-pre-wrap rounded-lg bg-slate-50 dark:bg-white/5 p-2 text-[11px] text-slate-600 dark:text-gray-300"
								>
									{(typeof c === 'string'
										? c
										: (c.content ?? c.text ?? '')
									).slice(0, 400)}
								</pre>
							))
						)}
					</div>
				)}
			</div>
		</div>
	);
}
