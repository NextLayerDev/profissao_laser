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
	Layers,
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
	Waves,
	X,
	Zap,
	ZoomIn,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLaserLineTypes } from '@/hooks/use-laser-line-types';
import type { LaserParameter } from '@/types/parameters';
import {
	applicableFields,
	formatMachineLabel,
} from '@/utils/constants/parameter-field-rules';

export type ParameterCardVariant = 'community' | 'simple' | 'lookup';

interface ParameterCardProps {
	parameter: LaserParameter;
	variant?: ParameterCardVariant;
	className?: string;
	// Footer actions (variant='community')
	onLike?: () => void;
	onSave?: () => void;
	onRate?: (n: number) => void;
	onViewDetails?: () => void;
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
	onViewDetails,
}: ParameterCardProps) {
	const Icon = materialIcon(p.material);
	// Aplicabilidade por máquina/modo (A4): campos não-aplicáveis viram "—".
	const ap = applicableFields(p.machine, p.mode);
	const [zoomed, setZoomed] = useState(false);
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);

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
			{/* Imagem do parâmetro (redesign) */}
			{p.imageUrl ? (
				<div className="-mx-5 -mt-5 mb-4 overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-white/[0.03]">
					<img
						src={p.imageUrl}
						alt={p.material}
						className="w-full max-h-52 object-cover"
						loading="lazy"
					/>
				</div>
			) : null}

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
				<div className="flex shrink-0 flex-col items-end gap-1.5">
					<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-semibold whitespace-nowrap">
						<Zap className="w-3 h-3" />
						{p.mode}
					</span>
					{p.isParent ? (
						<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-semibold whitespace-nowrap">
							<Layers className="w-3 h-3" />
							{p.passCount ? `${p.passCount} passadas` : 'Multi-passada'}
						</span>
					) : null}
				</div>
			</div>

			{/* Linha 1 — Máquina | Software | Lente */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
				<MiniCard
					icon={Cpu}
					label="Máquina"
					value={formatMachineLabel(p.machine, p.powerWatts) || '—'}
				/>
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
					value={ap.angle && p.angle != null ? `${p.angle}°` : '—'}
				/>
			</div>

			{/* Linha 4 — Frequência | Passadas */}
			<div className="grid grid-cols-2 gap-2 mb-3">
				<MiniCard
					icon={Activity}
					label="Frequência"
					value={ap.frequency ? `${p.frequency}kHz` : '—'}
				/>
				<MiniCard
					icon={RotateCcw}
					label="Passadas"
					value={String(p.passes).padStart(2, '0')}
				/>
			</div>

			{/* Q-pulse — só máquina UV (quando informado) */}
			{ap.qPulse && p.qPulse != null ? (
				<div className="grid grid-cols-2 gap-2 mb-3">
					<MiniCard icon={Waves} label="Q-pulse" value={`${p.qPulse}`} />
				</div>
			) : null}

			{/* Linha 5 — Cross Hatch | Eixo rotativo */}
			<div className="grid grid-cols-2 gap-2 mb-3">
				<MiniCard
					icon={Grid3x3}
					label="Cross Hatch"
					value={ap.crossHatch ? (p.crossHatch ? 'Sim' : 'Não') : '—'}
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
							<button
								type="button"
								onClick={() => setZoomed(true)}
								title="Clique para ampliar"
								className="group relative h-24 w-auto max-w-[220px] rounded-lg border border-slate-200 dark:border-white/10 bg-white overflow-hidden cursor-zoom-in"
							>
								<img
									src={lineType.imageUrl}
									alt={lineType.name}
									className="h-24 w-auto max-w-[220px] object-contain"
								/>
								<span className="absolute bottom-1 right-1 w-6 h-6 rounded-md bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
									<ZoomIn className="w-3.5 h-3.5" />
								</span>
							</button>
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
			{isLightburn && (p.tamanhoDivisao != null || p.sobreposicao != null) && (
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
			{isEzcad && (p.tamanhoLinha != null || p.forcarSeparacao != null) && (
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

			{/* Ver detalhes / passadas (redesign) */}
			{variant === 'community' && onViewDetails ? (
				<button
					type="button"
					onClick={onViewDetails}
					className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
				>
					{p.isParent ? 'Ver passadas' : 'Ver detalhes'}
				</button>
			) : null}

			{/* Lightbox do Tipo de Linha — clicar amplia. Via portal no body pra
			    centralizar no viewport (o course shell transforma o <main>). */}
			{mounted &&
				zoomed &&
				lineType?.imageUrl &&
				createPortal(
					<button
						type="button"
						onClick={() => setZoomed(false)}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6 cursor-zoom-out"
					>
						<div className="relative max-w-2xl w-full">
							<img
								src={lineType.imageUrl}
								alt={lineType.name}
								className="w-full max-h-[80vh] object-contain rounded-xl border border-white/10 bg-white"
							/>
							<div className="mt-3 flex items-center justify-center gap-2 text-white">
								<Square className="w-4 h-4 text-violet-400" />
								<span className="text-sm font-semibold">{lineType.name}</span>
							</div>
							<span className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/55 text-white flex items-center justify-center">
								<X className="w-4 h-4" />
							</span>
						</div>
					</button>,
					document.body,
				)}
		</div>
	);
}
