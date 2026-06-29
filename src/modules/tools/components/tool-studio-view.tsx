'use client';

import {
	Download,
	ImageUp,
	Loader2,
	RotateCcw,
	Sparkles,
	Wand2,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useToolPreview } from '../hooks/use-tool-preview';
import { downloadUrl } from '../lib/prompt-bank';
import type {
	AiToolDefinition,
	ToolControl,
	ToolInputSpec,
	ToolRunResult,
} from '../services/tool-definitions.service';
import { bindName, WidgetField } from './tool-widgets';

interface ToolStudioPreset {
	label: string;
	values: Record<string, unknown>;
}

interface ToolStudioViewProps {
	def: AiToolDefinition;
	toolKey: string;
	isDraft: boolean;
	header: ReactNode;
	values: Record<string, unknown>;
	setValue: (name: string, v: unknown) => void;
	setManyValues: (patch: Record<string, unknown>) => void;
	controls: ToolControl[];
	inputSpec: Record<string, ToolInputSpec>;
	presets: ToolStudioPreset[];
	livePreview: boolean;
	onRun: () => void;
	pending: boolean;
	result: ToolRunResult | null;
	downloadKey: string;
	showMeta: boolean;
	actionLabel: string;
	insufficient: boolean;
	missingRequired: boolean;
	billingNotice: ReactNode;
}

/** Formatos extras de download conhecidos na saída (além do principal). */
const EXTRA_FORMATS: { key: string; label: string }[] = [
	{ key: 'lbrn2', label: 'LightBurn' },
	{ key: 'dxf', label: 'DXF' },
	{ key: 'svg', label: 'SVG' },
];

/**
 * Tela "Estúdio" das tools-mãe (ui.layout='studio'): esquerda = dropzone +
 * controles agrupados por seção + presets de 1 clique; direita = preview GRANDE
 * ao vivo (debounce, não cobrado) com a foto original de fundo enquanto recalcula
 * + botões de export. O run final (Exportar) é cobrado pelo fluxo normal.
 */
