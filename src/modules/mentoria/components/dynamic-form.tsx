'use client';

import { HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormField, MntFormTemplate } from '../types';
import { isUnknownAnswer, UNKNOWN_ANSWER } from '../types';

/**
 * Renderiza um mnt_form_template (blocos → campos) definido pelo admin.
 * Campos com `allow_unknown` têm o botão "[A LEVANTAR / NÃO MEDIDO]" — a
 * ausência da informação também é diagnóstico.
 */
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-hidrata quando o rascunho carrega
	useEffect(() => {
		if (initialAnswers) setAnswers(initialAnswers);
	}, [JSON.stringify(initialAnswers ?? {})]);

	const setAnswer = (key: string, value: unknown) => {
		const next = { ...answers, [key]: value };
		setAnswers(next);
		onChange?.(next);
	};

	return (
		<div className="space-y-8">
			{template.schema.blocks.map((block) => (
				<section
					key={block.key}
					className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5"
				>
					<h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
						{block.title}
					</h3>
					{block.description && (
						<p className="text-sm text-slate-500 dark:text-gray-400 mb-3">
							{block.description}
						</p>
					)}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
				</section>
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
	const unknown = isUnknownAnswer(value);
	const wide = field.type === 'textarea';
	const inputClass =
		'w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:opacity-60';

	return (
		<div className={wide ? 'md:col-span-2' : ''}>
			<div className="flex items-center justify-between mb-1.5 gap-2">
				<label className="text-sm font-medium text-slate-700 dark:text-slate-300">
					{field.label}
					{field.required && <span className="text-red-500 ml-0.5">*</span>}
				</label>
				{field.allow_unknown && !readOnly && (
					<button
						type="button"
						onClick={() => onChange(unknown ? '' : UNKNOWN_ANSWER)}
						className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition ${
							unknown
								? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
								: 'border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-500'
						}`}
					>
						<HelpCircle className="w-3 h-3" />A LEVANTAR
					</button>
				)}
			</div>

			{unknown ? (
				<div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
					[ A LEVANTAR / NÃO MEDIDO ]
				</div>
			) : field.type === 'textarea' ? (
				<textarea
					className={`${inputClass} min-h-24`}
					value={(value as string) ?? ''}
					disabled={readOnly}
					onChange={(e) => onChange(e.target.value)}
				/>
			) : field.type === 'boolean' ? (
				<div className="flex gap-2">
					{[
						{ v: true, label: 'Sim' },
						{ v: false, label: 'Não' },
					].map(({ v, label }) => (
						<button
							key={label}
							type="button"
							disabled={readOnly}
							onClick={() => onChange(v)}
							className={`px-4 py-1.5 rounded-xl text-sm border transition ${
								value === v
									? 'bg-teal-500/15 border-teal-500/50 text-teal-600 dark:text-teal-400'
									: 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400'
							}`}
						>
							{label}
						</button>
					))}
				</div>
			) : field.type === 'select' ? (
				<select
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
				<div className="flex gap-1.5">
					{Array.from({ length: 11 }, (_, i) => (
						<button
							key={String(i)}
							type="button"
							disabled={readOnly}
							onClick={() => onChange(i)}
							className={`w-8 h-8 rounded-lg text-xs border transition ${
								value === i
									? 'bg-teal-500 text-white border-teal-500'
									: 'border-slate-200 dark:border-white/10 text-slate-500'
							}`}
						>
							{i}
						</button>
					))}
				</div>
			) : (
				<input
					type={
						field.type === 'number' || field.type === 'currency'
							? 'number'
							: field.type === 'date'
								? 'date'
								: 'text'
					}
					step={field.type === 'currency' ? '0.01' : undefined}
					className={inputClass}
					value={(value as string | number) ?? ''}
					disabled={readOnly}
					onChange={(e) =>
						onChange(
							field.type === 'number' || field.type === 'currency'
								? e.target.value === ''
									? ''
									: Number(e.target.value)
								: e.target.value,
						)
					}
				/>
			)}
		</div>
	);
}
