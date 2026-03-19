'use client';

import { AlertCircle, Loader2, Tag, XCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	usePaymentLinkInfo,
	useRedeemPaymentLink,
} from '@/hooks/use-payment-links';
import { formatCurrency } from '@/utils/format-currency';

function getErrorStatus(error: unknown): number | null {
	if (error && typeof error === 'object' && 'response' in error) {
		return (
			(error as { response?: { status?: number } }).response?.status ?? null
		);
	}
	return null;
}

export default function PaymentLinkPage() {
	const { token } = useParams<{ token: string }>();
	const { data, error, isLoading } = usePaymentLinkInfo(token);
	const redeemMutation = useRedeemPaymentLink(token);

	const [customerName, setCustomerName] = useState('');
	const [companyName, setCompanyName] = useState('');
	const [customerPhone, setCustomerPhone] = useState('');
	const [customerCpf, setCustomerCpf] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	useEffect(() => {
		if (data) {
			setCustomerName(data.customerName);
			setCompanyName(data.companyName);
		}
	}, [data]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (
			!customerName.trim() ||
			!companyName.trim() ||
			!customerPhone.trim() ||
			!customerCpf.trim() ||
			!email.trim() ||
			!password.trim()
		) {
			toast.error('Preencha todos os campos');
			return;
		}

		if (password.length < 6) {
			toast.error('A senha deve ter no mínimo 6 caracteres');
			return;
		}

		try {
			const { checkoutUrl } = await redeemMutation.mutateAsync({
				customerName: customerName.trim(),
				companyName: companyName.trim(),
				customerPhone: customerPhone.trim(),
				customerCpf: customerCpf.trim(),
				email: email.trim(),
				password,
			});

			window.location.href = checkoutUrl;
		} catch (err: unknown) {
			const status = getErrorStatus(err);
			if (status === 403) {
				toast.error(
					'Os dados informados não conferem com o link. Verifique nome, telefone e CPF.',
				);
			} else if (status === 410) {
				toast.error('Este link já foi utilizado ou expirou.');
			} else {
				toast.error('Erro ao criar conta. Tente novamente.');
			}
		}
	}

	// Loading
	if (isLoading) {
		return (
			<PageWrapper>
				<div className="flex items-center justify-center py-32">
					<Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
				</div>
			</PageWrapper>
		);
	}

	// Error: 410 Gone
	if (error && getErrorStatus(error) === 410) {
		return (
			<PageWrapper>
				<div className="max-w-md mx-auto text-center py-20">
					<div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
						<XCircle className="w-10 h-10 text-red-400" />
					</div>
					<h2 className="text-2xl font-bold text-white mb-3">
						Link expirado ou já utilizado
					</h2>
					<p className="text-gray-400 mb-2">
						Este link de pagamento não está mais disponível.
					</p>
					<p className="text-gray-500 text-sm">
						Caso precise de um novo link, entre em contato com o administrador.
					</p>
				</div>
			</PageWrapper>
		);
	}

	// Error: 404 Not Found
	if (error && getErrorStatus(error) === 404) {
		return (
			<PageWrapper>
				<div className="max-w-md mx-auto text-center py-20">
					<div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
						<AlertCircle className="w-10 h-10 text-red-400" />
					</div>
					<h2 className="text-2xl font-bold text-white mb-3">
						Link não encontrado
					</h2>
					<p className="text-gray-400 mb-2">
						O link que você está procurando não existe ou foi removido.
					</p>
					<p className="text-gray-500 text-sm">
						Verifique se o link está correto ou entre em contato com o
						administrador.
					</p>
				</div>
			</PageWrapper>
		);
	}

	// Generic error
	if (error) {
		return (
			<PageWrapper>
				<div className="max-w-md mx-auto text-center py-20">
					<div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
						<AlertCircle className="w-10 h-10 text-red-400" />
					</div>
					<h2 className="text-2xl font-bold text-white mb-3">
						Erro ao carregar link
					</h2>
					<p className="text-gray-400 mb-2">
						Ocorreu um erro ao carregar as informações do link.
					</p>
					<p className="text-gray-500 text-sm">
						Tente novamente mais tarde ou entre em contato com o administrador.
					</p>
				</div>
			</PageWrapper>
		);
	}

	// Data not loaded yet
	if (!data) return null;

	return (
		<PageWrapper>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Left — Product summary */}
				<div className="bg-[#1a1a1d] rounded-2xl border border-gray-800 overflow-hidden">
					<div className="relative h-56 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
						<span className="text-lg font-bold text-white/80 px-6 text-center">
							{data.productName}
						</span>
					</div>

					<div className="p-6">
						<h2 className="text-2xl font-bold text-white mb-2">
							{data.productName}
						</h2>
						{data.productDescription && (
							<p className="text-gray-400 text-sm mb-4">
								{data.productDescription}
							</p>
						)}

						<div className="border-t border-gray-800 pt-5">
							<div className="flex items-center gap-3">
								<span className="text-gray-500 line-through text-lg">
									{formatCurrency(data.originalPrice, 'BRL')}
								</span>
								<span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20">
									<Tag className="w-3 h-3" />-{data.discountPercent}%
								</span>
							</div>
							<p className="text-3xl font-bold text-white mt-1">
								{formatCurrency(data.discountedPrice, 'BRL')}
							</p>
						</div>
					</div>
				</div>

				{/* Right — Form */}
				<div className="bg-[#1a1a1d] rounded-2xl border border-gray-800 p-6">
					<h3 className="text-lg font-bold text-white mb-1">
						Olá, {data.customerName}!
					</h3>
					<p className="text-sm text-gray-400 mb-6">
						Preencha seus dados para continuar com a compra.
					</p>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label
								htmlFor="pl-name"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Nome completo
							</label>
							<input
								id="pl-name"
								type="text"
								value={customerName}
								onChange={(e) => setCustomerName(e.target.value)}
								placeholder="Seu nome completo"
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<div>
							<label
								htmlFor="pl-phone"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Telefone
							</label>
							<input
								id="pl-phone"
								type="tel"
								value={customerPhone}
								onChange={(e) => setCustomerPhone(e.target.value)}
								placeholder="(11) 99999-1234"
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<div>
							<label
								htmlFor="pl-cpf"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								CPF
							</label>
							<input
								id="pl-cpf"
								type="text"
								value={customerCpf}
								onChange={(e) => setCustomerCpf(e.target.value)}
								placeholder="000.000.000-00"
								maxLength={14}
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<div>
							<label
								htmlFor="pl-email"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								E-mail
							</label>
							<input
								id="pl-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="seu@email.com"
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<div>
							<label
								htmlFor="pl-password"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Senha
							</label>
							<input
								id="pl-password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Mínimo 6 caracteres"
								minLength={6}
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<div className="pt-1">
							<label
								htmlFor="pl-company"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Nome da empresa
							</label>
							<input
								id="pl-company"
								type="text"
								value={companyName}
								onChange={(e) => setCompanyName(e.target.value)}
								placeholder="Nome da sua empresa"
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<button
							type="submit"
							disabled={redeemMutation.isPending}
							className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors cursor-pointer mt-2"
						>
							{redeemMutation.isPending ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Processando...
								</>
							) : (
								'Continuar para pagamento'
							)}
						</button>
					</form>
				</div>
			</div>
		</PageWrapper>
	);
}

function PageWrapper({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-[#0d0d0f] text-white font-sans">
			<header className="border-b border-white/[0.06] bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-10">
				<div className="max-w-5xl mx-auto px-6 py-4">
					<span className="text-lg font-bold tracking-tight text-white">
						Profissão Laser
					</span>
				</div>
			</header>
			<main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
		</div>
	);
}
