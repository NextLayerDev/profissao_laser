'use client';

import { Gift, Link2, X } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '@/types/products';
import { PaymentLinksTable } from './payment-links-table';
import { PromoLinksTable } from './promo-links-table';

type Tab = 'payment' | 'promo';

interface ProductLinksModalProps {
	product: Product;
	onClose: () => void;
}

export function ProductLinksModal({
	product,
	onClose,
}: ProductLinksModalProps) {
	const [activeTab, setActiveTab] = useState<Tab>('payment');

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') onClose();
				}}
			>
				<span className="sr-only">Fechar modal</span>
			</button>

			<div className="relative bg-[#1a1a1d] border border-gray-800 rounded-2xl w-full max-w-4xl mx-4 p-6 shadow-2xl max-h-[85vh] flex flex-col">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-xl font-bold text-white">Links do produto</h2>
						<p className="text-sm text-gray-400 mt-0.5">{product.name}</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#252528]"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex items-center gap-2 mb-4">
					<button
						type="button"
						onClick={() => setActiveTab('payment')}
						className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
							activeTab === 'payment'
								? 'bg-violet-600 text-white'
								: 'bg-[#252528] text-gray-400 hover:text-white hover:bg-[#2a2a2d]'
						}`}
					>
						<Link2 className="w-4 h-4" />
						Links de Pagamento
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('promo')}
						className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
							activeTab === 'promo'
								? 'bg-violet-600 text-white'
								: 'bg-[#252528] text-gray-400 hover:text-white hover:bg-[#2a2a2d]'
						}`}
					>
						<Gift className="w-4 h-4" />
						Links Promocionais
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-[#131315]">
					{activeTab === 'payment' ? (
						<PaymentLinksTable productName={product.name} />
					) : (
						<PromoLinksTable productName={product.name} />
					)}
				</div>
			</div>
		</div>
	);
}
