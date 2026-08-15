'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, FileUp, Minus, Pencil, Plus, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { type ReactNode, useMemo, useRef, useState } from 'react';
import { useToolDefinition } from '../hooks/use-tool-definition';
import {
	aceitaAluno,
	permiteEdicaoDoDono,
	resolveCollectionConfig,
} from '../lib/collection-form';
import {
	type CollectionEntry,
	listCollection,
} from '../services/collections.service';
import type {
	ToolControl,
	ToolInputSpec,
} from '../services/tool-definitions.service';

/**
 * O formulário entra por import DINÂMICO por dois motivos, nessa ordem: ele
 * importa `WidgetField` (que importa este arquivo), e um import estático
 * fecharia um ciclo entre os três módulos; e é um modal que a maioria dos runs
 * nunca abre, então não tem por que viajar no bundle de toda tela de tool.
 */
const CollectionEntryForm = dynamic(
	() => import('./collection-entry-form').then((m) => m.CollectionEntryForm),
	{ ssr: false },
);

/**
 * Widgets adicionais da Fábrica de Tools. Ficam num arquivo irmão de
 * `tool-widgets.tsx` (que já tem os 6 originais) e são mesclados no mesmo
 * registry — dividir por arquivo evita um único módulo de 800 linhas.
 *
 * Todos consomem a MESMA `WidgetProps`, então nada muda no contrato. Os
 * parâmetros extras entram em `control.*`, que é `.passthrough()` no schema.
 */

export interface WidgetProps {
	control: ToolControl;
	spec?: ToolInputSpec;
	value: unknown;
	onChange: (v: unknown) => void;
}

/** Nome do input que um control liga (`bind: "input.material"` → `material`). */
function bindName(bind: string): string {
	return bind.startsWith('input.') ? bind.slice('input.'.length) : bind;
}

/**
 * O anel de foco segue o accent da tool (`--screen-accent`) em vez de travar em
 * violet, e usa `focus-visible` para não aparecer em clique de mouse.
 */
const fieldClass =
	'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] text-slate-700 dark:text-slate-300 outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_45%,transparent)]';

function Label({
	htmlFor,
	children,
}: {
	htmlFor?: string;
	children: ReactNode;
}) {
	return (
		<label
			htmlFor={htmlFor}
			className="block text-sm font-medium text-slate-700 dark:text-slate-300"
		>
			{children}
		</label>
	);
}

