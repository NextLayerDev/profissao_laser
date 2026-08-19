'use client';

import {
	Archive,
	ArchiveRestore,
	Check,
	ChevronDown,
	ChevronUp,
	Copy,
	CopyPlus,
	Download,
	ExternalLink,
	ImageOff,
	ShieldX,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useLicensedBrands } from '../hooks/use-licensed-brands';
import {
	useAmpliarTiragem,
	useArchiveMyLicensedArt,
	useMyLicensedArt,
} from '../hooks/use-my-licensed-art';
import type { LicensedBrand } from '../services/licensed-brand.service';
import type { MyLicensedArt } from '../services/my-licensed-art.service';
import { artLicenseUrl, useArtQrCode } from './art-license-panel';
import {
	CAMPO_NEUTRO,
	FalhaAoCarregar,
	GradeDeEsqueletos,
	LinhaDeRegistro,
	MONO,
	TEMA_LICENCIADA,
} from './licenciada-ui';

/**
 * As peças licenciadas do aluno, agrupadas pelo clube.
 *
 * A arte sem o código não serve: quem vai produzir a peça meses depois precisa
 * reencontrar o QR daquela geração, e a URL do CDN sozinha não diz qual código
 * pertence a ela. Aqui os dois andam juntos, como saíram.
 *
 * O agrupamento por marca não é organização por organização: uma oficina que
 * trabalha com três clubes procura "a caneca do Corinthians", não "a nona peça
 * que eu gerei".
 */

const BOTAO =
	'inline-flex items-center gap-1.5 rounded-md border border-[var(--al-rule)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--al-ink)] transition-colors hover:border-[var(--al-mute)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-ink)] disabled:opacity-50';

function contarPecas(n: number): string {
	return n === 1 ? '1 peça' : `${n} peças`;
}

/* ─────────────────────────── Ampliar a tiragem ─────────────────────────── */

const TIRAGENS_EXTRA = [5, 10, 25];

/**
 * "Gerei 10, vendi bem, quero mais 40."
 *
 * A tiragem é escolhida ANTES de a arte existir, então ninguém encomenda 50
 * peças no escuro. Aqui o aluno já viu o resultado — e as peças novas saem da
 * MESMA arte, sem rodar o modelo de novo. Custa só a licença.
 */
function AmpliarLote({
	batchId,
	courseSlug,
}: {
	batchId: string;
	courseSlug: string | undefined;
}) {
	const [aberto, setAberto] = useState(false);
	const ampliar = useAmpliarTiragem(courseSlug);

	if (!aberto) {
		return (
			<button
				type="button"
				onClick={() => setAberto(true)}
				className={BOTAO}
				disabled={ampliar.isPending}
			>
				<CopyPlus className="h-3 w-3" />
				Ampliar tiragem
			</button>
		);
	}

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			<span className={`${MONO} text-[var(--al-mute)]`}>Mais</span>
			{TIRAGENS_EXTRA.map((n) => (
				<button
					key={n}
					type="button"
					disabled={ampliar.isPending}
					onClick={() =>
						ampliar.mutate(
							{ batchId, pecas: n },
							{ onSuccess: () => setAberto(false) },
						)
					}
					className={BOTAO}
				>
					{n}
				</button>
			))}
			<button
				type="button"
				onClick={() => setAberto(false)}
				className={`${MONO} px-1.5 text-[var(--al-mute)] hover:text-[var(--al-ink)]`}
			>
				Cancelar
			</button>
		</div>
	);
}

/**
 * UM LOTE FECHADO. Dez miniaturas iguais empilhadas não informam nada — a arte
 * é a mesma, o que muda é o código de cada peça. Então o lote se apresenta
 * como uma coisa só, e abre quando o aluno quer os códigos.
 *
 * Lote de uma peça não fecha: não há o que agrupar, e um clique a mais para
 * ver a única peça seria só atrito.
 */
