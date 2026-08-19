'use client';

import { BadgeCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { motion } from 'motion/react';
import { useParams } from 'next/navigation';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { api } from '@/lib/fetch';
import {
	CARIMBO,
	DURACAO,
	useAnimar,
} from '@/modules/tools/components/licenciada-ui';
import {
	MOCK_LICENCIADA,
	mockVerify,
} from '@/modules/tools/mocks/licensed-art.mock';

interface Verificacao {
	code: string;
	valid: boolean;
	status: 'active' | 'revoked';
	content: string;
	featureKey: string;
	licensorName: string | null;
	brandName: string | null;
	crestUrl: string | null;
	accentColor: string | null;
	previewUrl: string | null;
	issuedAt: string;
	checkedAt: string;
}

type Estado =
	| { fase: 'carregando' }
	| { fase: 'ok'; dados: Verificacao }
	| { fase: 'inexistente' }
	| { fase: 'erro' };

/**
 * A página do QR gravado na peça.
 *
 * Sem shell, sem menu, sem login: quem escaneia um chaveiro comprado numa feira
 * não tem conta aqui. Responde a uma pergunta só — isto é oficial? — e o
 * veredito vem grande, antes de qualquer detalhe.
 *
 * O visual é o da UpVox transacional (violeta sobre lavanda, cartão branco,
 * borda lilás) e não o do app escuro, porque é o mesmo gênero de documento do
 * e-mail que a marca já manda: um comprovante. Compromisso deliberado com UM
 * visual claro — não segue o tema do aparelho, para o documento ser sempre o
 * mesmo e imprimir bem.
 */

/** Identidade UpVox — os hex da marca, não a paleta genérica do Tailwind. */
const MARCA = {
	'--ux-violet': '#7c3aed',
	'--ux-violet-dark': '#5b21b6',
	'--ux-violet-light': '#a78bfa',
	'--ux-ink': '#1b1630',
	'--ux-page': '#f1eefb',
	'--ux-card': '#ffffff',
	'--ux-border': '#e9e3fb',
	'--ux-soft': '#f7f4ff',
	'--ux-muted': '#6b7280',
	// A tarja drenada, para quando o veredito sobre a peça é negativo. É o mesmo
	// papel timbrado com a cor retirada — não outro documento.
	'--ux-graphite-dark': '#2a2733',
	'--ux-graphite': '#3d3949',
	'--ux-graphite-light': '#575167',
	// O verde é o MESMO da ferramenta: significa "licença ativa" nos dois lados.
	'--ux-seal': '#1f9d5b',
	'--ux-alert': '#dc2626',
	'--ux-warn': '#d97706',
} as CSSProperties;

const MONO = 'font-mono text-[11px] uppercase tracking-[0.16em] leading-none';

const FAIXA_VIOLETA =
	'bg-[linear-gradient(120deg,var(--ux-violet-dark),var(--ux-violet),var(--ux-violet-light))]';
const FAIXA_GRAFITE =
	'bg-[linear-gradient(120deg,var(--ux-graphite-dark),var(--ux-graphite),var(--ux-graphite-light))]';

/**
 * O tom de cada um dos quatro estados.
 *
 * Eles precisam ser distinguíveis DE RELANCE, não por leitura: quem está no
 * meio de uma feira com o chaveiro na mão olha a tela por dois segundos. Antes,
 * os quatro dividiam o mesmo corpo centralizado e só a frase mudava.
 *
 * A regra que decide a cor da tarja: ela só drena para grafite quando o
 * veredito é SOBRE A PEÇA e é negativo. Em "não deu para verificar" ela
 * continua violeta de propósito — um documento acinzentado e alarmado ali seria
 * a plataforma insinuando que a peça é irregular, quando a falha é nossa e não
 * diz absolutamente nada sobre quem vendeu.
 */
interface Tom {
	faixa: string;
	anel: string;
	etiquetaFundo: string;
	etiquetaTexto: string;
	rotulo: string;
	titulo: string;
	texto: string;
	/** Escudo sem cor: a marca ainda é aquela, mas a licença não vale mais. */
	escudoApagado?: boolean;
}

function tomDe(estado: Estado): Tom | null {
	if (estado.fase === 'carregando') return null;

	if (estado.fase === 'inexistente') {
		return {
			faixa: FAIXA_GRAFITE,
			anel: 'var(--ux-alert)',
			etiquetaFundo: 'rgba(220,38,38,0.1)',
			etiquetaTexto: 'var(--ux-alert)',
			rotulo: 'Código não emitido',
			titulo: 'Código não encontrado.',
			texto: 'Se ele veio gravado num produto, desconfie.',
		};
	}

	if (estado.fase === 'erro') {
		return {
			// Violeta: a falha é do nosso lado, e a tarja não acusa ninguém.
			faixa: FAIXA_VIOLETA,
			anel: 'var(--ux-warn)',
			etiquetaFundo: 'rgba(217,119,6,0.12)',
			etiquetaTexto: 'var(--ux-warn)',
			rotulo: 'Sem resposta agora',
			titulo: 'Não deu para verificar.',
			texto:
				'Isto não significa que a peça seja irregular — o problema é nosso. Tente de novo em instantes.',
		};
	}

	if (estado.dados.valid) {
		return {
			faixa: FAIXA_VIOLETA,
			// Verde, e não o violeta do emissor: o anel é o CANAL DO VEREDITO nos
			// quatro estados (vermelho, âmbar, verde). Com o violeta aqui, o único
			// estado bom era também o único que não respondia pela cor do anel.
			anel: 'var(--ux-seal)',
			etiquetaFundo: 'rgba(31,157,91,0.12)',
			etiquetaTexto: 'var(--ux-seal)',
			rotulo: 'Licença ativa',
			titulo: 'Peça licenciada.',
			texto: 'Esta arte foi gerada sob licença oficial da marca.',
		};
	}

	return {
		faixa: FAIXA_GRAFITE,
		anel: 'var(--ux-alert)',
		etiquetaFundo: 'rgba(220,38,38,0.1)',
		etiquetaTexto: 'var(--ux-alert)',
		rotulo: 'Licença revogada',
		titulo: 'Licença sem validade.',
		texto: 'Esta arte foi licenciada um dia, mas a licença foi revogada.',
		// Sem isto, uma peça REVOGADA exibia o escudo do clube em cores no alto do
		// documento e passava por válida para quem só bate o olho.
		escudoApagado: true,
	};
}

export default function VerificacaoArteLicenciada() {
	const params = useParams<{ code: string }>();
	const [estado, setEstado] = useState<Estado>({ fase: 'carregando' });
	// A hora do RELÓGIO DE QUEM CONSULTA. O `checkedAt` que vem do servidor fica
	// congelado no cache de 60s da CDN, então exibi-lo como "consultado agora"
	// seria mentira dentro dessa janela.
	const [consultadoEm, setConsultadoEm] = useState<Date | null>(null);
	const animar = useAnimar();

	useEffect(() => {
		let vivo = true;
		// Com o mock ligado, o código sai da biblioteca falsa do navegador em vez
		// da main-api — inclusive o de peça arquivada, que TEM de responder.
		const buscar = MOCK_LICENCIADA
			? mockVerify(params.code).then((data) => ({ data }))
			: api.get<Verificacao>(
					`/api/licensed-art/${encodeURIComponent(params.code)}`,
				);
		buscar
			.then(({ data }) => {
				if (!vivo) return;
				setEstado({ fase: 'ok', dados: data });
				setConsultadoEm(new Date());
			})
			.catch((err: { response?: { status?: number } }) => {
				if (!vivo) return;
				// 404 é tratado SEPARADAMENTE de erro de rede, e a diferença importa:
				// um denuncia falsificação, o outro é problema nosso e não pode
				// acusar quem vendeu a peça.
				setEstado({
					fase: err?.response?.status === 404 ? 'inexistente' : 'erro',
				});
			});
		return () => {
			vivo = false;
		};
	}, [params.code]);

	const dados = estado.fase === 'ok' ? estado.dados : null;
	const tom = tomDe(estado);

	return (
		<main
			style={MARCA}
			className="min-h-screen bg-[var(--ux-page)] px-5 py-10 text-[var(--ux-ink)]"
		>
			<div className="mx-auto max-w-md">
				<article className="overflow-hidden rounded-2xl border border-[var(--ux-border)] bg-[var(--ux-card)] shadow-[0_18px_50px_-24px_rgba(76,29,149,0.45)]">
					{/* A tarja do emissor. O logo é branco e monocromático — depende do
					    fundo escuro atrás dele, por isso a faixa e não um cabeçalho
					    claro. A cor dela é o primeiro sinal do veredito, antes de
					    qualquer palavra. */}
					<header
						className={`relative px-6 pb-12 pt-6 transition-colors duration-300 ${
							tom?.faixa ?? FAIXA_VIOLETA
						}`}
					>
						{/* <img> intencional: PNG da marca servido de /public. */}
						<img
							src="/img/upvox-logo-white.png"
							alt="UpVox"
							className="h-4 w-auto opacity-95"
						/>
						<p
							className={`${MONO} mt-3 text-white/75`}
						>{`Selo de autenticidade`}</p>

						{/* O SELO. Fica montado na borda da tarja, como um lacre prensado
						    onde acaba o papel timbrado de quem emitiu: o escudo é de quem
						    licenciou, a tarja é de quem atesta. */}
						<div className="-bottom-10 absolute left-1/2 -translate-x-1/2">
							<Selo
								dados={dados}
								fase={estado.fase}
								tom={tom}
								animar={animar}
							/>
						</div>
					</header>

					<div className="px-6 pb-8 pt-14">
						{estado.fase === 'carregando' && (
							<div className="flex flex-col items-center gap-3">
								<div className="h-5 w-44 animate-pulse rounded bg-[var(--ux-soft)]" />
								<div className="h-3 w-60 animate-pulse rounded bg-[var(--ux-soft)]" />
							</div>
						)}

						{tom && (
							<Veredito
								tom={tom}
								animar={animar}
								// A sobrancelha nomeia o licenciante ANTES do veredito: quem
								// escaneia quer saber de quem é a marca tanto quanto se a
								// peça é oficial, e é a informação que o escudo logo acima
								// já começou a dar.
								licenciante={dados?.brandName ?? dados?.licensorName ?? null}
							/>
						)}

						{dados && (
							<motion.div
								initial={animar ? { opacity: 0, y: 8 } : false}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									duration: DURACAO.media,
									delay: 0.18,
									ease: 'easeOut',
								}}
							>
								{dados.previewUrl && (
									<div className="mt-6 overflow-hidden rounded-xl border border-[var(--ux-border)] bg-[var(--ux-soft)]">
										{/* <img> intencional: a arte vem de CDN dinâmico. */}
										<img
											src={dados.previewUrl}
											alt="A arte licenciada"
											className={`w-full object-contain ${
												// A arte de uma peça revogada também perde a cor: ela
												// não deve ser reaproveitada como prova de nada.
												dados.valid ? '' : 'opacity-70 grayscale'
											}`}
										/>
									</div>
								)}

								<dl className="mt-6 space-y-0">
									<Linha rotulo="Conteúdo" valor={dados.content} />
									{/* Só quando a sobrancelha não pôde dizer: repetir o nome
									    duas vezes na mesma tela é ruído. */}
									{!dados.brandName && !dados.licensorName && (
										<Linha rotulo="Licenciado por" valor={dados.featureKey} />
									)}
									<Linha
										rotulo="Emitida em"
										valor={new Date(dados.issuedAt).toLocaleDateString('pt-BR')}
										mono
									/>
									<Linha rotulo="Código" valor={dados.code} mono />
								</dl>
							</motion.div>
						)}
					</div>

					<footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--ux-border)] bg-[var(--ux-soft)] px-6 py-4">
						<p className={`${MONO} text-[var(--ux-muted)]`}>
							Emitido por UpVox
						</p>
						{consultadoEm && (
							<p className={`${MONO} text-[var(--ux-muted)]`}>
								{`Consulta ${consultadoEm.toLocaleDateString('pt-BR')} ${consultadoEm.toLocaleTimeString(
									'pt-BR',
									{ hour: '2-digit', minute: '2-digit' },
								)}`}
							</p>
						)}
					</footer>
				</article>
			</div>
		</main>
	);
}

