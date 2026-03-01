import { Check } from 'lucide-react';
import type { ClassWithProducts } from '@/types/classes';

const TIER_STYLES = {
	prata: {
		gradient: 'from-slate-700 via-slate-500 to-slate-400',
		badge: 'bg-slate-400/20 text-slate-200 border border-slate-400/40',
		label: 'Prata',
		glow: 'hover:shadow-slate-500/20',
		divider: 'border-slate-600/30',
	},
	ouro: {
		gradient: 'from-amber-700 via-yellow-500 to-amber-400',
		badge: 'bg-amber-400/20 text-amber-200 border border-amber-400/40',
		label: 'Ouro',
		glow: 'hover:shadow-amber-500/20',
		divider: 'border-amber-600/30',
	},
	platina: {
		gradient: 'from-violet-700 via-purple-500 to-cyan-400',
		badge: 'bg-violet-400/20 text-violet-200 border border-violet-400/40',
		label: 'Platina',
		glow: 'hover:shadow-violet-500/20',
		divider: 'border-violet-600/30',
	},
};

interface StoreClassCardProps {
	cls: ClassWithProducts;
}

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

				<div className={`border-t pt-4 flex-1 ${style.divider}`}>
					<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
						Incluído neste plano
					</p>
					{cls.products.length > 0 ? (
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
					) : (
						<p className="text-sm text-gray-600">Nenhum produto neste plano</p>
					)}
				</div>
			</div>
		</div>
	);
}
