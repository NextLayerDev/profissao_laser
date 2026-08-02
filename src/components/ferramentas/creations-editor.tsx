'use client';

import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Field } from '@/components/ferramentas/builder-ui';
import type { Creation } from '@/modules/tools/services/tool-definitions.service';
import { IconPicker } from './icon-picker';

/**
 * Editor dos "Tipos de Criação" do Passo 1 (Prompts Mágicos). Cada item vira um
 * card no cliente (ícone + nome amigável); a resolução (W×H) é HIDDEN do usuário
 * e injetada no run via `creation_id`. `active:false` oculta o card sem apagar.
 *
 * Cada linha: nome amigável + ícone (lucide) + W×H (presets/inputs) + ativo +
 * reordenar (↑/↓) + excluir. O `id` é estável (slug do nome na criação; se o
 * nome mudir depois, o id persiste — não renomeia pra não quebrar runs antigos).
 */

const PRESETS: { label: string; w: number; h: number }[] = [
	{ label: 'Wrap 360° · 2:1', w: 2000, h: 1000 },
	{ label: 'Ultra-wide · 3:1', w: 2400, h: 800 },
	{ label: 'Quadrado · 1:1', w: 1024, h: 1024 },
	{ label: 'Paisagem · 16:9', w: 1920, h: 1080 },
	{ label: 'Retrato · 4:5', w: 1080, h: 1350 },
	{ label: 'Story · 9:16', w: 1080, h: 1920 },
];

const dimCls =
	'w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-emerald-400/50';
const txtCls =
	'w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-emerald-400/50';

function slugify(s: string): string {
	return (
		s
			.toLowerCase()
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || `tipo-${Date.now().toString(36)}`
	);
}

export interface CreationsEditorProps {
	value: Creation[];
	onChange: (creations: Creation[] | null) => void;
	disabled?: boolean;
}

export function CreationsEditor({
	value,
	onChange,
	disabled,
}: CreationsEditorProps) {
	const [iconOpenFor, setIconOpenFor] = useState<string | null>(null);

	const update = (id: string, patch: Partial<Creation>) =>
		onChange(value.map((c) => (c.id === id ? { ...c, ...patch } : c)));

	const remove = (id: string) => onChange(value.filter((c) => c.id !== id));

	const move = (idx: number, dir: -1 | 1) => {
		const j = idx + dir;
		if (j < 0 || j >= value.length) return;
		const next = [...value];
		[next[idx], next[j]] = [next[j], next[idx]];
		onChange(next);
	};

	const add = () => {
		const n = value.length + 1;
		const c: Creation = {
			id: `tipo-${n}`,
			label: `Tipo ${n}`,
			icon: 'Box',
			width: 1024,
			height: 1024,
			active: true,
		};
		onChange([...value, c]);
	};

	return (
		<Field
			label="Tipos de criação (Passo 1)"
			hint="Cards que o cliente escolhe. A resolução fica oculta; só o nome + ícone aparecem. Vazio = usa dimensões avulsas acima."
		>
			<div className="space-y-2.5">
				{value.length === 0 && (
					<p className="rounded-lg border border-dashed border-white/10 bg-black/20 px-3 py-3 text-[12px] text-slate-500">
						Nenhum tipo cadastrado — o cliente não vê o Passo 1 (a resolução vem
						das dimensões avulsas). Adicione tipos pra habilitar os cards.
					</p>
				)}

				{value.map((c, idx) => {
					const validDim =
						c.width >= 64 &&
						c.width <= 4096 &&
						c.height >= 64 &&
						c.height <= 4096;
					return (
						<div
							key={c.id}
							className="space-y-2.5 rounded-xl border border-white/[0.07] bg-black/20 p-3"
						>
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() =>
										setIconOpenFor(iconOpenFor === c.id ? null : c.id)
									}
									aria-label="Trocar ícone"
									className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
										iconOpenFor === c.id
											? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
											: 'border-white/10 bg-black/30 text-slate-300 hover:text-emerald-200'
									}`}
								>
									<ChevronDown
										className={`h-3.5 w-3.5 transition-transform ${iconOpenFor === c.id ? 'rotate-180' : ''}`}
									/>
								</button>
								<input
									type="text"
									value={c.label}
									disabled={disabled}
									onChange={(e) => {
										const label = e.target.value;
										// Só (re)gera o id enquanto ele ainda é o default "tipo-N".
										// Depois que o admin salva, o id fica estável (não quebra
										// runs antigos que referenciam o id).
										const regen =
											c.id.startsWith('tipo-') && c.label.startsWith('Tipo ');
										update(
											c.id,
											regen ? { label, id: slugify(label) } : { label },
										);
									}}
									placeholder="Nome amigável (ex.: Copos 360º)"
									className={txtCls}
								/>
								<button
									type="button"
									disabled={disabled || idx === 0}
									onClick={() => move(idx, -1)}
									className="rounded-lg border border-white/10 bg-black/30 p-2 text-slate-400 hover:text-slate-200 disabled:opacity-30"
									aria-label="Mover para cima"
								>
									<ArrowUp className="h-3.5 w-3.5" />
								</button>
								<button
									type="button"
									disabled={disabled || idx === value.length - 1}
									onClick={() => move(idx, 1)}
									className="rounded-lg border border-white/10 bg-black/30 p-2 text-slate-400 hover:text-slate-200 disabled:opacity-30"
									aria-label="Mover para baixo"
								>
									<ArrowDown className="h-3.5 w-3.5" />
								</button>
								<button
									type="button"
									disabled={disabled}
									onClick={() => remove(c.id)}
									className="rounded-lg border border-white/10 bg-black/30 p-2 text-slate-400 hover:text-rose-300 disabled:opacity-30"
									aria-label="Excluir tipo"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</button>
							</div>

							{iconOpenFor === c.id && (
								<div className="rounded-lg border border-white/[0.07] bg-black/30 p-2.5">
									<IconPicker
										value={c.icon ?? ''}
										onChange={(name) => update(c.id, { icon: name })}
									/>
								</div>
							)}

							<div className="flex flex-wrap items-center gap-1.5">
								{PRESETS.map((p) => {
									const on = c.width === p.w && c.height === p.h;
									return (
										<button
											key={p.label}
											type="button"
											disabled={disabled}
											onClick={() => update(c.id, { width: p.w, height: p.h })}
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
								<input
									type="number"
									min={64}
									max={4096}
									value={c.width}
									disabled={disabled}
									onChange={(e) =>
										update(c.id, { width: Number(e.target.value) || 0 })
									}
									className={dimCls}
									aria-label="Largura (px)"
								/>
								<span className="text-slate-500">×</span>
								<input
									type="number"
									min={64}
									max={4096}
									value={c.height}
									disabled={disabled}
									onChange={(e) =>
										update(c.id, { height: Number(e.target.value) || 0 })
									}
									className={dimCls}
									aria-label="Altura (px)"
								/>
								{!validDim && (
									<span className="text-[11px] text-rose-300">
										use 64–4096 px
									</span>
								)}
								<label className="ml-auto flex items-center gap-2 text-[12px] text-slate-400">
									<input
										type="checkbox"
										checked={c.active !== false}
										disabled={disabled}
										onChange={(e) => update(c.id, { active: e.target.checked })}
										className="accent-emerald-400"
									/>
									Ativo
								</label>
							</div>
						</div>
					);
				})}

				<button
					type="button"
					disabled={disabled}
					onClick={add}
					className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[12px] font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/20 disabled:opacity-40"
				>
					<Plus className="h-3.5 w-3.5" />
					Adicionar tipo
				</button>
			</div>
		</Field>
	);
}
