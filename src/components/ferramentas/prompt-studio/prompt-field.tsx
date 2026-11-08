'use client';

import { Braces } from 'lucide-react';
import { useRef } from 'react';
import { labelCls } from './ui';

/**
 * Limite real do `prompt` em `ai.generate_image` (8.000), menos o espaço que o
 * motor reserva para o tema do aluno e a instrução de formato.
 */
const PROMPT_LIMIT = 8_000;
const PROMPT_WARN = 6_500;

const TOKEN = /(\{tema\})/g;

/**
 * Campo do prompt com o `{tema}` DESTACADO no próprio texto.
 *
 * É o ponto onde o pedido do aluno entra — e o erro mais comum do admin era
 * esquecê-lo (o card gerava sempre a mesma arte) ou escrevê-lo errado
 * (`{Tema}`, `{ tema }`). Uma camada por trás do textarea repete o texto com o
 * marcador pintado; o textarea fica transparente por cima, com o cursor.
 */
export function PromptField({
	value,
	onChange,
	needsTema,
}: {
	value: string;
	onChange: (v: string) => void;
	/** O modo do card usa texto do aluno? Sem isso, `{tema}` é opcional. */
	needsTema: boolean;
}) {
	const ref = useRef<HTMLTextAreaElement>(null);
	const backdrop = useRef<HTMLDivElement>(null);
	const hasTema = value.includes('{tema}');
	const malformed = /\{\s*tema\s*\}/i.test(value.replace(/\{tema\}/g, ''));
	const len = value.length;

	const insertTema = () => {
		const el = ref.current;
		const start = el?.selectionStart ?? value.length;
		const end = el?.selectionEnd ?? value.length;
		const next = `${value.slice(0, start)}{tema}${value.slice(end)}`;
		onChange(next);
		requestAnimationFrame(() => {
			el?.focus();
			el?.setSelectionRange(start + 6, start + 6);
		});
	};

	const shared =
		'whitespace-pre-wrap break-words px-3.5 py-2.5 font-mono text-[13px] leading-6';

	return (
		<div>
			<div className="mb-1.5 flex items-center justify-between gap-2">
				<label htmlFor="prompt-script" className={`${labelCls} mb-0`}>
					Instrução para a IA
				</label>
				<button
					type="button"
					onClick={insertTema}
					className="inline-flex items-center gap-1 rounded-lg border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[11px] font-semibold text-amber-200 transition-colors hover:bg-amber-300/20"
				>
					<Braces className="h-3 w-3" />
					Onde entra o pedido do aluno
				</button>
			</div>
			<div className="relative rounded-xl border border-white/10 bg-black/30 focus-within:border-emerald-400/50 focus-within:ring-2 focus-within:ring-emerald-400/30">
				<div
					ref={backdrop}
					aria-hidden
					className={`${shared} pointer-events-none absolute inset-0 overflow-hidden text-slate-100`}
				>
					{value.split(TOKEN).map((part, i) =>
						part === '{tema}' ? (
							<mark
								key={i}
								className="rounded bg-amber-300/25 text-amber-200 outline outline-1 outline-amber-300/40"
							>
								{part}
							</mark>
						) : (
							<span key={i}>{part}</span>
						),
					)}
					{/* espaço final: mantém a altura igual quando o texto termina em \n */}{' '}
				</div>
				<textarea
					id="prompt-script"
					ref={ref}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onScroll={(e) => {
						if (backdrop.current)
							backdrop.current.scrollTop = e.currentTarget.scrollTop;
					}}
					rows={8}
					spellCheck={false}
					placeholder="Ex.: Crie uma arte de {tema} em aquarela, cores suaves, fundo branco."
					className={`${shared} relative block w-full resize-y bg-transparent text-transparent caret-slate-100 outline-none placeholder:text-slate-500`}
				/>
			</div>
			<div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
				<p
					className={`text-[11px] leading-snug ${
						malformed || (needsTema && !hasTema)
							? 'text-amber-300'
							: 'text-slate-500'
					}`}
				>
					{malformed
						? 'Escreva exatamente {tema}, minúsculo e sem espaços.'
						: needsTema && !hasTema
							? 'Falta o {tema}: sem ele, o pedido do aluno não entra.'
							: 'O que o aluno digitar entra no lugar de {tema}.'}
				</p>
				<span
					className={`text-[11px] tabular-nums ${
						len > PROMPT_LIMIT
							? 'text-rose-300'
							: len > PROMPT_WARN
								? 'text-amber-300'
								: 'text-slate-500'
					}`}
				>
					{len.toLocaleString('pt-BR')} / {PROMPT_LIMIT.toLocaleString('pt-BR')}
				</span>
			</div>
		</div>
	);
}
