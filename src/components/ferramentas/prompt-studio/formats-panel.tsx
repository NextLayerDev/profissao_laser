'use client';

import {
	ArrowDown,
	ArrowUp,
	ChevronLeft,
	Copy,
	Loader2,
	Plus,
	Search,
	Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CreationTemplatePreview } from '@/modules/tools/components/creation-template-preview';
import {
	activeModels,
	effectiveTemplate,
	slugify,
	templateProblem,
	templateSizePx,
} from '@/modules/tools/lib/creation-template';
import { resolveToolIcon } from '@/modules/tools/lib/tool-icons';
import type {
	Creation,
	CreationModel,
	CreationTemplate,
} from '@/modules/tools/services/tool-definitions.service';
import { IconPicker } from '../icon-picker';
import { PhoneFinder } from './phone-finder';
import { TemplateEditor } from './template-editor';
import {
	chipCls,
	fieldCls,
	ghostBtn,
	hintCls,
	iconBtn,
	labelCls,
	numCls,
	panelCls,
	primaryBtn,
} from './ui';

const NOVO_MOLDE: CreationTemplate = {
	width_mm: 100,
	height_mm: 100,
	safe_margin_mm: 3,
};

/** O que impede salvar a lista (mensagem para o admin) — `null` = ok. */
export function formatsProblem(list: Creation[]): string | null {
	const ids = new Set<string>();
	for (const c of list) {
		if (!c.label.trim()) return 'Todo formato precisa de um nome.';
		if (ids.has(c.id)) return `Dois formatos com o mesmo código (${c.id}).`;
		ids.add(c.id);
		if (Math.max(c.width, c.height) < 64 || Math.max(c.width, c.height) > 4096)
			return `"${c.label}": a resolução deve ficar entre 64 e 4096 px.`;
		const p = c.template ? templateProblem(c.template) : null;
		if (p) return `"${c.label}": ${p}`;
		const mids = new Set<string>();
		for (const m of c.models ?? []) {
			if (mids.has(m.id)) return `"${c.label}": modelo repetido (${m.label}).`;
			mids.add(m.id);
			const pm = templateProblem(m.template);
			if (pm) return `"${c.label} · ${m.label}": ${pm}`;
		}
	}
	return null;
}

/**
 * FORMATOS — o produto físico de cada arte. Lista à esquerda, ficha do
 * formato ao abrir. Salvar grava `definition.creations` e publica (o aluno vê
 * na hora). Nada aqui precisa de código: medidas, áreas livres e a biblioteca
 * de modelos (os celulares da Capinha) são dados.
 */
