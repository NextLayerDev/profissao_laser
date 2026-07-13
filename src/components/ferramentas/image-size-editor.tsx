'use client';

import { Ruler, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Field } from '@/components/ferramentas/builder-ui';

/**
 * Editor das DIMENSÕES EXATAS de saída (px) do `ai.generate_image` — arte de
 * gravação a laser (ex.: wrap 360°) precisa sair no tamanho exato. O motor
 * injeta a proporção no prompt E redimensiona a imagem final pra W×H.
 *
 * Props:
 *  - `value`: `{ width?, height? }` atual da definition.
 *  - `onChange`: `{ width, height }` pra salvar, ou `null` pra apagar.
 */

const PRESETS: { label: string; w: number; h: number }[] = [
	{ label: 'Wrap 360° · 2:1', w: 2000, h: 1000 },
	{ label: 'Ultra-wide · 3:1', w: 2400, h: 800 },
	{ label: 'Quadrado · 1:1', w: 1024, h: 1024 },
	{ label: 'Paisagem · 16:9', w: 1920, h: 1080 },
	{ label: 'Retrato · 4:5', w: 1080, h: 1350 },
	{ label: 'Story · 9:16', w: 1080, h: 1920 },
];

function gcd(a: number, b: number): number {
	return b === 0 ? a : gcd(b, a % b);
}

const inputCls =
	'w-24 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/30';

export interface ImageSizeEditorProps {
	value: { width?: number; height?: number };
	onChange: (size: { width: number; height: number } | null) => void;
	disabled?: boolean;
}

export function ImageSizeEditor({
	value,
	onChange,
	disabled,
}: ImageSizeEditorProps) {
	const [w, setW] = useState<string>(value.width ? String(value.width) : '');
	const [h, setH] = useState<string>(value.height ? String(value.height) : '');

	useEffect(() => {
		setW(value.width ? String(value.width) : '');
		setH(value.height ? String(value.height) : '');
	}, [value.width, value.height]);

	const nw = Number(w);
	const nh = Number(h);
	const valid =
		Number.isFinite(nw) &&
		Number.isFinite(nh) &&
		nw >= 64 &&
		nw <= 4096 &&
		nh >= 64 &&
		nh <= 4096;
	const dirty =
		String(value.width ?? '') !== w.trim() ||
		String(value.height ?? '') !== h.trim();
	const both = w.trim() !== '' && h.trim() !== '';
	const g = valid ? gcd(nw, nh) || 1 : 1;
	const ratio = valid ? `${nw / g}:${nh / g}` : null;
	const active = !!(value.width && value.height);

	return (
		<Field
			label="Dimensões de saída (px)"
			hint="Arte pra gravação a laser precisa do tamanho exato. Vazio = saída nativa do modelo (geralmente quadrada)."
		>
			<div className="space-y-3">
				<div className="flex flex-wrap gap-1.5">
					{PRESETS.map((p) => {
						const on = value.width === p.w && value.height === p.h;
						return (
							<button
								key={p.label}
								type="button"
								disabled={disabled}
								onClick={() => {
									setW(String(p.w));
									setH(String(p.h));
								}}
								className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-40 ${
									on
										? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
										: 'border-white/10 bg-black/30 text-slate-400 hover:text-slate-200'
								}`}
							>
								{p.label}
							</button>
						);
					})}
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Ruler className="h-4 w-4 text-slate-500" />
					<input
						type="number"
						min={64}
						max={4096}
						value={w}
						disabled={disabled}
						onChange={(e) => setW(e.target.value)}
						placeholder="largura"
						className={inputCls}
					/>
					<span className="text-slate-500">×</span>
					<input
						type="number"
						min={64}
						max={4096}
						value={h}
						disabled={disabled}
						onChange={(e) => setH(e.target.value)}
						placeholder="altura"
						className={inputCls}
					/>
					{ratio && (
						<span className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px] text-slate-300">
							{ratio}
						</span>
					)}
					{both && !valid && (
						<span className="text-[11px] text-rose-300">
							use 64–4096 px em cada lado
						</span>
					)}
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						disabled={!valid || !dirty || disabled}
						onClick={() => onChange({ width: nw, height: nh })}
						className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[12px] font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Salvar dimensões
					</button>
					<button
						type="button"
						disabled={!active || disabled}
						onClick={() => {
							setW('');
							setH('');
							onChange(null);
						}}
						className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-[12px] font-semibold text-slate-400 transition-colors hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
					>
						<Trash2 className="h-3.5 w-3.5" />
						Limpar (saída nativa)
					</button>
				</div>

				{active && (
					<p className="text-[11px] text-emerald-300/80">
						✓ Saída fixada em {value.width}×{value.height}px — o motor reforça a
						proporção no prompt e redimensiona pro tamanho exato.
					</p>
				)}
			</div>
		</Field>
	);
}
