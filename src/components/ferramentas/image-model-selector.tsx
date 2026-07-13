'use client';

import { AlertTriangle, Gauge, Sparkles, Star, Timer, Zap } from 'lucide-react';
import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import { Field, SelectInput } from '@/components/ferramentas/builder-ui';
import { useImageModelCatalog } from '@/modules/tools/hooks/use-image-model-catalog';
import type {
	ImageModelEntry,
	ImageModelQuality,
	ImageModelSpeed,
} from '@/modules/tools/services/image-models.service';

/**
 * Seletor do modelo de imagem (OpenRouter) usado por `ai.generate_image` desta
 * tool. Dropdown estilizado com filtro por "bestFor", indicadores de VELOCIDADE
 * e QUALIDADE por modelo (com ícone) e subtítulo dinâmico com `notes`. Modelos
 * lentos recebem um aviso destacado — importante pra tool de cliente.
 * Reusa o `SelectInput` da `builder-ui.tsx`.
 *
 * Props:
 *  - `value`: model id atual (string). `null`/`undefined` = "Padrão do sistema".
 *  - `onChange(modelId)`: callback; passar `null` apaga o override.
 */

const FILTERS: { id: 'all' | string; label: string }[] = [
	{ id: 'all', label: 'Todos' },
	{ id: 'laser', label: 'Laser' },
	{ id: 'poster', label: 'Poster' },
	{ id: 'text', label: 'Texto' },
	{ id: 'photoreal', label: 'Fotorreal' },
	{ id: 'typography', label: 'Tipografia' },
	{ id: 'identity', label: 'Identidade' },
	{ id: 'vector', label: 'Vetor' },
];

const SPEED_META: Record<
	ImageModelSpeed,
	{
		label: string;
		emoji: string;
		Icon: ComponentType<{ className?: string }>;
		cls: string;
	}
> = {
	fast: {
		label: 'Rápido',
		emoji: '⚡',
		Icon: Zap,
		cls: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
	},
	medium: {
		label: 'Médio',
		emoji: '🕒',
		Icon: Gauge,
		cls: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
	},
	slow: {
		label: 'Lento (~1min+)',
		emoji: '🐢',
		Icon: Timer,
		cls: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
	},
};

const QUALITY_META: Record<
	ImageModelQuality,
	{ label: string; stars: string }
> = {
	standard: { label: 'Qualidade padrão', stars: '★' },
	high: { label: 'Qualidade alta', stars: '★★' },
	top: { label: 'Qualidade máxima', stars: '★★★' },
};

/** Sufixo compacto no rótulo da opção (native <option> é só texto → emoji). */
function optionLabel(m: ImageModelEntry): string {
	const s = m.speed ? SPEED_META[m.speed].emoji : '';
	const q = m.quality ? QUALITY_META[m.quality].stars : '';
	const tag = [s, q].filter(Boolean).join(' ');
	return tag ? `${m.label}  ·  ${tag}` : m.label;
}

function Chip({
	Icon,
	text,
	cls,
}: {
	Icon: ComponentType<{ className?: string }>;
	text: string;
	cls: string;
}) {
	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}
		>
			<Icon className="h-3 w-3" />
			{text}
		</span>
	);
}

export interface ImageModelSelectorProps {
	value: string | null | undefined;
	onChange: (modelId: string | null) => void;
	disabled?: boolean;
}

export function ImageModelSelector({
	value,
	onChange,
	disabled,
}: ImageModelSelectorProps) {
	const { data: catalog, isLoading } = useImageModelCatalog();
	const [filter, setFilter] = useState<string>('all');

	const filtered = useMemo<ImageModelEntry[]>(() => {
		if (!catalog) return [];
		if (filter === 'all') return [...catalog];
		return catalog.filter((m) => m.bestFor.includes(filter));
	}, [catalog, filter]);

	const selected = useMemo(
		() => catalog?.find((m) => m.id === value) ?? null,
		[catalog, value],
	);

	return (
		<Field
			label="Modelo de imagem"
			hint="Qual IA gera a imagem desta tool. Catálogo curado; o default do sistema é Gemini 3 Pro. ⚡/🕒/🐢 = velocidade · ★ = qualidade."
		>
			<div className="space-y-3">
				<SelectInput
					value={value ?? ''}
					onChange={(v) => onChange(v === '' ? null : v)}
					muted={!value}
					className={disabled ? 'cursor-not-allowed opacity-50' : ''}
				>
					<option value="">Padrão do sistema (Gemini 3 Pro)</option>
					{isLoading && <option disabled>Carregando catálogo…</option>}
					{filtered.map((m) => (
						<option key={m.id} value={m.id}>
							{optionLabel(m)}
						</option>
					))}
				</SelectInput>

				{/* Filtro por "bestFor" (chips) */}
				<div className="flex flex-wrap gap-1.5">
					{FILTERS.map((f) => {
						const on = f.id === filter;
						return (
							<button
								key={f.id}
								type="button"
								onClick={() => setFilter(f.id)}
								className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30 ${
									on
										? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
										: 'border-white/10 bg-black/30 text-slate-400 hover:text-slate-200'
								}`}
							>
								{f.label}
							</button>
						);
					})}
				</div>

				{/* Velocidade + qualidade do modelo selecionado (com ícone) */}
				{selected && (selected.speed || selected.quality) && (
					<div className="flex flex-wrap items-center gap-2">
						{selected.speed && (
							<Chip
								Icon={SPEED_META[selected.speed].Icon}
								text={SPEED_META[selected.speed].label}
								cls={SPEED_META[selected.speed].cls}
							/>
						)}
						{selected.quality && (
							<Chip
								Icon={Star}
								text={`${QUALITY_META[selected.quality].stars} ${QUALITY_META[selected.quality].label}`}
								cls="border-sky-400/30 bg-sky-400/10 text-sky-200"
							/>
						)}
					</div>
				)}

				{/* Aviso destacado pra modelo lento (ruim pra tool de cliente) */}
				{selected?.speed === 'slow' && (
					<div className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/[0.06] p-2.5 text-[12px] leading-relaxed text-rose-200">
						<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
						<span>
							Modelo <strong>lento</strong> (~1 min ou mais por imagem). Para
							uma tool que o cliente usa, prefira um modelo{' '}
							<strong>Rápido</strong> (⚡).
						</span>
					</div>
				)}

				{/* Subtítulo dinâmico */}
				{selected ? (
					<div className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-3 text-[12px] leading-relaxed text-slate-300">
						<Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
						<div>
							<div className="mb-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300/80">
								{selected.id} · {selected.bestFor.join(' · ')}
							</div>
							{selected.notes}
						</div>
					</div>
				) : (
					<p className="text-[12px] text-slate-500">
						Sem override. O motor usa o default do sistema.
					</p>
				)}
			</div>
		</Field>
	);
}