function LoteFechado({
	lote,
	onAbrir,
	courseSlug,
}: {
	lote: Lote;
	onAbrir: () => void;
	courseSlug: string | undefined;
}) {
	const primeira = lote.pecas[0];
	const ultima = lote.pecas[lote.pecas.length - 1];
	return (
		<article className="overflow-hidden rounded-lg border border-[var(--al-rule)] bg-[var(--al-card)]">
			<div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
				<button
					type="button"
					onClick={onAbrir}
					aria-label={`Ver os códigos de ${primeira?.promptTitle ?? 'lote'}`}
					className="h-28 w-full shrink-0 overflow-hidden rounded-md bg-white sm:w-44"
				>
					{primeira?.previewUrl ? (
						/* <img> intencional: a peça vem de CDN dinâmico. */
						<img
							src={primeira.previewUrl}
							alt=""
							className="h-full w-full object-cover"
						/>
					) : null}
				</button>

				<div className="min-w-0 flex-1">
					<p className="font-display truncate text-sm font-bold tracking-[-0.01em] text-[var(--al-ink)]">
						{primeira?.promptTitle ?? 'Lote'}
					</p>
					<p className={`${MONO} mt-2 text-[var(--al-mute)]`}>
						{contarPecas(lote.pecas.length)} · peças {primeira?.pieceIndex}–
						{ultima?.pieceIndex}
					</p>
					<div className="mt-3 flex flex-wrap items-center gap-1.5">
						<button type="button" onClick={onAbrir} className={BOTAO}>
							<ChevronDown className="h-3 w-3" />
							Ver os códigos
						</button>
						{lote.canGrow && lote.batchId && (
							<AmpliarLote batchId={lote.batchId} courseSlug={courseSlug} />
						)}
					</div>
				</div>
			</div>
		</article>
	);
}

/* ────────────────────────────── Uma peça ────────────────────────────── */

function Peca({ arte }: { arte: MyLicensedArt }) {
	const { dataUrl, copiado, copiar, baixarQr } = useArtQrCode(arte.code);
	const arquivar = useArchiveMyLicensedArt();
	const emitida = new Date(arte.issuedAt).toLocaleDateString('pt-BR');
	const mover = () =>
		arquivar.mutate({ id: arte.id, archived: !arte.archived });

	return (
		<article
			className={`overflow-hidden rounded-lg border border-[var(--al-rule)] bg-[var(--al-card)] ${
				arte.archived ? 'opacity-70' : ''
			}`}
		>
			<div className="aspect-[4/3] overflow-hidden bg-[var(--al-poco)]">
				{arte.previewUrl ? (
					/* <img> intencional: a arte vem de CDN dinâmico. */
					<img
						src={arte.previewUrl}
						alt={arte.promptTitle ?? 'Peça licenciada'}
						className="h-full w-full object-cover"
					/>
				) : (
					<div className="flex h-full items-center justify-center">
						<ImageOff className="h-6 w-6 text-[var(--al-rule)]" />
					</div>
				)}
			</div>

			<div className="space-y-3 p-4">
				<p className="font-display truncate text-sm font-bold tracking-[-0.01em] text-[var(--al-ink)]">
					{arte.promptTitle ?? arte.licensorName ?? arte.featureKey}
				</p>
				{arte.batchSize > 1 && (
					<p className={`${MONO} text-[var(--al-mute)]`}>
						Peça {arte.pieceIndex} de {arte.batchSize}
					</p>
				)}

				<LinhaDeRegistro rotulo="Emitida">{emitida}</LinhaDeRegistro>

				{arte.revoked ? (
					<p className="flex items-start gap-1.5 rounded-md border border-red-500/30 bg-red-500/5 p-2.5 text-xs leading-relaxed text-red-700 dark:text-red-400">
						<ShieldX className="mt-0.5 h-3.5 w-3.5 shrink-0" />
						Licença revogada. Esta peça não é mais verificável como oficial.
					</p>
				) : (
					<div className="space-y-3 rounded-md border border-[var(--al-rule)] bg-[var(--al-poco)] p-3">
						{/* O código ocupa a linha inteira porque ele é COPIADO À MÃO com
						    frequência (o aluno digita no arquivo de gravação). Espremido
						    ao lado do QR ele quebrava no meio e virava dois pedaços. */}
						<div>
							<p className={`${MONO} text-[var(--al-mute)]`}>Código da peça</p>
							<p className="font-mono mt-1.5 text-xs font-semibold tracking-[0.04em] text-[var(--al-ink)]">
								{arte.code}
							</p>
						</div>

						<div className="flex items-center gap-3">
							{dataUrl ? (
								/* Fundo branco de propósito: QR escuro sobre claro é o que a
								   câmera lê, e é assim que ele vai gravado na peça. */
								<img
									src={dataUrl}
									alt={`QR de autenticidade da peça ${arte.code}`}
									className="h-16 w-16 shrink-0 rounded bg-white p-1"
								/>
							) : (
								<div className="h-16 w-16 shrink-0 animate-pulse rounded bg-[var(--al-rule)]" />
							)}
							<div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
								<button type="button" onClick={copiar} className={BOTAO}>
									{copiado ? (
										<Check className="h-3 w-3" />
									) : (
										<Copy className="h-3 w-3" />
									)}
									{copiado ? 'Código copiado' : 'Copiar código'}
								</button>
								<button
									type="button"
									onClick={baixarQr}
									disabled={!dataUrl}
									className={BOTAO}
								>
									<Download className="h-3 w-3" />
									Baixar o QR
								</button>
							</div>
						</div>
					</div>
				)}

				<div className="flex flex-wrap items-center gap-1.5">
					{arte.previewUrl && (
						<a href={arte.previewUrl} download className={BOTAO}>
							<Download className="h-3 w-3" />
							Baixar a arte
						</a>
					)}
					<a
						href={artLicenseUrl(arte.code)}
						target="_blank"
						rel="noreferrer"
						className={BOTAO}
					>
						<ExternalLink className="h-3 w-3" />
						Página do QR
					</a>
					{/* Arquivar não pede confirmação porque não destrói nada: a peça
					    vai para "Arquivadas" e volta de lá com um clique. Um diálogo
					    aqui só ensinaria que a ação é perigosa quando ela não é. */}
					<button
						type="button"
						onClick={mover}
						disabled={arquivar.isPending}
						className={`${BOTAO} ml-auto`}
					>
						{arte.archived ? (
							<>
								<ArchiveRestore className="h-3 w-3" />
								Trazer de volta
							</>
						) : (
							<>
								<Archive className="h-3 w-3" />
								Arquivar
							</>
						)}
					</button>
				</div>
			</div>
		</article>
	);
}

