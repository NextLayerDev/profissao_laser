'use client';

import { Check, Sparkles } from 'lucide-react';
import { type CSSProperties, useState } from 'react';
import type { PreviaOptionItem } from '@/types/previas';

/** Swatch CSS de fallback por fundo, caso a miniatura (.webp) não carregue. */
const SWATCH: Record<string, CSSProperties> = {
	'branco-puro': { background: '#ffffff' },
	'cinza-gradiente': { background: 'linear-gradient(135deg,#e2e8f0,#64748b)' },
	'preto-fosco': { background: '#171717' },
	madeira: { background: 'linear-gradient(135deg,#b45309,#78350f)' },
	marmore: { background: 'linear-gradient(135deg,#f1f5f9,#cbd5e1)' },
	'tecido-linho': { background: 'linear-gradient(135deg,#e7e5e4,#a8a29e)' },
	'ambiente-decorado': {
		background: 'linear-gradient(135deg,#fed7aa,#fbcfe8,#ddd6fe)',
	},
	'mesa-ambiente': {
		background:
			'linear-gradient(180deg,#e6ecd6 0%,#dfe6cf 58%,#8a5a2b 58%,#7c4f24 100%)',
	},
	transparente: {
		backgroundColor: '#ffffff',
		backgroundImage:
			'linear-gradient(45deg,#cbd5e1 25%,transparent 25%,transparent 75%,#cbd5e1 75%),linear-gradient(45deg,#cbd5e1 25%,transparent 25%,transparent 75%,#cbd5e1 75%)',
		backgroundSize: '16px 16px',
		backgroundPosition: '0 0,8px 8px',
	},
};

function BgThumb({
	item,
	selected,
	onSelect,
}: {
	item: PreviaOptionItem;
	selected: boolean;
	onSelect: () => void;
}) {
	const [imgOk, setImgOk] = useState(true);
	return (
		<button
			type="button"
			onClick={onSelect}
			title={item.label}
			aria-pressed={selected}
			className={`group relative rounded-lg overflow-hidden border text-left transition-all ${
				selected
					? 'border-violet-500 ring-2 ring-violet-500/40 shadow-md'
					: 'border-slate-200 dark:border-white/10 hover:border-violet-500/50'
			}`}
		>
			<div className="relative aspect-[16/10] w-full">
				{imgOk ? (
					<img
						src={`/previa/fundos/${item.value}.webp`}
						alt={item.label}
						className="w-full h-full object-cover"
						onError={() => setImgOk(false)}
					/>
				) : (
					<div
						className="w-full h-full"
						style={SWATCH[item.value] ?? { background: '#e2e8f0' }}
					/>
				)}
				{selected && (
					<div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center shadow">
						<Check className="w-2.5 h-2.5 text-white" />
					</div>
				)}
			</div>
			<span className="block px-1.5 py-1 text-[10px] font-medium text-slate-700 dark:text-slate-200 truncate">
				{item.label}
			</span>
		</button>
	);
}

/**
 * Seletor visual de fundo da cena para a Prévia. Mostra miniaturas reais de
 * cada fundo + uma linha de "Sugeridos" (3) baseada no produto escolhido.
 * Continua escrevendo no mesmo campo `fundoCena` — sem mudança no motor.
 */
export function PreviaBackgroundPicker({
	value,
	options,
	suggested,
	onChange,
}: {
	value: string;
	options: PreviaOptionItem[];
	suggested: string[];
	onChange: (value: string) => void;
}) {
	const [showAll, setShowAll] = useState(false);
	const suggestedItems = suggested
		.map((s) => options.find((o) => o.value === s))
		.filter((o): o is PreviaOptionItem => Boolean(o))
		.slice(0, 3);

	// Sem sugestões (produto não escolhido) → mostra todos direto.
	const expanded = showAll || suggestedItems.length === 0;
	const restCount = Math.max(options.length - suggestedItems.length, 0);

	return (
		<div className="space-y-1.5 max-w-md">
			{suggestedItems.length > 0 && (
				<div>
					<p className="text-xs font-medium text-violet-600 dark:text-violet-300 mb-1 flex items-center gap-1">
						<Sparkles className="w-3.5 h-3.5" /> Sugeridos para este produto
					</p>
					<div className="grid grid-cols-3 gap-1.5">
						{suggestedItems.map((o) => (
							<BgThumb
								key={`sug-${o.value}`}
								item={o}
								selected={value === o.value}
								onSelect={() => onChange(o.value)}
							/>
						))}
					</div>
				</div>
			)}

			{expanded && (
				<div>
					{suggestedItems.length > 0 && (
						<p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">
							Todos os fundos
						</p>
					)}
					<div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
						{options.map((o) => (
							<BgThumb
								key={o.value}
								item={o}
								selected={value === o.value}
								onSelect={() => onChange(o.value)}
							/>
						))}
					</div>
				</div>
			)}

			{suggestedItems.length > 0 && restCount > 0 && (
				<button
					type="button"
					onClick={() => setShowAll((v) => !v)}
					className="text-xs font-medium text-violet-600 dark:text-violet-300 hover:underline"
				>
					{showAll ? 'Ver menos' : `Ver todos os fundos (${restCount})`}
				</button>
			)}
		</div>
	);
}
