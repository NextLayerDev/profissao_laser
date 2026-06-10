'use client';

import {
	applyNodeChanges,
	Background,
	BackgroundVariant,
	Controls,
	type EdgeChange,
	type NodeChange,
	ReactFlow,
	ReactFlowProvider,
	useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
	LayoutGrid,
	Maximize2,
	Minimize2,
	Plus,
	Sparkles,
	Trash2,
	X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { BLOCK_CATALOG } from '../block-catalog';
import { FieldRow, ParamRow } from '../builder-fields';
import {
	type BuilderState,
	CUSTOM_PREFIX,
	type CustomNodeSpec,
	type FieldType,
	newField,
	newNode,
	type ParamValue,
	resolveSpec,
} from '../builder-model';
import { ac, resolveToolIcon } from '../forge-theme';
import { layoutLR } from './canvas-layout';
import {
	applyConnect,
	applyDisconnect,
	buildEdges,
	buildNodes,
	type FlowNode,
	INPUTS_ID,
	OUTPUT_ID,
	removeNode,
} from './canvas-mapping';
import { CANVAS_NODE_TYPES } from './canvas-nodes';
import { CustomNodeModal } from './custom-node-modal';

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
	// Posições são EFÊMERAS e pertencem ao React Flow (não vão pra definition).
	// O drag passa pelo applyNodeChanges (sem reconstruir nodes ⇒ sem flicker);
	// `state` só reconstrói a ESTRUTURA, preservando as posições atuais.
	const [rfNodes, setRfNodes] = useState<FlowNode[]>(() => {
		const laid = layoutLR(buildNodes(state, {}), buildEdges(state));
		return buildNodes(state, laid);
	});
	const [selected, setSelected] = useState<string | null>(null);
	const [maximized, setMaximized] = useState(false);
	const [creatingNode, setCreatingNode] = useState(false);
	const rf = useReactFlow();

	const toggleMax = useCallback(() => {
		setMaximized((m) => !m);
		// reenquadra depois do container redimensionar
		setTimeout(() => rf.fitView({ duration: 200, padding: 0.18 }), 90);
	}, [rf]);

	// trava o scroll do body e fecha no Esc enquanto maximizado (mas não quando
	// o modal "criar nó" está aberto — aí o Esc fecha o modal, não o maximizado).
	useEffect(() => {
		if (!maximized) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && !creatingNode) setMaximized(false);
		};
		window.addEventListener('keydown', onKey);
		return () => {
			document.body.style.overflow = prev;
			window.removeEventListener('keydown', onKey);
		};
	}, [maximized, creatingNode]);

	// Edges são puramente derivadas do estado (independem de posição) — não
	// recomputam durante o drag, então acompanham o nó sem piscar.
	const edges = useMemo(() => buildEdges(state), [state]);

	// Drag/seleção: React Flow é dono das posições (applyNodeChanges, sem rebuild).
	const onNodesChange = useCallback((changes: NodeChange[]) => {
		setRfNodes((nds) => applyNodeChanges(changes, nds));
	}, []);

	// Reconcilia a ESTRUTURA (mudou `state`) preservando as posições atuais (lidas
	// de `prev`, que já reflete os drags); dagre só pros nós novos. Drag puro não
	// muda `state` ⇒ este efeito não roda ⇒ sem flicker.
	const firstSync = useRef(true);
	// biome-ignore lint/correctness/useExhaustiveDependencies: reage só a mudanças estruturais de `state`
	useEffect(() => {
		if (firstSync.current) {
			firstSync.current = false;
			return;
		}
		setRfNodes((prev) => {
			const pos: Record<string, { x: number; y: number }> = {};
			for (const n of prev) pos[n.id] = n.position;
			const ids = [INPUTS_ID, ...state.nodes.map((n) => n.id), OUTPUT_ID];
			const missing = ids.filter((id) => !pos[id]);
			if (missing.length) {
				const laid = layoutLR(buildNodes(state, pos), buildEdges(state));
				for (const id of missing) if (laid[id]) pos[id] = laid[id];
			}
			return buildNodes(state, pos);
		});
	}, [state]);

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
				const edge = edges.find((e) => e.id === c.id);
				if (edge) s = applyDisconnect(s, edge);
			}
			onChange(s);
		},
		[state, onChange, edges],
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
			nodes: [...state.nodes, newNode(blockId, state.nodes, state.customNodes)],
		});
	const addCustom = (spec: CustomNodeSpec) => {
		onChange({ ...state, customNodes: [...state.customNodes, spec] });
		setCreatingNode(false);
	};
	const removeCustom = (id: string) => {
		if (state.nodes.some((n) => n.block === `${CUSTOM_PREFIX}${id}`)) {
			toast.error('Esse nó personalizado está em uso no canvas.');
			return;
		}
		onChange({
			...state,
			customNodes: state.customNodes.filter((c) => c.id !== id),
		});
	};
	const organize = useCallback(() => {
		setRfNodes((nds) => {
			const laid = layoutLR(nds, edges);
			return nds.map((n) => (laid[n.id] ? { ...n, position: laid[n.id] } : n));
		});
		setTimeout(() => rf.fitView({ duration: 200, padding: 0.18 }), 60);
	}, [edges, rf]);

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
		? resolveSpec(selNode.block, state.customNodes)
		: undefined;

	const shell = (
		<div
			className={
				maximized
					? 'fixed inset-0 z-[70] overflow-hidden bg-[#06080b]'
					: 'relative h-[72vh] min-h-[480px] overflow-hidden rounded-2xl border border-white/10 bg-[#06080b]'
			}
		>
			{/* paleta */}
			<div className="absolute left-3 top-3 z-10 flex max-h-[calc(100%-1.5rem)] max-w-[150px] flex-col gap-1.5 overflow-y-auto rounded-xl border border-white/10 bg-[#0c0f12]/90 p-2 backdrop-blur">
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

				{state.customNodes.length > 0 && (
					<span className="mt-1 px-1 font-mono text-[9px] uppercase tracking-widest text-slate-500">
						meus nós
					</span>
				)}
				{state.customNodes.map((c) => {
					const a = ac(c.accent);
					const Icon = resolveToolIcon(c.icon);
					return (
						<div key={c.id} className="group flex items-center gap-1">
							<button
								type="button"
								onClick={() => addNode(`${CUSTOM_PREFIX}${c.id}`)}
								className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-slate-300 ${a.nodeHover} hover:text-white`}
							>
								<Icon className="h-3.5 w-3.5 shrink-0" />
								<span className="truncate">{c.label}</span>
							</button>
							<button
								type="button"
								onClick={() => removeCustom(c.id)}
								title="Excluir nó"
								className="rounded p-1 text-slate-600 opacity-0 hover:text-rose-400 group-hover:opacity-100"
							>
								<Trash2 className="h-3 w-3" />
							</button>
						</div>
					);
				})}

				<button
					type="button"
					onClick={() => setCreatingNode(true)}
					className="mt-1 flex items-center justify-center gap-1 rounded-md border border-dashed border-white/15 px-2 py-1 text-[11px] text-slate-400 hover:border-emerald-400/40 hover:text-white"
				>
					<Plus className="h-3 w-3" /> criar nó
				</button>
			</div>

			{/* toolbar */}
			<div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
				<button
					type="button"
					onClick={organize}
					className="flex items-center gap-1.5 rounded-md border border-white/10 bg-[#0c0f12]/90 px-2.5 py-1.5 text-[11px] text-slate-300 backdrop-blur hover:text-white"
				>
					<LayoutGrid className="h-3.5 w-3.5" /> Organizar
				</button>
				<button
					type="button"
					onClick={toggleMax}
					title={maximized ? 'Restaurar (Esc)' : 'Maximizar'}
					className="flex items-center gap-1.5 rounded-md border border-white/10 bg-[#0c0f12]/90 px-2.5 py-1.5 text-[11px] text-slate-300 backdrop-blur hover:text-white"
				>
					{maximized ? (
						<>
							<Minimize2 className="h-3.5 w-3.5" /> Restaurar
						</>
					) : (
						<>
							<Maximize2 className="h-3.5 w-3.5" /> Maximizar
						</>
					)}
				</button>
			</div>

			<ReactFlow
				nodes={rfNodes}
				edges={edges}
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

			{/* drawer de config (key por nó: reseta editores com estado local) */}
			{selected && (selected === INPUTS_ID || selNode) && (
				<div
					key={selected}
					className="absolute right-3 top-14 z-10 max-h-[calc(100%-4.5rem)] w-80 overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0f12]/95 p-4 shadow-2xl backdrop-blur"
				>
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

			{creatingNode && (
				<CustomNodeModal
					existing={state.customNodes}
					onClose={() => setCreatingNode(false)}
					onSave={addCustom}
				/>
			)}
		</div>
	);

	// Maximizado: renderiza via portal no body pra escapar o containing block
	// da <Section> (backdrop-blur cria containing block que prenderia o
	// position:fixed dentro do retângulo da seção em vez da viewport).
	return maximized ? createPortal(shell, document.body) : shell;
}

export function ToolCanvas(props: Props) {
	return (
		<ReactFlowProvider>
			<CanvasInner {...props} />
		</ReactFlowProvider>
	);
}
