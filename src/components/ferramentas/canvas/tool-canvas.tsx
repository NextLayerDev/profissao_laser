'use client';

import {
	Background,
	BackgroundVariant,
	Controls,
	type EdgeChange,
	type NodeChange,
	ReactFlow,
	ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LayoutGrid, Sparkles, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BLOCK_CATALOG } from '../block-catalog';
import { FieldRow, ParamRow } from '../builder-fields';
import {
	type BuilderState,
	type FieldType,
	newField,
	newNode,
	type ParamValue,
} from '../builder-model';
import { ac, resolveToolIcon } from '../forge-theme';
import { layoutLR } from './canvas-layout';
import {
	applyConnect,
	applyDisconnect,
	INPUTS_ID,
	OUTPUT_ID,
	removeNode,
	stateToFlow,
} from './canvas-mapping';
import { CANVAS_NODE_TYPES } from './canvas-nodes';

const FIELD_TYPES: { type: FieldType; label: string }[] = [
	{ type: 'number', label: 'Número' },
	{ type: 'bool', label: 'Sim / Não' },
	{ type: 'enum', label: 'Opções' },
	{ type: 'string', label: 'Texto' },
	{ type: 'image', label: 'Imagem' },
];

interface Props {
	state: BuilderState;
	onChange: (s: BuilderState) => void;
}