export function FormatsPanel({
	value,
	saving,
	canPublish,
	onSave,
}: {
	value: Creation[];
	saving: boolean;
	/** Só administrador grava a definition (o upvox exige o papel `admin`). */
	canPublish: boolean;
	onSave: (next: Creation[]) => void;
}) {
	const [draft, setDraft] = useState<Creation[]>(value);
	const [openId, setOpenId] = useState<string | null>(null);
	const dirty = JSON.stringify(draft) !== JSON.stringify(value);
	const problem = formatsProblem(draft);
	const open = draft.find((c) => c.id === openId);

	const update = (id: string, p: Partial<Creation>) =>
		setDraft((d) => d.map((c) => (c.id === id ? { ...c, ...p } : c)));
	const move = (i: number, dir: -1 | 1) =>
		setDraft((d) => {
			const j = i + dir;
			if (j < 0 || j >= d.length) return d;
			const next = [...d];
			[next[i], next[j]] = [next[j], next[i]];
			return next;
		});

	const add = () => {
		let id = 'novo-formato';
		for (let n = 2; draft.some((c) => c.id === id); n++)
			id = `novo-formato-${n}`;
		setDraft((d) => [
			...d,
			{
				id,
				label: 'Novo formato',
				icon: 'Box',
				width: 1500,
				height: 1500,
				active: false,
				template: { ...NOVO_MOLDE },
			},
		]);
		setOpenId(id);
	};

	const save = () => {
		if (problem) {
			toast.error(problem);
			return;
		}
		onSave(draft);
	};

	const saveBar = (
		<div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b0e12]/95 px-4 py-3 backdrop-blur">
			<p className="text-[12px] text-slate-400">
				{!canPublish ? (
					<span className="text-amber-200">
						Só um administrador publica formatos. Você pode ver e simular; peça
						a um admin para salvar.
					</span>
				) : problem ? (
					<span className="text-rose-300">{problem}</span>
				) : dirty ? (
					'Alterações não publicadas.'
				) : (
					'Tudo publicado.'
				)}
			</p>
			<div className="flex gap-2">
				{dirty && (
					<button
						type="button"
						className={ghostBtn}
						onClick={() => setDraft(value)}
						disabled={saving}
					>
						Descartar
					</button>
				)}
				<button
					type="button"
					className={primaryBtn}
					onClick={save}
					disabled={!canPublish || !dirty || saving || !!problem}
				>
					{saving && <Loader2 className="h-4 w-4 animate-spin" />}
					Salvar e publicar
				</button>
			</div>
		</div>
	);

	if (open) {
		return (
			<div className="space-y-4">
				<button
					type="button"
					onClick={() => setOpenId(null)}
					className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
				>
					<ChevronLeft className="h-4 w-4" /> Todos os formatos
				</button>
				<FormatEditor
					value={open}
					onChange={(p) => update(open.id, p)}
					onRemove={() => {
						setDraft((d) => d.filter((c) => c.id !== open.id));
						setOpenId(null);
					}}
				/>
				{saveBar}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="max-w-xl text-[13px] text-slate-400">
					Os produtos onde a arte vai. A IA já respeita o tamanho de cada um e
					deixa livre o que não pode ter desenho, como a câmera da capinha.
				</p>
				<button type="button" className={ghostBtn} onClick={add}>
					<Plus className="h-4 w-4" /> Novo formato
				</button>
			</div>

			<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{draft.map((c, i) => {
					const Icon = resolveToolIcon(c.icon);
					const models = activeModels(c);
					const t = effectiveTemplate(c, models[0]?.id);
					return (
						<li
							key={c.id}
							className={`${panelCls} flex gap-3 p-3 ${c.active === false ? 'opacity-60' : ''}`}
						>
							<button
								type="button"
								onClick={() => setOpenId(c.id)}
								className="flex min-w-0 flex-1 items-center gap-3 text-left"
							>
								<div className="grid h-20 w-16 shrink-0 place-items-center">
									{t ? (
										<CreationTemplatePreview
											template={t}
											label={c.label}
											className="max-h-20 max-w-16"
										/>
									) : (
										<Icon className="h-7 w-7 text-slate-400" />
									)}
								</div>
								<div className="min-w-0">
									<p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-100">
										<Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
										{c.label}
									</p>
									<p className="mt-0.5 text-[11px] text-slate-500">
										{t
											? `${t.width_mm} × ${t.height_mm} mm`
											: `${c.width} × ${c.height} px`}
										{models.length > 0 && ` · ${models.length} modelos`}
									</p>
									<p className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold uppercase tracking-wide">
										{c.active === false && (
											<span className="text-slate-500">desligado</span>
										)}
										{(t?.zones?.length ?? 0) > 0 && (
											<span className="text-rose-300/80">
												sem arte em:{' '}
												{[
													...new Set(t?.zones?.map((z) => z.label || 'área')),
												].join(', ')}
											</span>
										)}
									</p>
								</div>
							</button>
							<div className="flex flex-col gap-1">
								<button
									type="button"
									aria-label="Mover para cima"
									disabled={i === 0}
									onClick={() => move(i, -1)}
									className={iconBtn}
								>
									<ArrowUp className="h-3.5 w-3.5" />
								</button>
								<button
									type="button"
									aria-label="Mover para baixo"
									disabled={i === draft.length - 1}
									onClick={() => move(i, 1)}
									className={iconBtn}
								>
									<ArrowDown className="h-3.5 w-3.5" />
								</button>
							</div>
						</li>
					);
				})}
			</ul>
			{saveBar}
		</div>
	);
}

