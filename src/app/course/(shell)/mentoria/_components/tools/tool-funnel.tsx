'use client';

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Check,
	ChevronDown,
	ChevronUp,
	Filter,
	GripVertical,
	Pencil,
	Plus,
	Trash2,
	X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useInvalidateToolProgress } from '@/modules/mentoria/hooks';
import {
	createFunnelStage,
	deleteFunnelStage,
	listFunnelStages,
	reorderFunnelStages,
	seedFunnelStages,
	updateFunnelStage,
} from '@/modules/mentoria/service';
import type { MntFunnelStage } from '@/modules/mentoria/types';
import {
	BTN_PRIMARY,
	CARD,
	ConfirmDialog,
	EmptyState,
	INPUT,
	MntSkeleton,
	mntErrorText,
} from '../shared';

/**
 * Ferramenta sales_funnel: o aluno monta as etapas do próprio funil (as
 * padrão são só um ponto de partida) e o desenho acompanha a lista.
 */
export function ToolSalesFunnel({ instanceId }: { instanceId: string }) {
	const qc = useQueryClient();
	const queryKey = ['mentoria', 'funnel-stages', instanceId];
	const invalidateProgress = useInvalidateToolProgress();
	const invalidate = () => {
		qc.invalidateQueries({ queryKey });
		invalidateProgress();
	};

	const { data: stages, isLoading } = useQuery({
		queryKey,
		queryFn: () => listFunnelStages(instanceId),
	});

	const [newName, setNewName] = useState('');
	const [removing, setRemoving] = useState<MntFunnelStage | null>(null);

	const sorted = [...(stages ?? [])].sort((a, b) => a.position - b.position);

	const seed = useMutation({
		mutationFn: () => seedFunnelStages(instanceId),
		onSuccess: () => {
			invalidate();
			toast.success('Funil criado!');
		},
		onError: (e) => toast.error(mntErrorText(e, 'Não foi possível criar.')),
	});

	const add = useMutation({
		mutationFn: (name: string) => createFunnelStage(instanceId, { name }),
		onSuccess: () => {
			setNewName('');
			invalidate();
		},
		onError: (e) =>
			toast.error(mntErrorText(e, 'Não foi possível adicionar a etapa.')),
	});

	const rename = useMutation({
		mutationFn: ({ id, name }: { id: string; name: string }) =>
			updateFunnelStage(id, { name }),
		onSuccess: invalidate,
		onError: (e) => toast.error(mntErrorText(e, 'Não foi possível renomear.')),
	});

	const remove = useMutation({
		mutationFn: (id: string) => deleteFunnelStage(id),
		onSuccess: () => {
			setRemoving(null);
			invalidate();
		},
		onError: (e) => toast.error(mntErrorText(e, 'Não foi possível excluir.')),
	});

	// A lista reordena na hora (cache) e a API grava tudo de uma vez; se
	// falhar, o refetch devolve a ordem salva.
	const reorder = useMutation({
		mutationFn: (ids: string[]) => reorderFunnelStages(instanceId, ids),
		onMutate: (ids) => {
			const byId = new Map(sorted.map((s) => [s.id, s]));
			qc.setQueryData<MntFunnelStage[]>(
				queryKey,
				ids.flatMap((id, position) => {
					const s = byId.get(id);
					return s ? [{ ...s, position }] : [];
				}),
			);
		},
		onError: (e) => {
			qc.invalidateQueries({ queryKey });
			toast.error(mntErrorText(e, 'Não foi possível reordenar.'));
		},
	});

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	if (isLoading) return <MntSkeleton />;

	const move = (from: number, to: number) => {
		if (to < 0 || to >= sorted.length || from === to) return;
		reorder.mutate(arrayMove(sorted, from, to).map((s) => s.id));
	};
	const onDragEnd = (e: DragEndEvent) => {
		if (!e.over || e.active.id === e.over.id) return;
		const from = sorted.findIndex((s) => s.id === e.active.id);
		const to = sorted.findIndex((s) => s.id === e.over?.id);
		if (from >= 0 && to >= 0) move(from, to);
	};
	const submitNew = () => {
		const name = newName.trim();
		if (name) add.mutate(name);
	};

	const addForm = (
		<form
			className="flex gap-2"
			onSubmit={(e) => {
				e.preventDefault();
				submitNew();
			}}
		>
			<input
				className={INPUT}
				value={newName}
				maxLength={80}
				onChange={(e) => setNewName(e.target.value)}
				placeholder="Nova etapa (ex.: Indicação)"
				aria-label="Nome da nova etapa"
			/>
			<button
				type="submit"
				className={`${BTN_PRIMARY} shrink-0`}
				disabled={!newName.trim() || add.isPending}
			>
				<Plus className="w-4 h-4" />
				Adicionar
			</button>
		</form>
	);

	if (sorted.length === 0) {
		return (
			<EmptyState
				icon={Filter}
				title="Monte seu funil de vendas"
				description="Comece pelas etapas padrão ou crie as suas."
			>
				<div className="flex w-full max-w-md flex-col gap-3">
					<button
						type="button"
						className={BTN_PRIMARY}
						disabled={seed.isPending}
						onClick={() => seed.mutate()}
					>
						{seed.isPending ? 'Criando...' : 'Usar etapas padrão'}
					</button>
					{addForm}
				</div>
			</EmptyState>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
			<section className={`${CARD} p-5`}>
				<h3 className="mb-4 inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
					<Filter className="w-4 h-4 text-teal-600 dark:text-teal-400" />
					Seu funil
				</h3>
				<FunnelDrawing stages={sorted} />
			</section>

			<section className={`${CARD} p-5 space-y-3`}>
				<h3 className="font-semibold text-slate-900 dark:text-slate-100">
					Etapas
				</h3>
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={onDragEnd}
				>
					<SortableContext
						items={sorted.map((s) => s.id)}
						strategy={verticalListSortingStrategy}
					>
						<ol className="space-y-2" data-testid="funnel-stages">
							{sorted.map((s, idx) => (
								<StageRow
									key={s.id}
									stage={s}
									index={idx}
									last={idx === sorted.length - 1}
									busy={reorder.isPending}
									onMove={(dir) => move(idx, idx + dir)}
									onRename={(name) => rename.mutate({ id: s.id, name })}
									onRemove={() => setRemoving(s)}
								/>
							))}
						</ol>
					</SortableContext>
				</DndContext>
				{addForm}
			</section>

			{removing && (
				<ConfirmDialog
					title={`Excluir "${removing.name}"?`}
					confirmLabel="Excluir"
					danger
					busy={remove.isPending}
					onCancel={() => setRemoving(null)}
					onConfirm={() => remove.mutate(removing.id)}
				>
					A etapa sai do funil.
				</ConfirmDialog>
			)}
		</div>
	);
}

/** Linha da lista: alça de arrastar, setas (celular/teclado), renomear e excluir. */
function StageRow({
	stage,
	index,
	last,
	busy,
	onMove,
	onRename,
	onRemove,
}: {
	stage: MntFunnelStage;
	index: number;
	last: boolean;
	busy: boolean;
	onMove: (dir: -1 | 1) => void;
	onRename: (name: string) => void;
	onRemove: () => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: stage.id });
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(stage.name);

	const iconBtn =
		'p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 transition';
	const cancel = () => {
		setName(stage.name);
		setEditing(false);
	};
	const save = () => {
		const next = name.trim();
		setEditing(false);
		if (next && next !== stage.name) onRename(next);
		else setName(stage.name);
	};

	return (
		<li
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.6 : undefined,
				position: 'relative',
				zIndex: isDragging ? 10 : undefined,
			}}
			className="flex items-center gap-1 rounded-xl border border-slate-200 bg-surface p-2 dark:border-white/10"
		>
			<button
				type="button"
				ref={setActivatorNodeRef}
				{...attributes}
				{...listeners}
				aria-label={`Arrastar ${stage.name}`}
				className={`${iconBtn} cursor-grab touch-none active:cursor-grabbing`}
			>
				<GripVertical className="w-4 h-4" />
			</button>
			<span className="w-5 shrink-0 text-center text-xs text-slate-400">
				{index + 1}
			</span>
			{editing ? (
				<form
					className="flex min-w-0 flex-1 items-center gap-1"
					onSubmit={(e) => {
						e.preventDefault();
						save();
					}}
				>
					<input
						className={`${INPUT} py-1`}
						value={name}
						maxLength={80}
						// biome-ignore lint/a11y/noAutofocus: abre pelo clique em "Renomear"
						autoFocus
						onChange={(e) => setName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Escape') cancel();
						}}
						aria-label="Nome da etapa"
					/>
					<button type="submit" className={iconBtn} aria-label="Salvar nome">
						<Check className="w-4 h-4" />
					</button>
					<button
						type="button"
						className={iconBtn}
						aria-label="Cancelar"
						onClick={cancel}
					>
						<X className="w-4 h-4" />
					</button>
				</form>
			) : (
				<>
					<span className="min-w-0 flex-1 truncate text-sm text-slate-900 dark:text-slate-100">
						{stage.name}
					</span>
					<button
						type="button"
						className={iconBtn}
						disabled={busy || index === 0}
						onClick={() => onMove(-1)}
						aria-label={`Subir ${stage.name}`}
					>
						<ChevronUp className="w-4 h-4" />
					</button>
					<button
						type="button"
						className={iconBtn}
						disabled={busy || last}
						onClick={() => onMove(1)}
						aria-label={`Descer ${stage.name}`}
					>
						<ChevronDown className="w-4 h-4" />
					</button>
					<button
						type="button"
						className={iconBtn}
						// Parte do nome salvo: depois de um renomear que falhou, o
						// rascunho antigo reaparecia no campo.
						onClick={() => {
							setName(stage.name);
							setEditing(true);
						}}
						aria-label={`Renomear ${stage.name}`}
					>
						<Pencil className="w-3.5 h-3.5" />
					</button>
					<button
						type="button"
						className={`${iconBtn} hover:text-red-500`}
						onClick={onRemove}
						aria-label={`Excluir ${stage.name}`}
					>
						<Trash2 className="w-3.5 h-3.5" />
					</button>
				</>
			)}
		</li>
	);
}