function labelOf(control: ToolControl): string {
	return control.label ?? bindName(control.bind);
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ───────────────────────────── texto ───────────────────────────── */

/**
 * `text` — corrige um bug real: o widget era autorável no builder mas não
 * existia no registry, então TODO campo de texto criado pelo admin caía no
 * `NumberWidget` e virava um campo numérico.
 */
export function TextWidget({ control, spec, value, onChange }: WidgetProps) {
	const id = `w-${bindName(control.bind)}`;
	const c = control as ToolControl & {
		placeholder?: string;
		maxLength?: number;
		mono?: boolean;
	};
	const current = String(value ?? spec?.default ?? '');
	return (
		<div className="space-y-1.5 sm:col-span-2">
			<Label htmlFor={id}>{labelOf(control)}</Label>
			<input
				id={id}
				type="text"
				value={current}
				placeholder={c.placeholder}
				maxLength={c.maxLength}
				onChange={(e) => onChange(e.target.value)}
				className={`${fieldClass} ${c.mono ? 'font-mono' : ''}`}
			/>
		</div>
	);
}

export function TextareaWidget({
	control,
	spec,
	value,
	onChange,
}: WidgetProps) {
	const id = `w-${bindName(control.bind)}`;
	const c = control as ToolControl & {
		placeholder?: string;
		maxLength?: number;
		rows?: number;
	};
	const current = String(value ?? spec?.default ?? '');
	return (
		<div className="space-y-1.5 sm:col-span-2">
			<div className="flex items-center justify-between">
				<Label htmlFor={id}>{labelOf(control)}</Label>
				{c.maxLength ? (
					<span className="font-mono text-[11px] tabular-nums text-slate-400">
						{current.length}/{c.maxLength}
					</span>
				) : null}
			</div>
			<textarea
				id={id}
				value={current}
				rows={c.rows ?? 4}
				placeholder={c.placeholder}
				maxLength={c.maxLength}
				onChange={(e) => onChange(e.target.value)}
				className={`${fieldClass} resize-y`}
			/>
		</div>
	);
}

/* ─────────────────────────── dimensão (mm) ─────────────────────────── */

const UNIT_TO_MM: Record<string, number> = { mm: 1, cm: 10, in: 25.4 };

/**
 * `dimension` — número com unidade, stepper e valores rápidos.
 *
 * REGRA CENTRAL: o valor emitido é SEMPRE em MILÍMETROS. A unidade é apenas
 * exibição — trocar de cm para mm reescreve o que aparece na tela, nunca o
 * valor guardado. Sem isso, o bug clássico do paramétrico acontece: o usuário
 * digita 80 pensando em centímetros e a máquina corta 80 mm.
 */
export function DimensionWidget({
	control,
	spec,
	value,
	onChange,
}: WidgetProps) {
	const id = `w-${bindName(control.bind)}`;
	const c = control as ToolControl & {
		unit?: keyof typeof UNIT_TO_MM;
		precision?: number;
		quick?: number[];
	};
	const unit = c.unit && UNIT_TO_MM[c.unit] ? c.unit : 'mm';
	const factor = UNIT_TO_MM[unit] ?? 1;
	const precision = c.precision ?? (unit === 'mm' ? 0 : 1);

	const min = control.min ?? spec?.min;
	const max = control.max ?? spec?.max;
	const step = control.step ?? 1;

	const mm = Number(value ?? spec?.default ?? min ?? 0);
	const shown = mm / factor;

	const clamp = (v: number) => {
		let out = v;
		if (typeof min === 'number') out = Math.max(min, out);
		if (typeof max === 'number') out = Math.min(max, out);
		return Math.round(out * 1000) / 1000;
	};

	const bump = (delta: number) => onChange(clamp(mm + delta));

	return (
		<div className="space-y-1.5">
			<Label htmlFor={id}>{labelOf(control)}</Label>
			<div className="flex items-stretch gap-1">
				<div className="relative flex-1">
					<input
						id={id}
						type="number"
						inputMode="decimal"
						value={
							Number.isFinite(shown) ? Number(shown.toFixed(precision)) : ''
						}
						min={typeof min === 'number' ? min / factor : undefined}
						max={typeof max === 'number' ? max / factor : undefined}
						step={step / factor}
						aria-valuetext={`${shown.toFixed(precision)} ${unit === 'mm' ? 'milímetros' : unit}`}
						onChange={(e) =>
							onChange(
								e.target.value === ''
									? undefined
									: clamp(Number(e.target.value) * factor),
							)
						}
						onKeyDown={(e) => {
							// Shift acelera o passo em 10×, como em editor de CAD.
							if (e.key === 'PageUp') {
								e.preventDefault();
								bump(step * 10);
							} else if (e.key === 'PageDown') {
								e.preventDefault();
								bump(-step * 10);
							}
						}}
						className={`${fieldClass} pr-10 text-right font-mono tabular-nums`}
					/>
					<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
						{unit}
					</span>
				</div>
				<div className="flex flex-col">
					{/* Alvos de toque ≥ 22px cada, 44px no par — mínimo acessível. */}
					<button
						type="button"
						aria-label={`Aumentar ${labelOf(control)}`}
						onClick={() => bump(step)}
						className="flex h-[22px] w-9 items-center justify-center rounded-t-lg border border-b-0 border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
					>
						<Plus className="h-3 w-3" />
					</button>
					<button
						type="button"
						aria-label={`Diminuir ${labelOf(control)}`}
						onClick={() => bump(-step)}
						className="flex h-[22px] w-9 items-center justify-center rounded-b-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
					>
						<Minus className="h-3 w-3" />
					</button>
				</div>
			</div>
			{c.quick?.length ? (
				<div className="flex flex-wrap gap-1 pt-0.5">
					{c.quick.map((q) => (
						<button
							key={q}
							type="button"
							onClick={() => onChange(clamp(q))}
							className={`rounded-full px-2.5 py-1 font-mono text-[11px] tabular-nums transition-colors ${
								Math.abs(mm - q) < 1e-6
									? 'bg-[var(--screen-accent,#7c3aed)] text-white'
									: 'border border-slate-200 text-slate-500 hover:border-[var(--screen-accent,#7c3aed)] dark:border-white/10 dark:text-slate-400'
							}`}
						>
							{q / factor}
							{unit}
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}

/* ─────────────────────────── arquivo (DXF/SVG) ─────────────────────────── */

const EXT_TINT: Record<string, string> = {
	dxf: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
	svg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
	lbrn2: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

/**
 * `file` — upload de arquivo NÃO-imagem (DXF, SVG, …). Usa o `accept` do spec,
 * que existia no schema desde sempre mas não tinha nenhum consumidor.
 *
 * Diferente do dropzone de imagem, o chip mostra a EXTENSÃO em mono num badge
 * colorido em vez de miniatura — não há o que pré-visualizar, e a extensão é
 * exatamente o que o usuário precisa conferir.
 */
export function FileWidget({ control, spec, value, onChange }: WidgetProps) {
	const [dragging, setDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const file = value instanceof File ? value : null;

	const c = control as ToolControl & { accept?: string[]; maxMb?: number };
	const accept = (c.accept ?? spec?.accept ?? []).map((e) =>
		e.replace(/^\./, '').toLowerCase(),
	);
	const maxMb = c.maxMb ?? 20;
	const acceptAttr = accept.map((e) => `.${e}`).join(',');

	const pick = (f: File | undefined) => {
		if (!f) return;
		const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
		if (accept.length && !accept.includes(ext)) {
			// Erro inline preso ao campo, não toast: o usuário precisa vê-lo ao
			// lado do controle que errou, e ele não pode sumir sozinho.
			setError(`Formato .${ext} não aceito. Envie ${acceptAttr}.`);
			return;
		}
		if (f.size > maxMb * 1024 * 1024) {
			setError(`Arquivo maior que ${maxMb} MB.`);
			return;
		}
		setError(null);
		onChange(f);
	};

	const ext = file?.name.split('.').pop()?.toLowerCase() ?? '';

	return (
		<div className="space-y-2 sm:col-span-2">
			<Label>{labelOf(control)}</Label>
			<button
				type="button"
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					pick(e.dataTransfer.files[0]);
				}}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={(e) => {
					e.preventDefault();
					setDragging(false);
				}}
				onClick={() => inputRef.current?.click()}
				className={`relative flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-9 transition-colors ${
					dragging
						? 'border-[var(--screen-accent,#7c3aed)] bg-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_10%,transparent)]'
						: 'border-slate-200 hover:border-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_50%,transparent)] dark:border-white/10'
				}`}
			>
				<input
					ref={inputRef}
					type="file"
					accept={acceptAttr || undefined}
					onChange={(e) => {
						pick(e.target.files?.[0]);
						e.target.value = '';
					}}
					className="hidden"
				/>
				<div className="mb-3 rounded-xl bg-[var(--screen-accent,#7c3aed)] p-3 text-white">
					<FileUp className="h-7 w-7" />
				</div>
				<p className="text-center text-sm font-medium text-slate-600 dark:text-gray-400">
					Arraste o arquivo ou clique para selecionar
				</p>
				{accept.length ? (
					<p className="mt-1 font-mono text-[11px] uppercase text-slate-400">
						{accept.join(' · ')}
					</p>
				) : null}
			</button>

			{error ? (
				<p
					role="alert"
					className="text-xs font-medium text-rose-600 dark:text-rose-400"
				>
					{error}
				</p>
			) : null}

			{file && (
				<div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#1a1a1d]">
					<span
						className={`rounded-lg px-2 py-1.5 font-mono text-[11px] font-semibold uppercase ${
							EXT_TINT[ext] ??
							'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
						}`}
					>
						{ext || 'file'}
					</span>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium text-slate-900 dark:text-white">
							{file.name}
						</p>
						<p className="font-mono text-xs tabular-nums text-slate-500 dark:text-gray-400">
							{formatBytes(file.size)}
						</p>
					</div>
					<Check className="h-5 w-5 shrink-0 text-emerald-500" />
					<button
						type="button"
						aria-label="Remover arquivo"
						onClick={() => onChange(undefined)}
						className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			)}
		</div>
	);
}

/* ───────────────────────────── dinheiro ───────────────────────────── */

/**
 * `money` — valor em BRL. O valor emitido é um INTEIRO EM CENTAVOS, nunca
 * float: o produto já tem histórico de erro de arredondamento em cobrança, e
 * centavos inteiros eliminam a classe inteira do problema.
 */
export function MoneyWidget({ control, spec, value, onChange }: WidgetProps) {
	const id = `w-${bindName(control.bind)}`;
	const cents = Number(value ?? spec?.default ?? 0);
	const [draft, setDraft] = useState<string | null>(null);
	const shown =
		draft ??
		(Number.isFinite(cents) ? (cents / 100).toFixed(2).replace('.', ',') : '');

	const commit = (raw: string) => {
		const normalized = raw.replace(/\./g, '').replace(',', '.');
		const n = Number.parseFloat(normalized);
		onChange(Number.isFinite(n) ? Math.round(n * 100) : undefined);
		setDraft(null);
	};

	return (
		<div className="space-y-1.5">
			<Label htmlFor={id}>{labelOf(control)}</Label>
			<div className="relative">
				<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
					R$
				</span>
				<input
					id={id}
					type="text"
					inputMode="decimal"
					value={shown}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={(e) => commit(e.target.value)}
					className={`${fieldClass} pl-9 text-right font-mono tabular-nums`}
				/>
			</div>
		</div>
	);
}

/* ───────────────────────── segmented (cards) ───────────────────────── */

/**
 * `segmented` — até ~4 opções como cards clicáveis em vez de dropdown.
 *
 * Generaliza (e permite apagar) o bloco hardcoded do Estúdio que fazia isso só
 * para o campo `operacao`, com um mapa fixo de 4 operações: aqui os ícones e as
 * descrições vêm da definition, então é dado em vez de código.
 */
export function SegmentedWidget({
	control,
	spec,
	value,
	onChange,
}: WidgetProps) {
	const c = control as ToolControl & {
		describe?: Record<string, string>;
	};
	const options = (control.options ?? spec?.options ?? []) as unknown[];
	const current = value ?? spec?.default;
	const numeric = options.every((o) => typeof o === 'number');

	const name = `w-${bindName(control.bind)}`;

	return (
		<fieldset className="space-y-1.5 sm:col-span-2">
			{/* `fieldset`+`legend`+`input[type=radio]` de verdade: dá navegação por
			    setas e anúncio correto no leitor de tela sem nenhum JS de teclado. */}
			<legend className="block pb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
				{labelOf(control)}
			</legend>
			<div className="grid grid-cols-2 gap-2">
				{options.map((opt) => {
					const key = String(opt);
					const active = String(current) === key;
					return (
						<label
							key={key}
							className={`cursor-pointer rounded-xl border p-3 text-left transition-colors focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_45%,transparent)] ${
								active
									? 'border-[var(--screen-accent,#7c3aed)] bg-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_10%,transparent)]'
									: 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20'
							}`}
						>
							<input
								type="radio"
								name={name}
								value={key}
								checked={active}
								onChange={() => onChange(numeric ? Number(key) : key)}
								className="sr-only"
							/>
							<span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
								{key}
							</span>
							{c.describe?.[key] ? (
								<span className="mt-0.5 block text-[11px] leading-snug text-slate-500 dark:text-slate-400">
									{c.describe[key]}
								</span>
							) : null}
						</label>
					);
				})}
			</div>
		</fieldset>
	);
}

/* ─────────────────────────── coleção ─────────────────────────── */

/**
 * `collection` — dropdown alimentado por uma COLEÇÃO, não por um enum estático.
 *
 * É o que faz "Material" listar os materiais que o admin cadastrou e "Perfil de
 * preço" listar os perfis do próprio aluno, em vez de uma lista chumbada na
 * definition que envelhece no dia seguinte. Era declarado nas definitions e não
 * existia em registry nenhum — caía no `TextWidget` e virava campo livre.
 *
 * Parâmetros no `control` (que é `.passthrough()`, então nada muda no schema):
 *   tool         key da tool DONA da coleção. Obrigatório — o widget não tem
 *                como descobrir sozinho em que tela está sendo renderizado.
 *   collection   nome da coleção (default `'default'`)
 *   labelField   campo de `data` a exibir; ausente → usa o `title` do registro
 *   valueField   campo a emitir; ausente → o `id` do registro
 *   mine         só os registros do próprio aluno (perfis de preço)
 *   allowEmpty   permite não escolher nada, com `placeholder`
 *
 * Falha com dignidade: enquanto carrega vira um select desabilitado; se a
 * coleção estiver vazia ou a busca falhar, diz isso em vez de mostrar um
 * dropdown vazio e mudo — que é indistinguível de bug para quem está usando.
 *
 * CADASTRAR SAI DAQUI. Quando a coleção declara `submissions.who:'student'`, o
 * widget ganha "Criar" (e "Editar", se `ownerEditable`) ao lado do rótulo. Era
 * o buraco do Orçamento: o aluno via "Meu perfil de custo" e não tinha, em
 * lugar nenhum do produto, como criar um perfil — `createCollectionEntry`
 * estava escrito no serviço e nunca era chamado. Coleção de catálogo (materiais,
 * velocidades: `who:'admin'`) não ganha botão nenhum, então as tools que já usam
 * este widget continuam idênticas.
 */
export function CollectionWidget({
	control,
	spec,
	value,
	onChange,
}: WidgetProps) {
	const c = control as ToolControl & {
		tool?: string;
		collection?: string;
		labelField?: string;
		valueField?: string;
		mine?: boolean;
		allowEmpty?: boolean;
		placeholder?: string;
	};
	const id = `w-${bindName(control.bind)}`;
	const toolKey = c.tool ?? '';
	const collection = c.collection ?? 'default';

	/** `'novo'` abre o formulário vazio; um registro abre em edição. */
	const [formulario, setFormulario] = useState<'novo' | CollectionEntry | null>(
		null,
	);

	const { data, isLoading, isError } = useQuery({
		queryKey: ['collection-options', toolKey, collection, c.mine ?? false],
		queryFn: () =>
			listCollection(toolKey, collection, {
				pageSize: 100,
				mine: c.mine,
				sort: 'recent',
			}),
		enabled: toolKey.length > 0,
		staleTime: 60_000,
	});

	/**
	 * Quem responde "o aluno pode cadastrar aqui?" é a DEFINITION da tool dona da
	 * coleção, não este componente. Na tela do Orçamento é a mesma query que já
	 * desenhou a tela (mesma chave no react-query), então não custa requisição
	 * nenhuma; só numa coleção emprestada de outra tool é que vira uma busca a
	 * mais — e ela é cacheada por 60 s.
	 */
	const def = useToolDefinition(toolKey, { enabled: toolKey.length > 0 });
	const config = useMemo(
		() => resolveCollectionConfig(def.data?.definition, collection),
		[def.data?.definition, collection],
	);
	const podeCriar = aceitaAluno(config);

	const items = data?.items ?? [];
	const options = items.map((e) => ({
		value: String(
			c.valueField ? ((e.data[c.valueField] as unknown) ?? e.id) : e.id,
		),
		label: String(
			(c.labelField ? e.data[c.labelField] : undefined) ?? e.title ?? e.id,
		),
	}));

	const current = String(value ?? spec?.default ?? '');
	const vazio = !isLoading && !isError && options.length === 0;

	// Editar exige saber QUAL registro está selecionado. Com `valueField` o campo
	// emite outro valor (um código, um nome) e o id se perde — aí só resta criar.
	const selecionado = c.valueField
		? undefined
		: items.find((e) => e.id === current);
	const podeEditar = !!selecionado?.is_mine && permiteEdicaoDoDono(config);

	let aviso: string | null = null;
	if (!toolKey) aviso = 'Este campo não declarou de qual ferramenta ler.';
	else if (isError) aviso = 'Não consegui carregar as opções agora.';
	else if (vazio) {
		aviso = podeCriar
			? 'Você ainda não cadastrou nenhum. Clique em “Criar”.'
			: 'Nenhum registro cadastrado ainda.';
	}

	/** O valor que o campo passa a emitir depois de salvar. */
	const valorDe = (e: CollectionEntry) =>
		String(c.valueField ? ((e.data[c.valueField] as unknown) ?? e.id) : e.id);

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between gap-2">
				<Label htmlFor={id}>{labelOf(control)}</Label>
				{podeCriar ? (
					<div className="flex items-center gap-1">
						{podeEditar && selecionado ? (
							<button
								type="button"
								onClick={() => setFormulario(selecionado)}
								className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
							>
								<Pencil className="h-3 w-3" />
								Editar
							</button>
						) : null}
						<button
							type="button"
							onClick={() => setFormulario('novo')}
							className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--screen-accent,#7c3aed)] transition-colors hover:bg-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_12%,transparent)]"
						>
							<Plus className="h-3 w-3" />
							Criar
						</button>
					</div>
				) : null}
			</div>
			<select
				id={id}
				className={fieldClass}
				value={current}
				disabled={isLoading || !!aviso}
				onChange={(e) => onChange(e.target.value)}
			>
				{isLoading ? <option value="">Carregando…</option> : null}
				{!isLoading && (c.allowEmpty || !current) ? (
					<option value="">{c.placeholder ?? '— selecione —'}</option>
				) : null}
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
			{aviso ? (
				<p className="text-[11px] text-amber-600 dark:text-amber-400">
					{aviso}
				</p>
			) : null}

			{formulario ? (
				<CollectionEntryForm
					toolKey={toolKey}
					collection={collection}
					entry={formulario === 'novo' ? null : formulario}
					onClose={() => setFormulario(null)}
					// Recém-criado já entra selecionado: o aluno abriu o formulário
					// porque queria USAR este registro agora.
					onSaved={(e) => onChange(valorDe(e))}
					onDeleted={(idApagado) => {
						if (selecionado?.id === idApagado) onChange('');
					}}
				/>
			) : null}
		</div>
	);
}

/** Widgets adicionais, mesclados no registry de `tool-widgets.tsx`. */
export const EXTRA_WIDGETS: Record<string, (p: WidgetProps) => ReactNode> = {
	text: TextWidget,
	textarea: TextareaWidget,
	dimension: DimensionWidget,
	file: FileWidget,
	money: MoneyWidget,
	segmented: SegmentedWidget,
	collection: CollectionWidget,
};
