'use client';

import {
	ChevronDown,
	ChevronUp,
	LayoutGrid,
	Plus,
	Search,
	Type,
	Wrench,
	X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useTools } from '@/modules/tools';
import { quickAccessItems } from '@/utils/constants/quick-access';
import type { PlanFeatureItem } from '../types/plans';

/**
 * Editor da lista de "Itens da landing" de um plano (usado dentro do modal de
 * plano). O admin monta a ordem exata que aparece no card da landing, com itens
 * de 3 tipos: uma **tool** real (registro do sistema), uma **aba/área** do app
 * (`quickAccessItems`), ou **texto** livre. Cada item guarda `label` (o que a
 * landing exibe) + `ref` (tool.key / href da área) como metadado. Sem modal
 * aninhado: os seletores abrem inline (painel expansível) pra caber no modal.
 */

type AddMode = null | 'tool' | 'area';

function uid(): string {
	// Ambiente browser: crypto.randomUUID sempre disponível nas páginas admin.
	return crypto.randomUUID();
}

const TYPE_BADGE: Record<
	PlanFeatureItem['type'],
	{ label: string; cls: string }
> = {
	tool: {
		label: 'Tool',
		cls: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
	},
	area: {
		label: 'Aba',
		cls: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
	},
	text: {
		label: 'Texto',
		cls: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
	},
};

export function PlanFeaturesEditor({
	value,
	onChange,
}: {
	value: PlanFeatureItem[];
	onChange: (items: PlanFeatureItem[]) => void;
}) {
	const [addMode, setAddMode] = useState<AddMode>(null);
	const lastTextId = useRef<string | null>(null);

	function update(id: string, patch: Partial<PlanFeatureItem>) {
		onChange(value.map((it) => (it.id === id ? { ...it, ...patch } : it)));
	}
	function remove(id: string) {
		onChange(value.filter((it) => it.id !== id));
	}
	function move(index: number, dir: -1 | 1) {
		const to = index + dir;
		if (to < 0 || to >= value.length) return;
		const next = value.slice();
		[next[index], next[to]] = [next[to], next[index]];
		onChange(next);
	}
	function addItem(item: PlanFeatureItem) {
		onChange([...value, item]);
	}
	function addText() {
		const id = uid();
		lastTextId.current = id;
		addItem({ id, type: 'text', ref: null, label: '' });
		setAddMode(null);
	}

	return (
		<div className="space-y-2.5">
			<div>
				<span className="block text-xs font-medium text-slate-500 dark:text-gray-400">
					Itens da landing
				</span>
				<p className="mt-0.5 text-[11px] text-slate-400 dark:text-gray-500">
					O que aparece no card deste plano na página de vendas, nesta ordem.
					Escolha uma tool, uma aba do app ou escreva um texto.
				</p>
			</div>

			{/* Lista de itens */}
			{value.length > 0 ? (
				<ul className="space-y-1.5">
					{value.map((it, i) => {
						const badge = TYPE_BADGE[it.type];
						return (
							<li
								key={it.id}
								className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] px-2 py-1.5"
							>
								<div className="flex flex-col">
									<button
										type="button"
										onClick={() => move(i, -1)}
										disabled={i === 0}
										className="text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30"
										aria-label="Mover para cima"
									>
										<ChevronUp className="h-3.5 w-3.5" />
									</button>
									<button
										type="button"
										onClick={() => move(i, 1)}
										disabled={i === value.length - 1}
										className="text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30"
										aria-label="Mover para baixo"
									>
										<ChevronDown className="h-3.5 w-3.5" />
									</button>
								</div>
								<span
									className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}
								>
									{badge.label}
								</span>
								<input
									value={it.label}
									onChange={(e) => update(it.id, { label: e.target.value })}
									ref={(el) => {
										if (el && lastTextId.current === it.id) {
											el.focus();
											lastTextId.current = null;
										}
									}}
									placeholder={
										it.type === 'text' ? 'Escreva o texto...' : 'Texto exibido'
									}
									className="min-w-0 flex-1 bg-transparent px-1 py-0.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
								/>
								<button
									type="button"
									onClick={() => remove(it.id)}
									className="shrink-0 text-slate-400 hover:text-red-500"
									aria-label="Remover item"
								>
									<X className="h-4 w-4" />
								</button>
							</li>
						);
					})}
				</ul>
			) : (
				<p className="rounded-lg border border-dashed border-slate-200 dark:border-white/10 px-3 py-4 text-center text-xs text-slate-400 dark:text-gray-500">
					Nenhum item. A landing usará a lista padrão até você adicionar itens.
				</p>
			)}

			{/* Barra de adicionar */}
			<div className="flex gap-2">
				<AddButton
					active={addMode === 'tool'}
					onClick={() => setAddMode(addMode === 'tool' ? null : 'tool')}
					icon={<Wrench className="h-3.5 w-3.5" />}
					label="Tool"
				/>
				<AddButton
					active={addMode === 'area'}
					onClick={() => setAddMode(addMode === 'area' ? null : 'area')}
					icon={<LayoutGrid className="h-3.5 w-3.5" />}
					label="Aba"
				/>
				<AddButton
					active={false}
					onClick={addText}
					icon={<Type className="h-3.5 w-3.5" />}
					label="Texto"
				/>
			</div>

			{/* Seletores inline */}
			{addMode === 'tool' && (
				<ToolPicker
					onPick={(t) => {
						addItem({ id: uid(), type: 'tool', ref: t.key, label: t.name });
						setAddMode(null);
					}}
				/>
			)}
			{addMode === 'area' && (
				<AreaPicker
					onPick={(a) => {
						addItem({
							id: uid(),
							type: 'area',
							ref: a.href ?? a.label,
							label: a.label,
						});
						setAddMode(null);
					}}
				/>
			)}
		</div>
	);
}

