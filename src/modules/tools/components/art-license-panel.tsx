'use client';

import { BadgeCheck, Check, Copy, Download } from 'lucide-react';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import type { ArtLicense } from '../services/tool-definitions.service';
import { CARIMBO, DURACAO, MONO, SUAVE, useAnimar } from './licenciada-ui';

/** A URL que o QR carrega. É pública e resolve sem login. */
export function artLicenseUrl(code: string): string {
	const origin = typeof window !== 'undefined' ? window.location.origin : '';
	return `${origin}/a/${encodeURIComponent(code)}`;
}

/**
 * O código de autenticidade da peça, com o QR para gravar junto com a arte.
 *
 * É o que transforma "arte parecida com oficial" em "arte verificável": quem
 * compra a peça escaneia e vê o que foi licenciado, por quem, e se continua
 * válido — sem precisar acreditar em ninguém.
 */
/**
 * Gera o PNG do QR de um código e entrega as ações de copiar e baixar.
 *
 * Vive aqui, e não em cada tela, porque a POLÍTICA do QR é uma só: o mesmo
 * nível de correção e o mesmo contraste, seja no painel logo depois de gerar
 * ou na biblioteca meses depois. Duas gerações diferentes do mesmo código
 * dariam duas peças que escaneiam diferente.
 */
export function useArtQrCode(code: string) {
	const [dataUrl, setDataUrl] = useState<string | null>(null);
	const [copiado, setCopiado] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const url = artLicenseUrl(code);

	useEffect(() => {
		QRCode.toDataURL(url, {
			// Nível H (30% de redundância) porque este QR vai GRAVADO A LASER em
			// acrílico ou metal e é fotografado por celular, com risco e reflexo.
			// Os níveis menores falham exatamente nesse cenário.
			errorCorrectionLevel: 'H',
			width: 512,
			margin: 2,
			color: { dark: '#0f172a', light: '#ffffff' },
		})
			.then(setDataUrl)
			.catch(() => setDataUrl(null));
	}, [url]);

	useEffect(() => {
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
	}, []);

	const copiar = async () => {
		await navigator.clipboard.writeText(code);
		setCopiado(true);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setCopiado(false), 2500);
	};

	const baixarQr = () => {
		if (!dataUrl) return;
		const a = document.createElement('a');
		a.href = dataUrl;
		a.download = `qr-${code}.png`;
		a.click();
	};

	return { url, dataUrl, copiado, copiar, baixarQr };
}

/* ───────────────────────── A cunhagem do código ───────────────────────── */

/**
 * O alfabeto REAL do código — base32 de Crockford, que já exclui I, L, O e U:
 * numa gravação fotografada de lado, I/L/1 e O/0 se confundem. O odômetro sorteia
 * daqui e não de um alfabeto qualquer, para nunca piscar um símbolo que o motor
 * não emitiria.
 */
const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Liga/desliga o odômetro. Se na tela ele parecer instável, vira `false` e o
 * código passa a aparecer inteiro — o resto da sequência continua igual.
 */
const ODOMETRO = true;

/** Intervalo entre uma letra travar e a próxima. 20 letras ≈ 500 ms. */
const PASSO_MS = 25;

/** Instante em que a cunhagem começa, alinhado com a entrada da placa do QR. */
const ATRASO_MS = 420;

function embaralhar(code: string, travados: number): string {
	let s = code.slice(0, travados);
	for (let i = travados; i < code.length; i++) {
		s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
	}
	return s;
}

/**
 * O código sendo cunhado: cada caractere gira e trava da esquerda para a
 * direita. Conta a história certa — o código está nascendo agora, para esta
 * peça, e não estava guardado em lugar nenhum.
 *
 * A string tem SEMPRE o comprimento final, mesmo girando: um código que cresce
 * letra a letra empurraria o layout vinte vezes em meio segundo. E termina no
 * valor exato, então copiar continua entregando o código de verdade.
 */
