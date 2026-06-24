'use client';

import {
	AlertCircle,
	ArrowLeft,
	Download,
	ImageIcon,
	Loader2,
	RotateCcw,
	Sparkles,
	Upload,
	Wand2,
} from 'lucide-react';
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useToolBank } from '../hooks/use-tool-bank';
import { useToolBilling } from '../hooks/use-tool-billing';
import { useToolDefinition } from '../hooks/use-tool-definition';
import { resolveScreenUi, screenAccentBg } from '../lib/screen-ui';
import { resolveToolIcon } from '../lib/tool-icons';
import type { ToolBankEntry } from '../services/tool-bank.service';
import {
	type AiToolDefinition,
	runToolEngine,
	type ToolRunResult,
} from '../services/tool-definitions.service';
import { ScreenNotice } from './screen-notice';
import { ToolBankGallery } from './tool-bank-gallery';
import { bindName, WidgetField } from './tool-widgets';

/** Baixa uma URL como arquivo (fetch→blob), com fallback de abrir em nova aba. */
async function downloadUrl(url: string, name: string) {
	try {
		const res = await fetch(url);
		const blob = await res.blob();
		const objectUrl = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = objectUrl;
		a.download = name;
		a.click();
		URL.revokeObjectURL(objectUrl);
	} catch {
		window.open(url, '_blank');
	}
}

function ResultPanel({
	result,
	downloadKey,
	showMeta,
}: {
	result: ToolRunResult;
	downloadKey: string;
	showMeta: boolean;
}) {
	const output = result.output;
	const preview = (output.preview ?? output.primary) as string | undefined;
	// Se downloadFrom apontar uma chave ausente no output, cai em `primary`
	// (em vez de simplesmente sumir com o botão de baixar).
	const primary = (output[downloadKey] ?? output.primary) as string | undefined;
	const meta = output.meta as Record<string, unknown> | undefined;

	return (
		<div className="space-y-4">
			<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4">
				{preview ? (
					<div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-[#111] flex items-center justify-center">
						{/* <img> intencional: preview de data URL / CDN dinâmico */}
						<img
							src={preview}
							alt="Resultado"
							className="max-w-full max-h-full object-contain"
						/>
					</div>
				) : (
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Pronto. Sem prévia visual.
					</p>
				)}

				{showMeta && meta && (
					<div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
						{Object.entries(meta).map(([k, v]) => (
							<span
								key={k}
								className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
							>
								{k}: {String(v)}
							</span>
						))}
					</div>
				)}
			</div>

			{primary && (
				<button
					type="button"
					onClick={() => downloadUrl(primary, 'resultado')}
					className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
				>
					<Download className="w-5 h-5" />
					Baixar resultado
				</button>
			)}
		</div>
	);
}

/* ───────── Banco do Admin (galeria + form por registro) ───────── */

/** O `mode` do registro determina quais inputs o cliente preenche. */
function modeOf(entry: ToolBankEntry): string {
	const m = entry.data?.mode;
	return typeof m === 'string' ? m : 'texto';
}

/** Drop de imagem de referência — visual igual ao widget de imagem das tools. */
function ReferenceDrop({
	file,
	onChange,
}: {
	file: File | null;
	onChange: (f: File | null) => void;
}) {
	const [dragging, setDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	return (
		<div className="space-y-3">
			<span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
				Imagem de referência
			</span>
			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					const f = e.dataTransfer.files[0];
					if (f) onChange(f);
				}}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={(e) => {
					e.preventDefault();
					setDragging(false);
				}}
				className={`relative flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-10 transition-colors ${
					dragging
						? 'border-violet-600 bg-violet-500/10'
						: 'border-slate-200 dark:border-white/10 hover:border-violet-500/50'
				}`}
			>
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					onChange={(e) => {
						onChange(e.target.files?.[0] ?? null);
						e.target.value = '';
					}}
					className="hidden"
				/>
				<div className="mb-3 rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 p-3 text-white">
					<Upload className="h-8 w-8" />
				</div>
				<p className="text-center text-sm font-medium text-slate-600 dark:text-gray-400">
					Arraste sua imagem ou clique para selecionar
				</p>
			</button>
			{file && (
				<div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-3">
					<div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-500/20">
						<ImageIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
					</div>
					<p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-white">
						{file.name}
					</p>
					<button
						type="button"
						onClick={() => onChange(null)}
						className="text-xs text-slate-400 hover:text-rose-500"
					>
						remover
					</button>
				</div>
			)}
		</div>
	);
}