export function ToolStudioView({
	def,
	toolKey,
	isDraft,
	header,
	values,
	setValue,
	setManyValues,
	controls,
	inputSpec,
	presets,
	livePreview,
	onRun,
	pending,
	result,
	downloadKey,
	showMeta,
	actionLabel,
	insufficient,
	missingRequired,
	billingNotice,
}: ToolStudioViewProps) {
	const imageControls = useMemo(
		() => controls.filter((c) => inputSpec[bindName(c.bind)]?.type === 'image'),
		[controls, inputSpec],
	);
	const paramControls = useMemo(
		() => controls.filter((c) => inputSpec[bindName(c.bind)]?.type !== 'image'),
		[controls, inputSpec],
	);

	// Agrupa os controles por `control.group` (mantém a ordem de 1ª aparição).
	const groups = useMemo(() => {
		const map = new Map<string, ToolControl[]>();
		for (const c of paramControls) {
			const g = c.group ?? 'Ajustes';
			if (!map.has(g)) map.set(g, []);
			map.get(g)?.push(c);
		}
		return Array.from(map.entries());
	}, [paramControls]);

	const file = useMemo(() => {
		for (const c of imageControls) {
			const v = values[bindName(c.bind)];
			if (v instanceof File) return v;
		}
		return null;
	}, [imageControls, values]);

	// URL da foto original (feedback instantâneo enquanto a prévia processada vem).
	const [originalUrl, setOriginalUrl] = useState<string | null>(null);
	useEffect(() => {
		if (!file) {
			setOriginalUrl(null);
			return;
		}
		const url = URL.createObjectURL(file);
		setOriginalUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	const preview = useToolPreview(toolKey, values, inputSpec, {
		enabled: livePreview && !missingRequired,
		draftDefinition: isDraft ? def.definition : undefined,
	});

	const liveSrc = preview.data?.preview ?? null;
	const out = result?.output;
	const resultPreview = (out?.preview ?? out?.primary) as string | undefined;
	// Canvas: enquanto edita, mostra a prévia ao vivo (ou a original de fundo);
	// depois de Exportar, mostra o resultado salvo.
	const canvasSrc = livePreview
		? (liveSrc ?? resultPreview ?? originalUrl)
		: (resultPreview ?? originalUrl);
	const meta = out?.meta as Record<string, unknown> | undefined;

	const exports = useMemo(() => {
		if (!out) return [] as { label: string; url: string }[];
		const list: { label: string; url: string }[] = [];
		const primary = (out[downloadKey] ?? out.primary) as string | undefined;
		if (primary) list.push({ label: 'Baixar imagem', url: primary });
		for (const f of EXTRA_FORMATS) {
			const u = out[f.key] as string | undefined;
			if (u) list.push({ label: f.label, url: u });
		}
		return list;
	}, [out, downloadKey]);

	// Reseta os valores não-imagem aos defaults (mantém a foto).
	const resetParams = () => {
		const patch: Record<string, unknown> = {};
		for (const [name, spec] of Object.entries(inputSpec)) {
			if (spec.type !== 'image' && spec.default !== undefined) {
				patch[name] = spec.default;
			}
		}
		setManyValues(patch);
	};

	return (
		<div className="p-4 md:p-8">
			{header}

			<div className="grid lg:grid-cols-[minmax(0,380px)_1fr] gap-6">
				{/* ───────── Controles (esquerda) ───────── */}
				<div className="space-y-5">
					{/* Dropzone */}
					<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-5">
						<div className="flex items-center gap-2 mb-3">
							<ImageUp className="w-4 h-4 text-violet-500" />
							<h3 className="text-sm font-semibold text-slate-900 dark:text-white">
								Foto
							</h3>
						</div>
						<div className="space-y-4">
							{imageControls.map((control) => (
								<WidgetField
									key={control.bind}
									control={control}
									spec={inputSpec[bindName(control.bind)]}
									value={values[bindName(control.bind)]}
									onChange={(v) => setValue(bindName(control.bind), v)}
								/>
							))}
						</div>
					</div>

					{/* Presets */}
					{presets.length > 0 && (
						<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-5">
							<div className="flex items-center gap-2 mb-3">
								<Sparkles className="w-4 h-4 text-amber-500" />
								<h3 className="text-sm font-semibold text-slate-900 dark:text-white">
									Estilos rápidos
								</h3>
							</div>
							<div className="flex flex-wrap gap-2">
								{presets.map((preset) => (
									<button
										key={preset.label}
										type="button"
										onClick={() => setManyValues(preset.values)}
										className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors"
									>
										{preset.label}
									</button>
								))}
							</div>
						</div>
					)}

					{/* Grupos de controles */}
					{groups.map(([groupName, groupControls]) => (
						<div
							key={groupName}
							className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-5"
						>
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-sm font-semibold text-slate-900 dark:text-white">
									{groupName}
								</h3>
							</div>
							<div className="space-y-4">
								{groupControls.map((control) => (
									<WidgetField
										key={control.bind}
										control={control}
										spec={inputSpec[bindName(control.bind)]}
										value={values[bindName(control.bind)]}
										onChange={(v) => setValue(bindName(control.bind), v)}
									/>
								))}
							</div>
						</div>
					))}

					{paramControls.length > 0 && (
						<button
							type="button"
							onClick={resetParams}
							className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
						>
							<RotateCcw className="w-3.5 h-3.5" />
							Restaurar ajustes
						</button>
					)}
				</div>

				{/* ───────── Preview (direita) ───────── */}
				<div className="space-y-4">
					<div className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-4">
						<div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] dark:bg-[repeating-conic-gradient(#222_0%_25%,transparent_0%_50%)] bg-[length:24px_24px] flex items-center justify-center">
							{canvasSrc ? (
								/* <img> intencional: preview de data URL / CDN dinâmico */
								<img
									src={canvasSrc}
									alt="Prévia"
									className="max-w-full max-h-full object-contain"
								/>
							) : (
								<div className="text-center px-6">
									<ImageUp className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-gray-600" />
									<p className="text-sm text-slate-400 dark:text-gray-500">
										Envie uma foto para ver a prévia ao vivo.
									</p>
								</div>
							)}
						</div>

						{/* Badge de status do preview */}
						{file && livePreview && (
							<div className="absolute top-6 left-6 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-medium backdrop-blur">
								{preview.isFetching ? (
									<>
										<Loader2 className="w-3 h-3 animate-spin" />
										Atualizando…
									</>
								) : (
									<>
										<span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
										Prévia ao vivo
									</>
								)}
							</div>
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

					{/* Ação principal (cobrada) */}
					<button
						type="button"
						onClick={onRun}
						disabled={pending || insufficient || missingRequired}
						className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
					>
						{pending ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								Processando…
							</>
						) : (
							<>
								<Wand2 className="w-5 h-5" />
								{actionLabel}
							</>
						)}
					</button>

					{billingNotice}

					{/* Downloads (após exportar) */}
					{exports.length > 0 && (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
							{exports.map((e) => (
								<button
									key={e.label}
									type="button"
									onClick={() => downloadUrl(e.url, `${toolKey}-${e.label}`)}
									className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] hover:border-violet-400 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors"
								>
									<Download className="w-4 h-4" />
									{e.label}
								</button>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
