'use client';

import { Check, Loader2, Search, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CreationTemplatePreview } from '@/modules/tools/components/creation-template-preview';
import {
	type PhoneSuggestion,
	suggestPhone,
	suggestPopularPhones,
} from '@/modules/tools/services/tool-bank.service';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { fieldCls, ghostBtn, hintCls, primaryBtn } from './ui';

const mm = (n: number) =>
	n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/**
 * CADASTRO DE CELULAR PELO NOME. O admin digita "Galaxy A26"; a IA pesquisa na
 * web as medidas e onde fica a câmera e devolve o molde pronto. Ele só olha o
 * desenho e confirma. "Sugerir os que faltam" lista os mais vendidos que ainda
 * não estão na biblioteca — um clique em cada um faz a mesma busca.
 */
export function PhoneFinder({
	existing,
	onAdd,
}: {
	existing: string[];
	onAdd: (p: PhoneSuggestion) => void;
}) {
	const [name, setName] = useState('');
	const [busy, setBusy] = useState<string | null>(null);
	const [found, setFound] = useState<PhoneSuggestion | null>(null);
	/** O nome pesquisado: a IA pode devolver "Moto G85 5G" para "Moto G85". */
	const [asked, setAsked] = useState('');
	const [popular, setPopular] = useState<string[] | null>(null);
	const [loadingPopular, setLoadingPopular] = useState(false);

	const search = async (raw: string) => {
		const q = raw.trim();
		if (q.length < 2) return;
		const dup = existing.find((e) => e.toLowerCase() === q.toLowerCase());
		if (dup) return toast.info(`${dup} já está na lista.`);
		setBusy(q);
		setAsked(q);
		setFound(null);
		try {
			setFound(await suggestPhone(q));
		} catch (err) {
			toast.error(getApiErrorMessage(err, 'Não encontrei esse celular.'));
		} finally {
			setBusy(null);
		}
	};

	const loadPopular = async () => {
		setLoadingPopular(true);
		try {
			setPopular(await suggestPopularPhones(existing));
		} catch (err) {
			toast.error(
				getApiErrorMessage(err, 'Não consegui buscar a lista agora.'),
			);
		} finally {
			setLoadingPopular(false);
		}
	};

	const confirm = () => {
		if (!found) return;
		onAdd(found);
		const done = [asked, found.label].map((n) => n.toLowerCase());
		setPopular((p) => p?.filter((n) => !done.includes(n.toLowerCase())) ?? p);
		setFound(null);
		setName('');
	};

	return (
		<div className="space-y-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-3">
			<form
				className="flex flex-wrap gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					search(name);
				}}
			>
				<div className="relative min-w-[200px] flex-1">
					<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Qual celular? Ex.: Galaxy A26, iPhone 16 Pro…"
						className={`${fieldCls} pl-9`}
						aria-label="Nome do celular"
					/>
				</div>
				<button
					type="submit"
					className={primaryBtn}
					disabled={!!busy || name.trim().length < 2}
				>
					{busy ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Sparkles className="h-4 w-4" />
					)}
					Adicionar
				</button>
			</form>

			{busy && (
				<p className="text-[12px] text-slate-400">
					Pesquisando as medidas do {busy}… leva uns 10 segundos.
				</p>
			)}

			{found && (
				<div className="flex flex-wrap items-center gap-4 rounded-lg bg-black/30 p-3">
					<CreationTemplatePreview
						template={found.template}
						label={found.label}
						className="h-28 w-auto shrink-0"
					/>
					<div className="min-w-0 flex-1 space-y-1">
						<p className="text-sm font-semibold text-slate-100">
							{found.label}{' '}
							<span className="font-normal text-slate-500">{found.brand}</span>
						</p>
						<p className="text-[12px] text-slate-400">
							{mm(found.template.width_mm)} × {mm(found.template.height_mm)} mm
							· câmera marcada em vermelho
						</p>
						{found.note && <p className={hintCls}>{found.note}</p>}
						<div className="flex gap-2 pt-1">
							<button type="button" className={primaryBtn} onClick={confirm}>
								<Check className="h-4 w-4" /> Está certo, adicionar
							</button>
							<button
								type="button"
								className={ghostBtn}
								onClick={() => setFound(null)}
							>
								<X className="h-4 w-4" /> Descartar
							</button>
						</div>
					</div>
				</div>
			)}

			{popular === null ? (
				<button
					type="button"
					onClick={loadPopular}
					disabled={loadingPopular}
					className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-300 hover:text-emerald-200"
				>
					{loadingPopular ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<Sparkles className="h-3.5 w-3.5" />
					)}
					Sugerir os mais vendidos que ainda faltam
				</button>
			) : popular.length === 0 ? (
				<p className={hintCls}>Os mais vendidos já estão todos na lista.</p>
			) : (
				<div className="flex flex-wrap items-center gap-1.5">
					<span className="text-[11px] text-slate-500">Faltam:</span>
					{popular.map((p) => (
						<button
							key={p}
							type="button"
							disabled={!!busy}
							onClick={() => {
								setName(p);
								search(p);
							}}
							className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[12px] text-slate-200 hover:border-emerald-400/40 disabled:opacity-50"
						>
							+ {p}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
