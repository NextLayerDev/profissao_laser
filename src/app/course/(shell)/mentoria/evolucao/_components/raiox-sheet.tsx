'use client';

// Página de PDF do Raio-X: folha A4 sem shell nem navegação, com cabeçalho
// (empresa, turma, data). "Baixar PDF" é o `window.print()` — no diálogo o
// navegador já oferece "Salvar como PDF", sem gerar arquivo no servidor.
// Usada pelo aluno (/raiox/[id]) e pelo mentor (/mentoria-admin/raiox/[id]).

import { ArrowLeft, FileDown } from 'lucide-react';
import Link from 'next/link';
import type { MntReport } from '@/modules/mentoria/types';
import { BTN_GHOST, BTN_PRIMARY, fmtDate } from '../../_components/shared';
import { RaioxView } from './raiox-view';

type Empresa = {
	name?: string | null;
	cnpj?: string | null;
	city?: string | null;
	state?: string | null;
	logo_url?: string | null;
};

export function RaioxSheet({
	report,
	loading,
	error,
	backHref,
}: {
	report: MntReport | undefined;
	loading: boolean;
	error: boolean;
	backHref: string;
}) {
	const p = (report?.payload ?? {}) as Record<string, unknown>;
	const empresa = (p.empresa ?? null) as Empresa | null;
	const turma = (p.turma ?? null) as { name?: string } | null;
	const place = [empresa?.city, empresa?.state].filter(Boolean).join('/');

	return (
		<div className="min-h-screen bg-surface-sunken px-4 py-6 print:bg-white print:p-0">
			<div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-2 print:hidden">
				<Link href={backHref} className={BTN_GHOST}>
					<ArrowLeft className="h-4 w-4" aria-hidden />
					Voltar
				</Link>
				<button
					type="button"
					onClick={() => window.print()}
					disabled={!report}
					className={BTN_PRIMARY}
					data-testid="raiox-print"
				>
					<FileDown className="h-4 w-4" aria-hidden />
					Baixar PDF
				</button>
			</div>

			{/* A4 vem do `@page` do globals.css; `print-root`
			    esconde o resto do documento na impressão. */}
			<article
				className="raiox-sheet print-root mx-auto min-h-[297mm] max-w-[210mm] rounded-card border border-subtle bg-surface p-[15mm] shadow-sm print:min-h-0 print:max-w-none print:rounded-none print:border-0 print:p-0"
				data-testid="raiox-sheet"
			>
				{loading ? (
					<p className="text-muted">Carregando…</p>
				) : error || !report ? (
					<p className="text-red-600 dark:text-red-400" role="alert">
						Não foi possível abrir o relatório.
					</p>
				) : (
					<>
						<header className="mb-6 flex items-start justify-between gap-4 border-b border-subtle pb-4">
							<div className="min-w-0">
								<p className="text-caption uppercase tracking-wide text-muted">
									Raio-X Empresarial 360°
								</p>
								<h1
									className="font-display text-xl font-bold text-primary"
									data-testid="raiox-company"
								>
									{empresa?.name ?? 'Empresa'}
								</h1>
								<p className="text-caption text-secondary">
									{[empresa?.cnpj, place, turma?.name]
										.filter(Boolean)
										.join(' · ')}
								</p>
							</div>
							<div className="shrink-0 text-right">
								{empresa?.logo_url && (
									// <img> simples: logo do CDN, sem o otimizador do Next na folha impressa.
									<img
										src={empresa.logo_url}
										alt=""
										className="mb-1 ml-auto h-10 w-auto object-contain"
									/>
								)}
								<p className="text-caption text-muted">Gerado em</p>
								<p className="text-label text-primary">
									{fmtDate(report.generated_at)}
								</p>
							</div>
						</header>
						<RaioxView report={report} sheet />
						<footer className="mt-8 border-t border-subtle pt-3 text-center text-caption text-muted">
							Profissão Laser 360°
						</footer>
					</>
				)}
			</article>
		</div>
	);
}
