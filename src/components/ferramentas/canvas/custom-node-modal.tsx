'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveToolIcon, TOOL_ICONS } from '@/modules/tools/lib/tool-icons';
import { BLOCK_CATALOG, type BlockSpec } from '../block-catalog';
import { LiteralControl } from '../builder-fields';
import { type CustomNodeSpec, slugifyKey } from '../builder-model';

/**
 * Modal "Criar nó": o usuário define um nó próprio (rótulo/ícone) a partir de um
 * bloco BASE do catálogo, pré-preenchendo os valores fixos. No `buildDoc` o nó é
 * expandido pro bloco base — o motor só vê blocos que conhece.
 */
export function CustomNodeModal({
	existing,
	onClose,
	onSave,
}: {
	existing: CustomNodeSpec[];
	onClose: () => void;
	onSave: (spec: CustomNodeSpec) => void;
}) {
	// só blocos base do catálogo (sem 'image.input'/output como base? deixa todos)
	const bases = BLOCK_CATALOG;
	const [label, setLabel] = useState('');
	const [icon, setIcon] = useState('box');
	const [baseId, setBaseId] = useState(bases[0]?.id ?? '');
	const base: BlockSpec | undefined = bases.find((b) => b.id === baseId);
	const [defaults, setDefaults] = useState<Record<string, unknown>>({});

	const litParams = (base?.params ?? []).filter((p) => p.kind === 'literal');

	const pickBase = (id: string) => {
		setBaseId(id);
		const b = bases.find((x) => x.id === id);
		const d: Record<string, unknown> = {};
		for (const p of b?.params ?? [])
			if (p.kind === 'literal') d[p.name] = p.default;
		setDefaults(d);
	};

	const genId = () => {
		const slug = slugifyKey(label) || 'no';
		const taken = new Set(existing.map((c) => c.id));
		let id = slug;
		let n = 1;
		while (taken.has(id)) {
			n += 1;
			id = `${slug}_${n}`;
		}
		return id;
	};

	const canSave = !!label.trim() && !!base;

	const save = () => {
		if (!base) return;
		onSave({
			id: genId(),
			label: label.trim(),
			icon,
			accent: base.accent,
			baseBlock: base.id,
			defaults,
		});
	};

	return createPortal(
		<div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
			<div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0c0f12] shadow-2xl">
				<header className="flex items-center justify-between border-b border-white/5 px-5 py-3">
					<span className="text-sm font-semibold text-white">
						Criar nó personalizado
					</span>
					<button
						type="button"
						onClick={onClose}
						className="rounded p-1 text-slate-500 hover:text-slate-200"
					>
						<X className="h-4 w-4" />
					</button>
				</header>

				<div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
					<div>
						<label
							htmlFor="cn-name"
							className="mb-1 block text-[11px] font-medium text-slate-400"
						>
							Nome do nó
						</label>
						<input
							id="cn-name"
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder="Ex.: Enviar pro meu CRM"
							className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
						/>
					</div>

					<div>
						<span className="mb-1.5 block text-[11px] font-medium text-slate-400">
							Ícone
						</span>
						<div className="flex flex-wrap gap-1.5">
							{TOOL_ICONS.map(({ name, Icon }) => (
								<button
									key={name}
									type="button"
									onClick={() => setIcon(name)}
									className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
										icon === name
											? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300'
											: 'border-white/10 bg-black/20 text-slate-400 hover:text-slate-200'
									}`}
								>
									<Icon className="h-4 w-4" />
								</button>
							))}
						</div>
					</div>

					<div>
						<label
							htmlFor="cn-base"
							className="mb-1 block text-[11px] font-medium text-slate-400"
						>
							Feito a partir de
						</label>
						<select
							id="cn-base"
							value={baseId}
							onChange={(e) => pickBase(e.target.value)}
							className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
						>
							{bases.map((b) => (
								<option key={b.id} value={b.id}>
									{b.label} ({b.id})
								</option>
							))}
						</select>
						<p className="mt-1 text-[11px] text-slate-500">
							As entradas (imagem, ligações) você conecta no canvas; aqui só os
							valores fixos.
						</p>
					</div>

					{litParams.length > 0 && (
						<div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
							<span className="text-[11px] font-medium text-slate-400">
								Valores padrão
							</span>
							{litParams.map((p) => (
								<div key={p.name} className="flex items-center gap-2">
									<span className="w-28 shrink-0 text-xs text-slate-300">
										{p.label}
									</span>
									<LiteralControl
										param={p}
										value={defaults[p.name]}
										onChange={(v) =>
											setDefaults((d) => ({ ...d, [p.name]: v }))
										}
									/>
								</div>
							))}
						</div>
					)}
				</div>

				<footer className="flex items-center justify-end gap-2 border-t border-white/5 px-5 py-3">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:text-white"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={save}
						disabled={!canSave}
						className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 py-2 text-xs font-bold text-[#06120f] disabled:opacity-40"
					>
						<Check className="h-3.5 w-3.5" /> Criar nó
					</button>
				</footer>
			</div>
		</div>,
		document.body,
	);
}

/** Ícone resolvido (reexport leve pra paleta). */
export { resolveToolIcon };
