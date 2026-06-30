'use client';

import {
	Bot,
	Download,
	Eraser,
	Image as ImageIcon,
	Layers,
	Loader2,
	type LucideIcon,
	Maximize2,
	Palette,
	RotateCcw,
	Ruler,
	SlidersHorizontal,
	Sparkles,
	Sun,
	Wand2,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useToolPreview } from '../hooks/use-tool-preview';
import { downloadUrl } from '../lib/prompt-bank';
import { resolveToolIcon } from '../lib/tool-icons';
import type {
	AiToolDefinition,
	ToolControl,
	ToolInputSpec,
	ToolRunResult,
} from '../services/tool-definitions.service';
import { StudioDropzone } from './studio-dropzone';
import { StudioPreview } from './studio-preview';
import { StudioGroup, StudioWidgetField } from './tool-studio-controls';
import { bindName } from './tool-widgets';

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

/** Ícone por seção (header dos grupos). */
const GROUP_ICONS: Record<string, LucideIcon> = {
	Foto: ImageIcon,
	Material: Layers,
	Ajustes: SlidersHorizontal,
	Tamanho: Ruler,
	Luz: Sun,
	Cor: Palette,
	Efeito: Wand2,
	Operação: Bot,
};

/** Metadados dos cards de operação da IA (label/ícone/descrição). */
const OP_META: Record<
	string,
	{ icon: LucideIcon; label: string; desc: string }
> = {
	remover_fundo: {
		icon: Eraser,
		label: 'Remover fundo',
		desc: 'Deixa o fundo transparente',
	},
	colorir: { icon: Palette, label: 'Colorir', desc: 'Dá cor a fotos P&B' },
	restaurar: {
		icon: Sparkles,
		label: 'Restaurar',
		desc: 'Recupera fotos antigas',
	},
	ampliar: {
		icon: Maximize2,
		label: 'Ampliar',
		desc: 'Aumenta a resolução (2–16×)',
	},
};

