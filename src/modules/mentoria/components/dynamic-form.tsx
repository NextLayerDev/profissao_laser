'use client';

// Renderiza um `mnt_form_template` (blocos → campos) definido pelo admin.
//
// Campos com `allow_unknown` têm o botão "[A LEVANTAR / NÃO MEDIDO]" — a
// ausência da informação também é diagnóstico, e é o princípio de produto mais
// distintivo desta tela: o aluno declara o que não sabe em vez de chutar.
//
// ── Por que quase nada aqui é componente do design system ────────────────────
//
// A regra da migração é usar o componente do DS quando ele cobre o
// comportamento atual SEM alterá-lo. Num formulário data-driven isso quase
// nunca se sustenta, e cada exceção está comentada no ponto:
//
//   number/currency  o `Input` do DS mascara em BRL e devolve string; aqui se
//                    grava `Number` (texto pt-BR → `parseBrNumber`), e mudar
//                    isso mudaria o payload da API;
//   date             o `Input type="date"` do DS é um Pressable que abre um
//                    calendário próprio, trocando o seletor nativo do browser;
//   select           o `Select` do DS é só o gatilho fechado, sem opções;
//   textarea         o `Textarea` do DS não expõe `id`, e sem `id` não há
//                    `htmlFor` — ver "Rótulos" abaixo;
//   boolean/scale    o DS não tem toggle binário nem escala.
//
// Todos estão registrados como gaps em docs/mentoria-360-design-system.md (A.5).
// O que se ganhou foi a pintura: tokens no lugar de slate/teal/amber cru, e a
// casca dos blocos vinda do `SectionCard`.
//
// ── Rótulos ──────────────────────────────────────────────────────────────────
//
// Todo campo liga rótulo e controle. Antes não ligava: os `<label>` não tinham
// `htmlFor` e os controles não tinham `id`, então clicar no rótulo não focava o
// campo e leitor de tela não relacionava os dois — em 45 campos. Onde o
// controle é um GRUPO de botões (boolean, scale) não existe elemento
// "rotulável" para apontar, então o rótulo vira `<span>` com id e o grupo o
// referencia por `aria-labelledby`, que é a forma correta para esse caso.

import { HelpCircle } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { formatBrNumber, parseBrNumber } from '../numbers';
import type { FormField, MntFormTemplate } from '../types';
import { isUnknownAnswer, UNKNOWN_ANSWER } from '../types';
import { SectionCard } from './ui';

// Cópia da string de `app/mentoria-admin/_components/ui.tsx` — `src/modules/`
// não deve importar de uma rota. Sem altura fixa (`h-control-md`) de propósito:
// veste `<textarea>` e `<select>` também, e altura travada achataria os dois.
//
// Exportado porque o caminho inverso é permitido: `desenvolvimento-view.tsx`
// está DENTRO de uma rota e importa daqui, em vez de clonar a string uma
// terceira vez.
export const inputClass =
	'w-full rounded-control border border-subtle bg-surface px-3 py-2 text-body text-primary placeholder:text-muted focus:outline-none focus:border-focus disabled:bg-surface-sunken disabled:opacity-60';

