'use client';

import { ArrowLeft, Gift, Link2, Loader2, Receipt, Trash2 } from 'lucide-react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ChatButton } from '@/components/dashboard/chat-button';
import { ProductLinksModal } from '@/components/links/product-links-modal';
import { BasicInfoSection } from '@/components/products/basic-info-section';
import { CommunitySection } from '@/components/products/community-section';
import { CourseContentSection } from '@/components/products/course-content-section';
import { CreatePromoLinkModal } from '@/components/products/create-promo-link-modal';
import { CreateSubscriptionModal } from '@/components/products/create-subscription-modal';
import { CuponsSection } from '@/components/products/cupons-section';
import { DeleteProductModal } from '@/components/products/delete-product-modal';
import { DuplicateProductModal } from '@/components/products/duplicate-product-modal';
import { ProductSystemClassesSection } from '@/components/products/product-system-classes-section';
import { VersionSelector } from '@/components/products/version-selector';
import { ThemeToggle } from '@/components/theme-toggle';
import { updateProductStatus, useProducts } from '@/modules/catalog';
import { pickDefaultVersion } from '@/utils/products/group-products';

type ActiveMenu =
	| 'painel'
	| 'informacoes'
	| 'conteudo'
	| 'cupons'
	| 'comunidade'
	| 'system-classes';

const tabs: { id: ActiveMenu; label: string }[] = [
	{ id: 'informacoes', label: 'Informações básicas' },
	{ id: 'conteudo', label: 'Conteúdo do curso' },
	{ id: 'cupons', label: 'Cupons' },
	{ id: 'comunidade', label: 'Comunidade' },
	{ id: 'system-classes', label: 'Classes Sistema' },
];

export default function ProdutoDetalhes() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const { products, isLoading } = useProducts();
	const [vendasAtivas, setVendasAtivas] = useState(true);
	const [togglingStatus, setTogglingStatus] = useState(false);
	const [activeMenu, setActiveMenu] = useState<ActiveMenu>('informacoes');
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [subscriptionModal, setSubscriptionModal] = useState(false);
	const [showLinksModal, setShowLinksModal] = useState(false);
	const [showDuplicateModal, setShowDuplicateModal] = useState(false);
	const [showPromoLinkModal, setShowPromoLinkModal] = useState(false);

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
	const versions = product
		? (products ?? []).filter((p) => p.name === product.name)
		: [];

	useEffect(() => {
		if (product) {
			setVendasAtivas(product.status === 'ativo');
		}
	}, [product?.status, product]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
			</div>
		);
	}

	if (!product) {
		return (
			<div className="min-h-screen flex items-center justify-center">
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
		<div className="min-h-screen text-slate-900 dark:text-white font-sans">
			{/* Top Header */}
			<header className="bg-white/80 dark:bg-[#040405]/90 backdrop-blur-sm border-b border-slate-200 dark:border-white/5 px-6 py-4 sticky top-0 z-30">
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
							<div className="mt-1">
								<VersionSelector
									versions={versions}
									currentId={product.id}
									onNewVersion={() => setShowDuplicateModal(true)}
								/>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<ChatButton variant="inline" />
						<ThemeToggle />
						<button
							type="button"
							onClick={() => setShowLinksModal(true)}
							title="Ver meus links"
							className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-gray-400 hover:text-violet-500 transition-colors"
						>
							<Link2 className="w-5 h-5" />
						</button>
						{vendasAtivas && (
							<button
								type="button"
								onClick={() => setShowPromoLinkModal(true)}
								title="Gerar link promocional"
								className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-gray-400 hover:text-amber-400 transition-colors"
							>
								<Gift className="w-5 h-5" />
							</button>
						)}

						<button
							type="button"
							onClick={() => setShowDeleteModal(true)}
							className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-gray-400 hover:text-red-400 transition-colors"
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

			<main className="px-6 py-6">
				{/* Tab Navigation */}
				<div className="flex items-center gap-2 mb-6 flex-wrap">
					{tabs.map((tab) => (
						<button
							type="button"
							key={tab.id}
							onClick={() => setActiveMenu(tab.id)}
							className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
								activeMenu === tab.id
									? 'bg-violet-600 text-white'
									: 'bg-white dark:bg-[#1a1a1d] text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 hover:text-slate-900 dark:hover:text-white shadow-sm dark:shadow-none'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Tab Content */}
				{activeMenu === 'cupons' ? (
					<CuponsSection product={{ id: product.id, name: product.name }} />
				) : activeMenu === 'comunidade' ? (
					<CommunitySection />
				) : activeMenu === 'conteudo' ? (
					<CourseContentSection
						product={{ id: product.id, name: product.name }}
					/>
				) : activeMenu === 'informacoes' ? (
					<BasicInfoSection
						product={product}
						vendasAtivas={vendasAtivas}
						togglingStatus={togglingStatus}
						onToggleStatus={handleToggleStatus}
					/>
				) : activeMenu === 'system-classes' ? (
					<ProductSystemClassesSection productId={product.id} />
				) : null}
			</main>

			{showPromoLinkModal && (
				<CreatePromoLinkModal
					product={product}
					onClose={() => setShowPromoLinkModal(false)}
				/>
			)}

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
					onDeleted={() => {
						const siblings = versions.filter((v) => v.id !== product.id);
						if (siblings.length > 0) {
							router.push(`/products/${pickDefaultVersion(siblings).id}`);
						} else {
							router.push('/products');
						}
					}}
				/>
			)}

			{showDuplicateModal && (
				<DuplicateProductModal
					product={product}
					onClose={() => setShowDuplicateModal(false)}
				/>
			)}

			{showLinksModal && (
				<ProductLinksModal
					product={product}
					onClose={() => setShowLinksModal(false)}
				/>
			)}
		</div>
	);
}
