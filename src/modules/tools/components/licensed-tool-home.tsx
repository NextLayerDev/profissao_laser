'use client';

import { ArrowLeft, ImageOff } from 'lucide-react';
import { type CSSProperties, useMemo, useState } from 'react';
import { useLicensedBrands } from '../hooks/use-licensed-brands';
import { useDeclaracao } from '../hooks/use-licensed-seller';
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
import { EcommercesEditor } from './ecommerces-editor';
import {
	CAMPO_NEUTRO,
	FalhaAoCarregar,
	GradeDeEsqueletos,
	LinhaDeRegistro,
	MONO,
	SeloAtivo,
	TEMA_LICENCIADA,
} from './licenciada-ui';
import { LicensedSellerGate } from './licensed-seller-gate';
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

function chaveDaEntrada(entry: ToolBankEntry): string | null {
	const k = (entry.data as Record<string, unknown>)?.feature_key;
	return typeof k === 'string' && k.trim() ? k.trim() : null;
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
					<ImageOff className="h-8 w-8 text-[var(--al-mute)]" />
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

/**
 * Um modelo daquela marca.
 *
 * O cartão tem DUAS formas, e quem decide é a grade inteira, não o cartão:
 *
 * - `comPreviaNaGrade` — pelo menos um modelo da marca tem exemplo cadastrado.
 *   Todos ganham o painel 4:3, e quem não tem exemplo recebe o escudo apagado
 *   como marca d'água. A moldura é a mesma para os vizinhos não desalinharem.
 *
 * - compacto — NENHUM modelo tem exemplo. Aí o painel some. Repetir cinco
 *   retângulos com o mesmo escudo desbotado não informa nada e ainda promete
 *   uma foto que não existe: o fallback tinha sido pensado como exceção e virou
 *   a regra, porque nenhum modelo tem imagem cadastrada até hoje. Sem prévia, o
 *   que ajuda a escolher é o nome da peça e o que ela exige de entrada.
 */
function CartaoDoModelo({
	entry,
	marca,
	onSelect,
	delay,
	comPreviaNaGrade,
}: {
	entry: ToolBankEntry;
	marca: LicensedBrand;
	onSelect: () => void;
	delay: number;
	comPreviaNaGrade: boolean;
}) {
	const capa = coverOf(entry);
	const mode = modeOf(entry);
	const imagens = maxImagesOf(entry);

	return (
		<button
			type="button"
			onClick={onSelect}
			style={{ animationDelay: `${delay}ms` }}
			className="group relative animate-fade-in-up overflow-hidden rounded-lg border border-[var(--al-rule)] bg-[var(--al-card)] text-left transition-colors duration-150 hover:border-[var(--screen-accent,var(--al-mute))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--al-ground)]"
		>
			{comPreviaNaGrade ? (
				<div className="aspect-[4/3] overflow-hidden bg-[var(--al-poco)]">
					{capa ? (
						/* <img> intencional: a arte vem de CDN dinâmico. */
						<img
							src={capa}
							alt=""
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
						/>
					) : marca.crest_url ? (
						/* Escudo apagado: marca d'água, não amostra. */
						<div className="flex h-full items-center justify-center p-10">
							{/* <img> intencional: a arte vem de CDN dinâmico. */}
							<img
								src={marca.crest_url}
								alt=""
								className="max-h-full max-w-full object-contain opacity-20 grayscale dark:opacity-[0.14]"
							/>
						</div>
					) : (
						<div className="flex h-full items-center justify-center">
							<ImageOff className="h-6 w-6 text-[var(--al-rule)]" />
						</div>
					)}
				</div>
			) : (
				/* O fio da marca no lugar do painel: sem prévia, é o que ancora o
				   cartão à licença em uso — a mesma ideia do fio no painel do
				   código. */
				<span
					aria-hidden
					className="absolute inset-y-0 left-0 w-[3px]"
					style={{ backgroundColor: marca.accent_color || CAMPO_NEUTRO }}
				/>
			)}

			<div
				className={`space-y-2.5 py-3 pr-4 ${comPreviaNaGrade ? 'pl-4' : 'pl-5'}`}
			>
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
	/**
	 * Os modelos não vieram. Precisa ser DISTINTO de `entries: []`: sem marca com
	 * modelo a tela desenha "nenhuma marca liberada", que numa falha de rede
	 * seria a plataforma dizendo ao aluno que ele não tem licença.
	 */
	entriesError?: boolean;
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
	entriesError = false,
	initialBrandKey = null,
	onSelect,
}: LicensedToolHomeProps) {
	const [aba, setAba] = useState<'criar' | 'minhas' | 'declaracao'>('criar');
	/**
	 * O portão do vendedor. Falha de rede aqui NÃO bloqueia: o motor tem a
	 * palavra final e recusa de qualquer jeito, então travar a tela por não
	 * conseguir ler o estado seria punir o aluno por um problema nosso.
	 */
	const declaracaoQuery = useDeclaracao();
	const declaracao = declaracaoQuery.data;
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
	// A forma dos cartões é decidida pela GRADE: ou todos têm painel de prévia,
	// ou nenhum tem. Misturar alto e compacto na mesma linha desalinha tudo.
	const algumaPrevia = modelos.some((e) => coverOf(e) !== null);

	const carregando = loading || marcasQuery.isLoading;
	// Qualquer uma das duas listas faltando produz a MESMA tela vazia enganosa,
	// então as duas falhas caem no mesmo aviso.
	const falhou = marcasQuery.isError || entriesError;

	// Enquanto a marca está escolhida, a interface veste a licença em uso. Só o
	// acento vai por `style` — ele é DADO (a cor do clube), não tema.
	const estilo = (
		marca?.accent_color ? { '--screen-accent': marca.accent_color } : {}
	) as CSSProperties;

	return (
		<div
			style={estilo}
			className={`${TEMA_LICENCIADA} min-h-full bg-[var(--al-ground)] px-4 py-6 text-[var(--al-ink)] sm:px-8 sm:py-10`}
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
								/* "Onde eu vendo", e não "Declaração": primeira pessoa como
								   "Minhas peças", e o MESMO nome da seção no perfil — a
								   coisa é uma só, o nome também tem de ser. */
								['declaracao', 'Onde eu vendo'],
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
								{/* O ponto só aparece na Declaração e só quando falta algo:
								    é o único jeito de a pendência ser visível sem abrir a
								    aba, e some sozinho quando ela é resolvida. */}
								{id === 'declaracao' && declaracao && !declaracao.ok && (
									<span
										aria-label="pendente"
										className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle"
									/>
								)}
							</button>
						))}
					</nav>
				</header>

				<hr className="my-6 border-[var(--al-rule)]" />

				{aba === 'declaracao' ? (
					/* A MESMA declaração do portão, alcançável a qualquer momento —
					   inclusive quando já está em dia, para rever ou acrescentar uma
					   loja sem precisar sair da ferramenta. */
					declaracaoQuery.isLoading ? (
						<GradeDeEsqueletos quantidade={1} />
					) : declaracao ? (
						<div className="mx-auto max-w-2xl space-y-6 py-4">
							<header className="space-y-2">
								<p className={`${MONO} text-[var(--al-mute)]`}>
									Cadastro do vendedor
								</p>
								<h2 className="font-display text-xl font-bold tracking-[-0.01em] text-[var(--al-ink)]">
									Onde você vende
								</h2>
								<p className="text-sm leading-relaxed text-[var(--al-mute)]">
									Os canais que você informou e o termo do licenciamento. Fica
									salvo no seu perfil e vale em qualquer aparelho.
								</p>
							</header>
							<section className="rounded-lg border border-[var(--al-rule)] bg-[var(--al-card)] p-4">
								<EcommercesEditor
									declaracao={declaracao}
									variante="licenciada"
								/>
							</section>
						</div>
					) : (
						<FalhaAoCarregar titulo="Não foi possível carregar a sua declaração.">
							Isto é um problema nosso. Recarregue a página em instantes.
						</FalhaAoCarregar>
					)
				) : aba === 'minhas' ? (
					/* A biblioteca NÃO passa pelo portão: quem já gerou precisa
					   continuar alcançando as próprias peças, porque o QR delas pode
					   estar gravado num chaveiro que já saiu daqui. */
					<MyLicensedArtLibrary />
				) : carregando || declaracaoQuery.isLoading ? (
					<GradeDeEsqueletos />
				) : declaracao && !declaracao.ok ? (
					/* ── O PORTÃO: quem gera arte de marca declara onde vende ── */
					<LicensedSellerGate declaracao={declaracao} />
				) : falhou ? (
					<FalhaAoCarregar titulo="Não foi possível carregar as marcas.">
						Isto é um problema nosso, não falta de licença. Recarregue a página
						em instantes.
					</FalhaAoCarregar>
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
									comPreviaNaGrade={algumaPrevia}
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
