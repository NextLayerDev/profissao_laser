'use client';

import {
	AlertCircle,
	ArrowLeft,
	BookOpen,
	Check,
	Copy,
	ExternalLink,
	Eye,
	EyeOff,
	Loader2,
	Monitor,
	XCircle,
	Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useProvisioningJob,
	useProvisioningStatus,
} from '@/hooks/use-provisioning';

// Internal steps — used only for progress % calculation
const STEPS = [
	{ key: 'created' },
	{ key: 'payment_confirmed' },
	{ key: 'supabase_org_created' },
	{ key: 'supabase_project_creating' },
	{ key: 'supabase_ready' },
	{ key: 'sql_bootstrapped' },
	{ key: 'admin_created' },
	{ key: 'vercel_project_created' },
	{ key: 'blob_created' },
	{ key: 'vercel_envs_configured' },
	{ key: 'vercel_deploying' },
	{ key: 'vercel_ready' },
	{ key: 'completed' },
] as const;

// Client-visible steps — simplified and friendly
const CLIENT_STEPS = [
	{
		label: 'Confirmando seu pagamento',
		description: 'Estamos verificando seu pagamento com segurança.',
		backendStatuses: ['created', 'payment_confirmed'],
	},
	{
		label: 'Preparando seu banco de dados',
		description:
			'Criando um ambiente exclusivo para a sua empresa. Isso costuma levar de 3 a 5 minutos.',
		backendStatuses: [
			'supabase_org_created',
			'supabase_project_creating',
			'supabase_ready',
			'sql_bootstrapped',
			'admin_created',
		],
	},
	{
		label: 'Configurando seu sistema',
		description: 'Aplicando suas configurações e personalizando o ambiente.',
		backendStatuses: [
			'vercel_project_created',
			'blob_created',
			'vercel_envs_configured',
		],
	},
	{
		label: 'Publicando online',
		description: 'Seu sistema está sendo publicado. Quase lá!',
		backendStatuses: ['vercel_deploying', 'vercel_ready', 'completed'],
	},
];

const PROGRESS_HEADERS: Record<number, { title: string; subtitle: string }> = {
	0: {
		title: 'Verificando seu pagamento...',
		subtitle: 'Aguarde, isso é rápido!',
	},
	1: {
		title: 'Criando seu ambiente exclusivo...',
		subtitle: 'Isso costuma levar de 3 a 5 minutos. Fique tranquilo!',
	},
	2: {
		title: 'Configurando seu sistema...',
		subtitle: 'Quase lá, só mais um instante!',
	},
	3: {
		title: 'Publicando seu sistema...',
		subtitle: 'Últimos ajustes antes de você acessar!',
	},
};

function getStepIndex(status: string): number {
	return STEPS.findIndex((s) => s.key === status);
}

function getProgress(status: string): number {
	const idx = getStepIndex(status);
	if (idx < 0) return 0;
	return Math.round((idx / (STEPS.length - 1)) * 100);
}

function getClientStepIndex(status: string): number {
	return CLIENT_STEPS.findIndex((s) =>
		(s.backendStatuses as readonly string[]).includes(status),
	);
}

function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text);
	toast.success('Copiado!');
}

