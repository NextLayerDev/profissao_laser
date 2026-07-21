'use client';

import {
	AlertCircle,
	ExternalLink,
	Eye,
	EyeOff,
	Loader2,
	Pencil,
	Pin,
	RefreshCw,
	X,
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';
import { ModalPortal } from '@/components/ui/modal-portal';
import {
	useKbSource,
	useReprocessKbSource,
	useSetKbChunkSuppressed,
	useUpdateKbSource,
} from '@/hooks/use-ai-knowledge';
import { KIND_LABELS, STATUS_LABELS } from '@/types/ai-knowledge';
import { KindBadge } from './kind-badge';
import { NO_EDIT_HINT } from './permission-hints';

function formatDate(iso: string | null): string {
	if (!iso) return '—';
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR');
}

/**
 * Painel lateral com o conteúdo completo de um conhecimento. Cada "trecho" é um
 * pedaço que a IA pode recuperar; a staff pode esconder um trecho ruim sem
 * apagar o conhecimento inteiro.
 */
export function SourceDrawer({
	sourceId,
	canEdit,
	onClose,
	onEdit,
}: {
	sourceId: string;
	canEdit: boolean;
	onClose: () => void;
	/** Abre o modal de edição (só faz sentido para conhecimento escrito à mão). */
	onEdit: (body: string) => void;
}) {
	const { data: source, isLoading } = useKbSource(sourceId);
	const setSuppressed = useSetKbChunkSuppressed(sourceId);
	const reprocess = useReprocessKbSource();
	const updateSource = useUpdateKbSource();

	const chunks = source?.chunks ?? [];
	const visibleCount = chunks.filter((c) => !c.suppressed).length;

	function togglePinned() {
		if (!source) return;
		updateSource.mutate(
			{ id: source.id, payload: { pinned: !source.pinned } },
			{
				onSuccess: () =>
					toast.success(
						source.pinned ? 'Destaque removido.' : 'Conhecimento destacado.',
					),
				onError: () => toast.error('Não foi possível salvar.'),
			},
		);
	}

	function toggleChunk(id: number, suppressed: boolean) {
		setSuppressed.mutate(
			{ id, suppressed },
			{
				onSuccess: () =>
					toast.success(
						suppressed
							? 'Trecho escondido da IA.'
							: 'Trecho liberado para a IA.',
					),
				onError: () => toast.error('Não foi possível salvar.'),
			},
		);
	}

	return (
		<ModalPortal>
			{/* biome-ignore lint/a11y/useSemanticElements: backdrop contém o painel com botões */}
			<div
				role="button"
				tabIndex={0}
				aria-label="Fechar painel"
				onClick={onClose}
				onKeyDown={(e) => e.key === 'Escape' && onClose()}
				className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm cursor-pointer"
			>
				<div
					role="dialog"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.key === 'Escape' && onClose()}
					className="w-full max-w-2xl h-full bg-white dark:bg-[#1a1a1d] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col cursor-default animate-[fade-in-up_0.2s_ease-out_both]"
				>
					{isLoading || !source ? (
						<LoadingState text="Carregando..." />
					) : (
						<>
							{/* Cabeçalho */}
							<div className="px-6 py-4 border-b border-slate-200 dark:border-white/10">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2 mb-1.5">
											<KindBadge kind={source.kind} />
											{source.pinned && (
												<span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
													<Pin className="w-3 h-3" />
													Destacado
												</span>
											)}
											{!source.enabled && (
												<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-gray-400">
													Desativado
												</span>
											)}
										</div>
										<h2 className="text-lg font-bold text-slate-900 dark:text-white">
											{source.title}
										</h2>
										{source.label && (
											<p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
												{source.label}
											</p>
										)}
									</div>
									<button
										type="button"
										onClick={onClose}
										aria-label="Fechar"
										className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
									>
										<X className="w-5 h-5" />
									</button>
								</div>

								{/* Ações */}
								<div className="flex flex-wrap items-center gap-2 mt-4">
									{source.kind === 'manual' && (
										<button
											type="button"
											/*
											 * Edita o texto ORIGINAL que a API devolve, não uma
											 * reconstrução a partir dos trechos. Remontar juntando
											 * os trechos parece equivalente, mas eles passaram por
											 * normalização e corte — salvar sem alterar nada
											 * reescreveria em silêncio o que a pessoa escreveu.
											 */
											onClick={() => onEdit(source.body ?? '')}
											disabled={!canEdit}
											title={canEdit ? undefined : NO_EDIT_HINT}
											className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
										>
											<Pencil className="w-3.5 h-3.5" />
											Editar texto
										</button>
									)}
									<button
										type="button"
										onClick={togglePinned}
										disabled={!canEdit || updateSource.isPending}
										title={canEdit ? undefined : NO_EDIT_HINT}
										className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
									>
										<Pin className="w-3.5 h-3.5" />
										{source.pinned ? 'Remover destaque' : 'Destacar'}
									</button>
									<button
										type="button"
										onClick={() =>
											reprocess.mutate(source.id, {
												onSuccess: () =>
													toast.success('Reprocessando este conhecimento.'),
												onError: () => toast.error('Não foi possível.'),
											})
										}
										disabled={!canEdit || reprocess.isPending}
										title={canEdit ? undefined : NO_EDIT_HINT}
										className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
									>
										{reprocess.isPending ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
										) : (
											<RefreshCw className="w-3.5 h-3.5" />
										)}
										Reprocessar
									</button>
									{source.sourceUrl && (
										<a
											href={source.sourceUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
										>
											<ExternalLink className="w-3.5 h-3.5" />
											Ver na plataforma
										</a>
									)}
								</div>
							</div>

							{/* Erro do processamento */}
							{source.status === 'error' && source.error && (
								<div className="mx-6 mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
									<AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
									<p className="text-sm text-red-800 dark:text-red-200">
										{source.error}
									</p>
								</div>
							)}

							{/* Trechos */}
							<div className="flex-1 overflow-y-auto px-6 py-4">
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-sm font-semibold text-slate-900 dark:text-white">
										Trechos que a IA pode usar
									</h3>
									<span className="text-xs text-slate-500 dark:text-gray-400 tabular-nums">
										{visibleCount} de {chunks.length}
									</span>
								</div>

								{chunks.length === 0 ? (
									<p className="text-sm text-slate-500 dark:text-gray-400 py-8 text-center">
										{source.status === 'processing'
											? 'Ainda preparando os trechos...'
											: 'Nenhum trecho gerado.'}
									</p>
								) : (
									<div className="space-y-2.5">
										{chunks.map((c) => (
											<div
												key={c.id}
												className={`rounded-xl border p-3.5 transition-colors ${
													c.suppressed
														? 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 opacity-60'
														: 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#0d0d0f]'
												}`}
											>
												<div className="flex items-start justify-between gap-3 mb-2">
													<span className="flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-gray-500">
														Trecho {c.seq + 1}
														{!c.hasEmbedding && (
															<span
																title="Este trecho ainda não entrou na busca inteligente."
																className="text-amber-600 dark:text-amber-400"
															>
																· fora da busca inteligente
															</span>
														)}
													</span>
													<button
														type="button"
														onClick={() => toggleChunk(c.id, !c.suppressed)}
														disabled={!canEdit || setSuppressed.isPending}
														title={
															canEdit
																? c.suppressed
																	? 'Liberar este trecho para a IA'
																	: 'Esconder este trecho da IA'
																: NO_EDIT_HINT
														}
														className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg text-slate-600 dark:text-gray-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
													>
														{c.suppressed ? (
															<>
																<Eye className="w-3 h-3" /> Liberar
															</>
														) : (
															<>
																<EyeOff className="w-3 h-3" /> Esconder
															</>
														)}
													</button>
												</div>
												<p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
													{c.content}
												</p>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Rodapé técnico */}
							<div className="px-6 py-3 border-t border-slate-200 dark:border-white/10 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-500 dark:text-gray-400">
								<span>Origem: {KIND_LABELS[source.kind]}</span>
								<span>Situação: {STATUS_LABELS[source.status]}</span>
								<span>Atualizado em {formatDate(source.updatedAt)}</span>
								{source.syncedAt && (
									<span>
										Lido da plataforma em {formatDate(source.syncedAt)}
									</span>
								)}
							</div>
						</>
					)}
				</div>
			</div>
		</ModalPortal>
	);
}