/**
 * O escudo de quem licenciou, num medalhão sobre a cor oficial do clube, com um
 * anel que carrega o veredito. Sem escudo cadastrado (ou fora do estado "ok"),
 * vira o ícone do estado — a pergunta continua respondida mesmo quando a marca
 * não tem arte no cadastro.
 *
 * Ele entra como um lacre sendo prensado: escala com um overshoot curto, sem
 * atraso. O veredito nunca espera a coreografia.
 */
function Selo({
	dados,
	fase,
	tom,
	animar,
}: {
	dados: Verificacao | null;
	fase: Estado['fase'];
	tom: Tom | null;
	animar: boolean;
}) {
	const base =
		'flex h-20 w-20 items-center justify-center rounded-full border-4 shadow-[0_8px_24px_-8px_rgba(27,22,48,0.4)]';
	const anel = { borderColor: tom?.anel ?? 'var(--ux-card)' };

	const conteudo =
		dados?.crestUrl != null ? (
			<div
				className="flex h-full w-full items-center justify-center rounded-full p-3"
				style={{ backgroundColor: dados.accentColor || '#ffffff' }}
			>
				{/* <img> intencional: a arte vem de CDN dinâmico. */}
				<img
					src={dados.crestUrl}
					alt={dados.brandName ?? 'Marca licenciada'}
					className={`max-h-full max-w-full object-contain ${
						tom?.escudoApagado ? 'opacity-60 grayscale' : ''
					}`}
				/>
			</div>
		) : fase === 'carregando' ? (
			<div className="h-8 w-8 animate-pulse rounded-full bg-[var(--ux-border)]" />
		) : fase === 'erro' ? (
			<ShieldAlert className="h-9 w-9 text-[var(--ux-warn)]" />
		) : dados?.valid ? (
			<BadgeCheck className="h-9 w-9 text-[var(--ux-seal)]" />
		) : (
			<ShieldX className="h-9 w-9 text-[var(--ux-alert)]" />
		);

	return (
		<motion.div
			initial={animar ? { scale: 0.6, opacity: 0 } : false}
			animate={{ scale: 1, opacity: 1 }}
			transition={CARIMBO}
			style={anel}
			className={`${base} overflow-hidden bg-[var(--ux-card)]`}
		>
			{conteudo}
		</motion.div>
	);
}