export default function CheckoutSuccessPage() {
	const searchParams = useSearchParams();
	const sessionId = searchParams.get('session_id');
	const [showSystemPassword, setShowSystemPassword] = useState(false);
	const [showCoursePassword, setShowCoursePassword] = useState(false);

	const {
		data: jobData,
		isError: jobError,
		failureCount: jobFailureCount,
	} = useProvisioningJob(sessionId);

	const { data: statusData } = useProvisioningStatus(jobData?.jobId ?? null);

	const currentStatus = statusData?.status ?? 'checking';
	const isCompleted = currentStatus === 'completed';
	const isFailed = currentStatus === 'failed';

	// No session_id
	if (!sessionId) {
		return (
			<PageWrapper>
				<div className="max-w-md mx-auto text-center">
					<div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
						<AlertCircle className="w-10 h-10 text-red-400" />
					</div>
					<h2 className="text-2xl font-bold text-white mb-3">
						Sessão inválida
					</h2>
					<p className="text-gray-400 mb-8">
						Nenhum identificador de sessão encontrado. Se você acabou de
						realizar uma compra, verifique seu e-mail.
					</p>
					<Link
						href="/store"
						className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Voltar para a loja
					</Link>
				</div>
			</PageWrapper>
		);
	}

	// Waiting for jobId (webhook not yet processed)
	if (!jobData && !jobError) {
		return (
			<PageWrapper>
				<div className="max-w-md mx-auto text-center">
					<div className="relative w-20 h-20 mx-auto mb-6">
						<div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
						<div className="relative w-20 h-20 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
							<Loader2 className="w-9 h-9 text-violet-400 animate-spin" />
						</div>
					</div>
					<h2 className="text-2xl font-bold text-white mb-3">
						Verificando seu pagamento...
					</h2>
					<p className="text-gray-400">
						Aguarde enquanto confirmamos seu pagamento. Isso é rápido!
					</p>
					{jobFailureCount > 3 && (
						<p className="text-sm text-gray-500 mt-4">
							Ainda processando... tentativa {jobFailureCount}/10
						</p>
					)}
				</div>
			</PageWrapper>
		);
	}

	// Job not found after all retries
	if (jobError && !jobData) {
		return (
			<PageWrapper>
				<div className="max-w-md mx-auto text-center">
					<div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
						<XCircle className="w-10 h-10 text-red-400" />
					</div>
					<h2 className="text-2xl font-bold text-white mb-3">
						Compra não encontrada
					</h2>
					<p className="text-gray-400 mb-8">
						Não foi possível localizar sua compra. Aguarde alguns minutos e
						tente novamente, ou entre em contato com o suporte.
					</p>
					<Link
						href="/store"
						className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Voltar para a loja
					</Link>
				</div>
			</PageWrapper>
		);
	}

	// Failed provisioning
	if (isFailed) {
		return (
			<PageWrapper>
				<div className="max-w-md mx-auto text-center">
					<div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
						<XCircle className="w-10 h-10 text-red-400" />
					</div>
					<h2 className="text-2xl font-bold text-white mb-3">
						Algo deu errado
					</h2>
					<p className="text-gray-400 mb-6">
						Ocorreu um erro ao configurar seu sistema. Nossa equipe já foi
						notificada e entrará em contato em breve.
					</p>
					{statusData?.lastError && (
						<div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 mb-8 text-left">
							<p className="text-xs text-red-400 font-mono break-all">
								{statusData.lastError}
							</p>
						</div>
					)}
					<Link
						href="/store"
						className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Voltar para a loja
					</Link>
				</div>
			</PageWrapper>
		);
	}

	// Completed — show credentials in 2 cards
	if (isCompleted && statusData) {
		return (
			<PageWrapper>
				<div className="max-w-3xl mx-auto space-y-8">
					{/* Success header */}
					<div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/60 via-[#0d0d0f] to-violet-950/40 p-8 text-center">
						<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />
						<div className="relative">
							<div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
								<Check className="w-10 h-10 text-emerald-400" />
							</div>
							<h2 className="text-3xl font-bold text-white mb-2">
								Tudo pronto! 🎉
							</h2>
							<p className="text-gray-400">
								Seu sistema e acesso ao curso foram configurados com sucesso.
							</p>
						</div>
					</div>

					{/* Cards grid */}
					<div className="grid gap-6 md:grid-cols-2">
						{/* Card 1: Sistema */}
						<div className="flex flex-col rounded-2xl border border-violet-500/20 bg-[#111113] overflow-hidden">
							<div className="bg-gradient-to-r from-violet-600/15 to-violet-600/5 border-b border-violet-500/20 px-6 py-4 flex items-center gap-3">
								<div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
									<Monitor className="w-4 h-4 text-violet-400" />
								</div>
								<div>
									<h3 className="font-bold text-white text-sm">Seu Sistema</h3>
									<p className="text-xs text-gray-500">
										Acesso ao painel admin
									</p>
								</div>
							</div>
							<div className="p-6 space-y-4 flex-1">
								{statusData.tenantUrl && (
									<CredentialRow
										label="URL do sistema"
										value={statusData.tenantUrl}
										isLink
									/>
								)}
								{statusData.adminEmail && (
									<CredentialRow
										label="Email do admin"
										value={statusData.adminEmail}
									/>
								)}
								{statusData.adminPassword && (
									<PasswordRow
										label="Senha do admin"
										value={statusData.adminPassword}
										show={showSystemPassword}
										onToggle={() => setShowSystemPassword((v) => !v)}
									/>
								)}
								{statusData.plan && (
									<div>
										<p className="text-xs font-medium text-gray-500 mb-1">
											Plano
										</p>
										<span className="inline-flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-full capitalize">
											<Zap className="w-3 h-3" />
											{statusData.plan}
										</span>
									</div>
								)}
							</div>
							{statusData.tenantUrl && (
								<div className="px-6 pb-6">
									<a
										href={`https://${statusData.tenantUrl}`}
										target="_blank"
										rel="noopener noreferrer"
										className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
									>
										<ExternalLink className="w-4 h-4" />
										Acessar meu sistema
									</a>
								</div>
							)}
						</div>

						{/* Card 2: Curso */}
						{statusData.customerEmail && (
							<div className="flex flex-col rounded-2xl border border-emerald-500/20 bg-[#111113] overflow-hidden">
								<div className="bg-gradient-to-r from-emerald-600/15 to-emerald-600/5 border-b border-emerald-500/20 px-6 py-4 flex items-center gap-3">
									<div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
										<BookOpen className="w-4 h-4 text-emerald-400" />
									</div>
									<div>
										<h3 className="font-bold text-white text-sm">
											Acesso ao Curso
										</h3>
										<p className="text-xs text-gray-500">
											Plataforma Profissão Laser
										</p>
									</div>
								</div>
								<div className="p-6 space-y-4 flex-1">
									<CredentialRow
										label="Email da conta"
										value={statusData.customerEmail}
									/>
									{statusData.customerPassword ? (
										<PasswordRow
											label="Senha da conta"
											value={statusData.customerPassword}
											show={showCoursePassword}
											onToggle={() => setShowCoursePassword((v) => !v)}
										/>
									) : (
										<div>
											<p className="text-xs font-medium text-gray-500 mb-1">
												Senha da conta
											</p>
											<p className="text-sm text-gray-300">
												Use a senha que você criou ao se cadastrar.
											</p>
										</div>
									)}
								</div>
								<div className="px-6 pb-6">
									<div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4">
										<p className="text-sm text-gray-400 leading-relaxed">
											Para acessar o curso, entre no seu sistema e faça login
											com o e-mail e senha que você utiliza na plataforma{' '}
											<span className="text-white font-medium">
												Profissão Laser
											</span>
											.
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</PageWrapper>
		);
	}

	// In progress
	const progress = getProgress(currentStatus);
	const currentClientIndex = getClientStepIndex(currentStatus);
	const header = PROGRESS_HEADERS[currentClientIndex] ?? PROGRESS_HEADERS[0];

	return (
		<PageWrapper>
			<div className="max-w-lg mx-auto space-y-5">
				{/* Header card — dynamic message per phase */}
				<div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-[#0d0d0f] p-7 text-center">
					<div className="relative w-16 h-16 mx-auto mb-5">
						<div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
						<div className="relative w-16 h-16 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
							<Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
						</div>
					</div>
					<h2 className="text-2xl font-bold text-white mb-2">{header.title}</h2>
					<p className="text-gray-400 text-sm">{header.subtitle}</p>
				</div>

				{/* Progress + Client Steps */}
				<div className="rounded-2xl border border-white/[0.07] bg-[#111113] p-6">
					{/* Progress bar */}
					<div className="mb-8">
						<div className="flex items-center justify-between mb-2.5">
							<span className="text-sm font-medium text-gray-300">
								Progresso
							</span>
							<span className="text-sm font-bold text-violet-400">
								{progress}%
							</span>
						</div>
						<div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
							<div
								className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-700 ease-out"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>

					{/* Client steps list */}
					<div className="space-y-1">
						{CLIENT_STEPS.map((step, idx) => {
							const isDone = idx < currentClientIndex;
							const isCurrent = idx === currentClientIndex;
							const isPending = idx > currentClientIndex;
							const isLast = idx === CLIENT_STEPS.length - 1;

							return (
								<div key={step.label} className="flex items-start gap-4">
									{/* Icon + connector line */}
									<div className="flex flex-col items-center pt-0.5">
										{isDone ? (
											<div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
												<Check className="w-3.5 h-3.5 text-emerald-400" />
											</div>
										) : isCurrent ? (
											<div className="relative w-7 h-7 shrink-0">
												<div className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping" />
												<div className="relative w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/60 flex items-center justify-center">
													<Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
												</div>
											</div>
										) : (
											<div className="w-7 h-7 rounded-full border border-white/10 bg-white/[0.03] shrink-0" />
										)}
										{!isLast && (
											<div
												className={`w-px mt-1.5 mb-1.5 h-6 ${
													isDone ? 'bg-emerald-500/30' : 'bg-white/[0.06]'
												}`}
											/>
										)}
									</div>

									{/* Text */}
									<div
										className={`flex-1 pb-2 ${isCurrent ? 'pt-0' : 'pt-0.5'}`}
									>
										<p
											className={`text-sm font-medium leading-tight ${
												isDone
													? 'text-gray-500'
													: isCurrent
														? 'text-white'
														: isPending
															? 'text-gray-600'
															: 'text-gray-500'
											}`}
										>
											{step.label}
										</p>
										{isCurrent && (
											<p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
												{step.description}
											</p>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</PageWrapper>
	);
}

function PageWrapper({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-[#0d0d0f] text-white font-sans">
			<header className="border-b border-white/[0.06] bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-10">
				<div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
					<Link
						href="/store"
						className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Voltar para a loja
					</Link>
					<span className="text-sm font-semibold tracking-tight text-gray-200">
						Status da compra
					</span>
					<div className="w-28" />
				</div>
			</header>
			<main className="max-w-5xl mx-auto px-6 py-12">{children}</main>
		</div>
	);
}

function CredentialRow({
	label,
	value,
	isLink,
}: {
	label: string;
	value: string;
	isLink?: boolean;
}) {
	return (
		<div>
			<p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
			<div className="flex items-center gap-2">
				<code className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-gray-200 font-mono truncate">
					{isLink ? (
						<a
							href={`https://${value}`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-violet-400 hover:text-violet-300 transition-colors"
						>
							{value}
						</a>
					) : (
						value
					)}
				</code>
				<button
					type="button"
					onClick={() => copyToClipboard(value)}
					title="Copiar"
					className="p-2 text-gray-500 hover:text-violet-400 transition-colors cursor-pointer shrink-0"
				>
					<Copy className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}

function PasswordRow({
	label,
	value,
	show,
	onToggle,
}: {
	label: string;
	value: string;
	show: boolean;
	onToggle: () => void;
}) {
	return (
		<div>
			<p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
			<div className="flex items-center gap-2">
				<code className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-gray-200 font-mono">
					{show ? value : '••••••••••••'}
				</code>
				<button
					type="button"
					onClick={onToggle}
					title={show ? 'Ocultar' : 'Mostrar'}
					className="p-2 text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
				>
					{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
				</button>
				<button
					type="button"
					onClick={() => copyToClipboard(value)}
					title="Copiar"
					className="p-2 text-gray-500 hover:text-violet-400 transition-colors cursor-pointer shrink-0"
				>
					<Copy className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}
