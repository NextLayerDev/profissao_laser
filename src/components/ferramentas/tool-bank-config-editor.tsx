'use client';

import { Check, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type {
	BankConfig,
	BankFieldDef,
} from '@/modules/tools/services/tool-definitions.service';
import { inputCls } from './builder-ui';

/**
 * Editor da CONFIG do banco (MVP): liga/desliga o banco e edita os campos de
 * cada registro (`bank.fields`) + o mapa de injeção (`bank.inject`) — o que torna
 * o banco genérico ("criar isso e muito mais"). Salvar devolve um `BankConfig`
 * pro chamador persistir na definition (update + publish).
 */

const FIELD_TYPES: { value: BankFieldDef['type']; label: string }[] = [
	{ value: 'text', label: 'Texto' },
	{ value: 'textarea', label: 'Texto longo' },
	{ value: 'enum', label: 'Opções' },
	{ value: 'image', label: 'Imagem' },
];

const labelCls = 'mb-1.5 block text-[13px] font-medium text-slate-300';
const small =
	'h-9 rounded-lg border border-white/10 bg-black/30 px-2.5 text-xs text-slate-200 focus-visible:outline-none focus-visible:border-emerald-400/50 focus-visible:ring-2 focus-visible:ring-emerald-400/30';

/** Campo + id estável de UI (só pro React key; removido ao salvar). */
type RowField = BankFieldDef & { _uid: number };

let uidSeq = 0;
const nextUid = () => {
	uidSeq += 1;
	return uidSeq;
};

function blankField(i: number): RowField {
	return {
		_uid: nextUid(),
		name: `campo_${i}`,
		label: 'Novo campo',
		type: 'text',
	};
}

function slug(s: string): string {
	return s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
}

export function ToolBankConfigEditor({
	config,
	saving,
	onSave,
	onClose,
}: {
	config: BankConfig;
	saving?: boolean;
	onSave: (config: BankConfig) => void;
	onClose: () => void;
}) {
	const [enabled, setEnabled] = useState(config.enabled);
	const [fields, setFields] = useState<RowField[]>(() =>
		(config.fields ?? []).map((f) => ({ ...f, _uid: nextUid() })),
	);
	const [card, setCard] = useState(config.card ?? {});
	const [inject, setInject] = useState<
		Record<string, { from: string; substitute?: boolean }>
	>(config.inject ?? {});

	const patchField = (i: number, p: Partial<BankFieldDef>) =>
		setFields((fs) => fs.map((f, idx) => (idx === i ? { ...f, ...p } : f)));
	const removeField = (i: number) =>
		setFields((fs) => fs.filter((_, idx) => idx !== i));
	const addField = () => setFields((fs) => [...fs, blankField(fs.length)]);

	const injectKeys = Object.keys(inject);
	const addInject = () =>
		setInject((m) => ({
			...m,
			[`entrada_${injectKeys.length}`]: { from: '' },
		}));
	const patchInject = (
		key: string,
		p: Partial<{ from: string; substitute?: boolean }>,
	) => setInject((m) => ({ ...m, [key]: { ...m[key], ...p } }));
	const renameInject = (oldKey: string, newKey: string) =>
		setInject((m) => {
			const next: typeof m = {};
			for (const [k, v] of Object.entries(m))
				next[k === oldKey ? newKey : k] = v;
			return next;
		});
	const removeInject = (key: string) =>
		setInject((m) => {
			const next = { ...m };
			delete next[key];
			return next;
		});

	const save = () => {
		const cleanFields: BankFieldDef[] = fields.map(({ _uid, ...f }) => ({
			...f,
			name: slug(f.name) || f.name,
			options:
				f.type === 'enum'
					? (f.options ?? []).map((o) => o.trim()).filter(Boolean)
					: undefined,
		}));
		onSave({
			enabled,
			fields: cleanFields,
			card,
			inject,
		});
	};

	return (
		<div className="space-y-5 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#0e1217] to-[#0a0c10] p-6">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-white">Configurar banco</h3>
				<button
					type="button"
					onClick={onClose}
					className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			{/* Enable */}
			<button
				type="button"
				onClick={() => setEnabled((v) => !v)}
				className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
					enabled
						? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
						: 'border-white/10 bg-white/5 text-slate-300'
				}`}
			>
				<span>
					Banco {enabled ? 'ativado' : 'desativado'}
					<span className="ml-2 font-normal text-slate-400">
						{enabled
							? 'a galeria aparece pro cliente'
							: 'os registros ficam ocultos'}
					</span>
				</span>
				<span
					className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${enabled ? 'bg-emerald-500/40' : 'bg-white/10'}`}
				>
					<span
						className={`h-5 w-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : ''}`}
					/>
				</span>
			</button>

			{/* Campos do registro */}
			<div className="space-y-3 border-t border-white/[0.06] pt-5">
				<div className="flex items-center justify-between">
					<p className="font-mono text-[11px] uppercase tracking-widest text-fuchsia-300/80">
						Campos do registro
					</p>
					<button
						type="button"
						onClick={addField}
						className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10"
					>
						<Plus className="h-3.5 w-3.5" /> Campo
					</button>
				</div>

				{fields.length === 0 && (
					<p className="text-xs text-slate-500">
						Nenhum campo. Adicione os campos próprios de cada registro (ex.:
						prompt, modo).
					</p>
				)}

				{fields.map((f, i) => (
					<div
						key={f._uid}
						className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3"
					>
						<div className="flex flex-wrap items-end gap-2">
							<label className="flex flex-col gap-1">
								<span className="text-[10px] uppercase text-slate-500">
									Nome (chave)
								</span>
								<input
									value={f.name}
									onChange={(e) => patchField(i, { name: e.target.value })}
									className={`${small} w-32 font-mono`}
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span className="text-[10px] uppercase text-slate-500">
									Rótulo
								</span>
								<input
									value={f.label ?? ''}
									onChange={(e) => patchField(i, { label: e.target.value })}
									className={`${small} w-36`}
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span className="text-[10px] uppercase text-slate-500">
									Tipo
								</span>
								<select
									value={f.type}
									onChange={(e) =>
										patchField(i, {
											type: e.target.value as BankFieldDef['type'],
										})
									}
									className={small}
								>
									{FIELD_TYPES.map((t) => (
										<option key={t.value} value={t.value}>
											{t.label}
										</option>
									))}
								</select>
							</label>
							<label className="flex items-center gap-1.5 pb-2 text-[11px] text-slate-400">
								<input
									type="checkbox"
									checked={!!f.required}
									onChange={(e) =>
										patchField(i, { required: e.target.checked })
									}
									className="accent-fuchsia-500"
								/>
								obrigatório
							</label>
							<button
								type="button"
								onClick={() => removeField(i)}
								className="ml-auto mb-1 rounded p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
							>
								<Trash2 className="h-3.5 w-3.5" />
							</button>
						</div>
						{f.type === 'enum' && (
							<input
								value={(f.options ?? []).join(', ')}
								onChange={(e) =>
									patchField(i, { options: e.target.value.split(',') })
								}
								placeholder="opções separadas por vírgula"
								className={`${small} w-full`}
							/>
						)}
						<input
							value={f.placeholder ?? ''}
							onChange={(e) => patchField(i, { placeholder: e.target.value })}
							placeholder="placeholder (opcional)"
							className={`${small} w-full`}
						/>
					</div>
				))}
			</div>

			{/* Card mapping */}
			<div className="space-y-3 border-t border-white/[0.06] pt-5">
				<p className="font-mono text-[11px] uppercase tracking-widest text-slate-400/80">
					Card (o que o cliente vê)
				</p>
				<div className="grid gap-3 sm:grid-cols-2">
					<label className="flex flex-col gap-1">
						<span className={labelCls}>Imagem do card</span>
						<input
							value={card.image ?? ''}
							onChange={(e) => setCard({ ...card, image: e.target.value })}
							placeholder="example_after_url"
							className={`${inputCls} font-mono`}
						/>
					</label>
					<label className="flex flex-col gap-1">
						<span className={labelCls}>Título</span>
						<input
							value={card.title ?? ''}
							onChange={(e) => setCard({ ...card, title: e.target.value })}
							placeholder="title"
							className={`${inputCls} font-mono`}
						/>
					</label>
					<label className="flex flex-col gap-1">
						<span className={labelCls}>Subtítulo</span>
						<input
							value={card.subtitle ?? ''}
							onChange={(e) => setCard({ ...card, subtitle: e.target.value })}
							placeholder="description"
							className={`${inputCls} font-mono`}
						/>
					</label>
					<label className="flex flex-col gap-1">
						<span className={labelCls}>Categoria</span>
						<input
							value={card.category ?? ''}
							onChange={(e) => setCard({ ...card, category: e.target.value })}
							placeholder="category"
							className={`${inputCls} font-mono`}
						/>
					</label>
				</div>
			</div>

			{/* Inject map */}
			<div className="space-y-3 border-t border-white/[0.06] pt-5">
				<div className="flex items-center justify-between">
					<p className="font-mono text-[11px] uppercase tracking-widest text-slate-400/80">
						Injeção no motor
					</p>
					<button
						type="button"
						onClick={addInject}
						className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10"
					>
						<Plus className="h-3.5 w-3.5" /> Mapeamento
					</button>
				</div>
				<p className="text-[11px] text-slate-500">
					Diz como os campos do registro entram no run (ex.: entrada{' '}
					<code className="text-slate-300">prompt</code> vem de{' '}
					<code className="text-slate-300">prompt_script</code>, substituindo{' '}
					<code className="text-slate-300">{'{tema}'}</code>).
				</p>
				{injectKeys.map((key) => (
					<div
						key={key}
						className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5"
					>
						<input
							value={key}
							onChange={(e) => renameInject(key, e.target.value)}
							placeholder="entrada do bloco"
							className={`${small} w-32 font-mono`}
						/>
						<span className="text-slate-500">←</span>
						<input
							value={inject[key].from}
							onChange={(e) => patchInject(key, { from: e.target.value })}
							placeholder="campo do registro"
							className={`${small} w-36 font-mono`}
						/>
						<label className="flex items-center gap-1.5 text-[11px] text-slate-400">
							<input
								type="checkbox"
								checked={!!inject[key].substitute}
								onChange={(e) =>
									patchInject(key, { substitute: e.target.checked })
								}
								className="accent-fuchsia-500"
							/>
							substituir {'{tema}'}
						</label>
						<button
							type="button"
							onClick={() => removeInject(key)}
							className="ml-auto rounded p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</button>
					</div>
				))}
			</div>

			<div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-4">
				<button
					type="button"
					onClick={onClose}
					className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
				>
					Cancelar
				</button>
				<button
					type="button"
					onClick={save}
					disabled={saving}
					className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-sm font-bold text-[#06120f] shadow-lg shadow-emerald-500/20 disabled:opacity-50"
				>
					{saving ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Check className="h-4 w-4" />
					)}
					Salvar e publicar
				</button>
			</div>
		</div>
	);
}
