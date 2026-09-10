'use client';

import { BadgeCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type License = {
	code: string;
	valid: boolean;
	status: 'active' | 'revoked';
	content: string;
	brandName?: string | null;
	crestUrl?: string | null;
	accentColor?: string | null;
	previewUrl?: string | null;
	issuedAt?: string | null;
	checkedAt?: string | null;
};

type VerificationState =
	| { kind: 'loading' }
	| { kind: 'active'; license: License }
	| { kind: 'revoked'; license: License }
	| { kind: 'not-found' }
	| { kind: 'unavailable' };

// This is the application's API, not the gateway. The public verifier must not
// depend on gateway authentication or its private upstream network.
const defaultPublicApiUrl =
	'https://profissao-laser-profissao-laser-back.1nwz76.easypanel.host';
const apiUrl = (process.env.NEXT_PUBLIC_API_URL || defaultPublicApiUrl).replace(
	/\/+$/,
	'',
);

function formatDate(value?: string | null): string | null {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? null
		: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
}

function safeAccent(value?: string | null): string | undefined {
	return value && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined;
}

export default function LicensedArtVerificationPage() {
	const params = useParams<{ code: string }>();
	const code = typeof params?.code === 'string' ? params.code : '';
	const [state, setState] = useState<VerificationState>({ kind: 'loading' });

	useEffect(() => {
		const controller = new AbortController();

		async function verify() {
			if (!code) {
				setState({ kind: 'unavailable' });
				return;
			}

			try {
				const response = await fetch(
					`${apiUrl}/api/licensed-art/${encodeURIComponent(code)}`,
					{
						cache: 'no-store',
						credentials: 'omit',
						signal: controller.signal,
					},
				);

				if (response.status === 404) {
					setState({ kind: 'not-found' });
					return;
				}
				if (!response.ok) {
					setState({ kind: 'unavailable' });
					return;
				}

				const license = (await response.json()) as License;
				setState(
					license.valid && license.status === 'active'
						? { kind: 'active', license }
						: { kind: 'revoked', license },
				);
			} catch (error) {
				if ((error as DOMException).name !== 'AbortError') {
					setState({ kind: 'unavailable' });
				}
			}
		}

		setState({ kind: 'loading' });
		void verify();
		return () => controller.abort();
	}, [code]);

	const license = 'license' in state ? state.license : null;
	const active = state.kind === 'active';
	const revoked = state.kind === 'revoked';
	const accent =
		safeAccent(license?.accentColor) ?? (active ? '#15803d' : '#7c3aed');
	const issuedAt = formatDate(license?.issuedAt);

	const content =
		state.kind === 'loading'
			? {
					title: 'Verificando licença…',
					text: 'Aguarde enquanto consultamos a autenticidade desta peça.',
				}
			: active
				? {
						title: 'Licença validada',
						text: 'Esta arte foi gerada sob licença oficial.',
					}
				: revoked
					? {
							title: 'Licença revogada',
							text: 'Esta licença não está mais válida.',
						}
					: state.kind === 'not-found'
						? {
								title: 'Código não encontrado',
								text: 'Não encontramos uma licença emitida para este código.',
							}
						: {
								title: 'Verificação indisponível',
								text: 'Não foi possível consultar a licença agora. Tente novamente em instantes.',
							};

	const Icon = active ? BadgeCheck : revoked ? ShieldX : ShieldAlert;

	return (
		<main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
			<section className="mx-auto max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
				<div
					className="px-6 py-5 text-white"
					style={{ backgroundColor: accent }}
				>
					<p className="text-sm font-semibold tracking-wide">Profissão Laser</p>
					<p className="mt-1 text-xs text-white/80">
						Verificação de arte licenciada
					</p>
				</div>

				<div className="px-6 py-8 text-center">
					<div
						className="mx-auto flex size-16 items-center justify-center rounded-full"
						style={{ backgroundColor: `${accent}1a`, color: accent }}
					>
						<Icon className="size-9" aria-hidden="true" />
					</div>
					<h1 className="mt-5 text-2xl font-bold tracking-tight">
						{content.title}
					</h1>
					<p className="mt-2 text-sm leading-6 text-slate-600">
						{content.text}
					</p>

					{license && (
						<div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 text-left">
							{license.crestUrl && (
								<div className="flex justify-center border-b border-slate-100 bg-slate-50 p-5">
									<img
										src={license.crestUrl}
										alt={
											license.brandName
												? `Escudo ${license.brandName}`
												: 'Escudo da marca'
										}
										className="max-h-20 max-w-40 object-contain"
									/>
								</div>
							)}
							<dl className="divide-y divide-slate-100 text-sm">
								{license.brandName && (
									<InfoRow label="Marca" value={license.brandName} />
								)}
								<InfoRow
									label="Conteúdo"
									value={license.content || 'Arte licenciada'}
								/>
								<InfoRow label="Código" value={license.code || code} mono />
								{issuedAt && <InfoRow label="Emitida em" value={issuedAt} />}
							</dl>
						</div>
					)}
				</div>
			</section>
		</main>
	);
}

function InfoRow({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="flex items-start justify-between gap-5 px-4 py-3">
			<dt className="shrink-0 text-slate-500">{label}</dt>
			<dd
				className={`text-right font-medium text-slate-800 ${mono ? 'break-all font-mono text-xs' : ''}`}
			>
				{value}
			</dd>
		</div>
	);
}