/**
 * Desenho do funil a partir das etapas: cada faixa é um trapézio que afina
 * até 40% da largura, com a cor escurecendo do topo para o fundo. Nada de
 * imagem fixa: adicionar, renomear ou reordenar redesenha na hora.
 */
function FunnelDrawing({ stages }: { stages: MntFunnelStage[] }) {
	const n = stages.length;
	const widthAt = (i: number) => 100 - (60 * i) / n;
	return (
		<div
			className="flex flex-col items-center gap-1"
			data-testid="funnel-drawing"
		>
			{stages.map((s, i) => {
				const top = widthAt(i);
				const bottom = widthAt(i + 1);
				// Recuo de cada lado, em % da faixa, para o fundo ficar mais estreito.
				const inset = ((top - bottom) / 2 / top) * 100;
				const light = 45 - (20 * i) / Math.max(1, n - 1);
				return (
					<div
						key={s.id}
						className="flex min-h-10 items-center justify-center px-6 py-2 text-center"
						style={{
							width: `${top}%`,
							clipPath: `polygon(0 0, 100% 0, ${100 - inset}% 100%, ${inset}% 100%)`,
							backgroundColor: `hsl(173 70% ${light}%)`,
						}}
					>
						<span className="truncate text-xs font-semibold text-white">
							{s.name}
						</span>
					</div>
				);
			})}
		</div>
	);
}
