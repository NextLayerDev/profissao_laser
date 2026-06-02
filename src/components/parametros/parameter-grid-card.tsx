'use client';

import {
	Activity,
	Bookmark,
	Box,
	Focus,
	Gauge,
	Layers,
	type LucideIcon,
	Minus,
	RotateCcw,
	Ruler,
	Star,
	ThumbsUp,
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
 * Card de parâmetro no estilo do print: imagem AO LADO da grade de receita,
 * com rating + validação + tags + autor + "X aprovaram" + Ver detalhes.
 */
export function ParameterGridCard({
	parameter: p,
	onLike,
	onSave,
	onRate,
	onViewDetails,
}: ParameterGridCardProps) {
	return (
		<div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#0e0e10]">
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
					<span className="text-xs text-slate-400">({p.likesCount ?? 0})</span>
				</span>
				{p.isPublic ? (
					<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
						✓ Validado
					</span>
				) : null}
				{p.isParent ? (
					<span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
						<Layers className="h-3 w-3" />
						{p.passCount ? `${p.passCount} passadas` : 'Multi-passada'}
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

			{/* Imagem AO LADO + grade de receita */}
			<div className="mb-3 flex gap-3">
				<div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-white/[0.03]">
					{p.imageUrl ? (
						<img
							src={p.imageUrl}
							alt={p.material}
							className="h-full w-full object-cover"
							loading="lazy"
						/>
					) : (
						<Box className="h-8 w-8 text-slate-300 dark:text-gray-600" />
					)}
				</div>
				<div className="grid min-w-0 flex-1 grid-cols-3 gap-x-3 gap-y-2">
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
						value={p.isParent ? `${p.passCount ?? '+'}` : String(p.passes ?? 1)}
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

			{/* Footer: autor + aprovaram + salvar + ver detalhes */}
			<div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
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
			</div>
		</div>
	);
}
