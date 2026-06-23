'use client';

import {
	applyNodeChanges,
	Background,
	BackgroundVariant,
	Controls,
	Handle,
	type NodeChange,
	type NodeProps,
	Position,
	ReactFlow,
	ReactFlowProvider,
	useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
	Disc3,
	DoorOpen,
	KeyRound,
	LayoutGrid,
	LogOut,
	Maximize2,
	MessageSquare,
	Minimize2,
	Paperclip,
	Video,
	X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BuilderRoomState } from '../builder-model';
import { ac } from '../forge-theme';
import { RoomBuilderSections } from '../room-builder-sections';
import { layoutLR } from './canvas-layout';
import type { FlowEdge, FlowNode } from './canvas-mapping';

type PlanLite = { id: string; key: string; name: string };

type RoomKind =
	| 'entrada'
	| 'acesso'
	| 'sala'
	| 'materiais'
	| 'chat'
	| 'gravacao'
	| 'saida';

interface KindMeta {
	title: string;
	icon: React.ComponentType<{ className?: string }>;
	accent: string;
	feature?: 'materials' | 'chat' | 'recording';
}

const KIND_META: Record<RoomKind, KindMeta> = {
	entrada: { title: 'Entrada', icon: DoorOpen, accent: 'emerald' },
	acesso: { title: 'Acesso', icon: KeyRound, accent: 'amber' },
	sala: { title: 'Sala', icon: Video, accent: 'cyan' },
	materiais: {
		title: 'Materiais',
		icon: Paperclip,
		accent: 'sky',
		feature: 'materials',
	},
	chat: {
		title: 'Chat',
		icon: MessageSquare,
		accent: 'violet',
		feature: 'chat',
	},
	gravacao: {
		title: 'Gravação',
		icon: Disc3,
		accent: 'orange',
		feature: 'recording',
	},
	saida: { title: 'Saída', icon: LogOut, accent: 'slate' },
};

const ORDER: RoomKind[] = [
	'entrada',
	'acesso',
	'sala',
	'materiais',
	'chat',
	'gravacao',
	'saida',
];

const EDGE_PAIRS: [RoomKind, RoomKind][] = [
	['entrada', 'acesso'],
	['acesso', 'sala'],
	['sala', 'materiais'],
	['sala', 'chat'],
	['sala', 'gravacao'],
	['materiais', 'saida'],
	['chat', 'saida'],
	['gravacao', 'saida'],
];

const LAYOUT_EDGES: FlowEdge[] = EDGE_PAIRS.map(([s, t]) => ({
	id: `${s}-${t}`,
	source: s,
	target: t,
}));

function summaryFor(
	kind: RoomKind,
	room: BuilderRoomState,
	planName: (k: string) => string,
): string {
	switch (kind) {
		case 'entrada':
			return 'O aluno abre a sala';
		case 'acesso': {
			const names = room.includedPlanKeys.length
				? room.includedPlanKeys.map(planName).join(', ')
				: 'nenhum plano';
			return room.allowVoxEntry
				? `${names} grátis · outros ${room.voxCost} vox`
				: `${names} grátis · resto bloqueado`;
		}
		case 'sala':
			return `${room.cap ?? '∞'} vagas · abre ${room.opensMinutesBefore}min antes · ${room.defaultDurationMin}min`;
		case 'materiais':
			return room.features.materials ? 'Ativado' : 'Desativado';
		case 'chat':
			return room.features.chat ? 'Ativado' : 'Desativado';
		case 'gravacao':
			return room.features.recording ? 'Ativado' : 'Desativado';
		case 'saida':
			return room.features.recording ? 'Na sala + replay' : 'Aluno na sala';
	}
}

interface RoomNodeData extends Record<string, unknown> {
	kind: RoomKind;
	title: string;
	summary: string;
	enabled?: boolean;
}

