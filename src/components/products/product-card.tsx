import { Link2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProductCardProps } from '@/types/components/product-card';
import { formatCurrency } from '@/utils/format-currency';

export function ProductCard({ product }: ProductCardProps) {
	return (
		<Link
			href={`/products/${product.id}`}
			className="bg-[#1a1a1d] rounded-2xl overflow-hidden border border-violet-500/30 hover:border-violet-500/60 transition-all duration-300 hover:scale-[1.02] block"
		>
			<div className="relative h-44 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
				{product.image ? (
					<Image
						src={product.image}
						alt={product.name}
						fill
						className="object-cover"
					/>
				) : (
					<span className="text-7xl font-bold text-white/80">
						{product.name[0]}
					</span>
				)}
			</div>

			<div className="p-4">
				<h3 className="font-semibold text-white mb-2">{product.name}</h3>
				<p className="text-sm text-gray-400 mb-4 line-clamp-2">
					{product.description}
				</p>

				<div className="border-t border-gray-800 pt-4">
					<div className="flex items-center justify-between">
						<div className="text-sm">
							<span className="text-gray-500">Preço: </span>
							<span className="text-white font-medium">
								{formatCurrency(product.price, 'BRL')}
							</span>
						</div>
						<button
							type="button"
							className="p-2 text-gray-500 hover:text-white transition-colors"
						>
							<Link2 className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</Link>
	);
}
