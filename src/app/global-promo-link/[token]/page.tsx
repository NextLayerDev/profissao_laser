'use client';

import {
	AlertCircle,
	ArrowLeft,
	Calendar,
	Clock,
	Loader2,
	Tag,
	Users,
	XCircle,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	useGlobalPromoLinkInfo,
	useRedeemGlobalPromoLink,
} from '@/hooks/use-global-promo-links';
import type { GlobalPromoLinkProduct } from '@/types/global-promo-link';
import { formatCurrency } from '@/utils/format-currency';

function getErrorStatus(error: unknown): number | null {
	if (error && typeof error === 'object' && 'response' in error) {
		return (
			(error as { response?: { status?: number } }).response?.status ?? null
		);
	}
	return null;
}

export default function GlobalPromoLinkPage() {
	const { token } = useParams<{ token: string }>();
	const { data, error, isLoading } = useGlobalPromoLinkInfo(token);
	const redeemMutation = useRedeemGlobalPromoLink(token);

	const [step, setStep] = useState<'select' | 'form'>('select');
	const [selectedProduct, setSelectedProduct] =
		useState<GlobalPromoLinkProduct | null>(null);

	const [customerName, setCustomerName] = useState('');
	const [companyName, setCompanyName] = useState('');
	const [customerPhone, setCustomerPhone] = useState('');
	const [customerCpf, setCustomerCpf] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	function handleSelectProduct(product: GlobalPromoLinkProduct) {
		setSelectedProduct(product);
		setStep('form');
	}

	function handleBack() {
		setStep('select');
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!selectedProduct) return;

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
				productId: selectedProduct.id,
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
			if (status === 400) {
				toast.error('CPF inválido. Verifique e tente novamente.');
			} else if (status === 409) {
				toast.error(
					'Você já resgatou este link promocional com este CPF/telefone.',
				);
			} else if (status === 410) {
				toast.error('Este link já foi esgotado ou expirou.');
			} else {
				toast.error('Erro ao processar. Tente novamente.');
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
						Promoção encerrada
					</h2>
					<p className="text-gray-400 mb-2">
						Este link promocional não está mais disponível.
					</p>
					<p className="text-gray-500 text-sm">
						O limite de usos foi atingido ou o link expirou. Entre em contato
						com o administrador para um novo link.
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

	// No products available
	if (data.products.length === 0) {
		return (
			<PageWrapper>
				<div className="max-w-md mx-auto text-center py-20">
					<div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
						<AlertCircle className="w-10 h-10 text-amber-400" />
					</div>
					<h2 className="text-2xl font-bold text-white mb-3">
						Nenhum produto disponível
					</h2>
					<p className="text-gray-400 mb-2">
						Esta promoção não possui produtos disponíveis no momento.
					</p>
					<p className="text-gray-500 text-sm">
						Entre em contato com o administrador para mais informações.
					</p>
				</div>
			</PageWrapper>
		);
	}

	// Step 1 — Product Selection
	if (step === 'select') {
		return (
			<PageWrapper>
				{/* Promo info header */}
				<div className="mb-8">
					<h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
						Oferta exclusiva para você!
					</h1>
					<p className="text-gray-400">
						Escolha o plano que deseja assinar com desconto especial.
					</p>

					<div className="flex flex-wrap items-center gap-3 mt-4">
						<span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-sm font-semibold px-3 py-1.5 rounded-full border border-emerald-500/20">
							<Tag className="w-3.5 h-3.5" />
							{data.discountPercent}% de desconto
						</span>
						<span className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-400 text-sm font-medium px-3 py-1.5 rounded-full border border-violet-500/20">
							<Clock className="w-3.5 h-3.5" />
							por {data.durationMonths}{' '}
							{data.durationMonths === 1 ? 'mês' : 'meses'}
						</span>
						<span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 text-sm font-medium px-3 py-1.5 rounded-full border border-amber-500/20">
							<Users className="w-3.5 h-3.5" />
							{data.remainingRedemptions}{' '}
							{data.remainingRedemptions === 1
								? 'vaga restante'
								: 'vagas restantes'}
						</span>
						{data.expiresAt && (
							<span className="inline-flex items-center gap-1.5 bg-slate-500/10 text-slate-400 text-sm font-medium px-3 py-1.5 rounded-full border border-slate-500/20">
								<Calendar className="w-3.5 h-3.5" />
								Válido até{' '}
								{new Date(data.expiresAt).toLocaleDateString('pt-BR', {
									day: '2-digit',
									month: '2-digit',
									year: 'numeric',
								})}
							</span>
						)}
					</div>
				</div>

				{/* Product grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{data.products.map((product) => (
						<div
							key={product.id}
							className="bg-[#1a1a1d] rounded-2xl border border-gray-800 overflow-hidden flex flex-col"
						>
							{/* Image */}
							<div className="relative h-44 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
								{product.image ? (
									<img
										src={product.image}
										alt={product.name}
										className="w-full h-full object-cover"
									/>
								) : (
									<span className="text-lg font-bold text-white/80 px-6 text-center">
										{product.name}
									</span>
								)}
								<span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
									<Tag className="w-3 h-3" />-{data.discountPercent}%
								</span>
							</div>

							{/* Info */}
							<div className="p-5 flex flex-col flex-1">
								<h3 className="text-lg font-bold text-white mb-1">
									{product.name}
								</h3>
								{product.description && (
									<p className="text-gray-400 text-sm mb-4 line-clamp-2">
										{product.description}
									</p>
								)}

								<div className="mt-auto pt-4 border-t border-gray-800">
									<div className="flex items-center gap-2">
										<span className="text-gray-500 line-through text-sm">
											{formatCurrency(product.originalPrice, 'BRL')}
										</span>
									</div>
									<p className="text-2xl font-bold text-white mt-0.5">
										{formatCurrency(product.discountedPrice, 'BRL')}
									</p>
									<p className="text-gray-500 text-xs mt-1">
										por {data.durationMonths}{' '}
										{data.durationMonths === 1 ? 'mês' : 'meses'}
									</p>
								</div>

								<button
									type="button"
									onClick={() => handleSelectProduct(product)}
									className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer mt-4"
								>
									Escolher este plano
								</button>
							</div>
						</div>
					))}
				</div>
			</PageWrapper>
		);
	}

	// Step 2 — Registration Form
	return (
		<PageWrapper>
			{/* Back button */}
			<button
				type="button"
				onClick={handleBack}
				className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
			>
				<ArrowLeft className="w-4 h-4" />
				<span className="text-sm font-medium">Voltar aos planos</span>
			</button>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Left — Selected product summary */}
				{selectedProduct && (
					<div className="bg-[#1a1a1d] rounded-2xl border border-gray-800 overflow-hidden">
						<div className="relative h-56 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
							{selectedProduct.image ? (
								<img
									src={selectedProduct.image}
									alt={selectedProduct.name}
									className="w-full h-full object-cover"
								/>
							) : (
								<span className="text-lg font-bold text-white/80 px-6 text-center">
									{selectedProduct.name}
								</span>
							)}
						</div>

						<div className="p-6">
							<h2 className="text-2xl font-bold text-white mb-2">
								{selectedProduct.name}
							</h2>
							{selectedProduct.description && (
								<p className="text-gray-400 text-sm mb-4">
									{selectedProduct.description}
								</p>
							)}

							<div className="border-t border-gray-800 pt-5">
								<div className="flex items-center gap-3">
									<span className="text-gray-500 line-through text-lg">
										{formatCurrency(selectedProduct.originalPrice, 'BRL')}
									</span>
									<span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20">
										<Tag className="w-3 h-3" />-{data.discountPercent}%
									</span>
								</div>
								<p className="text-3xl font-bold text-white mt-1">
									{formatCurrency(selectedProduct.discountedPrice, 'BRL')}
								</p>
								<p className="text-gray-500 text-xs mt-2">
									Valor promocional válido por {data.durationMonths}{' '}
									{data.durationMonths === 1 ? 'mês' : 'meses'}. Após esse
									período, o valor integral será cobrado caso a assinatura não
									seja cancelada.
								</p>
							</div>

							{/* Remaining slots */}
							<div className="mt-4 flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
								<Users className="w-4 h-4 text-amber-400 shrink-0" />
								<span className="text-sm text-amber-300">
									{data.remainingRedemptions > 0 ? (
										<>
											<span className="font-semibold">
												{data.remainingRedemptions}
											</span>{' '}
											{data.remainingRedemptions === 1
												? 'vaga restante'
												: 'vagas restantes'}
										</>
									) : (
										'Sem vagas disponíveis'
									)}
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Right — Form */}
				<div className="bg-[#1a1a1d] rounded-2xl border border-gray-800 p-6">
					<h3 className="text-lg font-bold text-white mb-1">
						Oferta especial!
					</h3>
					<p className="text-sm text-gray-400 mb-6">
						Preencha seus dados para aproveitar essa promoção exclusiva.
					</p>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label
								htmlFor="global-promo-name"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Nome completo
							</label>
							<input
								id="global-promo-name"
								type="text"
								value={customerName}
								onChange={(e) => setCustomerName(e.target.value)}
								placeholder="Seu nome completo"
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<div>
							<label
								htmlFor="global-promo-phone"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Telefone
							</label>
							<input
								id="global-promo-phone"
								type="tel"
								value={customerPhone}
								onChange={(e) => setCustomerPhone(e.target.value)}
								placeholder="(11) 99999-1234"
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<div>
							<label
								htmlFor="global-promo-cpf"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								CPF
							</label>
							<input
								id="global-promo-cpf"
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
								htmlFor="global-promo-email"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								E-mail
							</label>
							<input
								id="global-promo-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="seu@email.com"
								className="w-full bg-[#0d0d0f] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
							/>
						</div>

						<div>
							<label
								htmlFor="global-promo-password"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Senha
							</label>
							<input
								id="global-promo-password"
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
								htmlFor="global-promo-company"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Nome da empresa
							</label>
							<input
								id="global-promo-company"
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
						<p className="text-gray-600 text-xs text-center mt-3">
							Ao continuar, você concorda que o desconto é aplicado por{' '}
							{data.durationMonths}{' '}
							{data.durationMonths === 1 ? 'mês' : 'meses'}. Após esse prazo, o
							valor integral será cobrado automaticamente caso a assinatura não
							seja cancelada.
						</p>
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
