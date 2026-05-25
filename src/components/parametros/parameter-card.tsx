'use client';

import {
	Activity,
	Bookmark,
	Box,
	Circle,
	Cpu,
	Flame,
	Focus,
	Gauge,
	Grid3x3,
	type LucideIcon,
	Minus,
	MonitorSmartphone,
	Repeat,
	RotateCcw,
	Ruler,
	Square,
	Star,
	ThumbsUp,
	Triangle,
	Zap,
} from 'lucide-react';
import { useLaserLineTypes } from '@/hooks/use-laser-line-types';
import type { LaserParameter } from '@/types/parameters';

export type ParameterCardVariant = 'community' | 'simple' | 'lookup';

interface ParameterCardProps {
	parameter: LaserParameter;
	variant?: ParameterCardVariant;
	className?: string;
	// Footer actions (variant='community')
	onLike?: () => void;
	onSave?: () => void;
	onRate?: (n: number) => void;
}

const MATERIAL_ICONS: Record<string, LucideIcon> = {
	madeira: Flame,
	acrilico: Square,
	metal: Circle,
	couro: Triangle,
	tecido: Box,
};

function materialIcon(material: string): LucideIcon {
	const key = (material ?? '').toLowerCase().split(' ')[0];
	return MATERIAL_ICONS[key] ?? Flame;
}

interface MiniCardProps {
	icon: LucideIcon;
	label: string;
	value: React.ReactNode;
	className?: string;
}

function MiniCard({ icon: Icon, label, value, className = '' }: MiniCardProps) {
	return (
		<div
			className={`flex items-center gap-3 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] px-4 py-3 ${className}`}
		>
			<Icon className="w-5 h-5 text-violet-500 shrink-0" />
			<div className="min-w-0">
				<p className="text-xs text-slate-500 dark:text-gray-400 leading-tight">
					{label}
				</p>
				<p className="text-sm font-bold text-slate-900 dark:text-white truncate">
					{value}
				</p>
			</div>
		</div>
	);
}

