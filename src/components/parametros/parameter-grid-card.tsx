'use client';

import {
	Activity,
	Bookmark,
	Box,
	Check,
	Focus,
	Gauge,
	Layers,
	type LucideIcon,
	Minus,
	Palette,
	Pencil,
	RotateCcw,
	Ruler,
	Star,
	ThumbsUp,
	Trash2,
	Zap,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import type { LaserParameter } from '@/types/parameters';

interface ParameterGridCardProps {
	parameter: LaserParameter;
	onLike?: () => void;
	onSave?: () => void;
	onRate?: (n: number) => void;
	onViewDetails?: () => void;
	/** Admin: marca de seleção (multi-seleção p/ categoria em lote). */
	selected?: boolean;
	onToggleSelect?: () => void;
	/** Admin: ações de editar/excluir no rodapé (no lugar de like/salvar). */
	onEdit?: () => void;
	onDelete?: () => void;
}

const N_A = 'N/A';

function Cell({
	icon: Icon,
	label,
	value,
}: {
	icon: LucideIcon;
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className="min-w-0">
			<div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-gray-500">
				<Icon className="h-3 w-3 shrink-0 text-violet-500" />
				<span className="truncate">{label}</span>
			</div>
			<p className="truncate text-sm font-bold text-slate-900 dark:text-white">
				{value}
			</p>
		</div>
	);
}

function Tag({ children }: { children: React.ReactNode }) {
	return (
		<span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/5 dark:text-gray-300">
			{children}
		</span>
	);
}

/**
 * Card de parâmetro no estilo do print: imagem GRANDE à esquerda (coluna alta)
 * + grade de receita à direita + rodapé full-width. No modo admin (onEdit/
 * onDelete) o rodapé vira Editar/Excluir e a imagem ganha checkbox de seleção.
 */
export function ParameterGridCard({
	parameter: p,
	onLike,
	onSave,
	onRate,
	onViewDetails,
	selected,
	onToggleSelect,
	onEdit,
	onDelete,
}: ParameterGridCardProps) {
	const admin = !!(onEdit || onDelete);
	return (
		<div
			className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-shadow dark:bg-[#0e0e10] ${
				selected
					? 'border-violet-500 ring-2 ring-violet-500/40'
					: 'border-slate-200 dark:border-white/10'
			}`}
		>
			{/* Corpo: imagem ALTA à esquerda + conteúdo à direita.
			    flex-1 faz o corpo preencher a altura do card → a imagem (self-stretch
			    + object-cover) segue a altura EXATA do card, recortando p/ retângulo
			    mesmo quando a foto enviada é quadrada. */}
			<div className="flex flex-1 gap-4 p-4">
				<div className="relative w-32 shrink-0 self-stretch overflow-hidden rounded-xl bg-slate-100 sm:w-44 min-h-[260px] dark:bg-white/[0.03]">
					{p.imageUrl ? (
						<img
							src={p.imageUrl}
							alt={p.material}
							className="absolute inset-0 h-full w-full object-cover"
							loading="lazy"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center">
							<Box className="h-10 w-10 text-slate-300 dark:text-gray-600" />
						</div>
					)}

					{/* Checkbox de seleção (admin) */}
					{onToggleSelect ? (
						<button
							type="button"
							onClick={onToggleSelect}
							title={selected ? 'Desmarcar' : 'Selecionar'}
							className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${
								selected
									? 'border-violet-500 bg-violet-600 text-white'
									: 'border-white/80 bg-black/30 text-transparent hover:bg-black/50'
							}`}
						>
							<Check className="h-4 w-4" />
						</button>
					) : null}

					{/* Selo multi-passada sobre a imagem */}
					{p.isParent ? (
						<span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
							<Layers className="h-3 w-3" />
							{p.passCount ? `${p.passCount} passadas` : 'Multi'}
						</span>
					) : null}
				</div>

				<div className="flex min-w-0 flex-1 flex-col">
					{/* Título */}
					<h3 className="truncate font-display text-base font-bold text-slate-900 dark:text-white">
						{p.material}
					</h3>

					{/* Rating + selos */}
					<div className="mb-2 mt-1 flex flex-wrap items-center gap-2">
						<span className="inline-flex items-center gap-0.5">
							{[1, 2, 3, 4, 5].map((star) => (
								<button
									key={star}
									type="button"
									onClick={() => onRate?.(star)}
									disabled={!onRate}
									title={onRate ? 'Avaliar' : undefined}
									className="text-amber-400 disabled:cursor-default"
								>
									<Star
										className={`h-3.5 w-3.5 ${
											star <= Math.round(p.userRating ?? p.rating ?? 0)
												? 'fill-amber-400'
												: ''
										}`}
									/>
								</button>
							))}
							<span className="ml-1 text-sm font-bold text-slate-900 dark:text-white">
								{(p.rating ?? 0).toFixed(1)}
							</span>
							<span className="text-xs text-slate-400">
								({p.likesCount ?? 0})
							</span>
						</span>
						{p.isPublic ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
								✓ Validado
							</span>
						) : null}
						{p.category ? (
							<span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
								{p.category}
							</span>
						) : null}
						{p.color ? (
							<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/5 dark:text-gray-300">
								<Palette className="h-3 w-3 text-violet-500" />
								{p.color}
							</span>
						) : null}
					</div>

					{/* Tags: máquina+W / software / lente */}
					<div className="mb-3 flex flex-wrap gap-1.5">
						{p.machine ? (
							<Tag>
								{p.machine}
								{p.powerWatts ? ` ${p.powerWatts}W` : ''}
							</Tag>
						) : null}
						{p.software ? <Tag>{p.software}</Tag> : null}
						{p.lens ? <Tag>{p.lens}</Tag> : null}
					</div>

					{/* Grade de receita 3×3 */}
					<div className="grid min-w-0 grid-cols-3 gap-x-3 gap-y-3">
						<Cell icon={Gauge} label="Velocidade" value={`${p.speed}mm/s`} />
						<Cell icon={Zap} label="Potência" value={`${p.power}%`} />
						<Cell
							icon={Activity}
							label="Frequência"
							value={`${p.frequency}kHz`}
						/>
						<Cell
							icon={Minus}
							label="Linha"
							value={p.line != null ? `${p.line}` : N_A}
						/>
						<Cell
							icon={RotateCcw}
							label="Passadas"
							value={
								p.isParent ? `${p.passCount ?? '+'}` : String(p.passes ?? 1)
							}
						/>
						<Cell icon={Zap} label="Modo" value={p.mode} />
						<Cell
							icon={Focus}
							label="Profundidade"
							value={p.defocus != null ? `${p.defocus}` : N_A}
						/>
						<Cell icon={Zap} label="Power Max" value={`${p.power}%`} />
						<Cell icon={Ruler} label="Power Min" value={N_A} />
					</div>
				</div>
			</div>

			{/* Footer: autor + ações (admin: editar/excluir | cliente: like/salvar) */}
			<div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 dark:border-white/5">
				<div className="flex min-w-0 items-center gap-2">
					<Avatar
						name={p.createdByName ?? 'Anônimo'}
						className="h-8 w-8 text-xs"
					/>
					<div className="min-w-0">
						<p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
							{p.createdByName ?? 'Anônimo'}
						</p>
						<p className="text-[10px] text-slate-400">Contribuidor</p>
					</div>
				</div>

				{admin ? (
					<div className="flex shrink-0 items-center gap-1.5">
						<button
							type="button"
							onClick={onEdit}
							className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-600 dark:border-white/10 dark:text-gray-200 dark:hover:text-violet-400"
						>
							<Pencil className="h-3.5 w-3.5" />
							Editar
						</button>
						<button
							type="button"
							onClick={onDelete}
							title="Excluir"
							className="rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:border-red-300 hover:text-red-600 dark:border-white/10 dark:hover:text-red-400"
						>
							<Trash2 className="h-4 w-4" />
						</button>
					</div>
				) : (
					<div className="flex shrink-0 items-center gap-1">
						<button
							type="button"
							onClick={onLike}
							disabled={!onLike}
							className={`inline-flex items-center gap-1 px-1.5 text-xs font-medium ${
								p.isLiked
									? 'text-violet-500'
									: 'text-slate-500 hover:text-violet-500 dark:text-gray-400'
							}`}
						>
							<ThumbsUp
								className={`h-3.5 w-3.5 ${p.isLiked ? 'fill-violet-500' : ''}`}
							/>
							{p.likesCount ?? 0}
						</button>
						<button
							type="button"
							onClick={onSave}
							disabled={!onSave}
							title="Salvar"
							className={`p-1.5 ${
								p.isSaved
									? 'text-violet-500'
									: 'text-slate-400 hover:text-violet-500'
							}`}
						>
							<Bookmark
								className={`h-4 w-4 ${p.isSaved ? 'fill-violet-500' : ''}`}
							/>
						</button>
						<button
							type="button"
							onClick={onViewDetails}
							className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
						>
							Ver detalhes
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
