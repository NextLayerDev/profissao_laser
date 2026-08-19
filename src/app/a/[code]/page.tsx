'use client';

import { BadgeCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { useParams } from 'next/navigation';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { api } from '@/lib/fetch';

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
} as CSSProperties;

const MONO = 'font-mono text-[11px] uppercase tracking-[0.16em] leading-none';

export default function VerificacaoArteLicenciada() {
	const params = useParams<{ code: string }>();
	const [estado, setEstado] = useState<Estado>({ fase: 'carregando' });
	// A hora do RELÓGIO DE QUEM CONSULTA. O `checkedAt` que vem do servidor fica
	// congelado no cache de 60s da CDN, então exibi-lo como "consultado agora"
	// seria mentira dentro dessa janela.
	const [consultadoEm, setConsultadoEm] = useState<Date | null>(null);

	useEffect(() => {
		let vivo = true;
		api
			.get<Verificacao>(`/api/licensed-art/${encodeURIComponent(params.code)}`)
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

	return (
		<main
			style={MARCA}
			className="min-h-screen bg-[var(--ux-page)] px-5 py-10 text-[var(--ux-ink)]"
		>
			<div className="mx-auto max-w-md">
				<article className="overflow-hidden rounded-2xl border border-[var(--ux-border)] bg-[var(--ux-card)] shadow-[0_18px_50px_-24px_rgba(76,29,149,0.45)]">
					{/* A tarja do emissor. O logo é branco e monocromático — depende do
					    violeta atrás dele, por isso a faixa e não um cabeçalho claro. */}
					<header className="relative bg-[linear-gradient(120deg,var(--ux-violet-dark),var(--ux-violet),var(--ux-violet-light))] px-6 pb-12 pt-6">
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
							<Selo dados={dados} fase={estado.fase} />
						</div>
					</header>

					<div className="px-6 pb-8 pt-14">
						{estado.fase === 'carregando' && (
							<div className="flex flex-col items-center gap-3">
								<div className="h-5 w-44 animate-pulse rounded bg-[var(--ux-soft)]" />
								<div className="h-3 w-60 animate-pulse rounded bg-[var(--ux-soft)]" />
							</div>
						)}

						{estado.fase === 'inexistente' && (
							<Veredito
								titulo="Código não encontrado."
								texto="Se ele veio gravado num produto, desconfie."
							/>
						)}

						{estado.fase === 'erro' && (
							<Veredito
								titulo="Não deu para verificar agora."
								texto="Isto não significa que a peça seja irregular. Tente de novo em instantes."
							/>
						)}

						{dados && (
							<>
								<Veredito
									// A sobrancelha nomeia o licenciante ANTES do veredito: quem
									// escaneia quer saber de quem é a marca tanto quanto se a
									// peça é oficial, e é a informação que o escudo logo acima
									// já começou a dar.
									licenciante={dados.brandName ?? dados.licensorName}
									titulo={
										dados.valid ? 'Peça licenciada.' : 'Licença sem validade.'
									}
									texto={
										dados.valid
											? 'Esta arte foi gerada sob licença oficial da marca.'
											: 'Esta arte foi licenciada um dia, mas a licença foi revogada.'
									}
								/>

								{dados.previewUrl && (
									<div className="mt-6 overflow-hidden rounded-xl border border-[var(--ux-border)] bg-[var(--ux-soft)]">
										{/* <img> intencional: a arte vem de CDN dinâmico. */}
										<img
											src={dados.previewUrl}
											alt="A arte licenciada"
											className="w-full object-contain"
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
							</>
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
 * O escudo de quem licenciou, num medalhão branco sobre a cor oficial do clube.
 * Sem escudo cadastrado (ou fora do estado "ok"), vira o ícone do veredito — a
 * pergunta continua respondida mesmo quando a marca não tem arte no cadastro.
 */
function Selo({
	dados,
	fase,
}: {
	dados: Verificacao | null;
	fase: Estado['fase'];
}) {
	const base =
		'flex h-20 w-20 items-center justify-center rounded-full border-4 border-[var(--ux-card)] shadow-[0_8px_24px_-8px_rgba(27,22,48,0.4)]';

	if (dados?.crestUrl) {
		return (
			<div
				className={`${base} animate-fade-in-up overflow-hidden p-3`}
				style={{ backgroundColor: dados.accentColor || '#ffffff' }}
			>
				{/* <img> intencional: a arte vem de CDN dinâmico. */}
				<img
					src={dados.crestUrl}
					alt={dados.brandName ?? 'Marca licenciada'}
					className="max-h-full max-w-full object-contain"
				/>
			</div>
		);
	}

	const icone =
		fase === 'carregando' ? (
			<div className="h-8 w-8 animate-pulse rounded-full bg-[var(--ux-border)]" />
		) : fase === 'erro' ? (
			<ShieldAlert className="h-9 w-9 text-amber-500" />
		) : dados?.valid ? (
			<BadgeCheck className="h-9 w-9 text-[var(--ux-violet)]" />
		) : (
			<ShieldX className="h-9 w-9 text-red-500" />
		);

	return <div className={`${base} bg-[var(--ux-card)]`}>{icone}</div>;
}

function Veredito({
	licenciante,
	titulo,
	texto,
}: {
	licenciante?: string | null;
	titulo: string;
	texto: string;
}) {
	return (
		<div className="text-center">
			{licenciante && (
				<p className={`${MONO} mb-3 text-[var(--ux-violet)]`}>
					Licenciado por {licenciante}
				</p>
			)}
			<h1 className="font-display text-2xl font-bold tracking-[-0.02em]">
				{titulo}
			</h1>
			<p className="mt-2 text-sm leading-relaxed text-[var(--ux-muted)]">
				{texto}
			</p>
		</div>
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
