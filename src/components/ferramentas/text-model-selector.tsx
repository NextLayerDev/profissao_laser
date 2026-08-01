'use client';

import { Braces, Eye, Gauge, Timer, Wrench, Zap, ZapOff } from 'lucide-react';
import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import { Field, SelectInput } from '@/components/ferramentas/builder-ui';
import { useTextModelCatalog } from '@/modules/tools/hooks/use-text-model-catalog';
import type { TextModelEntry } from '@/modules/tools/services/text-models.service';

/**
 * Seletor do modelo de TEXTO usado pelos nós `ai.text` desta tool — o espelho,
 * para texto, do `ImageModelSelector`.
 *
 * Além do que o de imagem mostra, aqui aparecem três coisas que só importam em
 * texto: se o modelo suporta FERRAMENTAS (sem isso ele não roda como agente),
 * se suporta JSON estruturado, e o PREÇO por milhão de tokens — que é a
 * diferença entre um agente viável e um que queima a chave.
 *
 * `value = null/undefined` → "Padrão do sistema" (o `default` do catálogo).
 */

const FILTERS: { id: string; label: string }[] = [
	{ id: 'all', label: 'Todos' },
	{ id: 'raciocinio', label: 'Raciocínio' },
	{ id: 'cad', label: 'CAD' },
	{ id: 'extracao', label: 'Extração' },
	{ id: 'redacao', label: 'Redação' },
	{ id: 'juiz', label: 'Juiz' },
	{ id: 'visao', label: 'Visão' },
	{ id: 'barato', label: 'Barato' },
];

const SPEED_META: Record<
	string,
	{ label: string; Icon: ComponentType<{ className?: string }>; cls: string }
> = {
	instant: {
		label: 'Instantâneo',
		Icon: Zap,
		cls: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
	},
	fast: {
		label: 'Rápido',
		Icon: Zap,
		cls: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
	},
	medium: {
		label: 'Médio',
		Icon: Gauge,
		cls: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
	},
	slow: {
		label: 'Lento',
		Icon: Timer,
		cls: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
	},
};

const QUALITY_STARS: Record<string, string> = {
	standard: '★',
	high: '★★',
	top: '★★★',
};

const chip =
	'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium';

function usd(v: number): string {
	// Preço por milhão de tokens. Duas casas basta e cabe no chip.
	return `US$ ${v.toFixed(2)}`;
}

export function TextModelSelector({
	value,
	onChange,
	disabled,
	label = 'Modelo de texto (ai.text)',
}: {
	value?: string | null;
	onChange: (modelId: string | null) => void;
	disabled?: boolean;
	label?: string;
}) {
	const { data, isLoading } = useTextModelCatalog();
	const [filter, setFilter] = useState('all');

	const models: TextModelEntry[] = data ?? [];
	const visible = useMemo(
		() =>
			filter === 'all'
				? models
				: models.filter((m) => m.bestFor.includes(filter)),
		[models, filter],
	);

	const selected = models.find((m) => m.id === value) ?? null;
	const fallback = models.find((m) => m.default) ?? null;
	// Quando não há override, o que roda é o padrão do catálogo — mostrar os
	// detalhes DELE evita o admin achar que "sem escolha" significa "sem modelo".
	const shown = selected ?? fallback;

	return (
		<Field label={label}>
			<div className="space-y-2">
				<div className="flex flex-wrap gap-1">
					{FILTERS.map((f) => (
						<button
							key={f.id}
							type="button"
							onClick={() => setFilter(f.id)}
							className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
								filter === f.id
									? 'bg-emerald-400/20 text-emerald-200'
									: 'text-slate-400 hover:text-slate-200'
							}`}
						>
							{f.label}
						</button>
					))}
				</div>

				<SelectInput
					value={value ?? ''}
					muted={!value}
					onChange={(v) =>
						disabled || isLoading ? undefined : onChange(v || null)
					}
				>
					<option value="">
						{fallback
							? `Padrão do sistema (${fallback.label})`
							: 'Padrão do sistema'}
					</option>
					{visible.map((m) => (
						<option key={m.id} value={m.id}>
							{m.label}
						</option>
					))}
					{/* Modelo já escolhido mas fora do filtro atual continua na lista —
					    senão trocar de filtro "apagaria" a seleção aos olhos do admin. */}
					{selected && !visible.some((m) => m.id === selected.id) ? (
						<option value={selected.id}>{selected.label}</option>
					) : null}
				</SelectInput>

				{shown ? (
					<div className="space-y-1.5">
						<div className="flex flex-wrap gap-1">
							{(() => {
								const meta = SPEED_META[shown.speed] ?? SPEED_META.medium;
								return (
									<span className={`${chip} ${meta.cls}`}>
										<meta.Icon className="h-3 w-3" />
										{meta.label}
									</span>
								);
							})()}
							<span
								className={`${chip} border-white/10 bg-white/5 text-slate-300`}
							>
								{QUALITY_STARS[shown.quality] ?? '★'}
							</span>
							<span
								className={`${chip} border-white/10 bg-white/5 text-slate-300`}
							>
								{shown.contextK >= 1000
									? `${Math.round(shown.contextK / 1000)}M ctx`
									: `${shown.contextK}k ctx`}
							</span>
							<span
								className={`${chip} ${
									shown.toolUse
										? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
										: 'border-rose-400/30 bg-rose-400/10 text-rose-200'
								}`}
							>
								{shown.toolUse ? (
									<Wrench className="h-3 w-3" />
								) : (
									<ZapOff className="h-3 w-3" />
								)}
								{shown.toolUse ? 'ferramentas' : 'sem ferramentas'}
							</span>
							{shown.json ? (
								<span
									className={`${chip} border-white/10 bg-white/5 text-slate-300`}
								>
									<Braces className="h-3 w-3" /> JSON
								</span>
							) : null}
							{shown.vision ? (
								<span
									className={`${chip} border-white/10 bg-white/5 text-slate-300`}
								>
									<Eye className="h-3 w-3" /> visão
								</span>
							) : null}
							<span
								className={`${chip} border-white/10 bg-white/5 font-mono text-slate-300`}
							>
								{usd(shown.pricing.in)} → {usd(shown.pricing.out)} /1M
							</span>
						</div>

						<p className="text-[11px] leading-snug text-slate-400">
							{shown.notes}
						</p>

						{/* Escolher um modelo sem tool-calling para uma tool que vai virar
						    agente é o erro caro: só quebra em runtime. Avisar aqui é o
						    único momento em que dá para evitar. */}
						{!shown.toolUse ? (
							<p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1.5 text-[11px] leading-snug text-amber-200">
								Este modelo não suporta ferramentas. Serve para gerar texto, mas
								não pode ser usado por um agente que precise consultar dados.
							</p>
						) : null}
					</div>
				) : null}
			</div>
		</Field>
	);
}