function buildRoomNodes(
	room: BuilderRoomState,
	plans: PlanLite[],
	positions: Record<string, { x: number; y: number }>,
): FlowNode[] {
	const planName = (k: string) => plans.find((p) => p.key === k)?.name ?? k;
	return ORDER.map((kind) => {
		const meta = KIND_META[kind];
		const enabled = meta.feature ? room.features[meta.feature] : undefined;
		return {
			id: kind,
			type: 'roomNode',
			position: positions[kind] ?? { x: 0, y: 0 },
			deletable: false,
			data: {
				kind,
				title: meta.title,
				summary: summaryFor(kind, room, planName),
				enabled,
			} satisfies RoomNodeData,
		};
	});
}

function RoomNode({ data }: NodeProps) {
	const d = data as RoomNodeData;
	const meta = KIND_META[d.kind];
	const Icon = meta.icon;
	const a = ac(meta.accent);
	const dim = meta.feature && !d.enabled;
	return (
		<div
			className={`w-44 rounded-xl border bg-[#0b0e12] px-3 py-2.5 transition-opacity ${
				dim ? 'border-white/5 opacity-45' : 'border-white/10'
			}`}
		>
			{d.kind !== 'entrada' && (
				<Handle
					type="target"
					position={Position.Left}
					className="!size-2 !border-0 !bg-slate-500"
				/>
			)}
			<div className="flex items-center gap-2">
				<span
					className={`grid size-6 shrink-0 place-items-center rounded-md ${a.ico}`}
				>
					<Icon className="h-3.5 w-3.5" />
				</span>
				<span className="truncate text-sm font-semibold text-white">
					{d.title}
				</span>
				{meta.feature && (
					<span
						className={`ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
							d.enabled
								? 'bg-emerald-500/15 text-emerald-300'
								: 'bg-slate-500/15 text-slate-400'
						}`}
					>
						{d.enabled ? 'on' : 'off'}
					</span>
				)}
			</div>
			<p className="mt-1.5 text-[11px] leading-snug text-slate-400">
				{d.summary}
			</p>
			{d.kind !== 'saida' && (
				<Handle
					type="source"
					position={Position.Right}
					className="!size-2 !border-0 !bg-slate-500"
				/>
			)}
		</div>
	);
}

const ROOM_NODE_TYPES = { roomNode: RoomNode };

interface Props {
	room: BuilderRoomState;
	setRoom: (partial: Partial<BuilderRoomState>) => void;
	plans: PlanLite[];
	plansLoading?: boolean;
	/** True quando a aba Canvas está visível — dispara um fitView ao revelar. */
	active?: boolean;
}

