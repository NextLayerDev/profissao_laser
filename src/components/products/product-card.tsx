'use client';

import { Copy, Layers, Link2, Settings2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import type { ProductCardProps } from '@/types/components/product-card';
import { TIER_STYLES } from '@/utils/constants/tier-styles';
import { formatCurrency } from '@/utils/format-currency';
import { DeleteProductModal } from './delete-product-modal';
import { DuplicateProductModal } from './duplicate-product-modal';

// Paleta de bordas por nome de system class (nome → [borda-normal, borda-hover, cor-badge])
const SC_NAMED: Record<string, [string, string, string]> = {
	prata: [
		'dark:border-slate-400/50',
		'dark:hover:border-slate-300',
		'dark:text-slate-300 border-slate-400/40 bg-slate-400/10',
	],
	ouro: [
		'dark:border-amber-400/50',
		'dark:hover:border-amber-300',
		'dark:text-amber-300 border-amber-400/40 bg-amber-400/10',
	],
	platina: [
		'dark:border-purple-400/50',
		'dark:hover:border-purple-300',
		'dark:text-purple-300 border-purple-400/40 bg-purple-400/10',
	],
	bronze: [
		'dark:border-orange-400/50',
		'dark:hover:border-orange-300',
		'dark:text-orange-300 border-orange-400/40 bg-orange-400/10',
	],
	diamante: [
		'dark:border-cyan-400/50',
		'dark:hover:border-cyan-300',
		'dark:text-cyan-300 border-cyan-400/40 bg-cyan-400/10',
	],
};

const SC_PALETTE: Array<[string, string, string]> = [
	[
		'dark:border-violet-400/50',
		'dark:hover:border-violet-300',
		'dark:text-violet-300 border-violet-400/40 bg-violet-400/10',
	],
	[
		'dark:border-emerald-400/50',
		'dark:hover:border-emerald-300',
		'dark:text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
	],
	[
		'dark:border-rose-400/50',
		'dark:hover:border-rose-300',
		'dark:text-rose-300 border-rose-400/40 bg-rose-400/10',
	],
	[
		'dark:border-teal-400/50',
		'dark:hover:border-teal-300',
		'dark:text-teal-300 border-teal-400/40 bg-teal-400/10',
	],
	[
		'dark:border-fuchsia-400/50',
		'dark:hover:border-fuchsia-300',
		'dark:text-fuchsia-300 border-fuchsia-400/40 bg-fuchsia-400/10',
	],
	[
		'dark:border-sky-400/50',
		'dark:hover:border-sky-300',
		'dark:text-sky-300 border-sky-400/40 bg-sky-400/10',
	],
];

function resolveScStyle(name: string): [string, string, string] {
	const key = name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
	for (const [k, v] of Object.entries(SC_NAMED)) {
		if (key.includes(k)) return v;
	}
	let hash = 0;
	for (let i = 0; i < name.length; i++)
		hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
	return SC_PALETTE[hash % SC_PALETTE.length];
}

export function ProductCard({
	product,
	productClasses,
	productSystemClasses,
}: ProductCardProps) {
	const { canPrice } = usePermissions();
	const [imgError, setImgError] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [showDuplicateModal, setShowDuplicateModal] = useState(false);

	const primarySc = productSystemClasses?.[0];
	const [scBorder, scBorderHover, scBadge] = primarySc
		? resolveScStyle(primarySc.name)
		: [
				'dark:border-violet-500/30',
				'dark:hover:border-violet-500/60',
				'dark:text-purple-400 border-purple-500/20 bg-purple-500/10',
			];

	return (
		<>
			<Link
				href={`/products/${product.id}`}
				className={`bg-white dark:bg-[#1a1a1d] rounded-2xl overflow-hidden border border-slate-200 ${scBorder} ${scBorderHover} transition-all duration-300 hover:scale-[1.02] block shadow-sm dark:shadow-none`}
			>
				<div className="relative h-44 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
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
					{product.status === 'inativo' && (
						<span className="absolute top-2 right-2 bg-gray-900/80 text-gray-300 text-xs px-2 py-1 rounded-full">
							Inativo
						</span>
					)}
				</div>

				<div className="p-4">
					<h3 className="font-semibold text-slate-900 dark:text-white mb-2">
						{product.name}
					</h3>
					{productClasses && productClasses.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mb-2">
							{productClasses.map((cls) => {
								const style = TIER_STYLES[cls.tier];
								return (
									<span
										key={cls.id}
										className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}
										title={cls.name}
									>
										<Layers className="w-3 h-3 shrink-0" />
										{cls.name}
									</span>
								);
							})}
						</div>
					)}
					{productSystemClasses && productSystemClasses.length > 0 && (
						<div className="mb-2">
							<div className="flex items-center gap-1 mb-1">
								<Settings2 className="w-3 h-3 text-purple-400" />
								<span className="text-[10px] font-medium text-slate-500 dark:text-gray-500 uppercase tracking-wider">
									Sistema LaserOne
								</span>
							</div>
							<div className="flex flex-wrap gap-1.5">
								{productSystemClasses.map((sc) => {
									const [, , badge] = resolveScStyle(sc.name);
									return (
										<span
											key={sc.id}
											className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${badge}`}
											title={sc.name}
										>
											{sc.name}
										</span>
									);
								})}
							</div>
						</div>
					)}
					<p className="text-sm text-slate-600 dark:text-gray-400 mb-4 line-clamp-2">
						{product.description}
					</p>

					<div className="border-t border-slate-200 dark:border-gray-800 pt-4">
						<div className="flex items-center justify-between">
							{canPrice ? (
								<div className="text-sm">
									<span className="text-slate-500 dark:text-gray-500">
										Preço:{' '}
									</span>
									<span className="text-slate-900 dark:text-white font-medium">
										{formatCurrency(product.price, 'BRL')}
									</span>
								</div>
							) : (
								<div />
							)}
							<div className="flex items-center gap-1">
								<button
									type="button"
									className="p-2 text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors"
									onClick={(e) => e.stopPropagation()}
								>
									<Link2 className="w-4 h-4" />
								</button>
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setShowDuplicateModal(true);
									}}
									className="p-2 text-slate-500 dark:text-gray-500 hover:text-violet-400 transition-colors"
									title="Duplicar produto"
								>
									<Copy className="w-4 h-4" />
								</button>
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setShowDeleteModal(true);
									}}
									className="p-2 text-slate-500 dark:text-gray-500 hover:text-red-400 transition-colors"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</Link>

			{showDeleteModal && (
				<DeleteProductModal
					product={product}
					onClose={() => setShowDeleteModal(false)}
				/>
			)}

			{showDuplicateModal && (
				<DuplicateProductModal
					product={product}
					productClasses={productClasses}
					productSystemClasses={productSystemClasses}
					onClose={() => setShowDuplicateModal(false)}
				/>
			)}
		</>
	);
}
