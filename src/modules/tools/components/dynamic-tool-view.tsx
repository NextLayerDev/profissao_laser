'use client';

import { AlertCircle, Download, Loader2, Wand2, Wrench } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useToolBilling } from '../hooks/use-tool-billing';
import { useToolDefinition } from '../hooks/use-tool-definition';
import {
	type AiToolDefinition,
	runToolEngine,
	type ToolRunResult,
} from '../services/tool-definitions.service';
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
						{/* biome-ignore lint/performance/noImgElement: data URL / CDN dinâmico */}
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

	return (
		<div className="p-4 md:p-8">
			<PageHeader
				title={def.title}
				subtitle={def.description ?? undefined}
				icon={Wrench}
			/>

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
