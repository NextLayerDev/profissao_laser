'use client';

import { BookOpen, Plus, Search, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
	useCreateKbSource,
	useDeleteKbSource,
	useKbSources,
	useReprocessKbSource,
	useUpdateKbSource,
} from '@/hooks/use-ai-knowledge';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
	type KbSource,
	type KbSourceKind,
	type KbSourceStatus,
	KIND_LABELS,
	KIND_ORDER,
} from '@/types/ai-knowledge';
import { ConfirmDialog } from './confirm-dialog';
import { NO_EDIT_HINT } from './permission-hints';
import { SourceDrawer } from './source-drawer';
import { type SourceFormValues, SourceModal } from './source-modal';
import { SourcesTable } from './sources-table';

const PAGE_SIZE = 25;

const STATUS_FILTERS: Array<{ key: KbSourceStatus | 'all'; label: string }> = [
	{ key: 'all', label: 'Todos' },
	{ key: 'ready', label: 'Prontos' },
	{ key: 'processing', label: 'Preparando' },
	{ key: 'error', label: 'Com problema' },
	{ key: 'archived', label: 'Arquivados' },
];

export function SourcesTab({
	canEdit,
	canDelete,
	onTeach,
	pushedFilter,
}: {
	canEdit: boolean;
	canDelete: boolean;
	/** Abre o modal de varredura — usado no estado vazio. */
	onTeach: () => void;
	/**
	 * Filtro empurrado pelo topo (clicar numa faixa da composição ou numa ordem
	 * do dia). O `nonce` existe pra clicar duas vezes na MESMA faixa voltar a
	 * aplicar o filtro depois de a pessoa ter mexido nos selects.
	 */
	pushedFilter?: {
		kind?: KbSourceKind;
		status?: 'error';
		nonce: number;
	} | null;
}) {
	const [kind, setKind] = useState<KbSourceKind | 'all'>('all');
	const [status, setStatus] = useState<KbSourceStatus | 'all'>('all');
	const [search, setSearch] = useState('');
	/** Lista que cresce: com 37 páginas, avançar de duas em duas era ruim. */
	const [visible, setVisible] = useState(PAGE_SIZE);
	const debouncedSearch = useDebouncedValue(search, 400);

	const [drawerId, setDrawerId] = useState<string | null>(null);
	const [modal, setModal] = useState<{
		open: boolean;
		editing: KbSource | null;
		body: string;
	}>({ open: false, editing: null, body: '' });
	const [toDelete, setToDelete] = useState<KbSource | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);

	// O topo mandou filtrar (faixa da composição / ordem do dia). Aplica e volta
	// pra primeira página — senão a pessoa filtra e cai numa página vazia.
	// biome-ignore lint/correctness/useExhaustiveDependencies: o nonce é o gatilho
	useEffect(() => {
		if (!pushedFilter) return;
		setKind(pushedFilter.kind ?? 'all');
		setStatus(pushedFilter.status ?? 'all');
		setSearch('');
		setVisible(PAGE_SIZE);
	}, [pushedFilter?.nonce]);

	const params = useMemo(
		() => ({
			...(kind !== 'all' ? { kind } : {}),
			...(status !== 'all' ? { status } : {}),
			...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
			limit: visible,
			offset: 0,
		}),
		[kind, status, debouncedSearch, visible],
	);

	const { data, isLoading } = useKbSources(params);
	const createSource = useCreateKbSource();
	const updateSource = useUpdateKbSource();
	const deleteSource = useDeleteKbSource();
	const reprocess = useReprocessKbSource();

	const items = data?.items ?? [];
	const total = data?.total ?? 0;
	const temMais = items.length < total;

	/** Sem filtro nenhum e sem resultado = a base está realmente vazia. */
	const hasFilters =
		kind !== 'all' || status !== 'all' || debouncedSearch.trim().length > 0;
	const baseIsEmpty = !isLoading && total === 0 && !hasFilters;

	/** Trocar filtro volta a lista ao tamanho inicial. */
	function resetPage<T>(setter: (v: T) => void) {
		return (v: T) => {
			setter(v);
			setVisible(PAGE_SIZE);
		};
	}

	async function handleSave(values: SourceFormValues) {
		try {
			if (modal.editing) {
				await updateSource.mutateAsync({
					id: modal.editing.id,
					payload: {
						title: values.title,
						body: values.body,
						label: values.label || undefined,
						pinned: values.pinned,
					},
				});
				toast.success('Conhecimento atualizado.');
			} else {
				await createSource.mutateAsync({
					title: values.title,
					body: values.body,
					label: values.label || undefined,
					pinned: values.pinned,
				});
				toast.success('A IA já aprendeu isso.');
			}
			setModal({ open: false, editing: null, body: '' });
		} catch {
			toast.error('Não foi possível salvar.');
		}
	}

	function handleReprocess(source: KbSource) {
		setBusyId(source.id);
		reprocess.mutate(source.id, {
			onSuccess: () => toast.success('Reprocessando este conhecimento.'),
			onError: () => toast.error('Não foi possível reprocessar.'),
			onSettled: () => setBusyId(null),
		});
	}

	function handleToggleEnabled(source: KbSource) {
		setBusyId(source.id);
		updateSource.mutate(
			{ id: source.id, payload: { enabled: !source.enabled } },
			{
				onSuccess: () =>
					toast.success(
						source.enabled
							? 'Desativado. A IA para de usar este conhecimento.'
							: 'Ativado. A IA voltou a usar este conhecimento.',
					),
				onError: () => toast.error('Não foi possível salvar.'),
				onSettled: () => setBusyId(null),
			},
		);
	}

	function handleDelete() {
		if (!toDelete) return;
		deleteSource.mutate(toDelete.id, {
			onSuccess: () => {
				toast.success('Conhecimento excluído.');
				if (drawerId === toDelete.id) setDrawerId(null);
				setToDelete(null);
			},
			onError: () => toast.error('Não foi possível excluir.'),
		});
	}

	return (
		<div className="space-y-4">
			{/* Filtros */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative flex-1 min-w-[220px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
					<input
						value={search}
						onChange={(e) => resetPage(setSearch)(e.target.value)}
						placeholder="Buscar por assunto..."
						className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-600 focus:outline-none"
					/>
				</div>

				<select
					value={kind}
					onChange={(e) =>
						resetPage(setKind)(e.target.value as KbSourceKind | 'all')
					}
					aria-label="Filtrar por origem"
					className="px-3 py-2.5 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:border-violet-600 focus:outline-none"
				>
					<option value="all">Todas as origens</option>
					{KIND_ORDER.map((k) => (
						<option key={k} value={k}>
							{KIND_LABELS[k]}
						</option>
					))}
				</select>

				<button
					type="button"
					onClick={() => setModal({ open: true, editing: null, body: '' })}
					disabled={!canEdit}
					title={canEdit ? undefined : NO_EDIT_HINT}
					className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
				>
					<Plus className="w-4 h-4" />
					Adicionar
				</button>
			</div>

			<div className="flex flex-wrap gap-1.5">
				{STATUS_FILTERS.map((f) => (
					<button
						key={f.key}
						type="button"
						onClick={() => resetPage(setStatus)(f.key)}
						className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
							status === f.key
								? 'bg-violet-600 text-white'
								: 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
						}`}
					>
						{f.label}
					</button>
				))}
			</div>

			{/* Conteúdo */}
			{isLoading && items.length === 0 ? (
				<LoadingState text="Carregando o que a IA já sabe..." />
			) : baseIsEmpty ? (
				<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d]">
					<EmptyState
						icon={Sparkles}
						title="A IA ainda não sabe nada sobre a plataforma"
						description="Clique em Ensinar sobre a plataforma e ela vai ler ferramentas, planos, cursos, perguntas frequentes e mais — leva alguns minutos e você acompanha por aqui."
						action={
							canEdit
								? { label: 'Ensinar sobre a plataforma', onClick: onTeach }
								: undefined
						}
					/>
				</div>
			) : items.length === 0 ? (
				<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d]">
					<EmptyState
						icon={BookOpen}
						title="Nada encontrado"
						description="Tente outro termo de busca ou limpe os filtros."
					/>
				</div>
			) : (
				<>
					<SourcesTable
						items={items}
						canEdit={canEdit}
						canDelete={canDelete}
						busyId={busyId}
						onOpen={(s) => setDrawerId(s.id)}
						onReprocess={handleReprocess}
						onToggleEnabled={handleToggleEnabled}
						onDelete={setToDelete}
					/>

					{total > 0 && (
						<div className="flex flex-col items-center gap-3 pt-1">
							<span className="text-xs text-slate-500 dark:text-gray-400">
								Mostrando {items.length} de {total}{' '}
								{total === 1 ? 'conhecimento' : 'conhecimentos'}
							</span>
							{temMais && (
								<button
									type="button"
									onClick={() => setVisible((v) => v + PAGE_SIZE)}
									disabled={isLoading}
									className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors disabled:opacity-40"
								>
									{isLoading ? 'Carregando...' : 'Mostrar mais'}
								</button>
							)}
						</div>
					)}
				</>
			)}

			{/* Painel lateral */}
			{drawerId && (
				<SourceDrawer
					sourceId={drawerId}
					canEdit={canEdit}
					onClose={() => setDrawerId(null)}
					onEdit={(body) => {
						const found = items.find((s) => s.id === drawerId) ?? null;
						setModal({ open: true, editing: found, body });
						setDrawerId(null);
					}}
				/>
			)}

			{/* Criar / editar conhecimento escrito à mão */}
			{modal.open && (
				<SourceModal
					initial={
						modal.editing
							? {
									title: modal.editing.title,
									body: modal.body,
									label: modal.editing.label ?? '',
									pinned: modal.editing.pinned,
								}
							: undefined
					}
					saving={createSource.isPending || updateSource.isPending}
					onSave={handleSave}
					onClose={() => setModal({ open: false, editing: null, body: '' })}
				/>
			)}

			{toDelete && (
				<ConfirmDialog
					title="Excluir este conhecimento?"
					description={`"${toDelete.title}" some da base e a IA para de usar. Se veio da plataforma, volta na próxima vez que você clicar em Ensinar sobre a plataforma.`}
					confirmLabel="Excluir"
					loading={deleteSource.isPending}
					onConfirm={handleDelete}
					onCancel={() => setToDelete(null)}
				/>
			)}
		</div>
	);
}
