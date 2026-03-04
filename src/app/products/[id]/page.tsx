'use client';

import {
	ArrowLeft,
	Check,
	CheckCircle2,
	HelpCircle,
	Loader2,
	Receipt,
	Trash2,
	Users2,
} from 'lucide-react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ChatButton } from '@/components/dashboard/chat-button';
import { BasicInfoSection } from '@/components/products/basic-info-section';
import { CommunitySection } from '@/components/products/community-section';
import { CourseContentSection } from '@/components/products/course-content-section';
import { CreateSubscriptionModal } from '@/components/products/create-subscription-modal';
import { CuponsSection } from '@/components/products/cupons-section';
import { DeleteProductModal } from '@/components/products/delete-product-modal';
import { ThemeToggle } from '@/components/theme-toggle';
import { useProducts } from '@/hooks/use-products';
import { updateProductStatus } from '@/services/products';
import {
	productConfigItems,
	productMenuItems,
	productStats,
} from '@/utils/constants/product-detail';

export default function ProdutoDetalhes() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { products, isLoading } = useProducts();
	const [vendasAtivas, setVendasAtivas] = useState(true);
	const [togglingStatus, setTogglingStatus] = useState(false);
	const [activeMenu, setActiveMenu] = useState('painel');
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [subscriptionModal, setSubscriptionModal] = useState(false);

	const handleToggleStatus = async () => {
		const newStatus = !vendasAtivas;
		setTogglingStatus(true);
		try {
			await updateProductStatus(id, newStatus);
			setVendasAtivas(newStatus);
			toast.success(newStatus ? 'Vendas ativadas!' : 'Vendas desativadas!');
		} catch {
			toast.error('Erro ao atualizar status do produto');
		} finally {
			setTogglingStatus(false);
		}
	};

	const product = (products ?? []).find((p) => p.id === id);

	useEffect(() => {
		if (product) {
			setVendasAtivas(product.status === 'ativo');
		}
	}, [product?.status, product]);

	const completedCount = productConfigItems.filter(
		(item) => item.completed,
	).length;
	const progressPercentage = Math.round(
		(completedCount / productConfigItems.length) * 100,
	);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (!product) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] flex items-center justify-center">
				<div className="text-center">
					<p className="text-slate-600 dark:text-gray-400 mb-4">
						Produto não encontrado.
					</p>
					<Link
						href="/products"
						className="text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300"
					>
						Voltar para produtos
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			{/* Top Header */}
			<header className="bg-white dark:bg-[#1a1a1d] border-b border-slate-200 dark:border-gray-800 px-6 py-4 shadow-sm dark:shadow-none">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Link
							href="/products"
							className="p-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
						>
							<ArrowLeft className="w-5 h-5" />
						</Link>

						<div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center">
							<span className="text-xl font-bold text-white">
								{product.name[0]}
							</span>
						</div>

						<div>
							<h1 className="font-bold text-lg text-slate-900 dark:text-white">
								{product.name}
							</h1>
							<p className="text-xs text-slate-500 dark:text-gray-500">
								ID {product.id}
							</p>
						</div>

						<div className="flex items-center gap-3 ml-6">
							<span className="bg-slate-100 dark:bg-[#252528] text-xs px-3 py-1.5 rounded-full text-slate-600 dark:text-gray-300">
								Produtor
							</span>

							<button
								type="button"
								onClick={handleToggleStatus}
								disabled={togglingStatus}
								className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
									vendasAtivas
										? 'bg-emerald-500'
										: 'bg-slate-300 dark:bg-gray-600'
								}`}
							>
								<div
									className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
										vendasAtivas ? 'left-7' : 'left-1'
									}`}
								/>
							</button>

							<span className="text-sm text-slate-600 dark:text-gray-400">
								Vendas
								<br />
								ativas
							</span>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<ChatButton variant="inline" />
						<ThemeToggle />
						<button
							type="button"
							onClick={() => setShowDeleteModal(true)}
							className="p-3 bg-slate-100 dark:bg-[#252528] rounded-xl text-slate-500 dark:text-gray-400 hover:text-red-400 transition-colors"
						>
							<Trash2 className="w-5 h-5" />
						</button>

						<button
							type="button"
							onClick={() => setSubscriptionModal(true)}
							className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-5 py-3 rounded-xl font-medium transition-colors"
						>
							<Receipt className="w-4 h-4" />
							Criar Assinatura
						</button>
					</div>
				</div>
			</header>

			<div className="flex">
				{/* Sidebar */}
				<aside className="w-64 bg-slate-100 dark:bg-[#131315] border-r border-slate-200 dark:border-gray-800 min-h-[calc(100vh-80px)]">
					<nav className="p-4 space-y-1">
						{productMenuItems.map((item) => (
							<button
								type="button"
								key={item.id}
								onClick={() => setActiveMenu(item.id)}
								className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
									activeMenu === item.id
										? 'bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-white'
										: 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1a1a1d]'
								}`}
							>
								<item.icon className="w-5 h-5" />
								{item.label}
							</button>
						))}
					</nav>
				</aside>

				{/* Main Content */}
				<main className="flex-1 p-8">
					{activeMenu === 'cupons' ? (
						<CuponsSection product={{ id: product.id, name: product.name }} />
					) : activeMenu === 'comunidade' ? (
						<CommunitySection />
					) : activeMenu === 'conteudo' ? (
						<CourseContentSection
							product={{ id: product.id, name: product.name }}
						/>
					) : activeMenu === 'informacoes' ? (
						<BasicInfoSection product={product} />
					) : (
						<>
							{/* Success Banner */}
							<div className="flex items-start gap-4 mb-8">
								<CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 shrink-0" />
								<div>
									<h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
										Tudo pronto para suas vendas!
									</h2>
									<p className="text-slate-600 dark:text-gray-400 mt-1">
										Agora você só precisa divulgar seus Links e começar a
										vender.
									</p>
									<button
										type="button"
										className="mt-4 bg-slate-100 dark:bg-[#252528] hover:bg-slate-200 dark:hover:bg-[#2a2a2d] px-6 py-3 rounded-lg font-medium text-sm transition-colors border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white"
									>
										VER MEUS LINKS
									</button>
								</div>
							</div>

							{/* Stats Cards */}
							<div className="grid grid-cols-4 gap-4 mb-8">
								{productStats.map((stat) => (
									<div
										key={stat.label}
										className="bg-white dark:bg-[#1a1a1d] rounded-xl p-5 border border-slate-200 dark:border-gray-800 shadow-sm dark:shadow-none"
									>
										<div className={`text-3xl font-bold ${stat.color}`}>
											{stat.value}
										</div>
										<div className="text-sm text-slate-500 dark:text-gray-400 mt-1">
											{stat.label}
										</div>
									</div>
								))}
							</div>

							{/* Configuration Card */}
							<div className="bg-white dark:bg-[#1a1a1d] rounded-xl p-6 border border-slate-200 dark:border-gray-800 mb-8 shadow-sm dark:shadow-none">
								<div className="flex items-center justify-between mb-4">
									<h3 className="font-semibold text-slate-900 dark:text-white">
										Configuração do Produto
									</h3>
									<span className="text-emerald-400 text-sm font-medium">
										{progressPercentage}% completo
									</span>
								</div>

								<div className="h-1.5 bg-slate-200 dark:bg-gray-800 rounded-full mb-6 overflow-hidden">
									<div
										className="h-full bg-linear-to-r from-emerald-500 to-violet-500 rounded-full transition-all duration-500"
										style={{ width: `${progressPercentage}%` }}
									/>
								</div>

								<div className="grid grid-cols-4 gap-4">
									{productConfigItems.map((item) => (
										<div key={item.label} className="flex items-center gap-2">
											<div
												className={`w-5 h-5 rounded-full flex items-center justify-center ${
													item.completed
														? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400'
														: 'bg-slate-200 dark:bg-gray-700 text-slate-500 dark:text-gray-500'
												}`}
											>
												<Check className="w-3 h-3" />
											</div>
											<span
												className={`text-sm ${
													item.completed
														? 'text-emerald-600 dark:text-emerald-400'
														: 'text-slate-600 dark:text-gray-400'
												}`}
											>
												{item.label}
											</span>
										</div>
									))}
								</div>
							</div>

							{/* Tools Section */}
							<div className="mb-6">
								<p className="text-slate-600 dark:text-gray-300 mb-4">
									Enquanto isso, aproveite para configurar ferramentas gratuitas
									que te ajudam a vender mais
								</p>

								<div className="bg-white dark:bg-[#1a1a1d] rounded-xl p-5 border border-slate-200 dark:border-gray-800 flex items-center justify-between shadow-sm dark:shadow-none">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 bg-violet-100 dark:bg-violet-600/20 rounded-xl flex items-center justify-center">
											<Users2 className="w-6 h-6 text-violet-600 dark:text-violet-400" />
										</div>
										<div>
											<div className="flex items-center gap-2">
												<h4 className="font-semibold text-slate-900 dark:text-white">
													Programa de Afiliados
												</h4>
												<HelpCircle className="w-4 h-4 text-slate-400 dark:text-gray-500" />
											</div>
											<p className="text-sm text-slate-600 dark:text-gray-400">
												Escolha se seu produto poderá ser{' '}
												<span className="text-violet-600 dark:text-violet-400">
													promovido por outras pessoas
												</span>{' '}
												em troca de comissões.
											</p>
										</div>
									</div>
									<button
										type="button"
										className="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-xl font-medium transition-colors text-white"
									>
										Editar
									</button>
								</div>

								<div className="bg-slate-50 dark:bg-[#1a1a1d] rounded-xl p-5 border border-slate-200 dark:border-gray-800 mt-4 flex items-center justify-between opacity-50">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 bg-slate-200 dark:bg-gray-700/50 rounded-xl" />
										<div>
											<div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-40 mb-2" />
											<div className="h-3 bg-slate-100 dark:bg-gray-800 rounded w-64" />
										</div>
									</div>
									<div className="h-10 w-20 bg-slate-200 dark:bg-gray-700 rounded-xl" />
								</div>
							</div>
						</>
					)}
				</main>
			</div>

			{subscriptionModal && (
				<CreateSubscriptionModal
					stripeProductId={product.stripeProductId ?? ''}
					onClose={() => setSubscriptionModal(false)}
				/>
			)}

			{showDeleteModal && (
				<DeleteProductModal
					product={product}
					onClose={() => setShowDeleteModal(false)}
					onDeleted={() => router.push('/products')}
				/>
			)}
		</div>
	);
}