function useCodigoCunhado(code: string, animar: boolean): string {
	const [texto, setTexto] = useState(() =>
		animar ? embaralhar(code, 0) : code,
	);

	useEffect(() => {
		if (!animar) {
			setTexto(code);
			return;
		}
		setTexto(embaralhar(code, 0));
		let travados = 0;
		let giro: ReturnType<typeof setInterval> | null = null;
		const inicio = setTimeout(() => {
			giro = setInterval(() => {
				travados += 1;
				if (travados >= code.length) {
					setTexto(code);
					if (giro) clearInterval(giro);
					return;
				}
				setTexto(embaralhar(code, travados));
			}, PASSO_MS);
		}, ATRASO_MS);

		return () => {
			clearTimeout(inicio);
			if (giro) clearInterval(giro);
		};
	}, [code, animar]);

	return texto;
}

/* ───────────────────────────── O painel ───────────────────────────── */

/**
 * A PARTITURA fica aqui; os GESTOS vêm de `licenciada-ui`. A distinção importa:
 * a curva e a mola são vocabulário da ferramenta inteira, mas a ordem em que
 * este painel se monta é coreografia desta tela e de mais nenhuma.
 */
const T = {
	cartao: 0,
	fio: 0.12,
	placa: 0.2,
	selo: 0.38,
	registro: 0.52,
	botoes: 0.7,
};

/** `RÓTULO ····· VALOR` — o bloco de dados de um certificado. */
function Linha({
	rotulo,
	valor,
	atraso,
	animar,
}: {
	rotulo: string;
	valor: string;
	atraso: number;
	animar: boolean;
}) {
	return (
		<motion.div
			initial={animar ? { opacity: 0, y: 6 } : false}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: DURACAO.rapida, delay: atraso, ease: SUAVE }}
			className="flex items-baseline gap-2 py-2"
		>
			<span className={`${MONO} shrink-0 text-slate-400 dark:text-gray-500`}>
				{rotulo}
			</span>
			<span
				aria-hidden
				className="min-w-3 flex-1 -translate-y-[3px] border-b border-dotted border-slate-200 dark:border-white/15"
			/>
			<span
				className={`${MONO} shrink-0 text-right text-slate-700 dark:text-gray-200`}
			>
				{valor}
			</span>
		</motion.div>
	);
}