/* ──────────────────────────── A biblioteca ──────────────────────────── */

/** Um lote dentro da marca: as peças que saíram da mesma arte. */
interface Lote {
	key: string;
	batchId: string | null;
	canGrow: boolean;
	pecas: MyLicensedArt[];
}

interface Grupo {
	key: string;
	nome: string;
	crest: string | null;
	cor: string | null;
	total: number;
	lotes: Lote[];
}

export function MyLicensedArtLibrary() {
	const [verArquivadas, setVerArquivadas] = useState(false);
	/**
	 * Lotes abertos. Fechado é o padrão: dez miniaturas iguais empilhadas não
	 * informam nada — a arte é a mesma, o que muda é o código de cada peça.
	 */
	const [abertos, setAbertos] = useState<Set<string>>(new Set());
	const alternar = (key: string) =>
		setAbertos((prev) => {
			const next = new Set(prev);
			if (!next.delete(key)) next.add(key);
			return next;
		});
	const { data: artes, isLoading, error } = useMyLicensedArt(verArquivadas);
	const { data: marcas } = useLicensedBrands();
	// A ampliação cobra, e cobrança é sempre no contexto de um curso.
	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;

	/**
	 * O filtro fica FORA dos estados de vazio e de carregando: sem ele, quem
	 * abriu "Arquivadas" e não tem nenhuma peça lá ficaria preso — a única
	 * saída visível some justo quando a lista está vazia.
	 */
	const filtro = (
		<div className="flex gap-1.5">
			{(
				[
					[false, 'Na biblioteca'],
					[true, 'Arquivadas'],
				] as const
			).map(([valor, rotulo]) => (
				<button
					key={rotulo}
					type="button"
					onClick={() => setVerArquivadas(valor)}
					aria-pressed={verArquivadas === valor}
					className={`${MONO} rounded-md border px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-ink)] ${
						verArquivadas === valor
							? 'border-[var(--al-mute)] text-[var(--al-ink)]'
							: 'border-[var(--al-rule)] text-[var(--al-mute)] hover:text-[var(--al-ink)]'
					}`}
				>
					{rotulo}
				</button>
			))}
		</div>
	);

	const grupos = useMemo<Grupo[]>(() => {
		const porChave = new Map<string, LicensedBrand>();
		for (const m of marcas ?? []) porChave.set(m.feature_key, m);

		const mapa = new Map<string, Grupo>();
		for (const a of artes ?? []) {
			let g = mapa.get(a.featureKey);
			if (!g) {
				const marca = porChave.get(a.featureKey);
				g = {
					key: a.featureKey,
					// A marca cadastrada manda no nome; o que ficou gravado na licença
					// é a rede de segurança para uma marca que saiu do cadastro depois
					// de a peça já existir.
					nome: marca?.display_name ?? a.licensorName ?? a.featureKey,
					crest: marca?.crest_url ?? null,
					cor: marca?.accent_color ?? null,
					total: 0,
					lotes: [],
				};
				mapa.set(a.featureKey, g);
			}
			// Dentro da marca, as peças se agrupam pelo LOTE: elas saíram da mesma
			// arte, e é o lote — não a peça — que pode crescer.
			const chaveLote = a.batchId ?? `avulsa:${a.id}`;
			let l = g.lotes.find((x) => x.key === chaveLote);
			if (!l) {
				l = {
					key: chaveLote,
					batchId: a.batchId,
					canGrow: a.canGrow,
					pecas: [],
				};
				g.lotes.push(l);
			}
			l.pecas.push(a);
			g.total += 1;
		}
		for (const g of mapa.values()) {
			for (const l of g.lotes)
				l.pecas.sort((x, y) => x.pieceIndex - y.pieceIndex);
		}
		return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome));
	}, [artes, marcas]);

	if (isLoading) {
		return (
			<div className={`${TEMA_LICENCIADA} text-[var(--al-ink)]`}>
				{filtro}
				<GradeDeEsqueletos />
			</div>
		);
	}

	if (error) {
		return (
			<div className={`${TEMA_LICENCIADA} space-y-4 text-[var(--al-ink)]`}>
				{filtro}
				<FalhaAoCarregar titulo="Não foi possível carregar suas peças.">
					Elas continuam emitidas e os QR já gravados seguem respondendo.
					Recarregue a página em instantes.
				</FalhaAoCarregar>
			</div>
		);
	}

	if (grupos.length === 0) {
		return (
			<div className={`${TEMA_LICENCIADA} space-y-4 text-[var(--al-ink)]`}>
				{filtro}
				<div className="rounded-lg border border-dashed border-[var(--al-rule)] px-6 py-20 text-center">
					<p className="font-display text-lg font-bold">
						{verArquivadas
							? 'Nenhuma peça arquivada.'
							: 'Você ainda não gerou nenhuma peça.'}
					</p>
					<p className="mt-1 text-sm text-[var(--al-mute)]">
						{verArquivadas
							? 'O que você arquivar fica guardado aqui, e volta quando quiser.'
							: 'Cada peça que você gerar fica aqui, com o código para gravar.'}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={`${TEMA_LICENCIADA} space-y-6 text-[var(--al-ink)]`}>
			{filtro}
			{grupos.map((g) => (
				<section key={g.key} className="pt-4">
					<div className="flex items-center gap-3 border-b border-[var(--al-rule)] pb-3">
						<div
							className="flex h-9 w-9 shrink-0 items-center justify-center rounded p-1.5"
							style={{ backgroundColor: g.cor || CAMPO_NEUTRO }}
						>
							{g.crest ? (
								/* <img> intencional: a arte vem de CDN dinâmico. */
								<img
									src={g.crest}
									alt=""
									className="max-h-full max-w-full object-contain"
								/>
							) : null}
						</div>
						<h3 className="font-display min-w-0 flex-1 truncate text-base font-bold tracking-[-0.01em]">
							{g.nome}
						</h3>
						<span className={`${MONO} shrink-0 text-[var(--al-mute)]`}>
							{contarPecas(g.total)}
						</span>
					</div>

					{g.lotes.map((l) => {
						// Lote de uma peça nunca fecha: não há o que agrupar.
						const emLote = l.pecas.length > 1;
						const aberto = !emLote || abertos.has(l.key);
						if (!aberto) {
							return (
								<div key={l.key} className="mt-4">
									<LoteFechado
										lote={l}
										courseSlug={courseSlug}
										onAbrir={() => alternar(l.key)}
									/>
								</div>
							);
						}
						return (
							<div key={l.key} className="mt-4">
								{(emLote || (l.canGrow && l.batchId)) && (
									<div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
										<span className={`${MONO} text-[var(--al-mute)]`}>
											{l.pecas[0]?.promptTitle ?? 'Lote'} ·{' '}
											{contarPecas(l.pecas.length)}
										</span>
										<div className="flex flex-wrap items-center gap-1.5">
											{emLote && (
												<button
													type="button"
													onClick={() => alternar(l.key)}
													className={BOTAO}
												>
													<ChevronUp className="h-3 w-3" />
													Fechar o lote
												</button>
											)}
											{l.canGrow && l.batchId && (
												<AmpliarLote
													batchId={l.batchId}
													courseSlug={courseSlug}
												/>
											)}
										</div>
									</div>
								)}
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{l.pecas.map((a) => (
										<Peca key={a.id} arte={a} />
									))}
								</div>
							</div>
						);
					})}
				</section>
			))}
		</div>
	);
}
