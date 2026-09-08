'use client';

import {
	AlertTriangle,
	Check,
	ExternalLink,
	Loader2,
	Store,
} from 'lucide-react';
import { useState } from 'react';
import { useLicensedBrands } from '@/modules/tools/hooks/use-licensed-brands';
import { useVendedores } from '@/modules/tools/hooks/use-licensed-seller';

/**
 * VENDEDORES DECLARADOS (staff) — quem informou onde vende, e o quê.
 *
 * É a outra metade do relatório que vai para a mesa do clube: a volumetria diz
 * quantas peças de cada escudo saíram, esta tela diz onde elas aparecem.
 *
 * O filtro por marca não é conveniência, é o recorte ENTREGÁVEL: o clube não
 * tem nada a ver com quem nunca tocou no escudo dele.
 */
export function LicensedSellersView() {
	const [marca, setMarca] = useState('');
	const brands = useLicensedBrands();
	const { data, isLoading, isError } = useVendedores(marca || undefined);

	return (
		<div className="mx-auto max-w-5xl">
			<header className="mb-6">
				<h1 className="font-display text-xl font-bold tracking-[-0.01em]">
					Vendedores declarados
				</h1>
				<p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
					Onde cada aluno declarou que vende, e quando ele aceitou o termo do
					licenciamento.
				</p>
			</header>

			<div className="mb-4 flex flex-wrap items-center gap-2">
				<label
					htmlFor="marca"
					className="text-xs font-medium text-slate-500 dark:text-gray-400"
				>
					Marca
				</label>
				<select
					id="marca"
					value={marca}
					onChange={(e) => setMarca(e.target.value)}
					className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#1a1a1d]"
				>
					<option value="">Todos os vendedores</option>
					{(brands.data ?? []).map((b) => (
						<option key={b.id} value={b.feature_key}>
							{b.display_name}
						</option>
					))}
				</select>
				{marca && (
					<span className="text-xs text-slate-500 dark:text-gray-400">
						Só quem gerou peça desta marca.
					</span>
				)}
			</div>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
				</div>
			) : isError ? (
				<p className="rounded-xl border border-red-500/30 bg-red-500/5 px-6 py-10 text-center text-sm text-red-700 dark:text-red-400">
					Não foi possível carregar os vendedores.
				</p>
			) : (data?.length ?? 0) === 0 ? (
				<p className="rounded-xl border border-dashed border-slate-200 px-6 py-14 text-center text-sm text-slate-500 dark:border-white/10 dark:text-gray-400">
					{marca
						? 'Ninguém gerou peça desta marca ainda.'
						: 'Nenhum vendedor declarou canais ainda.'}
				</p>
			) : (
				<ul className="space-y-3">
					{data?.map((v) => (
						<li
							key={v.customerId}
							className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#1a1a1d]"
						>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<code className="font-mono text-xs text-slate-500 dark:text-gray-400">
									{v.customerId}
								</code>
								{v.upToDate ? (
									<span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
										<Check className="h-3.5 w-3.5" />
										Declaração em dia
									</span>
								) : (
									/* Declaração vencida NÃO é irregularidade: é o portão
									   funcionando. O aluno está barrado de gerar até
									   reconfirmar — e o clube precisa saber a diferença. */
									<span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
										<AlertTriangle className="h-3.5 w-3.5" />
										Pendente de reconfirmação
									</span>
								)}
							</div>

							<ul className="mt-3 space-y-1.5">
								{v.channels.map((c) => (
									<li key={c.url} className="flex items-center gap-2 text-sm">
										<Store className="h-3.5 w-3.5 shrink-0 text-slate-400" />
										<a
											href={c.url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex min-w-0 items-center gap-1 truncate text-violet-600 hover:underline dark:text-violet-400"
										>
											<span className="truncate">{c.url}</span>
											<ExternalLink className="h-3 w-3 shrink-0" />
										</a>
										{c.label && (
											<span className="shrink-0 text-xs text-slate-500 dark:text-gray-400">
												{c.label}
											</span>
										)}
									</li>
								))}
							</ul>

							<p className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-white/5 dark:text-gray-400">
								{v.acceptedAt
									? `Aceitou o termo ${v.acceptedVersion} em ${new Date(v.acceptedAt).toLocaleString('pt-BR')}`
									: 'Nunca aceitou o termo.'}
							</p>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