function CanvasInner({ state, onChange }: Props) {
	const [positions, setPositions] = useState<
		Record<string, { x: number; y: number }>
	>({});
	const [selected, setSelected] = useState<string | null>(null);

	const flow = useMemo(() => stateToFlow(state, positions), [state, positions]);

	// Posiciona nós sem posição (carga inicial / novo bloco) — só os que faltam.
	const idSig = state.nodes.map((n) => n.id).join('|');
	// biome-ignore lint/correctness/useExhaustiveDependencies: relayout ao mudar o conjunto de nós
	useEffect(() => {
		setPositions((prev) => {
			const ids = [INPUTS_ID, ...state.nodes.map((n) => n.id), OUTPUT_ID];
			const missing = ids.filter((id) => !prev[id]);
			if (!missing.length) return prev;
			const laid = layoutLR(flow.nodes, flow.edges);
			const next = { ...prev };
			for (const id of missing) if (laid[id]) next[id] = laid[id];
			return next;
		});
	}, [idSig]);

	const onNodesChange = useCallback((changes: NodeChange[]) => {
		setPositions((prev) => {
			let next = prev;
			for (const c of changes) {
				if (c.type === 'position' && c.position) {
					if (next === prev) next = { ...prev };
					next[c.id] = c.position;
				}
			}
			return next;
		});
	}, []);

	const onConnect = useCallback(
		(conn: {
			source: string | null;
			sourceHandle?: string | null;
			target: string | null;
			targetHandle?: string | null;
		}) => {
			const r = applyConnect(state, conn);
			if (r.error) {
				toast.error(r.error);
				return;
			}
			if (r.state) onChange(r.state);
		},
		[state, onChange],
	);

	const onEdgesChange = useCallback(
		(changes: EdgeChange[]) => {
			const removed = changes.filter((c) => c.type === 'remove');
			if (!removed.length) return;
			let s = state;
			for (const c of removed) {
				const edge = flow.edges.find((e) => e.id === c.id);
				if (edge) s = applyDisconnect(s, edge);
			}
			onChange(s);
		},
		[state, onChange, flow.edges],
	);

	const onNodesDelete = useCallback(
		(deleted: { id: string }[]) => {
			let s = state;
			for (const n of deleted) {
				if (n.id !== INPUTS_ID && n.id !== OUTPUT_ID) s = removeNode(s, n.id);
			}
			onChange(s);
			setSelected(null);
		},
		[state, onChange],
	);

	const addNode = (blockId: string) =>
		onChange({
			...state,
			nodes: [...state.nodes, newNode(blockId, state.nodes)],
		});
	const organize = () => setPositions(layoutLR(flow.nodes, flow.edges));

	const setField = (nf: (typeof state.fields)[number]) =>
		onChange({
			...state,
			fields: state.fields.map((x) => (x.name === nf.name ? nf : x)),
		});
	const removeField = (name: string) =>
		onChange({ ...state, fields: state.fields.filter((x) => x.name !== name) });
	const addField = (type: FieldType) =>
		onChange({
			...state,
			fields: [...state.fields, newField(type, state.fields.length)],
		});
	const setParam = (nodeId: string, param: string, v: ParamValue) =>
		onChange({
			...state,
			nodes: state.nodes.map((n) =>
				n.id === nodeId ? { ...n, params: { ...n.params, [param]: v } } : n,
			),
		});

	const selNode = state.nodes.find((n) => n.id === selected);
	const selIndex = state.nodes.findIndex((n) => n.id === selected);
	const selSpec = selNode
		? BLOCK_CATALOG.find((b) => b.id === selNode.block)
		: undefined;

	return (
		<div className="relative h-[68vh] min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[#06080b]">
			{/* paleta */}
			<div className="absolute left-3 top-3 z-10 flex max-w-[150px] flex-col gap-1.5 rounded-xl border border-white/10 bg-[#0c0f12]/90 p-2 backdrop-blur">
				<span className="px-1 font-mono text-[9px] uppercase tracking-widest text-slate-500">
					+ bloco
				</span>
				{BLOCK_CATALOG.map((b) => {
					const a = ac(b.accent);
					const Icon = resolveToolIcon(b.icon);
					return (
						<button
							key={b.id}
							type="button"
							onClick={() => addNode(b.id)}
							className={`flex items-center gap-1.5 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-slate-300 ${a.nodeHover} hover:text-white`}
						>
							<Icon className="h-3.5 w-3.5 shrink-0" /> {b.label}
						</button>
					);
				})}
			</div>

			{/* toolbar */}
			<div className="absolute right-3 top-3 z-10">
				<button
					type="button"
					onClick={organize}
					className="flex items-center gap-1.5 rounded-md border border-white/10 bg-[#0c0f12]/90 px-2.5 py-1.5 text-[11px] text-slate-300 backdrop-blur hover:text-white"
				>
					<LayoutGrid className="h-3.5 w-3.5" /> Organizar
				</button>
			</div>

			<ReactFlow
				nodes={flow.nodes}
				edges={flow.edges}
				nodeTypes={CANVAS_NODE_TYPES}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onNodesDelete={onNodesDelete}
				onNodeClick={(_, n) => setSelected(n.id)}
				onPaneClick={() => setSelected(null)}
				colorMode="dark"
				fitView
				proOptions={{ hideAttribution: true }}
			>
				<Background
					variant={BackgroundVariant.Dots}
					gap={20}
					size={1}
					color="#1e293b"
				/>
				<Controls
					className="!border-white/10 !bg-[#0c0f12]"
					showInteractive={false}
				/>
			</ReactFlow>

			{/* drawer de config */}
			{selected && (selected === INPUTS_ID || selNode) && (
				<div className="absolute right-3 top-14 z-10 max-h-[calc(100%-4.5rem)] w-80 overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0f12]/95 p-4 shadow-2xl backdrop-blur">
					<div className="mb-3 flex items-center justify-between">
						<span className="flex items-center gap-2 text-sm font-semibold text-white">
							{selected === INPUTS_ID ? (
								<>
									<Sparkles className="h-4 w-4 text-sky-300" /> Entradas
								</>
							) : (
								<>
									{(() => {
										const Icon = resolveToolIcon(selSpec?.icon);
										return <Icon className="h-4 w-4 text-slate-300" />;
									})()}
									{selSpec?.label ?? selNode?.block}
								</>
							)}
						</span>
						<button
							type="button"
							onClick={() => setSelected(null)}
							className="rounded p-1 text-slate-500 hover:text-slate-200"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					{selected === INPUTS_ID ? (
						<div className="space-y-2">
							{state.fields.map((f) => (
								<FieldRow
									key={f.name}
									field={f}
									onChange={setField}
									onRemove={() => removeField(f.name)}
								/>
							))}
							<div className="flex flex-wrap items-center gap-1.5 pt-1">
								<span className="text-[11px] text-slate-500">+ campo:</span>
								{FIELD_TYPES.map((ft) => (
									<button
										key={ft.type}
										type="button"
										onClick={() => addField(ft.type)}
										className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-slate-300 hover:border-sky-400/40 hover:text-white"
									>
										{ft.label}
									</button>
								))}
							</div>
						</div>
					) : selNode && selSpec ? (
						<div className="space-y-1">
							{selSpec.params.map((p) => (
								<ParamRow
									key={p.name}
									param={p}
									value={
										selNode.params[p.name] ?? {
											mode: 'literal',
											value: p.default,
										}
									}
									state={state}
									nodeIndex={selIndex}
									onChange={(v) => setParam(selNode.id, p.name, v)}
								/>
							))}
							<button
								type="button"
								onClick={() => onNodesDelete([{ id: selNode.id }])}
								className="mt-2 flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-400 hover:text-rose-400"
							>
								<Trash2 className="h-3.5 w-3.5" /> remover etapa
							</button>
						</div>
					) : null}
				</div>
			)}
		</div>
	);
}

export function ToolCanvas(props: Props) {
	return (
		<ReactFlowProvider>
			<CanvasInner {...props} />
		</ReactFlowProvider>
	);
}
