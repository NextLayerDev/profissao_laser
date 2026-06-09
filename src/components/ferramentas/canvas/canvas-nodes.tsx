'use client';

import { Handle, type NodeProps, Position } from '@xyflow/react';
import { Eye, Sparkles } from 'lucide-react';
import type { PortType } from '../block-catalog';
import { fieldProduces, type PortLike, wantType } from '../builder-model';
import {
	type AccentClasses,
	ac,
	PORT_HEX,
	resolveToolIcon,
} from '../forge-theme';
import type {
	BlockNodeData,
	InputsNodeData,
	OutputNodeData,
} from './canvas-mapping';

function portColor(t: PortLike | undefined): string {
	if (t === 'buffer' || t === 'string' || t === 'number')
		return PORT_HEX[t as PortType];
	if (t === 'bool') return '#c084fc';
	if (t === 'enum') return '#22d3ee';
	return '#64748b';
}

const dot = (color: string) => ({
	background: color,
	width: 11,
	height: 11,
	border: '2px solid #0a0d10',
});

const shell = (selected: boolean, a: AccentClasses) =>
	`rounded-xl border bg-[#0b0e12] shadow-xl transition-colors ${
		selected ? a.selBorder : 'border-white/15'
	}`;

/* ── Entradas ── */
export function InputsNode({ data, selected }: NodeProps) {
	const d = data as unknown as InputsNodeData;
	return (
		<div className={`min-w-[180px] ${shell(!!selected, ac('sky'))}`}>
			<header className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
				<span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/15 text-sky-300">
					<Sparkles className="h-3.5 w-3.5" />
				</span>
				<span className="text-xs font-semibold text-white">Entradas</span>
			</header>
			<div className="py-1.5">
				{d.fields.length === 0 && (
					<p className="px-3 py-1 text-[11px] text-slate-600">sem campos</p>
				)}
				{d.fields.map((f) => (
					<div
						key={f.name}
						className="relative flex items-center justify-end gap-2 px-3 py-1 text-[11px]"
					>
						<span className="truncate text-slate-300">{f.label}</span>
						<Handle
							type="source"
							position={Position.Right}
							id={`input.${f.name}`}
							style={dot(portColor(fieldProduces(f.type)))}
						/>
					</div>
				))}
			</div>
		</div>
	);
}

/* ── Bloco ── */
export function BlockNode({ data, selected }: NodeProps) {
	const d = data as unknown as BlockNodeData;
	const spec = d.spec;
	const accent = spec?.accent ?? 'slate';
	const a = ac(accent);
	const Icon = resolveToolIcon(spec?.icon);

	const params = spec?.params ?? [];
	const refParams = params.filter(
		(p) => p.kind === 'ref' || d.node.params[p.name]?.mode === 'ref',
	);
	const literalParams = params.filter(
		(p) => p.kind === 'literal' && d.node.params[p.name]?.mode !== 'ref',
	);

	return (
		<div className={`min-w-[230px] ${shell(!!selected, a)}`}>
			<header className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
				<span
					className={`flex h-5 w-5 items-center justify-center rounded-md font-mono text-[10px] ring-1 ${a.badge}`}
				>
					{d.index + 1}
				</span>
				<span
					className={`flex h-6 w-6 items-center justify-center rounded-md ${a.ico}`}
				>
					<Icon className="h-3.5 w-3.5" />
				</span>
				<span className="min-w-0 flex-1">
					<span className="block truncate text-xs font-semibold text-white">
						{spec?.label ?? d.node.block}
					</span>
				</span>
			</header>

			<div className="grid grid-cols-2 gap-1 py-1.5">
				<div>
					{refParams.map((p) => {
						const connected =
							d.node.params[p.name]?.mode === 'ref' &&
							!!(d.node.params[p.name] as { source?: string }).source;
						return (
							<div
								key={p.name}
								className="relative flex items-center gap-1.5 px-3 py-1 text-[11px]"
							>
								<Handle
									type="target"
									position={Position.Left}
									id={p.name}
									style={dot(portColor(wantType(p)))}
								/>
								<span className={connected ? 'text-white' : 'text-slate-400'}>
									{p.label}
								</span>
							</div>
						);
					})}
				</div>
				<div>
					{(spec?.outputs ?? []).map((o) => (
						<div
							key={o.name}
							className="relative flex items-center justify-end gap-1.5 px-3 py-1 text-[11px]"
						>
							<span className="truncate text-slate-400">{o.label}</span>
							<Handle
								type="source"
								position={Position.Right}
								id={o.name}
								style={dot(portColor(o.type))}
							/>
						</div>
					))}
				</div>
			</div>

			{literalParams.length > 0 && (
				<div className="border-t border-white/5 px-3 py-1.5 text-[10px] text-slate-500">
					{literalParams
						.map((p) => {
							const v = d.node.params[p.name];
							const val = v?.mode === 'literal' ? v.value : undefined;
							return `${p.label}: ${val === undefined || val === '' ? '—' : String(val)}`;
						})
						.join(' · ')}
				</div>
			)}
		</div>
	);
}

/* ── Resultado ── */
export function OutputNode({ data, selected }: NodeProps) {
	const d = data as unknown as OutputNodeData;
	const rows: { handle: string; label: string }[] = [
		{ handle: 'primary', label: 'Arquivo final' },
		{ handle: 'preview', label: 'Prévia' },
		{ handle: 'meta', label: 'Detalhes' },
	];
	return (
		<div className={`min-w-[180px] ${shell(!!selected, ac('violet'))}`}>
			<header className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
				<span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/15 text-violet-300">
					<Eye className="h-3.5 w-3.5" />
				</span>
				<span className="text-xs font-semibold text-white">Resultado</span>
			</header>
			<div className="py-1.5">
				{rows.map((r) => {
					const set =
						r.handle === 'meta'
							? d.output.meta.length > 0
							: !!d.output[r.handle as 'primary' | 'preview'];
					return (
						<div
							key={r.handle}
							className="relative flex items-center gap-1.5 px-3 py-1 text-[11px]"
						>
							<Handle
								type="target"
								position={Position.Left}
								id={r.handle}
								style={dot(set ? '#a78bfa' : '#475569')}
							/>
							<span className={set ? 'text-white' : 'text-slate-400'}>
								{r.label}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export const CANVAS_NODE_TYPES = {
	inputsNode: InputsNode,
	blockNode: BlockNode,
	outputNode: OutputNode,
};