function RoomCanvasInner({
	room,
	setRoom,
	plans,
	plansLoading,
	active,
}: Props) {
	const [rfNodes, setRfNodes] = useState<FlowNode[]>(() =>
		buildRoomNodes(
			room,
			plans,
			layoutLR(buildRoomNodes(room, plans, {}), LAYOUT_EDGES),
		),
	);
	const [selected, setSelected] = useState<RoomKind | null>(null);
	const [maximized, setMaximized] = useState(false);
	const rf = useReactFlow();

	// Edges: atenuadas quando a feature de uma ponta está desligada.
	const edges: FlowEdge[] = EDGE_PAIRS.map(([s, t]) => {
		const sf = KIND_META[s].feature;
		const tf = KIND_META[t].feature;
		const off =
			(sf && !room.features[sf]) || (tf && !room.features[tf]) || false;
		return {
			id: `${s}-${t}`,
			source: s,
			target: t,
			animated: !off,
			style: off ? { stroke: '#334155', opacity: 0.4 } : { stroke: '#475569' },
		};
	});

	// Atualiza o conteúdo dos nós quando o room muda, preservando as posições.
	useEffect(() => {
		setRfNodes((prev) => {
			const pos: Record<string, { x: number; y: number }> = {};
			for (const n of prev) pos[n.id] = n.position;
			return buildRoomNodes(room, plans, pos);
		});
	}, [room, plans]);

	// Container escondido (display:none) mede 0 → reenquadra quando a aba aparece.
	useEffect(() => {
		if (active)
			setTimeout(() => rf.fitView({ duration: 200, padding: 0.2 }), 60);
	}, [active, rf]);

	const onNodesChange = useCallback((changes: NodeChange[]) => {
		setRfNodes((nds) => applyNodeChanges(changes, nds));
	}, []);

	const toggleMax = useCallback(() => {
		setMaximized((m) => !m);
		setTimeout(() => rf.fitView({ duration: 200, padding: 0.18 }), 90);
	}, [rf]);

	useEffect(() => {
		if (!maximized) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setMaximized(false);
		};
		window.addEventListener('keydown', onKey);
		return () => {
			document.body.style.overflow = prev;
			window.removeEventListener('keydown', onKey);
		};
	}, [maximized]);

	const organize = useCallback(() => {
		setRfNodes((nds) => {
			const laid = layoutLR(nds, LAYOUT_EDGES);
			return nds.map((n) => (laid[n.id] ? { ...n, position: laid[n.id] } : n));
		});
		setTimeout(() => rf.fitView({ duration: 200, padding: 0.18 }), 60);
	}, [rf]);

	const selMeta = selected ? KIND_META[selected] : null;
	const SelIcon = selMeta?.icon;

	const shell = (
		<div
			className={
				maximized
					? 'fixed inset-0 z-[70] overflow-hidden bg-[#06080b]'
					: 'relative h-[72vh] min-h-[480px] overflow-hidden rounded-2xl border border-white/10 bg-[#06080b]'
			}
		>
			{/* legenda */}
			<div className="absolute left-3 top-3 z-10 max-w-[200px] rounded-xl border border-white/10 bg-[#0c0f12]/90 px-3 py-2 backdrop-blur">
				<span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
					funcionamento da sala
				</span>
				<p className="mt-1 text-[11px] leading-snug text-slate-400">
					Clique num bloco pra editar aquela parte.
				</p>
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
				nodeTypes={ROOM_NODE_TYPES}
				onNodesChange={onNodesChange}
				onNodeClick={(_, n) => setSelected(n.id as RoomKind)}
				onPaneClick={() => setSelected(null)}
				colorMode="dark"
				fitView
				nodesConnectable={false}
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

			{/* drawer de config do bloco selecionado */}
			{selected && selMeta && (
				<div
					key={selected}
					className="absolute right-3 top-14 z-10 max-h-[calc(100%-4.5rem)] w-[22rem] max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0f12]/95 p-4 shadow-2xl backdrop-blur"
				>
					<div className="mb-3 flex items-center justify-between">
						<span className="flex items-center gap-2 text-sm font-semibold text-white">
							{SelIcon && <SelIcon className="h-4 w-4 text-slate-300" />}
							{selMeta.title}
						</span>
						<button
							type="button"
							onClick={() => setSelected(null)}
							className="rounded p-1 text-slate-500 hover:text-slate-200"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					{selected === 'acesso' ? (
						<RoomBuilderSections
							room={room}
							plans={plans}
							plansLoading={plansLoading}
							setRoom={setRoom}
							section="access"
						/>
					) : selected === 'entrada' || selected === 'saida' ? (
						<p className="text-[13px] leading-relaxed text-slate-400">
							{selected === 'entrada'
								? 'Ponto de entrada: o aluno abre a ferramenta e o sistema checa o acesso antes de revelar o link da sala.'
								: 'Fim do fluxo: o aluno entra na sala (link externo) e, se a gravação estiver ligada, recebe o replay depois.'}
						</p>
					) : (
						<RoomBuilderSections
							room={room}
							plans={plans}
							plansLoading={plansLoading}
							setRoom={setRoom}
							section="room"
						/>
					)}
				</div>
			)}
		</div>
	);

	return maximized ? createPortal(shell, document.body) : shell;
}

export function RoomFlowCanvas(props: Props) {
	return (
		<ReactFlowProvider>
			<RoomCanvasInner {...props} />
		</ReactFlowProvider>
	);
}
