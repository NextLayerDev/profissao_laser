'use client';

import { Check, Loader2, Package, Search } from 'lucide-react';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { useLaserProduct, useLaserProducts } from '@/hooks/use-laser-products';
import type { LaserProduct } from '@/types/laser-products';

function usableImage(url: string | null | undefined): string | null {
	return url && !url.includes('placeholder') ? url : null;
}

function productThumb(p: LaserProduct): string | null {
	// Prefere a imagem do produto; cai pra 1ª variante se ele não tiver.
	return usableImage(p.imageUrl) ?? usableImage(p.variants?.[0]?.imageUrl);
}

/**
 * Produto + cor em cards visuais, na mesma tela. Escolher o produto já abre as
 * cores logo abaixo; se o produto só tem uma cor, ela é escolhida sozinha.
 */
export const PreviaProductPicker = forwardRef<
	HTMLDivElement,
	{
		selectedProductId: string | null;
		selectedVariantId: string | null;
		onSelectProduct: (id: string | null) => void;
		onSelectVariant: (id: string | null) => void;
	}
>(function PreviaProductPicker(
	{ selectedProductId, selectedVariantId, onSelectProduct, onSelectVariant },
	ref,
) {
	const [search, setSearch] = useState('');
	const { data: productsData, isLoading } = useLaserProducts({
		search: search.trim() || undefined,
		limit: 50,
	});
	const { data: selectedProduct, isLoading: productLoading } = useLaserProduct(
		selectedProductId,
		!!selectedProductId,
	);

	const products = productsData?.data ?? [];
	const variants = (selectedProduct?.variants ?? []).filter(
		(v) => v.status === 'ativo',
	);

	// Uma cor só → já vem escolhida (um clique a menos).
	const onlyVariantId = variants.length === 1 ? variants[0].id : null;
	useEffect(() => {
		if (onlyVariantId && selectedVariantId !== onlyVariantId) {
			onSelectVariant(onlyVariantId);
		}
	}, [onlyVariantId, selectedVariantId, onSelectVariant]);

	// Escolheu o produto com um toque → traz as cores para a vista (no celular
	// elas ficavam escondidas atrás da barra fixa do "Gerar").
	const colorsRef = useRef<HTMLFieldSetElement>(null);
	const pickedByUser = useRef(false);
	useEffect(() => {
		if (!pickedByUser.current || productLoading || !selectedProductId) return;
		pickedByUser.current = false;
		colorsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}, [productLoading, selectedProductId]);

	const showSearch = search.length > 0 || products.length > 8;

	return (
		<div ref={ref} className="space-y-4 scroll-mt-24">
			<fieldset className="min-w-0 space-y-2.5">
				<legend className="mb-2.5 flex w-full items-center justify-between gap-2 text-sm font-semibold text-slate-900 dark:text-white">
					<span>
						<span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">
							2
						</span>
						Produto
					</span>
				</legend>
				{showSearch && (
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
							aria-hidden="true"
						/>
						<input
							type="search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Buscar produto…"
							aria-label="Buscar produto"
							className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
						/>
					</div>
				)}
				{isLoading ? (
					<div className="flex justify-center py-6">
						<Loader2
							className="h-6 w-6 animate-spin text-violet-500"
							aria-label="Carregando produtos"
						/>
					</div>
				) : products.length === 0 ? (
					<p className="py-6 text-center text-sm text-slate-600 dark:text-gray-400">
						Nenhum produto encontrado.
					</p>
				) : (
					<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
						{products.map((product) => {
							const thumb = productThumb(product);
							const active = product.id === selectedProductId;
							return (
								<button
									key={product.id}
									type="button"
									aria-pressed={active}
									onClick={() => {
										pickedByUser.current = !active;
										onSelectProduct(active ? null : product.id);
									}}
									className={`group min-w-0 overflow-hidden rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
										active
											? 'border-violet-500 ring-2 ring-violet-500/40'
											: 'border-slate-200 dark:border-white/10 hover:border-violet-400'
									}`}
								>
									<div className="relative aspect-square bg-slate-100 dark:bg-black/30">
										{thumb ? (
											<img
												src={thumb}
												alt=""
												className="h-full w-full object-cover"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center">
												<Package
													className="h-7 w-7 text-slate-300 dark:text-slate-600"
													aria-hidden="true"
												/>
											</div>
										)}
										{active && (
											<span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 shadow">
												<Check
													className="h-3.5 w-3.5 text-white"
													aria-hidden="true"
												/>
											</span>
										)}
									</div>
									<p className="mx-2 my-1.5 line-clamp-2 min-h-[2rem] text-xs font-semibold leading-tight text-slate-900 dark:text-white">
										{product.name}
									</p>
								</button>
							);
						})}
					</div>
				)}
			</fieldset>

			{selectedProductId && (
				<fieldset
					ref={colorsRef}
					className="min-w-0 scroll-mb-32 md:scroll-mb-4"
				>
					<legend className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
						Cor{selectedProduct ? ` — ${selectedProduct.name}` : ''}
					</legend>
					{productLoading ? (
						<Loader2
							className="h-5 w-5 animate-spin text-violet-500"
							aria-label="Carregando cores"
						/>
					) : variants.length === 0 ? (
						// Sem variante ativa não há como gerar (a API exige productVariantId).
						<p className="text-sm text-slate-600 dark:text-gray-400">
							Este produto ainda não tem cor disponível — escolha outro.
						</p>
					) : (
						<div className="flex flex-wrap gap-2">
							{variants.map((variant) => {
								const active = variant.id === selectedVariantId;
								const thumb = usableImage(variant.imageUrl);
								const label = variant.colorName ?? variant.tipo ?? variant.name;
								return (
									<button
										key={variant.id}
										type="button"
										aria-pressed={active}
										onClick={() => onSelectVariant(variant.id)}
										title={variant.name}
										className={`flex w-[4.75rem] flex-col items-center gap-1 rounded-xl border p-1.5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
											active
												? 'border-violet-500 bg-violet-50 ring-2 ring-violet-500/40 dark:bg-violet-500/10'
												: 'border-slate-200 dark:border-white/10 hover:border-violet-400'
										}`}
									>
										<span className="relative block aspect-square w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-black/30">
											{thumb ? (
												<img
													src={thumb}
													alt=""
													className="h-full w-full object-cover"
												/>
											) : (
												<span
													className="block h-full w-full"
													style={{
														backgroundColor: variant.colorHex ?? '#ccc',
													}}
												/>
											)}
										</span>
										<span className="flex w-full items-center justify-center gap-1">
											{variant.colorHex && (
												<span
													className="h-2.5 w-2.5 shrink-0 rounded-full border border-slate-300 dark:border-gray-600"
													style={{ backgroundColor: variant.colorHex }}
													aria-hidden="true"
												/>
											)}
											<span className="truncate text-[11px] font-medium text-slate-700 dark:text-slate-200">
												{label}
											</span>
										</span>
									</button>
								);
							})}
						</div>
					)}
				</fieldset>
			)}
		</div>
	);
});
