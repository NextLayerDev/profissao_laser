'use client';

import { ArrowLeft, ImageOff, Loader2 } from 'lucide-react';
import { type CSSProperties, type ReactNode, useMemo, useState } from 'react';
import { useLicensedBrands } from '../hooks/use-licensed-brands';
import {
	coverOf,
	maxImagesOf,
	modeLabel,
	modeOf,
	modeUsesImage,
} from '../lib/prompt-bank';
import type { ResolvedScreenUi } from '../lib/screen-ui';
import type { LicensedBrand } from '../services/licensed-brand.service';
import type { ToolBankEntry } from '../services/tool-bank.service';
import { MyLicensedArtLibrary } from './my-licensed-art-library';
import { ScreenNotice } from './screen-notice';

/**
 * A tela de abertura da Arte Licenciada.
 *
 * Ela NÃO é uma galeria de prompts, e essa é a única decisão que explica o
 * resto: quem abre esta ferramenta não pensa "vou escolher um prompt", pensa
 * "hoje vou fazer peça do Corinthians". A marca é a primeira pergunta; o
 * modelo é a segunda.
 *
 * Por isso o cromo é acromático. Os escudos trazem cor forte e conflitante
 * (preto e vermelho, verde, rubro-negro) — qualquer acento próprio brigaria com
 * todos eles. A única cor da tela vem da marca, e o verde do selo aparece só
 * onde significa "licença ativa", nunca como enfeite.
 */

/* ── Vocabulário fixo ──────────────────────────────────────────────────────
   modelo = o prompt que o staff cadastrou · peça = o que o aluno gerou.
   Cada palavra tem um significado só, do começo ao fim do fluxo. */

/** Paleta da tela. Definida aqui, e não no globals, porque só esta tela usa. */
const PALETA = {
	'--al-ground': '#14161a',
	'--al-card': '#1b1e24',
	'--al-rule': '#2a2f38',
	'--al-ink': '#e8eaed',
	'--al-mute': '#8c94a1',
	'--al-seal': '#1f9d5b',
} as CSSProperties;

/** Cor de fundo do campo do escudo quando a marca não tem cor cadastrada. */
const CAMPO_NEUTRO = '#22262e';

const MONO = 'font-mono text-[11px] uppercase tracking-[0.16em] leading-none';

function chaveDaEntrada(entry: ToolBankEntry): string | null {
	const k = (entry.data as Record<string, unknown>)?.feature_key;
	return typeof k === 'string' && k.trim() ? k.trim() : null;
}

/** `RÓTULO ····· VALOR` — o bloco de dados de um certificado. */
function LinhaDeRegistro({
	rotulo,
	children,
}: {
	rotulo: string;
	children: ReactNode;
}) {
	return (
		<div className="flex items-baseline gap-2">
			<span className={`${MONO} shrink-0 text-[var(--al-mute)]`}>{rotulo}</span>
			<span
				aria-hidden
				className="min-w-3 flex-1 -translate-y-[3px] border-b border-dotted border-[var(--al-rule)]"
			/>
			<span className={`${MONO} shrink-0 text-[var(--al-ink)]`}>
				{children}
			</span>
		</div>
	);
}

/** "LICENÇA ATIVA" — palavra primeiro, cor depois (não dá para ler só a cor). */
function SeloAtivo() {
	return (
		<span className={`${MONO} inline-flex items-center gap-1.5`}>
			<span
				aria-hidden
				className="h-1.5 w-1.5 rounded-full bg-[var(--al-seal)]"
			/>
			<span className="text-[var(--al-seal)]">Licença ativa</span>
		</span>
	);
}

function contarModelos(n: number): string {
	return n === 1 ? '1 modelo' : `${n} modelos`;
}

/* ───────────────────── O campo do escudo (a assinatura) ───────────────────── */

function CampoDaMarca({
	marca,
	modelos,
	onSelect,
	delay,
}: {
	marca: LicensedBrand;
	modelos: number;
	onSelect: () => void;
	delay: number;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			style={{ animationDelay: `${delay}ms` }}
			className="group animate-fade-in-up overflow-hidden rounded-lg border border-[var(--al-rule)] bg-[var(--al-card)] text-left transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--al-ground)] active:scale-[0.985]"
		>
			{/* O escudo na cor oficial do clube, com margem larga — a página de
			    manual de marca. No hover o campo pressiona, como um carimbo. */}
			<div
				className="flex aspect-[4/3] items-center justify-center p-8 transition-all duration-200 group-hover:scale-[0.99] group-hover:shadow-[inset_0_2px_24px_rgba(0,0,0,0.45)]"
				style={{ backgroundColor: marca.accent_color || CAMPO_NEUTRO }}
			>
				{marca.crest_url ? (
					/* <img> intencional: a arte vem de CDN dinâmico. */
					<img
						src={marca.crest_url}
						alt=""
						className="max-h-full max-w-full object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
					/>
				) : (
					<ImageOff className="h-8 w-8 text-white/25" />
				)}
			</div>

			<div className="border-t border-[var(--al-rule)] px-4 py-3">
				<p className="font-display truncate text-[15px] font-bold tracking-[-0.01em] text-[var(--al-ink)]">
					{marca.display_name}
				</p>
				<p
					className={`${MONO} mt-2 flex items-center gap-2 text-[var(--al-mute)]`}
				>
					<span>{contarModelos(modelos)}</span>
					<span aria-hidden className="text-[var(--al-rule)]">
						·
					</span>
					<SeloAtivo />
				</p>
			</div>
		</button>
	);
}

