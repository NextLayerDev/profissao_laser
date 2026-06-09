'use client';

import { Link2, Trash2, Unlink } from 'lucide-react';
import type { BlockParam } from './block-catalog';
import {
	availableSources,
	type BuilderField,
	type BuilderState,
	type ParamValue,
	wantType,
} from './builder-model';
import { resolveToolIcon } from './forge-theme';

/**
 * Editores de campo/parâmetro compartilhados pelo builder em etapas e pelo
 * drawer do canvas: `LiteralControl` (valor fixo por tipo), `ParamRow` (valor
 * fixo ↔ ligação), `FieldRow` (editor de input).
 */

const smallSelect =
	'rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/40';

function Glyph({ name, className }: { name?: string; className?: string }) {
	const Icon = resolveToolIcon(name);
	return <Icon className={className} />;
}

export function LiteralControl({
	param,
	value,
	onChange,
}: {
	param: BlockParam;
	value: unknown;
	onChange: (v: unknown) => void;
}) {
	if (param.valueType === 'bool') {
		return (
			<button
				type="button"
				onClick={() => onChange(!value)}
				className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${value ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-400'}`}
			>
				{value ? 'sim' : 'não'}
			</button>
		);
	}
	if (param.options) {
		return (
			<select
				value={String(value ?? '')}
				onChange={(e) => {
					const numeric = param.options?.every((o) => typeof o === 'number');
					onChange(numeric ? Number(e.target.value) : e.target.value);
				}}
				className={smallSelect}
			>
				{param.options.map((o) => (
					<option key={String(o)} value={String(o)}>
						{String(o)}
					</option>
				))}
			</select>
		);
	}
	if (param.valueType === 'number' || param.valueType === 'int') {
		return (
			<input
				type="number"
				value={value === undefined || value === null ? '' : Number(value)}
				min={param.min}
				max={param.max}
				step={param.step}
				onChange={(e) =>
					onChange(e.target.value === '' ? undefined : Number(e.target.value))
				}
				className={`w-24 ${smallSelect}`}
			/>
		);
	}
	return (
		<input
			value={String(value ?? '')}
			onChange={(e) => onChange(e.target.value)}
			className={`w-40 ${smallSelect}`}
		/>
	);
}

export function ParamRow({
	param,
	value,
	state,
	nodeIndex,
	onChange,
}: {
	param: BlockParam;
	value: ParamValue;
	state: BuilderState;
	nodeIndex: number;
	onChange: (v: ParamValue) => void;
}) {
	const sources = availableSources(state, nodeIndex, wantType(param));
	const isRef = value.mode === 'ref';
	const canLiteral = param.kind === 'literal';

	return (
		<div className="flex flex-wrap items-center gap-2 py-1">
			<span className="w-28 shrink-0 text-xs font-medium text-slate-300">
				{param.label}
			</span>
			{isRef ? (
				<>
					<select
						value={value.mode === 'ref' ? value.source : ''}
						onChange={(e) =>
							onChange({
								mode: 'ref',
								source: e.target.value,
								negate: value.mode === 'ref' ? value.negate : undefined,
							})
						}
						className={`min-w-[10rem] flex-1 ${smallSelect} ${value.source ? 'text-cyan-200' : 'text-slate-500'}`}
					>
						<option value="">— escolha a fonte —</option>
						{sources.map((s) => (
							<option key={s.value} value={s.value}>
								{s.label}
							</option>
						))}
					</select>
					{param.valueType === 'bool' && (
						<label className="flex items-center gap-1 text-[11px] text-slate-400">
							<input
								type="checkbox"
								checked={value.mode === 'ref' ? !!value.negate : false}
								onChange={(e) =>
									onChange({
										mode: 'ref',
										source: value.mode === 'ref' ? value.source : '',
										negate: e.target.checked,
									})
								}
								className="accent-emerald-500"
							/>
							negar
						</label>
					)}
					{canLiteral && (
						<button
							type="button"
							onClick={() =>
								onChange({ mode: 'literal', value: param.default })
							}
							title="Usar valor fixo"
							className="text-slate-500 hover:text-slate-300"
						>
							<Unlink className="h-3.5 w-3.5" />
						</button>
					)}
				</>
			) : (
				<>
					<LiteralControl
						param={param}
						value={value.mode === 'literal' ? value.value : undefined}
						onChange={(v) => onChange({ mode: 'literal', value: v })}
					/>
					<button
						type="button"
						onClick={() => onChange({ mode: 'ref', source: '' })}
						title="Ligar a um campo / etapa"
						className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-cyan-300"
					>
						<Link2 className="h-3.5 w-3.5" /> ligar
					</button>
				</>
			)}
		</div>
	);
}

function MiniNum({
	label,
	value,
	onChange,
}: {
	label: string;
	value?: number;
	onChange: (v: number) => void;
}) {
	return (
		<label className="flex items-center gap-1 text-[11px] text-slate-500">
			{label}
			<input
				type="number"
				value={value ?? ''}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-16 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
			/>
		</label>
	);
}

export function FieldRow({
	field,
	onChange,
	onRemove,
}: {
	field: BuilderField;
	onChange: (f: BuilderField) => void;
	onRemove: () => void;
}) {
	return (
		<div className="rounded-xl border border-white/10 bg-black/20 p-3">
			<div className="flex items-center gap-2">
				<Glyph
					name={field.type === 'image' ? 'image' : 'box'}
					className="h-4 w-4 shrink-0 text-slate-400"
				/>
				<input
					value={field.label}
					onChange={(e) => onChange({ ...field, label: e.target.value })}
					className="flex-1 bg-transparent text-sm font-medium text-white focus:outline-none"
				/>
				<span className="font-mono text-[10px] text-slate-500">
					{field.name}
				</span>
				{field.type !== 'image' && (
					<button
						type="button"
						onClick={() => onChange({ ...field, visible: !field.visible })}
						className={`rounded-md px-2 py-1 text-[10px] font-semibold ${field.visible ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-500'}`}
					>
						{field.visible ? 'visível' : 'oculto'}
					</button>
				)}
				<button
					type="button"
					onClick={onRemove}
					className="rounded p-1 text-slate-500 hover:text-rose-400"
				>
					<Trash2 className="h-3.5 w-3.5" />
				</button>
			</div>
			<div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
				{(field.type === 'number' || field.type === 'int') && (
					<>
						<MiniNum
							label="padrão"
							value={field.default as number}
							onChange={(v) => onChange({ ...field, default: v })}
						/>
						<MiniNum
							label="mín"
							value={field.min}
							onChange={(v) => onChange({ ...field, min: v })}
						/>
						<MiniNum
							label="máx"
							value={field.max}
							onChange={(v) => onChange({ ...field, max: v })}
						/>
					</>
				)}
				{field.type === 'bool' && (
					<label className="flex items-center gap-2 text-xs text-slate-400">
						<input
							type="checkbox"
							checked={Boolean(field.default)}
							onChange={(e) =>
								onChange({ ...field, default: e.target.checked })
							}
							className="accent-emerald-500"
						/>
						ligado por padrão
					</label>
				)}
				{field.type === 'enum' && (
					<input
						value={(field.options ?? []).join(', ')}
						onChange={(e) =>
							onChange({
								...field,
								options: e.target.value
									.split(',')
									.map((s) => s.trim())
									.filter(Boolean),
							})
						}
						placeholder="opções, separadas por vírgula"
						className={`flex-1 ${smallSelect}`}
					/>
				)}
				{field.type === 'string' && (
					<input
						value={String(field.default ?? '')}
						onChange={(e) => onChange({ ...field, default: e.target.value })}
						placeholder="valor padrão"
						className={`flex-1 ${smallSelect}`}
					/>
				)}
			</div>
		</div>
	);
}
