'use client';

import { Check, Image as ImageIcon, Upload } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import type {
	ToolControl,
	ToolInputSpec,
} from '../services/tool-definitions.service';

/** Nome do input que um control liga (`bind: "input.material"` → `material`). */
export function bindName(bind: string): string {
	return bind.startsWith('input.') ? bind.slice('input.'.length) : bind;
}

interface WidgetProps {
	control: ToolControl;
	spec?: ToolInputSpec;
	value: unknown;
	onChange: (v: unknown) => void;
}

const fieldClass =
	'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/40';

function Label({
	htmlFor,
	children,
}: {
	htmlFor?: string;
	children: ReactNode;
}) {
	return (
		<label
			htmlFor={htmlFor}
			className="block text-sm font-medium text-slate-700 dark:text-slate-300"
		>
			{children}
		</label>
	);
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileDropWidget({ control, value, onChange }: WidgetProps) {
	const [dragging, setDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const file = value instanceof File ? value : null;

	const pick = (f: File | undefined) => {
		if (f) onChange(f);
	};

	return (
		<div className="space-y-3 sm:col-span-2">
			<Label>{control.label ?? 'Imagem'}</Label>
			<button
				type="button"
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					pick(e.dataTransfer.files[0]);
				}}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={(e) => {
					e.preventDefault();
					setDragging(false);
				}}
				onClick={() => inputRef.current?.click()}
				className={`relative flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-10 transition-colors cursor-pointer ${
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
						pick(e.target.files?.[0]);
						e.target.value = '';
					}}
					className="hidden"
				/>
				<div className="rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 p-3 text-white mb-3">
					<Upload className="w-8 h-8" />
				</div>
				<p className="text-slate-600 dark:text-gray-400 text-center font-medium text-sm">
					Arraste sua imagem ou clique para selecionar
				</p>
			</button>

			{file && (
				<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-3 flex items-center gap-3">
					<div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/20">
						<ImageIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="font-medium text-slate-900 dark:text-white truncate text-sm">
							{file.name}
						</p>
						<p className="text-slate-500 dark:text-gray-400 text-xs">
							{formatBytes(file.size)}
						</p>
					</div>
					<Check className="w-5 h-5 text-emerald-500" />
				</div>
			)}
		</div>
	);
}

function SelectWidget({ control, spec, value, onChange }: WidgetProps) {
	const id = `w-${bindName(control.bind)}`;
	const options = (control.options ?? spec?.options ?? []) as unknown[];
	const current = value ?? spec?.default ?? '';
	return (
		<div className="space-y-1.5">
			<Label htmlFor={id}>{control.label ?? bindName(control.bind)}</Label>
			<select
				id={id}
				value={String(current)}
				onChange={(e) => {
					// Preserva número quando todas as opções são numéricas (ex.: DPI).
					const raw = e.target.value;
					const numeric = options.every((o) => typeof o === 'number');
					onChange(numeric ? Number(raw) : raw);
				}}
				className={fieldClass}
			>
				{options.map((opt) => (
					<option key={String(opt)} value={String(opt)}>
						{String(opt)}
					</option>
				))}
			</select>
		</div>
	);
}

function SliderWidget({ control, spec, value, onChange }: WidgetProps) {
	const id = `w-${bindName(control.bind)}`;
	const min = control.min ?? spec?.min ?? 0;
	const max = control.max ?? spec?.max ?? 100;
	const step = control.step ?? 1;
	const current = Number(value ?? spec?.default ?? min);
	return (
		<div className="space-y-1.5 sm:col-span-2">
			<div className="flex items-center justify-between">
				<Label htmlFor={id}>{control.label ?? bindName(control.bind)}</Label>
				<span className="text-xs text-slate-400">{current}</span>
			</div>
			<input
				id={id}
				type="range"
				min={min}
				max={max}
				step={step}
				value={current}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-white/10 accent-violet-600"
			/>
		</div>
	);
}

function ToggleWidget({ control, spec, value, onChange }: WidgetProps) {
	const checked = Boolean(value ?? spec?.default ?? false);
	return (
		<label className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400 cursor-pointer sm:col-span-2">
			<input
				type="checkbox"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				className="accent-violet-600"
			/>
			{control.label ?? bindName(control.bind)}
		</label>
	);
}

function NumberWidget({ control, spec, value, onChange }: WidgetProps) {
	const id = `w-${bindName(control.bind)}`;
	const current = value ?? spec?.default ?? '';
	return (
		<div className="space-y-1.5">
			<Label htmlFor={id}>{control.label ?? bindName(control.bind)}</Label>
			<input
				id={id}
				type="number"
				value={current === '' ? '' : Number(current)}
				min={control.min ?? spec?.min}
				max={control.max ?? spec?.max}
				step={control.step}
				onChange={(e) =>
					onChange(e.target.value === '' ? undefined : Number(e.target.value))
				}
				className={fieldClass}
			/>
		</div>
	);
}

function ColorWidget({ control, spec, value, onChange }: WidgetProps) {
	const id = `w-${bindName(control.bind)}`;
	const current = String(value ?? spec?.default ?? '#000000');
	const valid = /^#[0-9a-f]{6}$/i.test(current) ? current : '#000000';
	return (
		<div className="space-y-1.5">
			<Label htmlFor={id}>{control.label ?? bindName(control.bind)}</Label>
			<div className="flex items-center gap-2">
				<input
					id={id}
					type="color"
					value={valid}
					onChange={(e) => onChange(e.target.value)}
					className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 dark:border-white/10 bg-transparent p-0.5"
				/>
				<input
					type="text"
					value={current}
					onChange={(e) => onChange(e.target.value)}
					placeholder="#000000"
					className={fieldClass}
				/>
			</div>
		</div>
	);
}

/** Registry de widgets — desenha `definition.ui.controls`. */
const WIDGETS: Record<string, (props: WidgetProps) => ReactNode> = {
	'file-drop': FileDropWidget,
	select: SelectWidget,
	slider: SliderWidget,
	toggle: ToggleWidget,
	number: NumberWidget,
	color: ColorWidget,
};

export function WidgetField(props: WidgetProps) {
	const Widget = WIDGETS[props.control.widget];
	if (!Widget) {
		// Widget desconhecido: cai num número/texto genérico (não quebra a tela).
		return <NumberWidget {...props} />;
	}
	return <Widget {...props} />;
}
