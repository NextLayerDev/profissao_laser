'use client';

import { Bot, Check, Copy, Loader2, QrCode, Server, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	useOmniInstanceMutations,
	useOmniInstanceStatus,
} from '../hooks/use-omni';
import type { OmniInstance, OmniProvider } from '../types/omni';

/**
 * Wizard de conexão do WhatsApp: escolher provedor → (Meta: credenciais) →
 * conectar → QR (poll 3s até conectar). Porta o fluxo do omni.tsx do porteira.
 */
export function SetupWizard({
	instance,
	onReady,
}: {
	instance: OmniInstance | null;
	onReady: () => void;
}) {
	const { create, connect } = useOmniInstanceMutations();
	const [provider, setProvider] = useState<OmniProvider | null>(
		instance?.provider ?? null,
	);
	const [meta, setMeta] = useState({
		meta_phone_number_id: '',
		meta_waba_token: '',
		meta_verify_token: '',
		meta_app_secret: '',
	});
	const [qr, setQr] = useState<string | null>(instance?.qr_code ?? null);
	const [connecting, setConnecting] = useState(false);
	const [webhookUrl, setWebhookUrl] = useState<string | null>(
		instance?.webhook_url ?? null,
	);

	const currentId = instance?.id ?? create.data?.id ?? null;
	const polling = !!currentId && (connecting || !!qr);
	const status = useOmniInstanceStatus(currentId, polling);

	useEffect(() => {
		if (status.data?.status === 'connected') {
			toast.success('WhatsApp conectado!');
			onReady();
		}
	}, [status.data?.status, onReady]);

	// Z-API invalida o QR (~20s) → renova re-chamando connect.
	useEffect(() => {
		if (!qr || !currentId) return;
		const t = setInterval(() => {
			connect
				.mutateAsync(currentId)
				.then((res) => {
					const next = res.qrCodeBase64 ?? res.qr_code ?? null;
					if (next) setQr(next);
				})
				.catch(() => {});
		}, 20_000);
		return () => clearInterval(t);
	}, [qr, currentId, connect]);

	async function handleStart(p: OmniProvider) {
		setProvider(p);
		if (p === 'meta') return; // aguarda o form
		await startInstance(p);
	}

	async function startInstance(p: OmniProvider) {
		setConnecting(true);
		try {
			let id = instance?.id ?? null;
			if (!id) {
				const created = await create.mutateAsync({
					provider: p,
					...(p === 'meta'
						? {
								credentials: {
									meta_phone_number_id: meta.meta_phone_number_id.trim(),
									meta_waba_token: meta.meta_waba_token.trim(),
									meta_verify_token: meta.meta_verify_token.trim(),
									...(meta.meta_app_secret.trim()
										? { meta_app_secret: meta.meta_app_secret.trim() }
										: {}),
								},
							}
						: {}),
				});
				id = created.id;
				setWebhookUrl(created.webhook_url ?? null);
			}
			const res = await connect.mutateAsync(id as string);
			const nextQr = res.qrCodeBase64 ?? res.qr_code ?? null;
			setQr(nextQr);
			if (res.status === 'connected') onReady();
			if (p === 'meta' && res.status !== 'connected') {
				toast.error('Credenciais Meta não validaram. Confira e tente de novo.');
			}
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Falha ao conectar instância',
			);
		} finally {
			setConnecting(false);
		}
	}

	const PROVIDERS: {
		key: OmniProvider;
		title: string;
		desc: string;
		icon: typeof Zap;
	}[] = [
		{
			key: 'zapi',
			title: 'Z-API',
			desc: 'Criação automática da instância + QR code. Custo por instância.',
			icon: Zap,
		},
		{
			key: 'evolution',
			title: 'Evolution API',
			desc: 'Instância própria (self-hosted) + QR code. Sem custo extra.',
			icon: Server,
		},
		{
			key: 'meta',
			title: 'Meta (API oficial)',
			desc: 'WhatsApp Cloud API oficial — cole as credenciais do seu app Meta.',
			icon: Bot,
		},
	];

	return (
		<div className="mx-auto max-w-3xl py-10">
			<div className="text-center mb-8">
				<div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-violet-600/15">
					<Bot className="h-7 w-7 text-violet-500" />
				</div>
				<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
					Conecte o WhatsApp da sua empresa
				</h2>
				<p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
					Escolha o provedor, conecte e a IA começa a atender. Cada mensagem
					respondida pela IA custa 0,2 voxxys.
				</p>
			</div>

			{!qr && (
				<div className="grid gap-4 sm:grid-cols-3">
					{PROVIDERS.map((p) => (
						<button
							key={p.key}
							type="button"
							disabled={connecting}
							onClick={() => handleStart(p.key)}
							className={`rounded-2xl border p-5 text-left transition-colors ${
								provider === p.key
									? 'border-violet-500 bg-violet-500/5'
									: 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-violet-500/40'
							}`}
						>
							<p.icon className="mb-3 h-6 w-6 text-violet-500" />
							<p className="font-semibold text-slate-900 dark:text-white">
								{p.title}
							</p>
							<p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
								{p.desc}
							</p>
						</button>
					))}
				</div>
			)}

			{provider === 'meta' && !qr && (
				<div className="mt-6 space-y-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5">
					<p className="text-sm font-semibold text-slate-900 dark:text-white">
						Credenciais do app Meta (WhatsApp Cloud API)
					</p>
					{(
						[
							['meta_phone_number_id', 'Phone Number ID'],
							['meta_waba_token', 'Access Token (permanente)'],
							['meta_verify_token', 'Verify Token (você define)'],
							['meta_app_secret', 'App Secret (opcional)'],
						] as const
					).map(([key, label]) => (
						<label key={key} className="block">
							<span className="mb-1 block text-xs font-medium text-slate-500 dark:text-gray-400">
								{label}
							</span>
							<input
								value={meta[key]}
								onChange={(e) =>
									setMeta((m) => ({ ...m, [key]: e.target.value }))
								}
								className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white font-mono"
							/>
						</label>
					))}
					{webhookUrl && (
						<div className="rounded-xl border border-sky-500/25 bg-sky-500/10 p-3 text-xs text-sky-700 dark:text-sky-300">
							<p className="font-semibold mb-1">
								Configure o webhook no painel Meta:
							</p>
							<div className="flex items-center gap-2">
								<code className="flex-1 truncate">{webhookUrl}</code>
								<button
									type="button"
									onClick={() => {
										navigator.clipboard.writeText(webhookUrl);
										toast.success('URL copiada');
									}}
									className="shrink-0 text-sky-600"
								>
									<Copy className="h-3.5 w-3.5" />
								</button>
							</div>
						</div>
					)}
					<button
						type="button"
						disabled={
							connecting ||
							!meta.meta_phone_number_id ||
							!meta.meta_waba_token ||
							!meta.meta_verify_token
						}
						onClick={() => startInstance('meta')}
						className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
					>
						{connecting ? 'Validando…' : 'Conectar API oficial'}
					</button>
				</div>
			)}

			{connecting && !qr && (
				<div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
					<Loader2 className="h-4 w-4 animate-spin" /> Criando instância…
				</div>
			)}

			{qr && (
				<div className="mt-8 text-center">
					<div className="mx-auto w-fit rounded-2xl border border-slate-200 dark:border-white/10 bg-white p-4">
						<img
							src={qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`}
							alt="QR Code"
							className="h-64 w-64"
						/>
					</div>
					<p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-gray-400">
						<QrCode className="h-4 w-4" />
						Abra o WhatsApp → Aparelhos conectados → Conectar aparelho
					</p>
					<p className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
						<Loader2 className="h-3 w-3 animate-spin" />
						Aguardando leitura… (o QR renova sozinho)
					</p>
				</div>
			)}

			{status.data?.status === 'connected' && (
				<div className="mt-6 flex items-center justify-center gap-2 text-emerald-500">
					<Check className="h-5 w-5" /> Conectado!
				</div>
			)}
		</div>
	);
}
