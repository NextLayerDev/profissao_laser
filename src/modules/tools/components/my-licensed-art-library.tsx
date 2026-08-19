'use client';

import {
	Archive,
	ArchiveRestore,
	Check,
	Copy,
	Download,
	ExternalLink,
	ImageOff,
	Loader2,
	ShieldX,
} from 'lucide-react';
import { type CSSProperties, useMemo, useState } from 'react';
import { useLicensedBrands } from '../hooks/use-licensed-brands';
import {
	useArchiveMyLicensedArt,
	useMyLicensedArt,
} from '../hooks/use-my-licensed-art';
import type { LicensedBrand } from '../services/licensed-brand.service';
import type { MyLicensedArt } from '../services/my-licensed-art.service';
import { artLicenseUrl, useArtQrCode } from './art-license-panel';

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

/** A mesma paleta da tela da ferramenta, repetida para a aba funcionar sozinha. */
const PALETA = {
	'--al-ground': '#14161a',
	'--al-card': '#1b1e24',
	'--al-rule': '#2a2f38',
	'--al-ink': '#e8eaed',
	'--al-mute': '#8c94a1',
	'--al-seal': '#1f9d5b',
} as CSSProperties;

const CAMPO_NEUTRO = '#22262e';
const MONO = 'font-mono text-[11px] uppercase tracking-[0.16em] leading-none';

const BOTAO =
	'inline-flex items-center gap-1.5 rounded-md border border-[var(--al-rule)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--al-ink)] transition-colors hover:border-[var(--al-mute)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-ink)] disabled:opacity-50';

function contarPecas(n: number): string {
	return n === 1 ? '1 peça' : `${n} peças`;
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
			<div className="aspect-[4/3] overflow-hidden bg-[#101216]">
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

				<div className="flex items-baseline gap-2">
					<span className={`${MONO} shrink-0 text-[var(--al-mute)]`}>
						Emitida
					</span>
					<span
						aria-hidden
						className="min-w-3 flex-1 -translate-y-[3px] border-b border-dotted border-[var(--al-rule)]"
					/>
					<span className={`${MONO} shrink-0 text-[var(--al-ink)]`}>
						{emitida}
					</span>
				</div>

				{arte.revoked ? (
					<p className="flex items-start gap-1.5 rounded-md border border-red-500/30 bg-red-500/5 p-2.5 text-xs leading-relaxed text-red-400">
						<ShieldX className="mt-0.5 h-3.5 w-3.5 shrink-0" />
						Licença revogada. Esta peça não é mais verificável como oficial.
					</p>
				) : (
					<div className="space-y-3 rounded-md border border-[var(--al-rule)] bg-[#101216] p-3">
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
								<div className="h-16 w-16 shrink-0 animate-pulse rounded bg-white/5" />
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

interface Grupo {
	key: string;
	nome: string;
	crest: string | null;
	cor: string | null;
	pecas: MyLicensedArt[];
}

export function MyLicensedArtLibrary() {
	const [verArquivadas, setVerArquivadas] = useState(false);
	const { data: artes, isLoading, error } = useMyLicensedArt(verArquivadas);
	const { data: marcas } = useLicensedBrands();

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
					pecas: [],
				};
				mapa.set(a.featureKey, g);
			}
			g.pecas.push(a);
		}
		return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome));
	}, [artes, marcas]);

	if (isLoading) {
		return (
			<div style={PALETA} className="text-[var(--al-ink)]">
				{filtro}
				<div className="flex justify-center py-24">
					<Loader2 className="h-5 w-5 animate-spin text-[var(--al-mute)]" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div style={PALETA} className="space-y-4 text-[var(--al-ink)]">
				{filtro}
				<p className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
					Não foi possível carregar suas peças. Tente de novo em instantes.
				</p>
			</div>
		);
	}

	if (grupos.length === 0) {
		return (
			<div style={PALETA} className="space-y-4 text-[var(--al-ink)]">
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
		<div style={PALETA} className="space-y-6 text-[var(--al-ink)]">
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
							{contarPecas(g.pecas.length)}
						</span>
					</div>

					<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{g.pecas.map((a) => (
							<Peca key={a.id} arte={a} />
						))}
					</div>
				</section>
			))}
		</div>
	);
}
