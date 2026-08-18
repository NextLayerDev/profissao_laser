'use client';

import { BadgeCheck, Check, Copy, Download } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import type { ArtLicense } from '../services/tool-definitions.service';

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
export function ArtLicensePanel({ license }: { license: ArtLicense }) {
	const [dataUrl, setDataUrl] = useState<string | null>(null);
	const [copiado, setCopiado] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const url = artLicenseUrl(license.code);

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
		await navigator.clipboard.writeText(license.code);
		setCopiado(true);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setCopiado(false), 2500);
	};

	const baixarQr = () => {
		if (!dataUrl) return;
		const a = document.createElement('a');
		a.href = dataUrl;
		a.download = `qr-${license.code}.png`;
		a.click();
	};

	return (
		<div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
			<p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
				<BadgeCheck className="h-4 w-4 shrink-0" />
				Arte licenciada
				{license.licensorName ? ` — ${license.licensorName}` : ''}
			</p>

			<div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
				{dataUrl ? (
					<img
						src={dataUrl}
						alt={`QR de autenticidade da peça ${license.code}`}
						className="h-32 w-32 shrink-0 rounded-lg bg-white p-1"
					/>
				) : (
					<div className="h-32 w-32 shrink-0 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
				)}

				<div className="min-w-0 flex-1">
					<p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-gray-500">
						Código da peça
					</p>
					<p className="font-mono mt-1 break-all text-sm font-semibold text-slate-900 dark:text-white">
						{license.code}
					</p>
					<p className="mt-2 text-xs text-slate-600 dark:text-gray-400">
						Grave este QR junto com a arte. Quem escanear vê que a peça é
						oficial.
					</p>

					<div className="mt-3 flex flex-wrap gap-2">
						<button
							type="button"
							onClick={copiar}
							className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-emerald-400 dark:border-white/15 dark:text-gray-200"
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
							onClick={baixarQr}
							disabled={!dataUrl}
							className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-emerald-400 disabled:opacity-50 dark:border-white/15 dark:text-gray-200"
						>
							<Download className="h-3.5 w-3.5" />
							Baixar QR
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