/* ───────────────────────── Um modelo daquela marca ───────────────────────── */

function CartaoDoModelo({
	entry,
	marca,
	onSelect,
	delay,
}: {
	entry: ToolBankEntry;
	marca: LicensedBrand;
	onSelect: () => void;
	delay: number;
}) {
	const capa = coverOf(entry);
	const mode = modeOf(entry);
	const imagens = maxImagesOf(entry);

	return (
		<button
			type="button"
			onClick={onSelect}
			style={{ animationDelay: `${delay}ms` }}
			className="group animate-fade-in-up overflow-hidden rounded-lg border border-[var(--al-rule)] bg-[var(--al-card)] text-left transition-colors duration-150 hover:border-[var(--screen-accent,var(--al-mute))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--al-ground)]"
		>
			<div className="aspect-[4/3] overflow-hidden bg-[#101216]">
				{capa ? (
					/* <img> intencional: a arte vem de CDN dinâmico. */
					<img
						src={capa}
						alt=""
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
					/>
				) : marca.crest_url ? (
					/* Sem exemplo cadastrado, o lugar da prévia recebe o escudo apagado
					   — marca de água, não amostra. Um retângulo vazio do tamanho de
					   uma foto promete uma imagem que não existe. */
					<div className="flex h-full items-center justify-center p-10">
						{/* <img> intencional: a arte vem de CDN dinâmico. */}
						<img
							src={marca.crest_url}
							alt=""
							className="max-h-full max-w-full object-contain opacity-[0.14] grayscale"
						/>
					</div>
				) : (
					<div className="flex h-full items-center justify-center">
						<ImageOff className="h-6 w-6 text-[var(--al-rule)]" />
					</div>
				)}
			</div>

			<div className="space-y-2.5 px-4 py-3">
				<p className="font-display truncate text-sm font-bold tracking-[-0.01em] text-[var(--al-ink)]">
					{entry.title}
				</p>
				<LinhaDeRegistro rotulo="Entrada">{modeLabel(mode)}</LinhaDeRegistro>
				{modeUsesImage(mode) && (
					<LinhaDeRegistro rotulo="Fotos">
						{imagens === 1 ? 'até 1' : `até ${imagens}`}
					</LinhaDeRegistro>
				)}
			</div>
		</button>
	);
}

/* ─────────────────────────────── A tela ─────────────────────────────── */

interface LicensedToolHomeProps {
	title: string;
	subtitle?: string;
	notice: ResolvedScreenUi['notice'];
	entries: ToolBankEntry[];
	loading: boolean;
	/** Marca já escolhida antes de ir gerar — devolve o aluno onde ele estava. */
	initialBrandKey?: string | null;
	onSelect: (entry: ToolBankEntry, marca: LicensedBrand) => void;
}

