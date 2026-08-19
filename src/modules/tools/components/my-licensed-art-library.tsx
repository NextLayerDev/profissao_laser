'use client';

import {
	BadgeCheck,
	Download,
	ExternalLink,
	Loader2,
	ShieldX,
} from 'lucide-react';
import { useMyLicensedArt } from '../hooks/use-my-licensed-art';
import { ArtLicensePanel, artLicenseUrl } from './art-license-panel';

/**
 * Biblioteca das artes licenciadas do aluno.
 *
 * A arte sem o código não serve: quem produz a peça meses depois precisa
 * reencontrar o QR daquela geração, e a URL do CDN sozinha não diz qual código
 * pertence a ela. Aqui os dois andam juntos, como saíram.
 */
export function MyLicensedArtLibrary() {
	const { data: artes, isLoading, error } = useMyLicensedArt();

	if (isLoading) {
		return (
			<div className="flex justify-center py-16">
				<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
			</div>
		);
	}

	if (error) {
		return (
			<p className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/5 dark:text-red-400">
				Não foi possível carregar suas artes licenciadas.
			</p>
		);
	}

	if (!artes || artes.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-slate-300 py-16 text-center dark:border-white/15">
				<p className="font-display text-lg font-semibold">
					Você ainda não gerou nenhuma arte licenciada.
				</p>
				<p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
					Cada arte que você gerar aparece aqui, com o código e o QR para gravar
					na peça.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{artes.map((a) => (
				<article
					key={a.id}
					className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1a1a1d]"
				>
					<div className="flex flex-col gap-4 p-4 sm:flex-row">
						<div className="h-32 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:w-48 dark:bg-white/5">
							{a.previewUrl ? (
								/* <img> intencional: a arte vem de CDN dinâmico. */
								<img
									src={a.previewUrl}
									alt={a.promptTitle ?? 'Arte licenciada'}
									className="h-full w-full object-cover"
								/>
							) : null}
						</div>

						<div className="min-w-0 flex-1">
							<p className="flex items-center gap-1.5 font-semibold">
								{a.revoked ? (
									<ShieldX className="h-4 w-4 shrink-0 text-red-500" />
								) : (
									<BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
								)}
								<span className="truncate">
									{a.promptTitle ?? a.licensorName ?? a.featureKey}
								</span>
							</p>
							<p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">
								{a.licensorName ? `${a.licensorName} · ` : ''}
								{new Date(a.issuedAt).toLocaleDateString('pt-BR')}
							</p>
							<p className="font-mono mt-2 break-all text-sm font-semibold text-slate-900 dark:text-white">
								{a.code}
							</p>
							{a.revoked && (
								<p className="mt-1 text-xs text-red-600 dark:text-red-400">
									Licença revogada — esta peça não é mais verificável como
									oficial.
								</p>
							)}

							<div className="mt-3 flex flex-wrap gap-2">
								{a.previewUrl && (
									<a
										href={a.previewUrl}
										download
										className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium transition-colors hover:border-violet-400 dark:border-white/15"
									>
										<Download className="h-3.5 w-3.5" />
										Baixar arte
									</a>
								)}
								<a
									href={artLicenseUrl(a.code)}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium transition-colors hover:border-violet-400 dark:border-white/15"
								>
									<ExternalLink className="h-3.5 w-3.5" />
									Ver a página do QR
								</a>
							</div>
						</div>
					</div>

					{/* O QR completo, com copiar e baixar — o mesmo painel que aparece
					    logo depois de gerar, para a peça produzida meses depois sair
					    idêntica à primeira. */}
					{!a.revoked && (
						<div className="border-t border-slate-200 p-4 dark:border-white/10">
							<ArtLicensePanel
								license={{
									code: a.code,
									featureKey: a.featureKey,
									licensorName: a.licensorName,
									issuedAt: a.issuedAt,
								}}
							/>
						</div>
					)}
				</article>
			))}
		</div>
	);
}
