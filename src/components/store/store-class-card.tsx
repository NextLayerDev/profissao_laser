import { Check, X } from 'lucide-react';
import type { StoreClassCardProps } from '@/types/components/store-class-card';
import { CLASS_FEATURES } from '@/utils/constants/class-features';
import { TIER_STYLES } from '@/utils/constants/tier-styles';

export function StoreClassCard({ cls }: StoreClassCardProps) {
	const style = TIER_STYLES[cls.tier];

	return (
		<div
			className={`relative bg-[#1a1a1d] rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all duration-300 hover:shadow-lg ${style.glow} flex flex-col`}
		>
			<div className={`h-1.5 bg-linear-to-r ${style.gradient}`} />

			<div className="p-6 flex flex-col flex-1">
				<div className="mb-4">
					<span
						className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${style.badge}`}
					>
						{style.label}
					</span>
					<h3 className="text-xl font-bold text-white mt-3 leading-tight">
						{cls.name}
					</h3>
					{cls.description && (
						<p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
							{cls.description}
						</p>
					)}
				</div>

				<div className={`border-t pt-4 mb-4 ${style.divider}`}>
					<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
						Funcionalidades
					</p>
					<ul className="space-y-2">
						{CLASS_FEATURES.map((feat) => {
							const enabled = cls[feat.key];
							return (
								<li key={feat.key} className="flex items-center gap-2">
									{enabled ? (
										<Check className="w-4 h-4 text-emerald-400 shrink-0" />
									) : (
										<X className="w-4 h-4 text-gray-600 shrink-0" />
									)}
									<span
										className={`text-sm ${enabled ? 'text-gray-200' : 'text-gray-600'}`}
									>
										{feat.label}
									</span>
								</li>
							);
						})}
					</ul>
				</div>

				{cls.products.length > 0 && (
					<div className={`border-t pt-4 flex-1 ${style.divider}`}>
						<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
							Incluído neste plano
						</p>
						<ul className="space-y-2">
							{cls.products.map((product) => (
								<li key={product.id} className="flex items-start gap-2">
									<Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
									<span className="text-sm text-gray-300 leading-snug">
										{product.name}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