export function LicensedToolHome({
	title,
	subtitle,
	notice,
	entries,
	loading,
	initialBrandKey = null,
	onSelect,
}: LicensedToolHomeProps) {
	const [aba, setAba] = useState<'criar' | 'minhas'>('criar');
	const [marcaKey, setMarcaKey] = useState<string | null>(initialBrandKey);
	const marcasQuery = useLicensedBrands();

	// Modelos por marca. A contagem vem dos registros que o aluno já lê — não
	// existe endpoint novo para isto, e nem precisa.
	const porMarca = useMemo(() => {
		const mapa = new Map<string, ToolBankEntry[]>();
		for (const e of entries) {
			const k = chaveDaEntrada(e);
			if (!k) continue;
			const lista = mapa.get(k);
			if (lista) lista.push(e);
			else mapa.set(k, [e]);
		}
		return mapa;
	}, [entries]);

	// Só entra na tela a marca que tem contrato ativo E pelo menos um modelo
	// cadastrado. Marca sem modelo é um campo que não leva a lugar nenhum.
	const marcas = useMemo(
		() =>
			(marcasQuery.data ?? []).filter(
				(m) => m.active && (porMarca.get(m.feature_key)?.length ?? 0) > 0,
			),
		[marcasQuery.data, porMarca],
	);

	const marca = marcas.find((m) => m.feature_key === marcaKey) ?? null;
	const modelos = marca ? (porMarca.get(marca.feature_key) ?? []) : [];

	const carregando = loading || marcasQuery.isLoading;

	// Enquanto a marca está escolhida, a interface veste a licença em uso.
	const estilo = {
		...PALETA,
		...(marca?.accent_color
			? ({ '--screen-accent': marca.accent_color } as CSSProperties)
			: {}),
	} as CSSProperties;

	return (
		<div
			style={estilo}
			className="min-h-full bg-[var(--al-ground)] px-4 py-6 text-[var(--al-ink)] sm:px-8 sm:py-10"
		>
			<div className="mx-auto max-w-5xl">
				{notice && <ScreenNotice notice={notice} />}

				<header className="flex flex-wrap items-end justify-between gap-4">
					<div className="min-w-0">
						<h1 className="font-display text-2xl font-bold tracking-[-0.02em] sm:text-[28px]">
							{title}
						</h1>
						<p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--al-mute)]">
							{subtitle ??
								'Escolha a marca, gere a peça e grave o código de autenticidade.'}
						</p>
					</div>

					<nav className="flex shrink-0 gap-6" aria-label="Seções">
						{(
							[
								['criar', 'Criar'],
								['minhas', 'Minhas peças'],
							] as const
						).map(([id, rotulo]) => (
							<button
								key={id}
								type="button"
								onClick={() => setAba(id)}
								aria-current={aba === id ? 'page' : undefined}
								className={`${MONO} border-b-2 pb-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-ink)] ${
									aba === id
										? 'border-[var(--al-ink)] text-[var(--al-ink)]'
										: 'border-transparent text-[var(--al-mute)] hover:text-[var(--al-ink)]'
								}`}
							>
								{rotulo}
							</button>
						))}
					</nav>
				</header>

				<hr className="my-6 border-[var(--al-rule)]" />

				{aba === 'minhas' ? (
					<MyLicensedArtLibrary />
				) : carregando ? (
					<div className="flex justify-center py-24">
						<Loader2 className="h-5 w-5 animate-spin text-[var(--al-mute)]" />
					</div>
				) : marca ? (
					/* ── Passo 2: os modelos daquela marca ── */
					<section>
						<button
							type="button"
							onClick={() => setMarcaKey(null)}
							className={`${MONO} inline-flex items-center gap-1.5 text-[var(--al-mute)] transition-colors hover:text-[var(--al-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-ink)]`}
						>
							<ArrowLeft className="h-3.5 w-3.5" />
							Marcas
						</button>

						<div className="mt-4 flex items-center gap-4">
							<div
								className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg p-2.5"
								style={{
									backgroundColor: marca.accent_color || CAMPO_NEUTRO,
								}}
							>
								{marca.crest_url ? (
									/* <img> intencional: a arte vem de CDN dinâmico. */
									<img
										src={marca.crest_url}
										alt=""
										className="max-h-full max-w-full object-contain"
									/>
								) : null}
							</div>
							<div className="min-w-0">
								<h2 className="font-display truncate text-xl font-bold tracking-[-0.02em]">
									{marca.display_name}
								</h2>
								<p className={`${MONO} mt-2 flex flex-wrap items-center gap-2`}>
									<SeloAtivo />
									<span aria-hidden className="text-[var(--al-rule)]">
										·
									</span>
									<span className="text-[var(--al-mute)]">
										{contarModelos(modelos.length)}
									</span>
								</p>
							</div>
						</div>

						<p className="mt-6 text-sm text-[var(--al-mute)]">
							Escolha o que você vai produzir.
						</p>

						<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{modelos.map((e, i) => (
								<CartaoDoModelo
									key={e.id}
									entry={e}
									marca={marca}
									delay={i * 40}
									onSelect={() => onSelect(e, marca)}
								/>
							))}
						</div>
					</section>
				) : marcas.length === 0 ? (
					/* ── Vazio: a oficina ainda não tem nenhuma marca liberada ── */
					<div className="rounded-lg border border-dashed border-[var(--al-rule)] px-6 py-20 text-center">
						<p className="font-display text-lg font-bold">
							Nenhuma marca liberada ainda.
						</p>
						<p className="mt-1 text-sm text-[var(--al-mute)]">
							Quando a Profissão Laser fechar com um clube, ele aparece aqui.
						</p>
					</div>
				) : (
					/* ── Passo 1: as marcas ── */
					<section>
						<div className="flex items-baseline justify-between gap-4">
							<h2 className={`${MONO} text-[var(--al-mute)]`}>
								Marcas licenciadas
							</h2>
							<span className={`${MONO} text-[var(--al-mute)]`}>
								{marcas.length === 1 ? '1 ativa' : `${marcas.length} ativas`}
							</span>
						</div>

						<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{marcas.map((m, i) => (
								<CampoDaMarca
									key={m.id}
									marca={m}
									modelos={porMarca.get(m.feature_key)?.length ?? 0}
									delay={i * 40}
									onSelect={() => setMarcaKey(m.feature_key)}
								/>
							))}
						</div>
					</section>
				)}
			</div>
		</div>
	);
}
