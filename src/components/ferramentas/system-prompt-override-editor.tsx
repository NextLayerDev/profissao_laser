'use client';

import { RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Field } from '@/components/ferramentas/builder-ui';
import { DEFAULT_IMAGE_SYSTEM_PROMPT_FRONT } from '@/lib/image-models-catalog-defaults';

/**
 * Editor do `definition.system_prompt` (override per-tool do system prompt
 * enviado ao `ai.generate_image`). Substitui (não concatena) o prompt laser
 * padrão quando preenchido.
 *
 * Props:
 *  - `value`: prompt atual. `null`/`undefined`/vazio = default (laser).
 *  - `onChange(prompt)`: callback; passar `null` apaga o override.
 */

const areaCls =
	'w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 font-mono text-[12px] leading-relaxed text-slate-100 placeholder:text-slate-500 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/30';

export interface SystemPromptOverrideEditorProps {
	value: string | null | undefined;
	onChange: (prompt: string | null) => void;
	disabled?: boolean;
}

export function SystemPromptOverrideEditor({
	value,
	onChange,
	disabled,
}: SystemPromptOverrideEditorProps) {
	const [draft, setDraft] = useState<string>(value ?? '');
	const isDirty = draft !== (value ?? '');

	// Sincroniza o `draft` quando o `value` mudar externamente (ex.: query refetch
	// após `setToolSystemPromptMut` invalidar a cache). Sem isso o textarea fica
	// "preso" no estado local após o save e o usuário precisa recarregar a página
	// pra ver o valor novo persistido.
	useEffect(() => {
		setDraft(value ?? '');
	}, [value]);

	return (
		<Field
			label="System prompt (opcional)"
			hint="Sobrescreve o prompt de aderência a laser. Deixe vazio para usar o padrão."
		>
			<div className="space-y-2.5">
				<textarea
					rows={8}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					placeholder={DEFAULT_IMAGE_SYSTEM_PROMPT_FRONT}
					disabled={disabled}
					className={`${areaCls} resize-y ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
				/>

				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						disabled={!isDirty || disabled}
						onClick={() => onChange(draft.trim() === '' ? null : draft)}
						className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[12px] font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Salvar override
					</button>
					<button
						type="button"
						disabled={disabled}
						onClick={() => {
							setDraft(DEFAULT_IMAGE_SYSTEM_PROMPT_FRONT);
							onChange(DEFAULT_IMAGE_SYSTEM_PROMPT_FRONT);
						}}
						className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-[12px] font-semibold text-slate-300 transition-colors hover:bg-black/50 disabled:cursor-not-allowed disabled:opacity-40"
					>
						<RotateCcw className="h-3.5 w-3.5" />
						Restaurar padrão laser
					</button>
					<button
						type="button"
						disabled={!value || disabled}
						onClick={() => {
							setDraft('');
							onChange(null);
						}}
						className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-[12px] font-semibold text-slate-400 transition-colors hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
					>
						<Trash2 className="h-3.5 w-3.5" />
						Limpar (volta ao default)
					</button>
				</div>

				{value && value !== DEFAULT_IMAGE_SYSTEM_PROMPT_FRONT && (
					<p className="text-[11px] text-amber-300/80">
						⚠ Override ativo. O motor NÃO aplica o prompt laser padrão a esta
						tool.
					</p>
				)}
			</div>
		</Field>
	);
}