function Veredito({
	tom,
	licenciante,
	animar,
}: {
	tom: Tom;
	licenciante: string | null;
	animar: boolean;
}) {
	return (
		<motion.div
			// Sem atraso: a resposta é a razão de a página existir.
			initial={animar ? { opacity: 0, y: 8 } : false}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: DURACAO.rapida, ease: 'easeOut' }}
			className="text-center"
		>
			{licenciante && (
				<p className={`${MONO} mb-3 text-[var(--ux-violet)]`}>
					Licenciado por {licenciante}
				</p>
			)}
			<h1 className="font-display text-2xl font-bold tracking-[-0.02em]">
				{tom.titulo}
			</h1>

			{/* A etiqueta diz o estado em UMA expressão, com cor própria. É o que
			    sobra quando a pessoa não lê a frase inteira. */}
			<motion.p
				initial={animar ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={{ duration: DURACAO.rapida, delay: 0.12 }}
				style={{ backgroundColor: tom.etiquetaFundo, color: tom.etiquetaTexto }}
				className={`${MONO} mt-3 inline-flex items-center rounded-full px-3 py-1.5`}
			>
				{tom.rotulo}
			</motion.p>

			<p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-[var(--ux-muted)]">
				{tom.texto}
			</p>
		</motion.div>
	);
}

/** `RÓTULO ····· VALOR` — o bloco de dados de um certificado. */
function Linha({
	rotulo,
	valor,
	mono,
}: {
	rotulo: string;
	valor: ReactNode;
	mono?: boolean;
}) {
	return (
		<div className="flex items-baseline gap-2 border-b border-[var(--ux-border)] py-3 last:border-b-0">
			<dt className={`${MONO} shrink-0 text-[var(--ux-muted)]`}>{rotulo}</dt>
			<span
				aria-hidden
				className="min-w-3 flex-1 -translate-y-[3px] border-b border-dotted border-[var(--ux-border)]"
			/>
			<dd
				className={`shrink-0 text-right font-semibold ${
					mono ? `${MONO} font-normal` : 'text-sm'
				}`}
			>
				{valor}
			</dd>
		</div>
	);
}