export function ToolStudioView({
	def,
	toolKey,
	isDraft,
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

	// IA: a "Operação" vira cards (sem live preview). Heurística com fallback.
	const opControl = useMemo(
		() =>
			!livePreview
				? paramControls.find(
						(c) =>
							bindName(c.bind) === 'operacao' ||
							(c.group ?? '').toLowerCase() === 'operação',
					)
				: undefined,
		[livePreview, paramControls],
	);

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

	const resetParams = () => {
		const patch: Record<string, unknown> = {};
		for (const [name, spec] of Object.entries(inputSpec)) {
			if (spec.type !== 'image' && spec.default !== undefined) {
				patch[name] = spec.default;
			}
		}
		setManyValues(patch);
	};

	const presetActive = (preset: ToolStudioPreset) =>
		Object.entries(preset.values).every(
			([k, v]) => String(values[k]) === String(v),
		);

	// Acento + ícone do cabeçalho-herói.
	const HeroIcon = resolveToolIcon(
		(def.definition.ui as { icon?: string } | undefined)?.icon,
	);

	/** Renderiza um control de parâmetro (com tratamento especial da IA). */
	function renderControl(c: ToolControl): ReactNode {
		const name = bindName(c.bind);
		// IA: a operação é o grid de cards.
		if (opControl && c === opControl) {
			const opts = (c.options ?? inputSpec[name]?.options ?? []) as unknown[];
			const current = String(values[name] ?? inputSpec[name]?.default ?? '');
			return (
				<div key={c.bind} className="grid grid-cols-2 gap-2 py-1">
					{opts.map((raw) => {
						const opt = String(raw);
						const m = OP_META[opt] ?? {
							icon: Sparkles,
							label: opt,
							desc: '',
						};
						const Icon = m.icon;
						const active = current === opt;
						return (
							<button
								key={opt}
								type="button"
								onClick={() => setValue(name, opt)}
								style={
									active
										? {
												borderColor: 'var(--screen-accent)',
												backgroundColor:
													'color-mix(in srgb, var(--screen-accent) 10%, transparent)',
											}
										: undefined
								}
								className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
									active
										? ''
										: 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20'
								}`}
							>
								<span
									className="flex h-8 w-8 items-center justify-center rounded-lg"
									style={{
										backgroundColor:
											'color-mix(in srgb, var(--screen-accent) 14%, transparent)',
										color: 'var(--screen-accent)',
									}}
								>
									<Icon className="h-4 w-4" />
								</span>
								<span className="text-sm font-semibold text-slate-800 dark:text-white">
									{m.label}
								</span>
								{m.desc && (
									<span className="text-[11px] leading-tight text-slate-500 dark:text-gray-400">
										{m.desc}
									</span>
								)}
							</button>
						);
					})}
				</div>
			);
		}
		// "fator" só aparece quando a operação é "ampliar".
		if (name === 'fator' && String(values.operacao) !== 'ampliar') return null;
		return (
			<StudioWidgetField
				key={c.bind}
				control={c}
				spec={inputSpec[name]}
				value={values[name]}
				onChange={(v) => setValue(name, v)}
			/>
		);
	}

	const actionDisabled = pending || insufficient || missingRequired;

	return (
		<div className="p-4 md:p-8">
			{/* Cabeçalho-herói com acento da tool */}
			<div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
				<div
					className="absolute inset-0"
					style={{
						background:
							'linear-gradient(120deg, color-mix(in srgb, var(--screen-accent) 20%, transparent), transparent 62%)',
					}}
				/>
				<div className="relative flex items-center gap-4 px-6 py-6 sm:px-8">
					<span
						className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg"
						style={{ backgroundColor: 'var(--screen-accent)' }}
					>
						<HeroIcon className="h-6 w-6" />
					</span>
					<div className="min-w-0">
						<h1 className="font-display text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
							{def.title}
						</h1>
						{def.description && (
							<p className="truncate text-sm text-slate-500 dark:text-gray-400">
								{def.description}
							</p>
						)}
					</div>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_1fr]">
				{/* ───────── Controles ───────── */}
				<div className="space-y-4">
					{/* Dropzone herói */}
					{imageControls.map((c) => (
						<StudioDropzone
							key={c.bind}
							label={c.label ?? 'Envie sua foto'}
							file={values[bindName(c.bind)] instanceof File ? file : null}
							onChange={(f) => setValue(bindName(c.bind), f)}
						/>
					))}

					{/* Presets */}
					{presets.length > 0 && (
						<StudioGroup title="Estilos rápidos" icon={Sparkles}>
							<div className="flex flex-wrap gap-2 py-2">
								{presets.map((p) => {
									const active = presetActive(p);
									return (
										<button
											key={p.label}
											type="button"
											onClick={() => setManyValues(p.values)}
											style={
												active
													? {
															borderColor: 'var(--screen-accent)',
															color: 'var(--screen-accent)',
															backgroundColor:
																'color-mix(in srgb, var(--screen-accent) 10%, transparent)',
														}
													: undefined
											}
											className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
												active
													? ''
													: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20'
											}`}
										>
											{p.label}
										</button>
									);
								})}
							</div>
						</StudioGroup>
					)}

					{/* Grupos de controles */}
					{groups.map(([groupName, groupControls]) => (
						<StudioGroup
							key={groupName}
							title={groupName}
							icon={GROUP_ICONS[groupName]}
						>
							{groupControls.map(renderControl)}
						</StudioGroup>
					))}

					{paramControls.length > 0 && (
						<button
							type="button"
							onClick={resetParams}
							className="flex w-full items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-gray-400 dark:hover:text-slate-200"
						>
							<RotateCcw className="h-3.5 w-3.5" />
							Restaurar ajustes
						</button>
					)}
				</div>

				{/* ───────── Preview + ação ───────── */}
				<div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
					<StudioPreview
						originalUrl={originalUrl}
						liveSrc={liveSrc}
						resultPreview={resultPreview ?? null}
						isFetching={preview.isFetching}
						isError={preview.isError}
						livePreview={livePreview}
						hasFile={!!file}
						meta={showMeta ? meta : undefined}
					/>

					<button
						type="button"
						onClick={onRun}
						disabled={actionDisabled}
						style={
							actionDisabled
								? undefined
								: { backgroundColor: 'var(--screen-accent)' }
						}
						className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white transition-opacity ${
							actionDisabled
								? 'cursor-not-allowed bg-slate-400 dark:bg-white/15'
								: 'hover:opacity-90'
						}`}
					>
						{pending ? (
							<>
								<Loader2 className="h-5 w-5 animate-spin" />
								Processando…
							</>
						) : (
							<>
								<Wand2 className="h-5 w-5" />
								{actionLabel}
							</>
						)}
					</button>

					{billingNotice}

					{exports.length > 0 && (
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{exports.map((e) => (
								<button
									key={e.label}
									type="button"
									onClick={() => downloadUrl(e.url, `${toolKey}-${e.label}`)}
									className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700 transition-colors hover:border-slate-300 dark:border-white/10 dark:bg-[#16161a] dark:text-slate-200 dark:hover:border-white/20"
								>
									<Download className="h-4 w-4" />
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