function FormatEditor({
	value: c,
	onChange,
	onRemove,
}: {
	value: Creation;
	onChange: (p: Partial<Creation>) => void;
	onRemove: () => void;
}) {
	const [iconOpen, setIconOpen] = useState(false);
	const Icon = resolveToolIcon(c.icon);
	const hasModels = (c.models?.length ?? 0) > 0;
	const longSide = Math.max(c.width, c.height);
	const setLongSide = (n: number) => {
		// Sem molde a proporção vem do W×H; com molde só o lado maior importa.
		if (c.width >= c.height)
			onChange({ width: n, height: Math.round((n * c.height) / c.width) || n });
		else
			onChange({ height: n, width: Math.round((n * c.width) / c.height) || n });
	};
	const preview = c.template ?? c.models?.[0]?.template;
	const px = preview ? templateSizePx(preview, longSide) : null;

	return (
		<div className={`${panelCls} space-y-6 p-5`}>
			<div className="flex flex-wrap items-start gap-3">
				<button
					type="button"
					onClick={() => setIconOpen((v) => !v)}
					aria-label="Trocar ícone"
					className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-black/30 text-slate-200 hover:border-emerald-400/40"
				>
					<Icon className="h-5 w-5" />
				</button>
				<label className="min-w-[200px] flex-1">
					<span className={labelCls}>Nome que o aluno vê</span>
					<input
						value={c.label}
						onChange={(e) => onChange({ label: e.target.value })}
						className={fieldCls}
					/>
				</label>
				<button
					type="button"
					onClick={onRemove}
					className={`${iconBtn} mt-7 hover:text-rose-300`}
					aria-label="Excluir formato"
				>
					<Trash2 className="h-4 w-4" />
				</button>
			</div>
			{iconOpen && (
				<div className="rounded-xl border border-white/[0.07] bg-black/30 p-3">
					<IconPicker
						value={c.icon ?? ''}
						onChange={(name) => {
							onChange({ icon: name });
							setIconOpen(false);
						}}
					/>
				</div>
			)}

			<Toggle
				on={c.active !== false}
				onClick={() => onChange({ active: c.active === false })}
				label="Aparece para o aluno"
			/>

			<details className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">
				<summary className="cursor-pointer text-[13px] font-medium text-slate-300">
					Ajustes avançados
				</summary>
				<div className="space-y-5 pt-4">
					<label className="block w-48">
						<span className={labelCls}>Qualidade da imagem (px)</span>
						<input
							type="number"
							min={64}
							max={4096}
							value={longSide}
							onChange={(e) => setLongSide(Number(e.target.value) || 0)}
							className={fieldCls}
						/>
						<span className={hintCls}>
							{px
								? `Gera ${px.width} × ${px.height} px`
								: `${c.width} × ${c.height} px`}
						</span>
					</label>

					<div className="flex flex-wrap gap-2">
						<Toggle
							on={!!(c.template || hasModels) && c.mask !== false}
							disabled={!c.template && !hasModels}
							onClick={() => onChange({ mask: c.mask === false })}
							label="Deixar transparente fora da peça e nas áreas livres"
						/>
						<Toggle
							on={c.transparent === true}
							onClick={() =>
								onChange({ transparent: !c.transparent || undefined })
							}
							label="Arte sem fundo"
						/>
					</div>

					<label className="block">
						<span className={labelCls}>Dica extra para a IA neste formato</span>
						<textarea
							value={c.prompt_hint ?? ''}
							onChange={(e) =>
								onChange({ prompt_hint: e.target.value || undefined })
							}
							rows={2}
							placeholder="Ex.: composição vertical, assunto principal na metade de baixo."
							className={`${fieldCls} h-auto py-2`}
						/>
					</label>
					<p className={hintCls}>Código interno: {c.id}</p>
				</div>
			</details>

			{hasModels ? (
				<ModelLibrary
					models={c.models ?? []}
					onChange={(models) => onChange({ models })}
					onRemoveAll={() =>
						onChange({
							models: undefined,
							template: c.template ?? c.models?.[0]?.template,
						})
					}
				/>
			) : (
				<section className="space-y-3 border-t border-white/[0.06] pt-5">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<h3 className="text-sm font-semibold text-slate-100">
							Molde da peça
						</h3>
						<div className="flex gap-2">
							{!c.template && (
								<button
									type="button"
									className={ghostBtn}
									onClick={() => onChange({ template: { ...NOVO_MOLDE } })}
								>
									<Plus className="h-4 w-4" /> Adicionar molde
								</button>
							)}
							<button
								type="button"
								className={ghostBtn}
								onClick={() =>
									onChange({
										models: [
											{
												id: 'modelo-1',
												label: 'Modelo 1',
												brand: '',
												active: true,
												template: c.template ?? { ...NOVO_MOLDE },
											},
										],
									})
								}
							>
								Usar biblioteca de modelos
							</button>
						</div>
					</div>
					{c.template ? (
						<>
							<TemplateEditor
								value={c.template}
								onChange={(template) => onChange({ template })}
							/>
							<button
								type="button"
								className="text-[12px] text-slate-500 underline-offset-2 hover:text-rose-300 hover:underline"
								onClick={() => onChange({ template: undefined })}
							>
								Remover molde (volta a ser só uma resolução em px)
							</button>
						</>
					) : (
						<p className={hintCls}>
							Sem molde: a arte sai em {c.width} × {c.height} px, sem instrução
							de formato nem recorte.
						</p>
					)}
				</section>
			)}
		</div>
	);
}