export function DynamicForm({
	template,
	initialAnswers,
	readOnly = false,
	onChange,
}: {
	template: MntFormTemplate;
	initialAnswers?: Record<string, unknown>;
	readOnly?: boolean;
	onChange?: (answers: Record<string, unknown>) => void;
}) {
	const [answers, setAnswers] = useState<Record<string, unknown>>(
		initialAnswers ?? {},
	);

	// Re-hidrata só até o aluno digitar: depois de "Salvar rascunho" o refetch
	// traz o snapshot do clique e, sem essa trava, apagava o que foi digitado
	// enquanto o save estava em andamento.
	const editedRef = useRef(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-hidrata quando o rascunho carrega
	useEffect(() => {
		if (initialAnswers && !editedRef.current) setAnswers(initialAnswers);
	}, [JSON.stringify(initialAnswers ?? {})]);

	const setAnswer = (key: string, value: unknown) => {
		editedRef.current = true;
		const next = { ...answers, [key]: value };
		setAnswers(next);
		onChange?.(next);
	};

	return (
		<div className="space-y-8">
			{template.schema.blocks.map((block) => (
				// `@container` + `@2xl:` em vez de `md:`: o painel do Assistente rouba
				// 384px da coluna de conteúdo, e breakpoint de viewport não enxerga
				// isso — dois campos lado a lado numa coluna estreita ficam apertados.
				<SectionCard
					key={block.key}
					title={block.title}
					description={block.description}
					className="@container"
				>
					<div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
						{block.fields.map((field) => (
							<FieldInput
								key={field.key}
								field={field}
								value={answers[field.key]}
								readOnly={readOnly}
								onChange={(v) => setAnswer(field.key, v)}
							/>
						))}
					</div>
				</SectionCard>
			))}
		</div>
	);
}

function FieldInput({
	field,
	value,
	readOnly,
	onChange,
}: {
	field: FormField;
	value: unknown;
	readOnly: boolean;
	onChange: (value: unknown) => void;
}) {
	// `useId` e não `field.key`: o mesmo template pode ser montado duas vezes na
	// mesma página (a rota de conferência renderiza três estados de uma vez), e
	// ids repetidos fariam o rótulo apontar para o campo da outra instância.
	const controlId = useId();
	const labelId = useId();

	const unknown = isUnknownAnswer(value);
	const wide = field.type === 'textarea';
	// Grupos de botões não têm elemento rotulável para o `htmlFor` apontar, e a
	// caixa "A LEVANTAR" não é um controle — nos dois casos o vínculo é por
	// `aria-labelledby`.
	const isGroup = unknown || field.type === 'boolean' || field.type === 'scale';

	const labelContent = (
		<>
			{field.label}
			{/* `text-danger` não tem token escuro no DS — daí o par `dark:`. */}
			{field.required && (
				<span className="ml-0.5 text-red-600 dark:text-red-400">*</span>
			)}
		</>
	);

	return (
		<div className={wide ? '@2xl:col-span-2' : ''}>
			<div className="mb-1.5 flex items-center justify-between gap-2">
				{isGroup ? (
					<span id={labelId} className="text-label text-primary">
						{labelContent}
					</span>
				) : (
					<label
						htmlFor={controlId}
						id={labelId}
						className="text-label text-primary"
					>
						{labelContent}
					</label>
				)}

				{field.allow_unknown && !readOnly && (
					// Pílula, não `Button` do DS: o Button tem altura mínima
					// `h-control-sm` (32px), que estouraria a linha do rótulo, e não
					// encaminha `aria-pressed` — que é justamente o que um toggle pede.
					<button
						type="button"
						aria-pressed={unknown}
						onClick={() => onChange(unknown ? '' : UNKNOWN_ANSWER)}
						className={`inline-flex items-center gap-1 rounded-chip border px-2 py-0.5 text-[11px] transition ${
							unknown
								? 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400'
								: 'border-subtle text-muted hover:text-amber-600 dark:hover:text-amber-400'
						}`}
					>
						<HelpCircle className="h-3 w-3" />A LEVANTAR
					</button>
				)}
			</div>

			{unknown ? (
				<div
					aria-labelledby={labelId}
					className="rounded-control border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 text-body text-amber-600 dark:text-amber-400"
				>
					[ A LEVANTAR / NÃO MEDIDO ]
				</div>
			) : field.type === 'textarea' ? (
				<textarea
					id={controlId}
					className={`${inputClass} min-h-24`}
					value={(value as string) ?? ''}
					disabled={readOnly}
					onChange={(e) => onChange(e.target.value)}
				/>
			) : field.type === 'boolean' ? (
				// `<fieldset>` sem `<legend>`: o nome acessível vem do
				// `aria-labelledby`, porque o rótulo divide a linha com a pílula "A
				// LEVANTAR" e um `<legend>` teria de ser o primeiro filho daqui.
				<fieldset aria-labelledby={labelId} className="flex gap-2">
					{[
						{ v: true, label: 'Sim' },
						{ v: false, label: 'Não' },
					].map(({ v, label }) => (
						<button
							key={label}
							type="button"
							disabled={readOnly}
							aria-pressed={value === v}
							onClick={() => onChange(v)}
							className={`rounded-control border px-4 py-1.5 text-label transition ${
								value === v
									? 'border-brand bg-brand-wash text-brand dark:text-violet-400'
									: 'border-subtle text-muted'
							}`}
						>
							{label}
						</button>
					))}
				</fieldset>
			) : field.type === 'select' ? (
				<select
					id={controlId}
					className={inputClass}
					value={(value as string) ?? ''}
					disabled={readOnly}
					onChange={(e) => onChange(e.target.value)}
				>
					<option value="">Selecione...</option>
					{(field.options ?? []).map((opt) => (
						<option key={opt} value={opt}>
							{opt}
						</option>
					))}
				</select>
			) : field.type === 'scale' ? (
				// 0 a 10 (o seed usa "Nota (0-10)"); `flex-wrap` porque 11 botões
				// de 32px passam de 400px e estouravam o card no celular.
				<fieldset aria-labelledby={labelId} className="flex flex-wrap gap-1.5">
					{Array.from({ length: 11 }, (_, i) => (
						<button
							key={String(i)}
							type="button"
							disabled={readOnly}
							aria-pressed={value === i}
							onClick={() => onChange(i)}
							className={`h-8 w-8 rounded-chip border text-caption transition ${
								value === i
									? 'border-brand bg-brand text-on-brand'
									: 'border-subtle text-muted'
							}`}
						>
							{i}
						</button>
					))}
				</fieldset>
			) : field.type === 'number' || field.type === 'currency' ? (
				<NumberField
					id={controlId}
					value={value}
					currency={field.type === 'currency'}
					readOnly={readOnly}
					onChange={onChange}
				/>
			) : (
				<input
					id={controlId}
					type={field.type === 'date' ? 'date' : 'text'}
					className={inputClass}
					value={(value as string | number) ?? ''}
					disabled={readOnly}
					onChange={(e) => onChange(e.target.value)}
				/>
			)}
		</div>
	);
}

/**
 * Número/moeda como texto pt-BR: '15.000' é 15000 (no `type="number"` virava
 * 15) e '1500,50' não some no Firefox. Grava `Number` ou '' como antes.
 */
function NumberField({
	id,
	value,
	currency,
	readOnly,
	onChange,
}: {
	id: string;
	value: unknown;
	currency: boolean;
	readOnly: boolean;
	onChange: (value: unknown) => void;
}) {
	const [text, setText] = useState(() => formatBrNumber(value));
	const [synced, setSynced] = useState(value);
	const [invalid, setInvalid] = useState(false);

	// Valor trocado de fora (rascunho carregado): reescreve o texto, a menos que
	// seja o próprio número que acabou de sair daqui.
	if (value !== synced) {
		setSynced(value);
		const current = parseBrNumber(text);
		const same =
			typeof value === 'number' ? value === current : current === null;
		if (!same) setText(formatBrNumber(value));
	}

	const parsed = parseBrNumber(text);
	return (
		<>
			<input
				id={id}
				type="text"
				inputMode="decimal"
				className={`${inputClass} ${invalid ? 'border-red-500' : ''}`}
				value={text}
				disabled={readOnly}
				placeholder={currency ? '0,00' : undefined}
				aria-invalid={invalid || undefined}
				onBlur={() => setInvalid(text.trim() !== '' && parsed === null)}
				onChange={(e) => {
					setText(e.target.value);
					setInvalid(false);
					onChange(parseBrNumber(e.target.value) ?? '');
				}}
			/>
			{invalid && (
				<p className="mt-1 text-caption text-red-600 dark:text-red-400">
					Valor inválido. Use só números, ex.: 15.000,50
				</p>
			)}
			{currency && !invalid && parsed !== null && !readOnly && (
				<p className="mt-1 text-caption text-muted">
					{parsed.toLocaleString('pt-BR', {
						style: 'currency',
						currency: 'BRL',
					})}
				</p>
			)}
		</>
	);
}
