'use client';

import { Check, Loader2, Plus, ShieldCheck, Store, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import {
	useAceitarTermo,
	useAddCanal,
	useRemoveCanal,
} from '../hooks/use-licensed-seller';
import type { Declaracao } from '../services/licensed-seller.service';
import { MONO } from './licenciada-ui';

/**
 * OS CANAIS DE VENDA E O TERMO — o formulário, sem a moldura.
 *
 * Ele aparece em dois lugares e é o MESMO em ambos: na seção do perfil, ao lado
 * de "Minha marca", que é onde a pessoa cadastra uma vez e esquece; e dentro da
 * Arte Licenciada, como portão, para quem chegou lá sem ter passado pelo perfil.
 *
 * Duas telas com dois formulários iguais divergiriam na primeira mudança — e o
 * que está sendo coletado aqui é uma declaração que vai para o licenciante.
 *
 * ┌─ ESTE CADASTRO NÃO É "MINHA MARCA" ─────────────────────────────────────┐
 * │ A seção vizinha no perfil é OPCIONAL de verdade: quem não configura vê   │
 * │ um convite e nada mais, sem aviso e sem pendência.                       │
 * │                                                                          │
 * │ Aqui é o contrário, e de propósito. Sem os canais e sem o aceite, a Arte │
 * │ Licenciada não gera — então o estado incompleto PRECISA aparecer como    │
 * │ pendência, senão a pessoa só descobre a regra quando a geração falhar.   │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * A `variante` existe porque as duas casas falam idiomas visuais diferentes: o
 * perfil é branco com violeta, a Arte Licenciada é acromática. Todo ramo aqui é
 * `licenciada ? <lá> : <perfil>`, nunca uma edição da marcação compartilhada.
 */

export type VarianteDoEditor = 'perfil' | 'licenciada';

interface Estilo {
	rotulo: string;
	campo: string;
	item: string;
	vazio: string;
	botao: string;
	acao: string;
	dica: string;
	texto: string;
	titulo: string;
	divisor: string;
}

const ESTILOS: Record<VarianteDoEditor, Estilo> = {
	perfil: {
		rotulo:
			'block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5',
		campo:
			'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 dark:border-white/10 dark:bg-[#141417] dark:text-white',
		item: 'flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10',
		vazio:
			'rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-gray-400',
		botao:
			'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5',
		acao: 'flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-40',
		dica: 'text-xs leading-relaxed text-slate-500 dark:text-gray-400',
		texto: 'text-sm text-slate-900 dark:text-white',
		titulo: 'font-semibold text-slate-900 dark:text-white',
		divisor: 'border-slate-200 dark:border-white/10',
	},
	licenciada: {
		rotulo: `${MONO} block text-[var(--al-mute)] mb-1.5`,
		campo:
			'w-full rounded-md border border-[var(--al-rule)] bg-[var(--al-ground)] px-3 py-2 text-sm text-[var(--al-ink)] outline-none placeholder:text-[var(--al-mute)] focus:border-[color-mix(in_srgb,var(--al-ink)_35%,transparent)]',
		item: 'flex items-center gap-2 rounded-md border border-[var(--al-rule)] px-3 py-2',
		vazio:
			'rounded-md border border-dashed border-[var(--al-rule)] px-4 py-6 text-center text-sm text-[var(--al-mute)]',
		botao:
			'inline-flex items-center gap-1.5 rounded-md border border-[var(--al-rule)] px-3 py-2 text-xs font-semibold text-[var(--al-ink)] transition-colors hover:border-[color-mix(in_srgb,var(--al-ink)_30%,transparent)] disabled:opacity-40',
		acao: 'flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--al-ink)] px-6 py-3 text-sm font-semibold text-[var(--al-ground)] transition-opacity hover:opacity-90 active:scale-[0.985] disabled:opacity-40',
		dica: 'text-xs leading-relaxed text-[var(--al-mute)]',
		texto: 'text-sm text-[var(--al-ink)]',
		titulo: 'font-semibold text-[var(--al-ink)]',
		divisor: 'border-[var(--al-rule)]',
	},
};

export function EcommercesEditor({
	declaracao,
	variante = 'perfil',
}: {
	declaracao: Declaracao;
	variante?: VarianteDoEditor;
}) {
	const e = ESTILOS[variante];
	const [url, setUrl] = useState('');
	const [label, setLabel] = useState('');
	const [li, setLi] = useState(false);
	const urlId = useId();
	const labelId = useId();

	const add = useAddCanal();
	const remove = useRemoveCanal();
	const aceitar = useAceitarTermo();

	const temCanal = declaracao.channels.length > 0;
	const podeAdicionar = url.trim().length > 3 && !add.isPending;

	const adicionar = async () => {
		if (!podeAdicionar) return;
		await add.mutateAsync({
			url: url.trim(),
			label: label.trim() || undefined,
		});
		setUrl('');
		setLabel('');
		// Mexer na lista vence o aceite anterior. Desmarcar deixa isso visível —
		// um checkbox marcado diria que a declaração cobre a lista nova, e não
		// cobre.
		setLi(false);
	};

	return (
		<div className="space-y-5">
			<div>
				{temCanal ? (
					<ul className="space-y-2">
						{declaracao.channels.map((c) => (
							<li key={c.id} className={e.item}>
								<Store className="h-3.5 w-3.5 shrink-0 opacity-60" />
								<span className="min-w-0 flex-1">
									<span className={`block truncate ${e.texto}`}>{c.url}</span>
									{c.label && <span className={e.dica}>{c.label}</span>}
								</span>
								<button
									type="button"
									onClick={async () => {
										await remove.mutateAsync(c.id);
										setLi(false);
									}}
									disabled={remove.isPending}
									title={`Tirar ${c.url} da lista`}
									className="shrink-0 rounded-md p-1.5 opacity-60 transition-opacity hover:opacity-100 disabled:opacity-30"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</button>
							</li>
						))}
					</ul>
				) : (
					<p className={e.vazio}>Nenhum canal informado ainda.</p>
				)}
			</div>

			<div className={`space-y-2 border-t pt-4 ${e.divisor}`}>
				<div>
					<label htmlFor={urlId} className={e.rotulo}>
						Link da loja, do marketplace ou do perfil
					</label>
					<input
						id={urlId}
						value={url}
						onChange={(ev) => setUrl(ev.target.value)}
						onKeyDown={(ev) => {
							if (ev.key === 'Enter') adicionar();
						}}
						placeholder="https://sualoja.com.br"
						className={e.campo}
					/>
				</div>
				<div>
					<label htmlFor={labelId} className={e.rotulo}>
						Como você chama esse canal (opcional)
					</label>
					<input
						id={labelId}
						value={label}
						onChange={(ev) => setLabel(ev.target.value)}
						placeholder="Shopee, minha loja, o perfil da oficina…"
						className={e.campo}
					/>
				</div>
				<button
					type="button"
					onClick={adicionar}
					disabled={!podeAdicionar}
					className={e.botao}
				>
					{add.isPending ? (
						<Loader2 className="h-3 w-3 animate-spin" />
					) : (
						<Plus className="h-3 w-3" />
					)}
					Adicionar canal
				</button>
				<p className={e.dica}>
					Informe todos: e-commerce, marketplace e o perfil onde você anuncia.
					Se você vende só presencialmente, informe o perfil que usa para
					divulgar.
				</p>
			</div>

			{/* ── o termo ── */}
			<div className={`border-t pt-4 ${e.divisor}`}>
				<div className="flex items-center justify-between gap-2">
					<p className={`${MONO} opacity-70`}>Termo de uso do licenciamento</p>
					<span className={`${MONO} opacity-70`}>
						versão {declaracao.terms.version}
					</span>
				</div>

				<ol className="mt-3 space-y-3">
					{declaracao.terms.clauses.map((c, i) => (
						<li key={c.titulo} className="flex gap-3">
							<span className={`${MONO} mt-0.5 shrink-0 opacity-60`}>
								{String(i + 1).padStart(2, '0')}
							</span>
							<span className={`${e.dica} text-sm`}>
								<strong className={e.titulo}>{c.titulo}</strong> {c.texto}
							</span>
						</li>
					))}
				</ol>

				<label
					className={`mt-4 flex cursor-pointer items-start gap-2.5 border-t pt-4 ${e.divisor}`}
				>
					<input
						type="checkbox"
						checked={li}
						onChange={(ev) => setLi(ev.target.checked)}
						className="mt-0.5 h-4 w-4 shrink-0 accent-violet-600"
					/>
					<span className={`${e.texto} leading-relaxed`}>
						Li o termo e declaro que a lista acima tem todos os canais onde eu
						vendo.
					</span>
				</label>

				<button
					type="button"
					onClick={() => aceitar.mutate()}
					disabled={!li || !temCanal || aceitar.isPending}
					className={`mt-4 ${e.acao}`}
				>
					{aceitar.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<ShieldCheck className="h-4 w-4" />
					)}
					{declaracao.accepted ? 'Confirmar a declaração' : 'Aceitar e salvar'}
				</button>

				{declaracao.accepted && (
					<p className={`${MONO} mt-3 text-center opacity-70`}>
						<Check className="mr-1 inline h-3 w-3" />
						Aceite anterior em{' '}
						{new Date(declaracao.accepted.at).toLocaleDateString('pt-BR')} ·
						versão {declaracao.accepted.version}
					</p>
				)}
			</div>
		</div>
	);
}
