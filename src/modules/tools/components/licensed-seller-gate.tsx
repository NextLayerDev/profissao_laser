'use client';

import { Check, Loader2, Plus, ShieldCheck, Store, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import {
	useAceitarTermo,
	useAddCanal,
	useRemoveCanal,
} from '../hooks/use-licensed-seller';
import type {
	Declaracao,
	StatusDaDeclaracao,
} from '../services/licensed-seller.service';
import { MONO } from './licenciada-ui';

/**
 * O PORTÃO DO VENDEDOR.
 *
 * Fica na frente da aba "Criar" e não da ferramenta inteira: quem já gerou
 * precisa continuar alcançando as próprias peças, porque o QR delas pode estar
 * gravado num chaveiro que já saiu daqui.
 *
 * A tela é UMA só para os quatro motivos de bloqueio, e o que muda é a frase do
 * topo. Fazer quatro telas seria repetir o mesmo formulário quatro vezes; não
 * dizer qual é o motivo seria deixar o aluno adivinhando o botão.
 */

const MOTIVO: Record<StatusDaDeclaracao, string> = {
	sem_canal:
		'Para gerar arte de marca, informe onde você vende. É o que a plataforma leva ao licenciante junto com a contagem de peças.',
	termo_pendente:
		'Falta ler e aceitar o termo abaixo. Ele é a declaração que acompanha o seu cadastro.',
	lista_mudou:
		'Sua lista de canais mudou depois do último aceite. Confirme o termo de novo — ele declara os canais que estão na lista hoje.',
	termo_mudou:
		'O termo de uso do licenciamento foi atualizado. Leia a nova redação e aceite para continuar.',
	ok: '',
};

const CAMPO =
	'w-full rounded-md border border-[var(--al-rule)] bg-[var(--al-ground)] px-3 py-2 text-sm text-[var(--al-ink)] outline-none placeholder:text-[var(--al-mute)] focus:border-[color-mix(in_srgb,var(--al-ink)_35%,transparent)]';

export function LicensedSellerGate({ declaracao }: { declaracao: Declaracao }) {
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
		// Mexer na lista vence o aceite; desmarcar deixa isso visível em vez de
		// o aluno clicar "aceitar" achando que já estava aceito.
		setLi(false);
	};

	return (
		<div className="mx-auto max-w-2xl space-y-6 py-4">
			<header className="space-y-2">
				<p className={`${MONO} text-[var(--al-mute)]`}>
					Antes de gerar — cadastro do vendedor
				</p>
				<h2 className="font-display text-xl font-bold tracking-[-0.01em] text-[var(--al-ink)]">
					Onde você vende?
				</h2>
				<p className="text-sm leading-relaxed text-[var(--al-mute)]">
					{MOTIVO[declaracao.status]}
				</p>
			</header>

			{/* ── os canais ── */}
			<section className="rounded-lg border border-[var(--al-rule)] bg-[var(--al-card)] p-4">
				<p className={`${MONO} text-[var(--al-mute)]`}>Seus canais de venda</p>

				{temCanal ? (
					<ul className="mt-3 space-y-2">
						{declaracao.channels.map((c) => (
							<li
								key={c.id}
								className="flex items-center gap-2 rounded-md border border-[var(--al-rule)] px-3 py-2"
							>
								<Store className="h-3.5 w-3.5 shrink-0 text-[var(--al-mute)]" />
								<span className="min-w-0 flex-1">
									<span className="block truncate text-sm text-[var(--al-ink)]">
										{c.url}
									</span>
									{c.label && (
										<span className={`${MONO} text-[var(--al-mute)]`}>
											{c.label}
										</span>
									)}
								</span>
								<button
									type="button"
									onClick={async () => {
										await remove.mutateAsync(c.id);
										setLi(false);
									}}
									disabled={remove.isPending}
									title={`Tirar ${c.url} da lista`}
									className="shrink-0 rounded-md p-1.5 text-[var(--al-mute)] transition-colors hover:text-[var(--al-ink)] disabled:opacity-40"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</button>
							</li>
						))}
					</ul>
				) : (
					<p className="mt-3 rounded-md border border-dashed border-[var(--al-rule)] px-4 py-6 text-center text-sm text-[var(--al-mute)]">
						Nenhum canal informado ainda.
					</p>
				)}

				<div className="mt-4 space-y-2 border-t border-[var(--al-rule)] pt-4">
					<label htmlFor={urlId} className={`${MONO} text-[var(--al-mute)]`}>
						Link da loja, do marketplace ou do perfil
					</label>
					<input
						id={urlId}
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') adicionar();
						}}
						placeholder="https://sualoja.com.br"
						className={CAMPO}
					/>
					<label htmlFor={labelId} className={`${MONO} text-[var(--al-mute)]`}>
						Como você chama esse canal (opcional)
					</label>
					<input
						id={labelId}
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						placeholder="Shopee, minha loja, o perfil da oficina…"
						className={CAMPO}
					/>
					<button
						type="button"
						onClick={adicionar}
						disabled={!podeAdicionar}
						className="inline-flex items-center gap-1.5 rounded-md border border-[var(--al-rule)] px-3 py-2 text-xs font-semibold text-[var(--al-ink)] transition-colors hover:border-[color-mix(in_srgb,var(--al-ink)_30%,transparent)] disabled:opacity-40"
					>
						{add.isPending ? (
							<Loader2 className="h-3 w-3 animate-spin" />
						) : (
							<Plus className="h-3 w-3" />
						)}
						Adicionar canal
					</button>
					<p className="text-xs leading-relaxed text-[var(--al-mute)]">
						Informe todos: e-commerce, marketplace e o perfil onde você anuncia.
						Se você vende só presencialmente, informe o perfil que usa para
						divulgar.
					</p>
				</div>
			</section>

			{/* ── o termo ── */}
			<section className="rounded-lg border border-[var(--al-rule)] bg-[var(--al-card)] p-4">
				<div className="flex items-center justify-between gap-2">
					<p className={`${MONO} text-[var(--al-mute)]`}>
						Termo de uso do licenciamento
					</p>
					<span className={`${MONO} text-[var(--al-mute)]`}>
						versão {declaracao.terms.version}
					</span>
				</div>

				<ol className="mt-3 space-y-3">
					{declaracao.terms.clauses.map((c, i) => (
						<li key={c.titulo} className="flex gap-3">
							<span className={`${MONO} mt-0.5 shrink-0 text-[var(--al-mute)]`}>
								{String(i + 1).padStart(2, '0')}
							</span>
							<span className="text-sm leading-relaxed text-[var(--al-mute)]">
								<strong className="font-semibold text-[var(--al-ink)]">
									{c.titulo}
								</strong>{' '}
								{c.texto}
							</span>
						</li>
					))}
				</ol>

				<label className="mt-4 flex cursor-pointer items-start gap-2.5 border-t border-[var(--al-rule)] pt-4">
					<input
						type="checkbox"
						checked={li}
						onChange={(e) => setLi(e.target.checked)}
						className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--al-seal)]"
					/>
					<span className="text-sm leading-relaxed text-[var(--al-ink)]">
						Li o termo e declaro que a lista acima tem todos os canais onde eu
						vendo.
					</span>
				</label>

				<button
					type="button"
					onClick={() => aceitar.mutate()}
					disabled={!li || !temCanal || aceitar.isPending}
					className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--al-ink)] px-6 py-3 text-sm font-semibold text-[var(--al-ground)] transition-opacity hover:opacity-90 active:scale-[0.985] disabled:opacity-40"
				>
					{aceitar.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<ShieldCheck className="h-4 w-4" />
					)}
					Aceitar e continuar
				</button>

				{declaracao.accepted && (
					<p className={`${MONO} mt-3 text-center text-[var(--al-mute)]`}>
						<Check className="mr-1 inline h-3 w-3" />
						Aceite anterior em{' '}
						{new Date(declaracao.accepted.at).toLocaleDateString('pt-BR')} ·
						versão {declaracao.accepted.version}
					</p>
				)}
			</section>
		</div>
	);
}
