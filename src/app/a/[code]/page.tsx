'use client';

import { BadgeCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/fetch';

interface Verificacao {
	code: string;
	valid: boolean;
	status: 'active' | 'revoked';
	content: string;
	featureKey: string;
	licensorName: string | null;
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
 */
export default function VerificacaoArteLicenciada() {
	const params = useParams<{ code: string }>();
	const [estado, setEstado] = useState<Estado>({ fase: 'carregando' });

	useEffect(() => {
		let vivo = true;
		api
			.get<Verificacao>(`/api/licensed-art/${encodeURIComponent(params.code)}`)
			.then(({ data }) => vivo && setEstado({ fase: 'ok', dados: data }))
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

	return (
		<main className="min-h-screen bg-slate-50 px-6 py-16 dark:bg-[#0d0d0f]">
			<div className="mx-auto max-w-md">
				{estado.fase === 'carregando' && (
					<div className="flex flex-col items-center gap-4">
						<div className="h-16 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
						<div className="h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
					</div>
				)}

				{estado.fase === 'inexistente' && (
					<Veredito
						icone={<ShieldX className="h-16 w-16 text-red-500" />}
						titulo="Código não encontrado."
						texto="Se ele veio gravado num produto, desconfie."
					/>
				)}

				{estado.fase === 'erro' && (
					<Veredito
						icone={<ShieldAlert className="h-16 w-16 text-amber-500" />}
						titulo="Não deu para verificar agora."
						texto="Isto não significa que a peça seja irregular. Tente de novo em instantes."
					/>
				)}

				{estado.fase === 'ok' && (
					<>
						<Veredito
							icone={
								estado.dados.valid ? (
									<BadgeCheck className="h-16 w-16 text-emerald-500" />
								) : (
									<ShieldX className="h-16 w-16 text-red-500" />
								)
							}
							titulo={
								estado.dados.valid
									? 'Peça licenciada.'
									: 'Licença sem validade.'
							}
							texto={
								estado.dados.valid
									? 'Esta arte foi gerada sob licença oficial da marca.'
									: 'Esta arte foi licenciada um dia, mas a licença foi revogada.'
							}
						/>

						{estado.dados.previewUrl && (
							<div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1a1a1d]">
								{/* <img> intencional: a arte vem de CDN dinâmico. */}
								<img
									src={estado.dados.previewUrl}
									alt="A arte licenciada"
									className="w-full object-contain"
								/>
							</div>
						)}

						<dl className="mt-8 space-y-3 text-sm">
							<Linha rotulo="Conteúdo" valor={estado.dados.content} />
							{estado.dados.licensorName && (
								<Linha
									rotulo="Licenciado por"
									valor={estado.dados.licensorName}
								/>
							)}
							<Linha
								rotulo="Emitida em"
								valor={new Date(estado.dados.issuedAt).toLocaleDateString(
									'pt-BR',
								)}
							/>
							<Linha rotulo="Código" valor={estado.dados.code} mono />
						</dl>
					</>
				)}
			</div>
		</main>
	);
}

function Veredito({
	icone,
	titulo,
	texto,
}: {
	icone: React.ReactNode;
	titulo: string;
	texto: string;
}) {
	return (
		<div className="flex flex-col items-center text-center">
			{icone}
			<h1 className="font-display mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
				{titulo}
			</h1>
			<p className="mt-2 text-sm text-slate-600 dark:text-gray-400">{texto}</p>
		</div>
	);
}

function Linha({
	rotulo,
	valor,
	mono,
}: {
	rotulo: string;
	valor: string;
	mono?: boolean;
}) {
	return (
		<div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3 dark:border-white/10">
			<dt className="text-slate-500 dark:text-gray-400">{rotulo}</dt>
			<dd
				className={`text-right font-medium text-slate-900 dark:text-white ${mono ? 'font-mono text-xs' : ''}`}
			>
				{valor}
			</dd>
		</div>
	);
}