function AddButton({
	active,
	onClick,
	icon,
	label,
}: {
	active: boolean;
	onClick: () => void;
	icon: React.ReactNode;
	label: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
				active
					? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300'
					: 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 hover:border-violet-500/40'
			}`}
		>
			<Plus className="h-3 w-3" />
			{icon}
			{label}
		</button>
	);
}

/** Seletor inline de tools (registro do sistema), com busca. */
function ToolPicker({
	onPick,
}: {
	onPick: (t: { key: string; name: string }) => void;
}) {
	const tools = useTools();
	const [search, setSearch] = useState('');
	const list = useMemo(() => {
		const q = search.trim().toLowerCase();
		return (tools.data ?? []).filter(
			(t) =>
				!q ||
				t.name.toLowerCase().includes(q) ||
				t.key.toLowerCase().includes(q),
		);
	}, [tools.data, search]);

	return (
		<div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141416] p-2">
			<div className="relative">
				<Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Buscar tool..."
					className="w-full rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] py-1.5 pl-8 pr-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
				/>
			</div>
			<div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
				{tools.isLoading ? (
					<p className="py-3 text-center text-xs text-slate-400">Carregando…</p>
				) : list.length === 0 ? (
					<p className="py-3 text-center text-xs text-slate-400">
						Nenhuma tool encontrada.
					</p>
				) : (
					list.map((t) => (
						<button
							key={t.key}
							type="button"
							onClick={() => onPick(t)}
							className="flex w-full items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 text-left hover:border-violet-500/40 hover:bg-white dark:hover:bg-white/5"
						>
							<span className="min-w-0">
								<span className="block truncate text-sm text-slate-900 dark:text-white">
									{t.name}
								</span>
								<span className="block truncate font-mono text-[11px] text-slate-400">
									{t.key}
								</span>
							</span>
							<Plus className="h-3.5 w-3.5 shrink-0 text-violet-500" />
						</button>
					))
				)}
			</div>
		</div>
	);
}

/** Seletor inline de abas/áreas do app (quickAccessItems), com busca. */
function AreaPicker({
	onPick,
}: {
	onPick: (a: { label: string; href?: string }) => void;
}) {
	const [search, setSearch] = useState('');
	const list = useMemo(() => {
		const q = search.trim().toLowerCase();
		return quickAccessItems.filter(
			(a) => !q || a.label.toLowerCase().includes(q),
		);
	}, [search]);

	return (
		<div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#141416] p-2">
			<div className="relative">
				<Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Buscar aba/área..."
					className="w-full rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] py-1.5 pl-8 pr-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
				/>
			</div>
			<div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
				{list.length === 0 ? (
					<p className="py-3 text-center text-xs text-slate-400">
						Nenhuma área encontrada.
					</p>
				) : (
					list.map((a) => (
						<button
							key={a.label}
							type="button"
							onClick={() => onPick(a)}
							className="flex w-full items-center gap-2.5 rounded-md border border-transparent px-2 py-1.5 text-left hover:border-sky-500/40 hover:bg-white dark:hover:bg-white/5"
						>
							<span
								className={`grid h-6 w-6 shrink-0 place-items-center rounded ${a.iconBg}`}
							>
								<a.Icon className="h-3.5 w-3.5" />
							</span>
							<span className="min-w-0 flex-1">
								<span className="block truncate text-sm text-slate-900 dark:text-white">
									{a.label}
								</span>
								<span className="block truncate text-[11px] text-slate-400">
									{a.description}
								</span>
							</span>
							<Plus className="h-3.5 w-3.5 shrink-0 text-sky-500" />
						</button>
					))
				)}
			</div>
		</div>
	);
}
