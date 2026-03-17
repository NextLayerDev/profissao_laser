'use client';

import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckoutAuthForm } from '@/components/checkout/checkout-auth-form';
import { CheckoutConfirmButton } from '@/components/checkout/checkout-confirm-button';
import { CheckoutProductSummary } from '@/components/checkout/checkout-product-summary';
import { useClasses } from '@/hooks/use-classes';
import { useProducts } from '@/hooks/use-products';
import { getCurrentUser } from '@/lib/auth';
import { createPurchase } from '@/services/purchase';
import type { ClassWithProducts } from '@/types/classes';
import type { Product } from '@/types/products';

const TIER_ORDER: Record<string, number> = { prata: 0, ouro: 1, platina: 2 };

interface ProductVariant {
	product: Product;
	classInfo?: ClassWithProducts;
}

export default function CheckoutPage() {
	const params = useParams<{ slug: string }>();
	const searchParams = useSearchParams();
	const classIdParam = searchParams.get('classId');

	const { products, isLoading: productsLoading } = useProducts();
	const { classes, isLoading: classesLoading } = useClasses();
	const [isAuthenticated, setIsAuthenticated] = useState(!!getCurrentUser());
	const [isPurchasing, setIsPurchasing] = useState(false);
	const [companyName, setCompanyName] = useState('');

	const isLoading = productsLoading || classesLoading;

	const activeProducts = (products ?? []).filter((p) => p.status === 'ativo');
	const activeClasses = classes.filter((c) => c.status === 'ativo');

	// Map product ID -> class
	const productClassMap = useMemo(() => {
		const map = new Map<string, ClassWithProducts>();
		for (const cls of activeClasses) {
			for (const product of cls.products) {
				map.set(product.id, cls);
			}
		}
		return map;
	}, [activeClasses]);

	// Find all variants for this slug (products with same name)
	const variants = useMemo(() => {
		const matchingProducts = activeProducts.filter(
			(p) => p.slug === params.slug,
		);

		if (matchingProducts.length === 0) return [];

		// Get the name of the first matching product to find all variants
		const productName = matchingProducts[0].name;
		const allVariants = activeProducts.filter((p) => p.name === productName);

		const variantList: ProductVariant[] = allVariants.map((product) => ({
			product,
			classInfo: productClassMap.get(product.id),
		}));

		return variantList.sort((a, b) => {
			const aOrder = a.classInfo ? (TIER_ORDER[a.classInfo.tier] ?? 3) : 3;
			const bOrder = b.classInfo ? (TIER_ORDER[b.classInfo.tier] ?? 3) : 3;
			return aOrder - bOrder;
		});
	}, [activeProducts, params.slug, productClassMap]);

	// Determine initial selected index based on classId param
	const initialIndex = useMemo(() => {
		if (!classIdParam || variants.length === 0) return 0;
		const idx = variants.findIndex((v) => v.classInfo?.id === classIdParam);
		return idx >= 0 ? idx : 0;
	}, [classIdParam, variants]);

	const [selectedIndex, setSelectedIndex] = useState(initialIndex);

	// Keep selectedIndex in sync when variants change
	const safeIndex = selectedIndex < variants.length ? selectedIndex : 0;
	const selectedVariant = variants[safeIndex];

	const handleAuthenticatedPurchase = useCallback(async () => {
		if (!selectedVariant) return;

		if (!companyName.trim()) {
			toast.error('Informe o nome da empresa.');
			return;
		}

		setIsPurchasing(true);
		setIsAuthenticated(true);

		try {
			const { checkoutUrl } = await createPurchase({
				productId: selectedVariant.product.id,
				companyName: companyName.trim(),
			});
			window.location.href = checkoutUrl;
		} catch {
			toast.error('Erro ao processar compra. Tente novamente.');
			setIsPurchasing(false);
		}
	}, [selectedVariant, companyName]);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] flex items-center justify-center">
				<Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
			</div>
		);
	}

	if (variants.length === 0) {
		return (
			<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] flex items-center justify-center">
				<div className="text-center">
					<p className="text-slate-600 dark:text-gray-400 text-lg font-medium mb-2">
						Produto nao encontrado
					</p>
					<p className="text-slate-500 dark:text-gray-500 text-sm mb-6">
						O produto que voce procura nao existe ou foi removido.
					</p>
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-violet-500 hover:text-violet-400 text-sm font-medium transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Voltar para a loja
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-white font-sans">
			{/* Header */}
			<header className="border-b border-slate-200 dark:border-gray-800 bg-slate-50/80 dark:bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0 z-10">
				<div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
					<Link
						href="/"
						className="flex items-center gap-2 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Voltar para a loja
					</Link>
					<span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
						Checkout
					</span>
					<div className="w-24" />
				</div>
			</header>

			{/* Content */}
			<main className="max-w-5xl mx-auto px-6 py-10">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Left: Product summary */}
					<CheckoutProductSummary
						variants={variants}
						selectedIndex={safeIndex}
						onSelectIndex={setSelectedIndex}
					/>

					{/* Right: Company name + Auth or Confirm */}
					<div className="space-y-6">
						{/* Company name field */}
						<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-gray-800 p-6">
							<div className="flex items-center gap-2 mb-1">
								<Building2 className="w-4 h-4 text-violet-400" />
								<h3 className="text-lg font-bold text-slate-900 dark:text-white">
									Dados da empresa
								</h3>
							</div>
							<p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
								Informe o nome da empresa para configuracao do sistema
							</p>
							<div>
								<label
									htmlFor="company-name"
									className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1"
								>
									Nome da empresa
								</label>
								<input
									id="company-name"
									type="text"
									value={companyName}
									onChange={(e) => setCompanyName(e.target.value)}
									required
									placeholder="Nome da sua empresa"
									className="w-full bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
								/>
							</div>
						</div>

						{isPurchasing ? (
							<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-gray-800 p-6 flex flex-col items-center justify-center min-h-[200px]">
								<Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
								<p className="text-slate-600 dark:text-gray-400 text-sm">
									Redirecionando para pagamento...
								</p>
							</div>
						) : isAuthenticated && getCurrentUser() ? (
							<CheckoutConfirmButton
								productId={selectedVariant.product.id}
								companyName={companyName.trim() || undefined}
							/>
						) : (
							<CheckoutAuthForm onAuthenticated={handleAuthenticatedPurchase} />
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
