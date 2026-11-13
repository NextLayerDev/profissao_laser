'use client';

import { Circle, Plus, Square, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CreationTemplatePreview } from '@/modules/tools/components/creation-template-preview';
import { templateProblem } from '@/modules/tools/lib/creation-template';
import type {
	CreationTemplate,
	CreationZone,
} from '@/modules/tools/services/tool-definitions.service';
import { chipCls, hintCls, iconBtn, numCls } from './ui';

/**
 * Editor do MOLDE: medidas da peça, contorno, margem e zonas proibidas, com o
 * desenho ao lado atualizando a cada número. Tudo em milímetros — é como o
 * fornecedor passa o molde e como o admin mede com a régua.
 */
export function TemplateEditor({
	value,
	onChange,
	compact = false,
}: {
	value: CreationTemplate;
	onChange: (t: CreationTemplate) => void;
	/** Dentro de um modelo da biblioteca: desenho menor. */
	compact?: boolean;
}) {
	const [focusZone, setFocusZone] = useState<number | null>(null);
	const zones = value.zones ?? [];
	const problem = templateProblem(value);
	const patch = (p: Partial<CreationTemplate>) => onChange({ ...value, ...p });
	const patchZone = (i: number, p: Partial<CreationZone>) =>
		patch({ zones: zones.map((z, j) => (j === i ? { ...z, ...p } : z)) });

	const num = (v: string) => {
		const n = Number(v.replace(',', '.'));
		return Number.isFinite(n) ? n : 0;
	};

	const addZone = () => {
		const w = Math.round(value.width_mm * 0.3);
		patch({
			zones: [
				...zones,
				{
					label: 'câmera',
					shape: 'rect',
					x: 5,
					y: 5,
					w,
					h: w,
					r: Math.round(w / 4),
				},
			],
		});
		setFocusZone(zones.length);
	};

	return (
		<div
			className={`grid gap-4 ${compact ? 'sm:grid-cols-[1fr_120px]' : 'sm:grid-cols-[1fr_200px]'}`}
		>
			<div className="space-y-3">
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					<NumField
						label="Largura (mm)"
						value={value.width_mm}
						onChange={(v) => patch({ width_mm: num(v) })}
					/>
					<NumField
						label="Altura (mm)"
						value={value.height_mm}
						onChange={(v) => patch({ height_mm: num(v) })}
					/>
					<NumField
						label="Cantos (mm)"
						value={value.corner_radius_mm ?? 0}
						disabled={value.outline === 'ellipse'}
						onChange={(v) => patch({ corner_radius_mm: num(v) || undefined })}
					/>
					<NumField
						label="Margem (mm)"
						value={value.safe_margin_mm ?? 0}
						onChange={(v) => patch({ safe_margin_mm: num(v) || undefined })}
					/>
				</div>
				<div className="flex flex-wrap items-center gap-1.5">
					<span className="mr-1 text-[12px] text-slate-400">Contorno</span>
					<button
						type="button"
						className={chipCls(value.outline !== 'ellipse')}
						onClick={() => patch({ outline: undefined })}
					>
						Retângulo
					</button>
					<button
						type="button"
						className={chipCls(value.outline === 'ellipse')}
						onClick={() => patch({ outline: 'ellipse' })}
					>
						Redondo / oval
					</button>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-[12px] font-medium text-slate-300">
							Áreas livres{' '}
							<span className="font-normal text-slate-500">
								(câmera, alça, furo — medidas a partir do canto superior
								esquerdo)
							</span>
						</span>
						<button
							type="button"
							onClick={addZone}
							className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white"
						>
							<Plus className="h-3 w-3" /> Área
						</button>
					</div>
					{zones.length === 0 && (
						<p className="text-[11px] text-slate-500">
							Nenhuma área livre — a arte ocupa a peça inteira.
						</p>
					)}
					{zones.map((z, i) => (
						<fieldset
							key={i}
							onFocus={() => setFocusZone(i)}
							className={`grid grid-cols-[1fr_auto] items-end gap-2 rounded-xl border p-2.5 ${
								focusZone === i
									? 'border-rose-400/40 bg-rose-400/[0.04]'
									: 'border-white/[0.07] bg-black/20'
							}`}
						>
							<div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
								<label className="col-span-3 sm:col-span-2">
									<span className="mb-1 block text-[11px] text-slate-500">
										Nome
									</span>
									<input
										value={z.label ?? ''}
										onChange={(e) => patchZone(i, { label: e.target.value })}
										className={numCls}
										placeholder="câmera"
									/>
								</label>
								<NumField
									small
									label="X"
									value={z.x}
									onChange={(v) => patchZone(i, { x: num(v) })}
								/>
								<NumField
									small
									label="Y"
									value={z.y}
									onChange={(v) => patchZone(i, { y: num(v) })}
								/>
								<NumField
									small
									label="Larg."
									value={z.w}
									onChange={(v) => patchZone(i, { w: num(v) })}
								/>
								<NumField
									small
									label="Alt."
									value={z.h}
									onChange={(v) => patchZone(i, { h: num(v) })}
								/>
							</div>
							<div className="flex items-center gap-1">
								<button
									type="button"
									title={
										z.shape === 'ellipse' ? 'Virar retângulo' : 'Virar círculo'
									}
									aria-label="Trocar forma da área"
									onClick={() =>
										patchZone(i, {
											shape: z.shape === 'ellipse' ? 'rect' : 'ellipse',
										})
									}
									className={iconBtn}
								>
									{z.shape === 'ellipse' ? (
										<Circle className="h-3.5 w-3.5" />
									) : (
										<Square className="h-3.5 w-3.5" />
									)}
								</button>
								<button
									type="button"
									aria-label="Remover área"
									onClick={() =>
										patch({ zones: zones.filter((_, j) => j !== i) })
									}
									className={`${iconBtn} hover:text-rose-300`}
								>
									<Trash2 className="h-3.5 w-3.5" />
								</button>
							</div>
							{z.shape === 'rect' && (
								<div className="col-span-2 flex items-center gap-2 text-[11px] text-slate-500">
									Cantos da área
									<input
										type="range"
										min={0}
										max={Math.max(1, Math.min(z.w, z.h) / 2)}
										step={0.5}
										value={z.r ?? 0}
										onChange={(e) => patchZone(i, { r: num(e.target.value) })}
										className="flex-1 accent-rose-400"
									/>
									<span className="w-12 text-right tabular-nums">
										{(z.r ?? 0).toLocaleString('pt-BR')} mm
									</span>
								</div>
							)}
						</fieldset>
					))}
				</div>
				{problem && <p className="text-[12px] text-rose-300">{problem}</p>}
			</div>

			<div className="flex flex-col items-center gap-2">
				<CreationTemplatePreview
					template={value}
					highlightZone={focusZone}
					className={compact ? 'h-36 w-auto' : 'h-64 w-auto max-w-full'}
				/>
				<p className={`${hintCls} text-center`}>
					Vermelho: fica livre
					<br />
					Tracejado: margem de segurança
				</p>
			</div>
		</div>
	);
}

function NumField({
	label,
	value,
	onChange,
	disabled,
	small,
}: {
	label: string;
	value: number;
	onChange: (v: string) => void;
	disabled?: boolean;
	small?: boolean;
}) {
	return (
		<label className={disabled ? 'opacity-40' : undefined}>
			<span
				className={`mb-1 block text-slate-500 ${small ? 'text-[11px]' : 'text-[12px]'}`}
			>
				{label}
			</span>
			<input
				type="number"
				inputMode="decimal"
				step="0.1"
				min={0}
				disabled={disabled}
				value={Number.isFinite(value) ? value : 0}
				onChange={(e) => onChange(e.target.value)}
				className={numCls}
			/>
		</label>
	);
}