export function ParameterCard({
	parameter: p,
	variant = 'simple',
	className = '',
	onLike,
	onSave,
	onRate,
}: ParameterCardProps) {
	const Icon = materialIcon(p.material);

	// Resolve nome do tipo de linha pelo lineTypeId (se houver)
	const { data: lineTypes = [] } = useLaserLineTypes(
		(p.software as 'Ezcad' | 'Lightburn' | 'LaserGRBL') ?? undefined,
	);
	const lineType = p.lineTypeId
		? lineTypes.find((lt) => lt.id === p.lineTypeId)
		: null;

	const isEzcad = p.software === 'Ezcad';
	const isLightburn = p.software === 'Lightburn';

	return (
		<div
			className={`rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e0e10] p-5 ${className}`}
		>
			{/* Header — icon + nome + badge tipo de trabalho */}
			<div className="flex items-start justify-between gap-3 mb-4">
				<div className="flex items-center gap-3 min-w-0">
					<div className="w-12 h-12 shrink-0 rounded-xl bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
						<Icon className="w-6 h-6 text-violet-500" />
					</div>
					<div className="min-w-0">
						<h3 className="font-display text-lg font-bold text-slate-900 dark:text-white truncate">
							{p.material}
						</h3>
						{p.thickness && (
							<p className="text-xs text-slate-500 dark:text-gray-400">
								{p.thickness}
							</p>
						)}
					</div>
				</div>
				<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-semibold whitespace-nowrap">
					<Zap className="w-3 h-3" />
					{p.mode}
				</span>
			</div>

			{/* Linha 1 — Máquina | Software | Lente */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
				<MiniCard icon={Cpu} label="Máquina" value={p.machine ?? '—'} />
				<MiniCard
					icon={MonitorSmartphone}
					label="Software"
					value={p.software ?? '—'}
				/>
				<MiniCard icon={Focus} label="Lente" value={p.lens ?? '—'} />
			</div>

			{/* Linha 2 — Velocidade | Linha */}
			<div className="grid grid-cols-2 gap-2 mb-3">
				<MiniCard icon={Gauge} label="Velocidade" value={`${p.speed}mm/s`} />
				<MiniCard
					icon={Minus}
					label="Linha"
					value={p.line != null ? `${p.line}` : '—'}
				/>
			</div>

			{/* Linha 3 — Potência | Ângulo */}
			<div className="grid grid-cols-2 gap-2 mb-3">
				<MiniCard icon={Zap} label="Potência" value={`${p.power}%`} />
				<MiniCard
					icon={Triangle}
					label="Ângulo"
					value={p.angle != null ? `${p.angle}°` : '—'}
				/>
			</div>

			{/* Linha 4 — Frequência | Passadas */}
			<div className="grid grid-cols-2 gap-2 mb-3">
				<MiniCard
					icon={Activity}
					label="Frequência"
					value={`${p.frequency}kHz`}
				/>
				<MiniCard
					icon={RotateCcw}
					label="Passadas"
					value={String(p.passes).padStart(2, '0')}
				/>
			</div>

			{/* Linha 5 — Cross Hatch | Eixo rotativo */}
			<div className="grid grid-cols-2 gap-2 mb-3">
				<MiniCard
					icon={Grid3x3}
					label="Cross Hatch"
					value={p.crossHatch ? 'Sim' : 'Não'}
				/>
				<MiniCard
					icon={Repeat}
					label="Eixo rotativo"
					value={p.axisRotative ? 'Sim' : 'Não'}
				/>
			</div>

			{/* Tipo de Linha — card dedicado com imagem grande (visível) */}
			<div className="rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] px-4 py-3 mb-3">
				<div className="flex items-center gap-2 mb-2">
					<Square className="w-5 h-5 text-violet-500 shrink-0" />
					<span className="text-xs text-slate-500 dark:text-gray-400">
						Tipo de Linha
					</span>
				</div>
				{lineType ? (
					<div className="flex items-center gap-4">
						{lineType.imageUrl && (
							<img
								src={lineType.imageUrl}
								alt={lineType.name}
								className="h-24 w-auto max-w-[220px] rounded-lg border border-slate-200 dark:border-white/10 bg-white object-contain"
							/>
						)}
						<span className="text-sm font-bold text-slate-900 dark:text-white">
							{lineType.name}
						</span>
					</div>
				) : (
					<span className="text-sm font-bold text-slate-900 dark:text-white">
						—
					</span>
				)}
			</div>

			{/* Linha 6 — campos software-specific */}
			{isEzcad && (p.tamanhoDivisao != null || p.sobreposicao != null) && (
				<div className="grid grid-cols-2 gap-2 mb-3">
					{p.tamanhoDivisao != null && (
						<MiniCard
							icon={Ruler}
							label="Tamanho da Divisão"
							value={`${p.tamanhoDivisao}mm`}
						/>
					)}
					{p.sobreposicao != null && (
						<MiniCard
							icon={Ruler}
							label="Sobreposição"
							value={`${p.sobreposicao}mm`}
						/>
					)}
				</div>
			)}
			{isLightburn && (p.tamanhoLinha != null || p.forcarSeparacao != null) && (
				<div className="grid grid-cols-2 gap-2 mb-3">
					{p.tamanhoLinha != null && (
						<MiniCard
							icon={Ruler}
							label="Tamanho da Linha"
							value={`${p.tamanhoLinha}mm`}
						/>
					)}
					{p.forcarSeparacao != null && (
						<MiniCard
							icon={Square}
							label="Forçar Separação"
							value={p.forcarSeparacao ? 'Sim' : 'Não'}
						/>
					)}
				</div>
			)}

			{/* Notas */}
			{p.notes && (
				<div className="rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-3 mb-3">
					<p className="text-xs font-semibold text-violet-500 mb-1">Notas</p>
					<p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
						{p.notes}
					</p>
				</div>
			)}

			{/* Footer — community variant */}
			{variant === 'community' && (
				<div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-white/5">
					<div className="flex items-center gap-1">
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								key={star}
								type="button"
								onClick={() => onRate?.(star)}
								disabled={!onRate}
								className="text-violet-500 disabled:cursor-default"
							>
								<Star
									className={`w-4 h-4 ${
										star <= (p.userRating ?? p.rating ?? 0)
											? 'fill-violet-500'
											: ''
									}`}
								/>
							</button>
						))}
						<span className="ml-1 text-xs text-slate-500 dark:text-gray-400">
							{(p.rating ?? 0).toFixed(1)}
						</span>
					</div>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={onLike}
							disabled={!onLike}
							className={`inline-flex items-center gap-1 text-sm ${
								p.isLiked
									? 'text-violet-500'
									: 'text-slate-500 dark:text-gray-400 hover:text-violet-500'
							}`}
						>
							<ThumbsUp
								className={`w-4 h-4 ${p.isLiked ? 'fill-violet-500' : ''}`}
							/>
							<span>{p.likesCount ?? 0}</span>
						</button>
						<button
							type="button"
							onClick={onSave}
							disabled={!onSave}
							className={`inline-flex items-center gap-1 text-sm ${
								p.isSaved
									? 'text-violet-500'
									: 'text-slate-500 dark:text-gray-400 hover:text-violet-500'
							}`}
						>
							<Bookmark
								className={`w-4 h-4 ${p.isSaved ? 'fill-violet-500' : ''}`}
							/>
							<span>Salvar</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