export function ArtLicensePanel({ license }: { license: ArtLicense }) {
	const { dataUrl, copiado, copiar, baixarQr } = useArtQrCode(license.code);
	const animar = useAnimar();
	const codigo = useCodigoCunhado(license.code, animar && ODOMETRO);
	const [baixando, setBaixando] = useState(false);
	const nudge = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (nudge.current) clearTimeout(nudge.current);
		};
	}, []);

	const baixar = () => {
		baixarQr();
		setBaixando(true);
		if (nudge.current) clearTimeout(nudge.current);
		nudge.current = setTimeout(() => setBaixando(false), 260);
	};

	const emitida = new Date(license.issuedAt).toLocaleDateString('pt-BR');

	const botao =
		'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-[var(--screen-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--screen-accent)] active:scale-[0.985] disabled:opacity-50 dark:border-white/15 dark:text-gray-200';

	return (
		<motion.section
			initial={animar ? { opacity: 0, y: 12, scale: 0.985 } : false}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: DURACAO.cartao, delay: T.cartao, ease: SUAVE }}
			aria-label="Selo de autenticidade da peça"
			className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
		>
			<div className="p-4 sm:p-5">
				<p
					className={`${MONO} flex items-center gap-2 text-slate-400 dark:text-gray-500`}
				>
					<BadgeCheck className="h-3.5 w-3.5 shrink-0" />
					Selo de autenticidade
				</p>

				<div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
					{/* A PLACA. Branca sempre, em tema claro ou escuro: é a superfície
					    onde o QR precisa do contraste puro, e é também a única que
					    garante que a cor da marca apareça — o acento do Corinthians é
					    preto e sumiria contra o fundo escuro do app. */}
					<motion.div
						initial={animar ? { opacity: 0, scale: 0.96 } : false}
						animate={{ opacity: 1, scale: 1, y: baixando ? 3 : 0 }}
						transition={{
							default: { duration: DURACAO.media, delay: T.placa, ease: SUAVE },
							// O empurrãozinho do download tem transição PRÓPRIA: herdando a
							// da entrada, ele esperaria os 200 ms de atraso da placa e
							// duraria mais que o próprio gesto — parecia travamento.
							y: { duration: DURACAO.toque, ease: 'easeOut' },
						}}
						className="relative shrink-0 self-start overflow-hidden rounded-lg bg-white p-2 shadow-[0_1px_3px_rgba(15,23,42,0.12)]"
					>
						{/* O fio da marca, sobre o branco. A única cor do painel que não
						    é o verde do selo — e ela vem do clube, nunca de nós. */}
						<motion.span
							aria-hidden
							initial={animar ? { scaleX: 0 } : false}
							animate={{ scaleX: 1 }}
							transition={{
								duration: DURACAO.media,
								delay: T.fio,
								ease: 'easeOut',
							}}
							className="absolute inset-x-0 top-0 h-1 origin-left bg-[var(--screen-accent)]"
						/>
						{dataUrl ? (
							/* Preto sobre branco, 512 px, nível H: gravado a laser e
							   fotografado por celular, é o único contraste que sobrevive a
							   risco e reflexo. Não encolhe e não muda de cor. */
							<img
								src={dataUrl}
								alt={`QR de autenticidade da peça ${license.code}`}
								className="h-32 w-32"
							/>
						) : (
							<div className="h-32 w-32 animate-pulse rounded bg-slate-100" />
						)}
					</motion.div>

					<div className="min-w-0 flex-1">
						<p className={`${MONO} text-slate-400 dark:text-gray-500`}>
							Código da peça
						</p>

						{/* O código é PROTAGONISTA: ele é transcrito à mão no arquivo de
						    gravação e lido de longe. Como legenda de 12 px, obrigava a
						    aproximar o rosto da tela. */}
						<div className="relative mt-2 overflow-hidden">
							<p className="font-mono break-all text-base font-semibold tracking-[0.1em] text-slate-900 sm:text-lg dark:text-white">
								{codigo}
							</p>
							{copiado && animar && (
								<motion.span
									aria-hidden
									initial={{ x: '-110%' }}
									animate={{ x: '110%' }}
									transition={{ duration: DURACAO.cartao, ease: 'easeOut' }}
									className="pointer-events-none absolute inset-y-0 w-2/3 bg-[linear-gradient(90deg,transparent,var(--screen-accent),transparent)] opacity-20"
								/>
							)}
						</div>

						{/* Verde aqui e em nenhum outro lugar: ele significa "licença
						    ativa", não "coisa boa". */}
						<p className={`${MONO} mt-3 flex items-center gap-1.5`}>
							<motion.span
								aria-hidden
								initial={animar ? { scale: 0 } : false}
								animate={{ scale: 1 }}
								transition={{ ...CARIMBO, delay: T.selo }}
								className="h-1.5 w-1.5 rounded-full bg-emerald-500"
							/>
							<motion.span
								initial={animar ? { opacity: 0 } : false}
								animate={{ opacity: 1 }}
								transition={{ duration: DURACAO.rapida, delay: T.selo + 0.06 }}
								className="text-emerald-600 dark:text-emerald-400"
							>
								Licença ativa
							</motion.span>
						</p>

						<div className="mt-4 divide-y divide-slate-100 dark:divide-white/5">
							<Linha
								rotulo="Emitida"
								valor={emitida}
								atraso={T.registro}
								animar={animar}
							/>
							{license.licensorName && (
								<Linha
									rotulo="Licenciante"
									valor={license.licensorName}
									atraso={T.registro + 0.04}
									animar={animar}
								/>
							)}
						</div>
					</div>
				</div>

				<motion.div
					initial={animar ? { opacity: 0 } : false}
					animate={{ opacity: 1 }}
					transition={{ duration: DURACAO.rapida, delay: T.botoes }}
					className="mt-5 flex flex-wrap items-center gap-2"
				>
					{/* Largura mínima fixa: sem ela, "Código copiado" é mais largo que
					    "Copiar código" e empurra o botão vizinho no clique. */}
					<button
						type="button"
						onClick={copiar}
						className={`${botao} min-w-[9.5rem]`}
					>
						{copiado ? (
							<Check className="h-3.5 w-3.5" />
						) : (
							<Copy className="h-3.5 w-3.5" />
						)}
						{copiado ? 'Código copiado' : 'Copiar código'}
					</button>
					<button
						type="button"
						onClick={baixar}
						disabled={!dataUrl}
						className={botao}
					>
						<Download className="h-3.5 w-3.5" />
						Baixar QR
					</button>
					<p className="text-xs text-slate-500 dark:text-gray-400">
						Grave o QR junto com a arte.
					</p>
				</motion.div>
			</div>
		</motion.section>
	);
}
