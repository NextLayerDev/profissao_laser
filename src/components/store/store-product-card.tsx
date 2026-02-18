import { Loader2, ShoppingCart, Star } from 'lucide-react';
import Image from 'next/image';
import { usePurchase } from '@/hooks/use-purchase';
import type { Product } from '@/types/products';
import { formatCurrency } from '@/utils/format-currency';

interface StoreProductCardProps {
	product: Product;
}

export function StoreProductCard({ product }: StoreProductCardProps) {
	const { mutate: purchase, isPending } = usePurchase();

	function handleBuy() {
		purchase({
			productId: product.id,
			amount: product.price,
			recorrencia: 'one_time',
		});
	}

	return (
		<div className="bg-[#1a1a1d] rounded-2xl overflow-hidden border border-gray-800 hover:border-violet-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 flex flex-col">
			<div className="relative h-48 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
				{product.image ? (
					<Image
						src={product.image}
						alt={product.name}
						fill
						className="object-cover"
					/>
				) : (
					<span className="text-8xl font-bold text-white/80">
						{product.name[0]}
					</span>
				)}
				{product.category && (
					<span className="absolute top-3 left-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
						{product.category}
					</span>
				)}
			</div>

			<div className="p-5 flex flex-col flex-1">
				<h3 className="font-semibold text-white text-lg leading-snug mb-2">
					{product.name}
				</h3>

				{product.description && (
					<p className="text-sm text-gray-400 line-clamp-2 mb-4">
						{product.description}
					</p>
				)}

				<div className="flex items-center gap-1 mb-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<Star
							// biome-ignore lint/suspicious/noArrayIndexKey: static mock stars
							key={i}
							className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
						/>
					))}
					<span className="text-xs text-gray-500 ml-1">(4.9)</span>
				</div>

				<div className="mt-auto border-t border-gray-800 pt-4">
					<div className="flex items-center justify-between mb-3">
						<div>
							<p className="text-xs text-gray-500 mb-0.5">Por apenas</p>
							<p className="text-2xl font-bold text-white">
								{formatCurrency(product.price, 'BRL')}
							</p>
						</div>
						{product.refundDays && (
							<span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
								{product.refundDays} dias de garantia
							</span>
						)}
					</div>

					<button
						type="button"
						onClick={handleBuy}
						disabled={isPending}
						className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 cursor-pointer"
					>
						{isPending ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								Aguarde...
							</>
						) : (
							<>
								<ShoppingCart className="w-4 h-4" />
								Comprar agora
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