interface DynamicToolViewProps {
	toolKey: string;
	/** Definition inline (preview de rascunho no builder admin). */
	definitionOverride?: AiToolDefinition;
}

export function DynamicToolView({
	toolKey,
	definitionOverride,
}: DynamicToolViewProps) {
	const query = useToolDefinition(toolKey, { enabled: !definitionOverride });
	const def = definitionOverride ?? query.data;
	const isDraft = !!definitionOverride;

	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;
	const billing = useToolBilling(toolKey, courseSlug);

	const [values, setValues] = useState<Record<string, unknown>>({});
	const [result, setResult] = useState<ToolRunResult | null>(null);
	const [draftRunning, setDraftRunning] = useState(false);

	// Banco do Admin: galeria de registros → form por registro escolhido.
	const bank = def?.definition.bank;
	const bankEnabled = !!bank?.enabled;
	// Busca os registros tb no preview do builder (draft) — só pula a key
	// placeholder de uma tool ainda não salva — pra o preview do Cliente mostrar
	// a galeria EXATAMENTE como o cliente vê (não cair no form).
	const bankQuery = useToolBank(toolKey, {
		enabled: bankEnabled && toolKey !== 'preview',
	});
	const [selectedEntry, setSelectedEntry] = useState<ToolBankEntry | null>(
		null,
	);
	const [tema, setTema] = useState('');
	const [referencia, setReferencia] = useState<File | null>(null);

	const inputSpec = useMemo(() => def?.definition.input ?? {}, [def]);
	const ui = def?.definition.ui;
	const controls = ui?.controls ?? [];

	// Inicializa os valores com os defaults dos inputs quando a definition carrega.
	// biome-ignore lint/correctness/useExhaustiveDependencies: re-init on definition id/key
	useEffect(() => {
		const init: Record<string, unknown> = {};
		for (const [name, spec] of Object.entries(inputSpec)) {
			if (spec.type !== 'image' && spec.default !== undefined) {
				init[name] = spec.default;
			}
		}
		setValues(init);
		setResult(null);
		setSelectedEntry(null);
		setTema('');
		setReferencia(null);
	}, [def?.id, def?.tool_key]);

	const setValue = useCallback((name: string, v: unknown) => {
		setValues((prev) => ({ ...prev, [name]: v }));
	}, []);

	const missingRequired = useMemo(
		() =>
			Object.entries(inputSpec).some(([name, spec]) => {
				const v = values[name];
				return spec.required && (v === undefined || v === null || v === '');
			}),
		[inputSpec, values],
	);

	const run = useCallback(async () => {
		if (missingRequired) {
			toast.error('Preencha os campos obrigatórios.');
			return;
		}
		// Preview de rascunho (staff): roda inline, sem billing.
		if (isDraft && def) {
			setDraftRunning(true);
			try {
				const r = await runToolEngine(toolKey, {
					values,
					inputSpec,
					draftDefinition: def.definition,
				});
				setResult(r);
			} catch {
				toast.error('Falha no preview.');
			} finally {
				setDraftRunning(false);
			}
			return;
		}
		// Fluxo normal: o hook decide cobrar (invoke→motor→settle) ou rodar livre.
		await billing.runEngine((invocationId) =>
			runToolEngine(toolKey, { values, inputSpec, invocationId }).then((r) => {
				setResult(r);
				return r;
			}),
		);
	}, [missingRequired, isDraft, def, toolKey, values, inputSpec, billing]);

	// Run de um registro do banco: manda bank_entry_id + tema/referencia.
	const runBank = useCallback(async () => {
		if (!selectedEntry) return;
		const mode = modeOf(selectedEntry);
		if (mode.includes('texto') && !tema.trim()) {
			toast.error('Digite o tema.');
			return;
		}
		const bankInputs: Record<string, unknown> = {};
		if (mode.includes('texto')) bankInputs.tema = tema.trim();
		if (mode.includes('imagem') && referencia)
			bankInputs.referencia = referencia;

		await billing.runEngine((invocationId) =>
			runToolEngine(toolKey, {
				values: {},
				inputSpec: {},
				invocationId,
				bankEntryId: selectedEntry.id,
				bankInputs,
			}).then((r) => {
				setResult(r);
				return r;
			}),
		);
	}, [selectedEntry, tema, referencia, toolKey, billing]);

	if (!definitionOverride && query.isLoading) {
		return (
			<div className="p-8 flex items-center justify-center">
				<Loader2 className="w-6 h-6 animate-spin text-violet-500" />
			</div>
		);
	}

	if (!def) {
		return (
			<div className="p-8">
				<div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5 p-6 flex items-start gap-3">
					<AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
					<div>
						<p className="font-medium text-slate-900 dark:text-white">
							Ferramenta não encontrada
						</p>
						<p className="text-sm text-slate-500 dark:text-gray-400">
							A ferramenta “{toolKey}” não está disponível.
						</p>
					</div>
				</div>
			</div>
		);
	}

	const pending = isDraft ? draftRunning : billing.pending;
	const actionLabel = ui?.action?.label ?? 'Executar';
	const showCostNotice = !isDraft && (ui?.action?.showCostNotice ?? true);
	const resultUi = ui?.result;
	const downloadKey = (resultUi?.downloadFrom ?? 'output.primary').replace(
		/^output\./,
		'',
	);

	// Aparência personalizada da tela do cliente (cor/tema/título/subtítulo/banner).
	const screenUi = resolveScreenUi(def, 'customer');

	const header = (
		<PageHeader
			title={screenUi.title ?? def.title}
			subtitle={screenUi.subtitle ?? def.description ?? undefined}
			icon={resolveToolIcon(
				(def.definition.ui as { icon?: string } | undefined)?.icon,
			)}
		/>
	);

	// Tema forçado (dark/light) ganha fundo próprio + respiro, igual às salas.
	const themedShell = screenUi.themeClass
		? `rounded-2xl p-4 sm:p-6 ${screenUi.themeClass === 'dark' ? 'bg-[#0d0d0f]' : 'bg-slate-50'}`
		: '';
	const screenStyle = { '--screen-accent': screenUi.accent } as CSSProperties;

	/* ── Banco do Admin: galeria → form por registro ── */
	if (bankEnabled) {
		// Sem registro escolhido → galeria.
		if (!selectedEntry) {
			return (
				<div
					className={`p-4 md:p-8 ${screenUi.themeClass}`}
					style={screenStyle}
				>
					<div className={themedShell}>
						{screenUi.notice && <ScreenNotice notice={screenUi.notice} />}
						{header}
						{bankQuery.isLoading ? (
							<div className="flex justify-center p-12">
								<Loader2 className="h-6 w-6 animate-spin text-violet-500" />
							</div>
						) : (
							<ToolBankGallery
								entries={bankQuery.data ?? []}
								onSelect={(entry) => {
									setSelectedEntry(entry);
									setResult(null);
									setTema('');
									setReferencia(null);
								}}
							/>
						)}
					</div>
				</div>
			);
		}

		const mode = modeOf(selectedEntry);
		const needsTema = mode.includes('texto');
		const needsImage = mode.includes('imagem');
		const canGenerate = !needsTema || !!tema.trim();
		const cardImg =
			selectedEntry.example_after_url ?? selectedEntry.example_before_url;

		return (
			<div className={`p-4 md:p-8 ${screenUi.themeClass}`} style={screenStyle}>
				<div className={themedShell}>
					{screenUi.notice && <ScreenNotice notice={screenUi.notice} />}
					{header}

					<button
						type="button"
						onClick={() => {
							setSelectedEntry(null);
							setResult(null);
						}}
						className="mb-5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-white/10"
					>
						<ArrowLeft className="h-4 w-4" /> Voltar à galeria
					</button>

					<div className="grid gap-6 lg:grid-cols-2">
						{/* Formulário do registro */}
						<div className="space-y-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-6">
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-white/5">
									{cardImg ? (
										// <img> intencional: data URL / CDN dinâmico
										<img
											src={cardImg}
											alt={selectedEntry.title}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center">
											<Sparkles className="h-6 w-6 text-violet-400" />
										</div>
									)}
								</div>
								<div className="min-w-0">
									<h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">
										{selectedEntry.title}
									</h3>
									{selectedEntry.category && (
										<span
											className="text-xs font-medium"
											style={{ color: 'var(--screen-accent)' }}
										>
											{selectedEntry.category}
										</span>
									)}
								</div>
							</div>

							{selectedEntry.description && (
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{selectedEntry.description}
								</p>
							)}

							{needsTema && (
								<div className="space-y-1.5">
									<label
										htmlFor="bank-tema"
										className="block text-sm font-medium text-slate-700 dark:text-slate-300"
									>
										Tema
									</label>
									<input
										id="bank-tema"
										value={tema}
										onChange={(e) => setTema(e.target.value)}
										placeholder="Ex.: cachorro astronauta no espaço"
										className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
									/>
								</div>
							)}

							{needsImage && (
								<ReferenceDrop file={referencia} onChange={setReferencia} />
							)}

							<button
								type="button"
								onClick={runBank}
								disabled={pending || billing.insufficient || !canGenerate}
								style={screenAccentBg}
								className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
							>
								{pending ? (
									<>
										<Loader2 className="h-5 w-5 animate-spin" />
										Gerando...
									</>
								) : (
									<>
										<Wand2 className="h-5 w-5" />
										{actionLabel}
									</>
								)}
							</button>

							{showCostNotice && billing.notice}
						</div>

						{/* Resultado */}
						<div>
							{result ? (
								<div className="space-y-4">
									<div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4">
										<BankResultImage
											result={result}
											downloadKey={downloadKey}
										/>
									</div>
									<button
										type="button"
										onClick={() => setResult(null)}
										className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-white/10"
									>
										<RotateCcw className="h-4 w-4" /> Gerar outra
									</button>
								</div>
							) : (
								<div className="flex h-full min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-sm text-slate-400 dark:text-gray-500">
									O resultado aparece aqui.
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}

	/* ── Tool normal (sem banco) ── */
	return (
		<div className="p-4 md:p-8">
			{header}

			<div className="grid lg:grid-cols-2 gap-6">
				{/* Controles */}
				<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{controls.map((control) => {
							const name = bindName(control.bind);
							return (
								<WidgetField
									key={control.bind}
									control={control}
									spec={inputSpec[name]}
									value={values[name]}
									onChange={(v) => setValue(name, v)}
								/>
							);
						})}
					</div>

					<button
						type="button"
						onClick={run}
						disabled={pending || billing.insufficient || missingRequired}
						className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
					>
						{pending ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								Processando...
							</>
						) : (
							<>
								<Wand2 className="w-5 h-5" />
								{actionLabel}
							</>
						)}
					</button>

					{showCostNotice && billing.notice}
				</div>

				{/* Resultado */}
				<div>
					{result ? (
						<ResultPanel
							result={result}
							downloadKey={downloadKey}
							showMeta={resultUi?.showMeta ?? true}
						/>
					) : (
						<div className="h-full min-h-[240px] rounded-2xl border border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center text-sm text-slate-400 dark:text-gray-500">
							O resultado aparece aqui.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

/** Resultado de imagem do banco: imagem grande (até ~70vh) + baixar. */
function BankResultImage({
	result,
	downloadKey,
}: {
	result: ToolRunResult;
	downloadKey: string;
}) {
	const output = result.output;
	const preview = (output.preview ?? output.primary) as string | undefined;
	const primary = (output[downloadKey] ?? output.primary) as string | undefined;
	const shown = preview ?? primary;

	return (
		<div className="space-y-4">
			{shown ? (
				<div className="flex max-h-[70vh] w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-[#111]">
					{/* <img> intencional: preview de data URL / CDN dinâmico */}
					<img
						src={shown}
						alt="Resultado"
						className="max-h-[70vh] w-full object-contain"
					/>
				</div>
			) : (
				<p className="text-sm text-slate-500 dark:text-gray-400">
					Pronto. Sem prévia visual.
				</p>
			)}
			{primary && (
				<button
					type="button"
					onClick={() => downloadUrl(primary, 'resultado')}
					className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-violet-500"
				>
					<Download className="h-5 w-5" />
					Baixar imagem
				</button>
			)}
		</div>
	);
}
