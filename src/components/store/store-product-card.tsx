'use client';

import {
	Check,
	CheckCircle,
	Cpu,
	Layers,
	Monitor,
	Settings2,
	ShoppingCart,
	Star,
	X,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useOwnership } from '@/hooks/use-ownership';
import type { StoreProductCardProps } from '@/types/components/store-product-card';
import { CLASS_FEATURES } from '@/utils/constants/class-features';
import { TIER_STYLES } from '@/utils/constants/tier-styles';
import { formatCurrency } from '@/utils/format-currency';

const SC_TIER_BADGES = [
	{
		key: 'prata' as const,
		label: 'Prata',
		style: 'bg-slate-400/20 text-slate-300 border border-slate-500/40',
	},
	{
		key: 'gold' as const,
		label: 'Gold',
		style: 'bg-amber-400/20 text-amber-300 border border-amber-500/40',
	},
	{
		key: 'platina' as const,
		label: 'Platina',
		style: 'bg-violet-400/20 text-violet-300 border border-violet-500/40',
	},
];

export function StoreProductCard({ variants }: StoreProductCardProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [selectedScIndex, setSelectedScIndex] = useState<number | null>(() => {
		const sc = variants[0].systemClasses ?? [];
		return sc.length > 0 ? 0 : null;
	});
	const [imgError, setImgError] = useState(false);
	const router = useRouter();

	const { product, classInfo, systemClasses } = variants[selectedIndex];
	const hasMultipleTiers = variants.length > 1;

	// System class selection
	const allSystemClasses = systemClasses ?? [];
	const activeSystemClass =
		selectedScIndex !== null
			? (allSystemClasses[selectedScIndex] ?? null)
			: null;

	function handleBuy() {
		const classParam = classInfo ? `?classId=${classInfo.id}` : '';
		router.push(`/checkout/${product.slug}${classParam}`);
	}

	const { status: ownershipStatus } = useOwnership(variants, selectedIndex);

	// Features: prefer classInfo, fallback to selected system class
	const enabledFeatures = classInfo
		? CLASS_FEATURES.filter((f) => classInfo[f.key])
		: activeSystemClass
			? CLASS_FEATURES.filter((f) => activeSystemClass[f.key])
			: [];

	// System class tiers (only when there's a selected system class)
	const systemTiers = activeSystemClass
		? SC_TIER_BADGES.filter((t) => activeSystemClass[t.key])
		: [];

	return (
		<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-800 hover:border-violet-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 flex flex-col shadow-sm dark:shadow-none">
			<div className="relative h-48 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
				{product.image && !imgError ? (
					<Image
						src={product.image}
						alt={product.name}
						fill
						className="object-cover"
						onError={() => setImgError(true)}
					/>
				) : (
					<span className="text-sm text-white/70 px-4 text-center">
						Produto sem imagem
					</span>
				)}
				{product.category && (
					<div className="absolute top-3 left-3">
						<span className="bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
							{product.category}
						</span>
					</div>
				)}
				{activeSystemClass && (
					<div className="absolute top-3 right-3">
						<span className="bg-purple-600/80 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
							{activeSystemClass.name}
						</span>
					</div>
				)}
			</div>

			{hasMultipleTiers && (
				<div className="px-5 pt-4">
					<div className="flex items-center gap-1.5 mb-2">
						<Layers className="w-3 h-3 text-violet-400" />
						<span className="text-[10px] font-medium text-slate-500 dark:text-gray-500 uppercase tracking-wider">
							Nivel de acesso
						</span>
					</div>
					<div className="flex gap-2">
						{variants.map((v, i) => {
							const style = v.classInfo ? TIER_STYLES[v.classInfo.tier] : null;
							const label = style?.label ?? 'Padrão';
							const isActive = i === selectedIndex;
							return (
								<button
									key={v.product.id}
									type="button"
									onClick={() => {
										setSelectedIndex(i);
										const sc = variants[i].systemClasses ?? [];
										setSelectedScIndex(sc.length > 0 ? 0 : null);
										setImgError(false);
									}}
									className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 cursor-pointer ${
										isActive
											? (style?.badge ??
												'bg-violet-400/20 text-violet-300 border-violet-500/40')
											: 'bg-transparent text-slate-500 dark:text-gray-500 border-slate-300 dark:border-gray-700 hover:border-slate-400 dark:hover:border-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
									}`}
								>
									{label}
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* System class selector - mini cards */}
			{allSystemClasses.length >= 1 && (
				<div className="px-5 pt-3">
					<div className="flex items-center gap-1.5 mb-2">
						<Settings2 className="w-3 h-3 text-purple-400" />
						<span className="text-[10px] font-medium text-slate-500 dark:text-gray-500 uppercase tracking-wider">
							Plano do sistema
						</span>
					</div>
					<div className="grid grid-cols-2 gap-2">
						{allSystemClasses.map((sc, i) => {
							const isActive = selectedScIndex === i;
							const scFeatures = CLASS_FEATURES.filter((f) => sc[f.key]);
							return (
								<button
									key={sc.id}
									type="button"
									onClick={() => setSelectedScIndex(i)}
									className={`text-left p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
										isActive
											? 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/50'
											: 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700'
									}`}
								>
									<p
										className={`text-xs font-bold mb-1 ${isActive ? 'text-purple-600 dark:text-white' : 'text-slate-500 dark:text-gray-400'}`}
									>
										{sc.name}
									</p>
									<div className="flex flex-wrap gap-1">
										{scFeatures.map((f) => (
											<span
												key={f.key}
												className={`inline-flex items-center gap-0.5 text-[10px] ${isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-gray-600'}`}
											>
												<Check className="w-2.5 h-2.5" />
												{f.label}
											</span>
										))}
									</div>
								</button>
							);
						})}
						{/* Sem plano */}
						<button
							type="button"
							onClick={() => setSelectedScIndex(null)}
							className={`text-left p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
								selectedScIndex === null
									? 'bg-slate-100 dark:bg-white/[0.08] border-slate-300 dark:border-white/20'
									: 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700'
							}`}
						>
							<p
								className={`text-xs font-bold mb-1 flex items-center gap-1 ${selectedScIndex === null ? 'text-slate-700 dark:text-white' : 'text-slate-500 dark:text-gray-400'}`}
							>
								<X className="w-3 h-3" />
								Sem plano
							</p>
							<p className="text-[10px] text-slate-400 dark:text-gray-600">
								Apenas o curso
							</p>
						</button>
					</div>
				</div>
			)}

			<div className="p-5 flex flex-col flex-1">
				<h3 className="font-semibold text-slate-900 dark:text-white text-lg leading-snug mb-2">
					{product.name}
				</h3>

				{product.description && (
					<p className="text-sm text-slate-600 dark:text-gray-400 line-clamp-2 mb-3">
						{product.description}
					</p>
				)}

				{(product.machine || product.software) && (
					<div className="flex flex-wrap gap-3 mb-3">
						{product.machine && (
							<span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full">
								<Monitor className="w-3.5 h-3.5 text-violet-500" />
								{product.machine}
							</span>
						)}
						{product.software && (
							<span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-full">
								<Cpu className="w-3.5 h-3.5 text-violet-500" />
								{product.software}
							</span>
						)}
					</div>
				)}

				{enabledFeatures.length > 0 && (
					<div className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
						{enabledFeatures.map((feat) => (
							<div key={feat.key} className="flex items-center gap-1.5">
								<Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
								<span className="text-xs text-slate-600 dark:text-gray-300">
									{feat.label}
								</span>
							</div>
						))}
					</div>
				)}

				{systemTiers.length > 0 && (
					<div className="mb-3">
						<p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-wider font-medium mb-1.5">
							Tiers inclusos
						</p>
						<div className="flex flex-wrap gap-1.5">
							{systemTiers.map((t) => (
								<span
									key={t.key}
									className={`text-xs px-2 py-0.5 rounded-full ${t.style}`}
								>
									{t.label}
								</span>
							))}
						</div>
					</div>
				)}

				<div className="flex items-center gap-1 mb-4">
					{Array.from({ length: 5 }).map((_, i) => (
						<Star
							// biome-ignore lint/suspicious/noArrayIndexKey: static mock stars
							key={i}
							className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
						/>
					))}
					<span className="text-xs text-slate-500 dark:text-gray-500 ml-1">
						(4.9)
					</span>
				</div>

				<div className="mt-auto border-t border-slate-200 dark:border-gray-800 pt-4">
					<div className="flex items-center justify-between mb-3">
						<div>
							<p className="text-xs text-slate-500 dark:text-gray-500 mb-0.5">
								Por apenas
							</p>
							<p className="text-2xl font-bold text-slate-900 dark:text-white">
								{formatCurrency(product.price, 'BRL')}
							</p>
						</div>
						{product.refundDays && (
							<span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
								{product.refundDays} dias de garantia
							</span>
						)}
					</div>

					{ownershipStatus === 'owned' ? (
						<button
							type="button"
							disabled
							className="w-full flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold py-3 rounded-xl cursor-not-allowed"
						>
							<CheckCircle className="w-4 h-4" />
							Já possui
						</button>
					) : (
						<button
							type="button"
							onClick={handleBuy}
							className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-colors duration-200 cursor-pointer"
						>
							<ShoppingCart className="w-4 h-4" />
							{ownershipStatus === 'upgrade'
								? 'Fazer upgrade'
								: 'Comprar agora'}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