function Toggle({
	on,
	onClick,
	label,
	disabled,
}: {
	on: boolean;
	onClick: () => void;
	label: string;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={on}
			disabled={disabled}
			onClick={onClick}
			className={`${chipCls(on)} disabled:opacity-40`}
		>
			{on ? '✓ ' : ''}
			{label}
		</button>
	);
}

/**
 * BIBLIOTECA DE MODELOS — cada um com o próprio molde. Lista enxuta com busca
 * e marca; abrir um modelo mostra o editor de molde. "Duplicar" é o atalho
 * real: o iPhone novo costuma ser o anterior com 2 mm a mais.
 */
function ModelLibrary({
	models,
	onChange,
	onRemoveAll,
}: {
	models: CreationModel[];
	onChange: (m: CreationModel[]) => void;
	onRemoveAll: () => void;
}) {
	const [q, setQ] = useState('');
	const [brand, setBrand] = useState<string | null>(null);
	const [openId, setOpenId] = useState<string | null>(null);
	const brands = useMemo(
		() => [...new Set(models.map((m) => m.brand?.trim() || 'Outros'))],
		[models],
	);
	const shown = models.filter(
		(m) =>
			(!brand || (m.brand?.trim() || 'Outros') === brand) &&
			m.label.toLowerCase().includes(q.trim().toLowerCase()),
	);
	const patch = (id: string, p: Partial<CreationModel>) =>
		onChange(models.map((m) => (m.id === id ? { ...m, ...p } : m)));
	const uniqueId = (base: string) => {
		let id = slugify(base);
		for (let n = 2; models.some((m) => m.id === id); n++)
			id = `${slugify(base)}-${n}`;
		return id;
	};
	const duplicate = (m: CreationModel) => {
		const copy: CreationModel = {
			...m,
			id: uniqueId(`${m.label} copia`),
			label: `${m.label} (cópia)`,
			template: JSON.parse(JSON.stringify(m.template)),
		};
		onChange([...models, copy]);
		setOpenId(copy.id);
	};
	const add = () => {
		const base = models[models.length - 1];
		const m: CreationModel = {
			id: uniqueId('novo modelo'),
			label: 'Novo modelo',
			brand: brand ?? base?.brand ?? '',
			active: true,
			template: base
				? JSON.parse(JSON.stringify(base.template))
				: { ...NOVO_MOLDE },
		};
		onChange([...models, m]);
		setOpenId(m.id);
	};

	return (
		<section className="space-y-3 border-t border-white/[0.06] pt-5">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<h3 className="text-sm font-semibold text-slate-100">
						Biblioteca de modelos{' '}
						<span className="font-normal text-slate-500">
							({models.length})
						</span>
					</h3>
					<p className={hintCls}>
						O aluno escolhe o dele na hora de gerar. Digite o nome e a IA traz
						as medidas e a posição da câmera.
					</p>
				</div>
			</div>

			<PhoneFinder
				existing={models.map((m) => m.label)}
				onAdd={(p) =>
					onChange([
						...models,
						{
							id: uniqueId(p.label),
							label: p.label,
							brand: p.brand,
							active: true,
							template: p.template,
						},
					])
				}
			/>

			<div className="flex flex-wrap items-center gap-2">
				<div className="relative min-w-[180px] flex-1">
					<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
					<input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Buscar modelo…"
						className={`${fieldCls} pl-9`}
					/>
				</div>
				<button
					type="button"
					className={chipCls(brand === null)}
					onClick={() => setBrand(null)}
				>
					Todas
				</button>
				{brands.map((b) => (
					<button
						key={b}
						type="button"
						className={chipCls(brand === b)}
						onClick={() => setBrand(brand === b ? null : b)}
					>
						{b}
					</button>
				))}
			</div>

			<ul className="divide-y divide-white/[0.05] overflow-hidden rounded-xl border border-white/[0.07]">
				{shown.map((m) => {
					const isOpen = openId === m.id;
					return (
						<li key={m.id} className="bg-black/20">
							<div className="flex items-center gap-3 px-3 py-2">
								<button
									type="button"
									onClick={() => setOpenId(isOpen ? null : m.id)}
									className="flex min-w-0 flex-1 items-center gap-3 text-left"
									aria-expanded={isOpen}
								>
									<CreationTemplatePreview
										template={m.template}
										label={m.label}
										className="h-10 w-auto shrink-0"
									/>
									<span className="min-w-0">
										<span
											className={`block truncate text-sm font-medium ${m.active === false ? 'text-slate-500 line-through' : 'text-slate-100'}`}
										>
											{m.label}
										</span>
										<span className="block text-[11px] text-slate-500">
											{m.brand || 'Sem marca'} · {m.template.width_mm} ×{' '}
											{m.template.height_mm} mm
										</span>
									</span>
								</button>
								<button
									type="button"
									className={iconBtn}
									aria-label={`Duplicar ${m.label}`}
									title="Duplicar"
									onClick={() => duplicate(m)}
								>
									<Copy className="h-3.5 w-3.5" />
								</button>
							</div>
							{isOpen && (
								<div className="space-y-3 border-t border-white/[0.05] bg-black/30 p-3">
									<div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
										<label>
											<span className="mb-1 block text-[11px] text-slate-500">
												Nome
											</span>
											<input
												value={m.label}
												onChange={(e) => patch(m.id, { label: e.target.value })}
												className={numCls}
											/>
										</label>
										<label>
											<span className="mb-1 block text-[11px] text-slate-500">
												Marca
											</span>
											<input
												value={m.brand ?? ''}
												list="marcas-modelos"
												onChange={(e) => patch(m.id, { brand: e.target.value })}
												className={numCls}
											/>
										</label>
										<div className="flex items-end gap-2">
											<Toggle
												on={m.active !== false}
												onClick={() =>
													patch(m.id, { active: m.active === false })
												}
												label="Ativo"
											/>
											<button
												type="button"
												aria-label={`Excluir ${m.label}`}
												className={`${iconBtn} hover:text-rose-300`}
												onClick={() =>
													onChange(models.filter((x) => x.id !== m.id))
												}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										</div>
									</div>
									<details className="group">
										<summary className="cursor-pointer text-[12px] text-slate-400 hover:text-slate-200">
											Corrigir medidas à mão
										</summary>
										<div className="pt-3">
											<TemplateEditor
												compact
												value={m.template}
												onChange={(template) => patch(m.id, { template })}
											/>
										</div>
									</details>
								</div>
							)}
						</li>
					);
				})}
				{shown.length === 0 && (
					<li className="px-3 py-6 text-center text-[12px] text-slate-500">
						Nenhum modelo encontrado.
					</li>
				)}
			</ul>
			<datalist id="marcas-modelos">
				{brands.map((b) => (
					<option key={b} value={b} />
				))}
			</datalist>
			<div className="flex flex-wrap gap-4">
				<button
					type="button"
					onClick={add}
					className="text-[12px] text-slate-500 underline-offset-2 hover:text-slate-200 hover:underline"
				>
					Cadastrar à mão
				</button>
				<button
					type="button"
					onClick={onRemoveAll}
					className="text-[12px] text-slate-500 underline-offset-2 hover:text-rose-300 hover:underline"
				>
					Desligar a lista de modelos
				</button>
			</div>
		</section>
	);
}
