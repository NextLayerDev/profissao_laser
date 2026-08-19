'use client';

import { BadgeCheck, ImageUp, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import {
	useDeleteLicensedBrand,
	useLicensedBrands,
	useSaveLicensedBrand,
} from '@/modules/tools/hooks/use-licensed-brands';
import {
	FEATURE_KEY_RE,
	type LicensedBrand,
} from '@/modules/tools/services/licensed-brand.service';

interface Form {
	id?: string;
	feature_key: string;
	display_name: string;
	active: boolean;
	notes: string;
	crest: File | null;
	mascot: File | null;
}

const VAZIO: Form = {
	feature_key: '',
	display_name: '',
	active: true,
	notes: '',
	crest: null,
	mascot: null,
};

/**
 * Cadastro das marcas licenciadas.
 *
 * O escudo pertence à MARCA, não ao prompt: cadastrar aqui uma vez serve todos
 * os prompts que apontarem para a mesma chave, e trocar a arte oficial atualiza
 * todos de uma vez.
 */
export function LicensedBrandsView() {
	const { data: marcas, isLoading, error } = useLicensedBrands();
	const salvar = useSaveLicensedBrand();
	const remover = useDeleteLicensedBrand();
	const [form, setForm] = useState<Form | null>(null);

	const abrirNova = () => setForm({ ...VAZIO });
	const abrirEdicao = (m: LicensedBrand) =>
		setForm({
			id: m.id,
			feature_key: m.feature_key,
			display_name: m.display_name,
			active: m.active,
			notes: m.notes ?? '',
			crest: null,
			mascot: null,
		});

	const chaveValida = form
		? FEATURE_KEY_RE.test(form.feature_key.trim())
		: true;
	const editando = !!form?.id;
	// Na criação o escudo é obrigatório; na edição, o que já está lá continua
	// valendo se nenhum arquivo novo for escolhido.
	const podeSalvar =
		!!form &&
		chaveValida &&
		!!form.display_name.trim() &&
		(editando || !!form.crest);

	const enviar = async () => {
		if (!form || !podeSalvar) return;
		await salvar.mutateAsync({
			id: form.id,
			feature_key: form.feature_key,
			display_name: form.display_name,
			active: form.active,
			notes: form.notes,
			crest: form.crest,
			mascot: form.mascot,
		});
		setForm(null);
	};

	return (
		<div className="mx-auto max-w-5xl">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="font-display text-2xl font-bold tracking-tight">
						Marcas licenciadas
					</h1>
					<p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
						O escudo cadastrado aqui vale para todos os prompts que usarem a
						mesma chave. Trocar a arte oficial atualiza todos de uma vez.
					</p>
				</div>
				<button
					type="button"
					onClick={abrirNova}
					className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
				>
					<Plus className="h-4 w-4" />
					Nova marca
				</button>
			</div>

			{isLoading && (
				<div className="mt-10 flex justify-center">
					<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
				</div>
			)}

			{error && (
				<p className="mt-10 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/5 dark:text-red-400">
					Não foi possível carregar as marcas.
				</p>
			)}

			{marcas && marcas.length === 0 && (
				<div className="mt-10 rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-white/15">
					<p className="font-display text-lg font-semibold">
						Nenhuma marca cadastrada.
					</p>
					<p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
						Cadastre a primeira para os prompts licenciados funcionarem.
					</p>
				</div>
			)}

			{marcas && marcas.length > 0 && (
				<div className="mt-8 grid gap-3 sm:grid-cols-2">
					{marcas.map((m) => (
						<article
							key={m.id}
							className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#1a1a1d]"
						>
							<div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/5">
								{m.crest_url ? (
									/* <img> intencional: a arte vem de CDN dinâmico. */
									<img
										src={m.crest_url}
										alt={m.display_name}
										className="h-full w-full object-contain p-1"
									/>
								) : (
									<div className="flex h-full items-center justify-center">
										<ImageUp className="h-5 w-5 text-slate-400" />
									</div>
								)}
							</div>

							<div className="min-w-0 flex-1">
								<p className="flex items-center gap-1.5 font-semibold">
									<span className="truncate">{m.display_name}</span>
									{m.active ? (
										<BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
									) : null}
								</p>
								<p className="font-mono mt-0.5 truncate text-xs text-slate-500 dark:text-gray-400">
									{m.feature_key}
								</p>
								{!m.active && (
									<p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
										Inativa — não gera peça nova
									</p>
								)}
							</div>

							<div className="flex shrink-0 gap-1">
								<button
									type="button"
									onClick={() => abrirEdicao(m)}
									className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium transition-colors hover:border-violet-400 dark:border-white/15"
								>
									Editar
								</button>
								<button
									type="button"
									onClick={() => {
										// Confirmação porque apagar a marca deixa os prompts que
										// apontam para ela sem arte — e eles param de gerar.
										if (
											window.confirm(
												`Remover "${m.display_name}"? Os prompts que usam ${m.feature_key} param de gerar.`,
											)
										) {
											remover.mutate(m.id);
										}
									}}
									aria-label={`Remover ${m.display_name}`}
									className="rounded-lg border border-slate-200 px-2 py-1.5 text-slate-500 transition-colors hover:border-red-400 hover:text-red-500 dark:border-white/15"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</button>
							</div>
						</article>
					))}
				</div>
			)}

			{form && (
				<div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8">
					<div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#1a1a1d]">
						<div className="flex items-start justify-between">
							<h2 className="font-display text-lg font-bold">
								{editando ? 'Editar marca' : 'Nova marca'}
							</h2>
							<button
								type="button"
								onClick={() => setForm(null)}
								aria-label="Fechar"
								className="rounded-lg p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						<div className="mt-5 space-y-4">
							<Campo
								label="Chave da marca"
								hint="Formato tipo:nome, ex.: clube:corinthians. Não pode ser renomeada depois de emitida — o QR já gravado nas peças aponta para ela."
								erro={
									form.feature_key.trim() && !chaveValida
										? 'Use o formato tipo:nome, só minúsculas.'
										: null
								}
							>
								<input
									value={form.feature_key}
									onChange={(e) =>
										setForm({ ...form, feature_key: e.target.value })
									}
									placeholder="clube:corinthians"
									className="font-mono w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111114] dark:text-white"
								/>
							</Campo>

							<Campo
								label="Nome para o público"
								hint="É o que aparece na página do QR. Ninguém quer ler clube:corinthians."
							>
								<input
									value={form.display_name}
									onChange={(e) =>
										setForm({ ...form, display_name: e.target.value })
									}
									placeholder="Corinthians"
									className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111114] dark:text-white"
								/>
							</Campo>

							<div className="grid gap-4 sm:grid-cols-2">
								<Arquivo
									label={`Escudo / logo oficial${editando ? '' : ' *'}`}
									hint={
										editando ? 'Deixe vazio para manter o atual.' : undefined
									}
									file={form.crest}
									onPick={(f) => setForm({ ...form, crest: f })}
								/>
								<Arquivo
									label="Mascote (opcional)"
									file={form.mascot}
									onPick={(f) => setForm({ ...form, mascot: f })}
								/>
							</div>

							<Campo label="Observações">
								<textarea
									value={form.notes}
									onChange={(e) => setForm({ ...form, notes: e.target.value })}
									rows={2}
									placeholder="Contrato, validade, contato do licenciante…"
									className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111114] dark:text-white"
								/>
							</Campo>

							<label className="flex items-start gap-2 text-sm">
								<input
									type="checkbox"
									checked={form.active}
									onChange={(e) =>
										setForm({ ...form, active: e.target.checked })
									}
									className="mt-0.5 accent-violet-600"
								/>
								<span>
									Ativa
									<span className="mt-0.5 block text-xs text-slate-500 dark:text-gray-400">
										Desligar impede gerar peça nova. As peças já emitidas
										continuam verificáveis pelo QR.
									</span>
								</span>
							</label>
						</div>

						<div className="mt-6 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setForm(null)}
								className="rounded-lg border border-slate-200 px-4 py-2 text-sm dark:border-white/15"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={enviar}
								disabled={!podeSalvar || salvar.isPending}
								className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
							>
								{salvar.isPending ? 'Salvando…' : 'Salvar'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function Campo({
	label,
	hint,
	erro,
	children,
}: {
	label: string;
	hint?: string;
	erro?: string | null;
	children: React.ReactNode;
}) {
	return (
		<div>
			<span className="mb-1 block text-sm font-medium">{label}</span>
			{children}
			{erro ? (
				<p className="mt-1 text-xs text-red-600 dark:text-red-400">{erro}</p>
			) : hint ? (
				<p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{hint}</p>
			) : null}
		</div>
	);
}

function Arquivo({
	label,
	hint,
	file,
	onPick,
}: {
	label: string;
	hint?: string;
	file: File | null;
	onPick: (f: File | null) => void;
}) {
	return (
		<div>
			<span className="mb-1 block text-sm font-medium">{label}</span>
			<label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-xs text-slate-500 transition-colors hover:border-violet-400 dark:border-white/15 dark:text-gray-400">
				<ImageUp className="h-4 w-4 shrink-0" />
				<span className="truncate">
					{file ? file.name : 'Escolher arquivo'}
				</span>
				<input
					type="file"
					accept="image/png,image/jpeg,image/webp,image/svg+xml"
					onChange={(e) => onPick(e.target.files?.[0] ?? null)}
					className="hidden"
				/>
			</label>
			{hint && (
				<p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{hint}</p>
			)}
		</div>
	);
}
