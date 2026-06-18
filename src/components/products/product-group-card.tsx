'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Product } from '@/modules/catalog';
import type { ProductSystemClassInfo } from '@/types/components/product-card';
import { formatCurrency } from '@/utils/format-currency';
import {
	groupStartingPrice,
	pickDefaultVersion,
} from '@/utils/products/group-products';
import { resolveScStyle } from '@/utils/products/sc-style';

interface ProductGroupCardProps {
	versions: Product[];
	/** System classes por id de versão (para unir os badges do grupo) */
	systemClassesByVersion: Map<string, ProductSystemClassInfo[] | undefined>;
}

export function ProductGroupCard({
	versions,
	systemClassesByVersion,
}: ProductGroupCardProps) {
	const [imgError, setImgError] = useState(false);

	const defaultVersion = pickDefaultVersion(versions);
	const startingPrice = groupStartingPrice(versions);
	const image = versions.find((v) => v.image)?.image ?? null;
	const noneActive = versions.every((v) => v.status !== 'ativo');

	const scByName = new Map<string, ProductSystemClassInfo>();
	for (const v of versions) {
		for (const sc of systemClassesByVersion.get(v.id) ?? []) {
			if (!scByName.has(sc.name)) scByName.set(sc.name, sc);
		}
	}
	const systemClasses = Array.from(scByName.values());

	const primarySc = systemClasses[0];
	const [scBorder, scBorderHover] = primarySc
		? resolveScStyle(primarySc.name)
		: ['dark:border-violet-500/30', 'dark:hover:border-violet-500/60'];

	return (
		<Link
			href={`/products/${defaultVersion.id}`}
			className={`bg-white dark:bg-[#1a1a1d] rounded-2xl overflow-hidden border border-slate-200 ${scBorder} ${scBorderHover} transition-all duration-300 hover:scale-[1.02] block shadow-sm dark:shadow-none`}
		>
			<div className="relative h-44 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center">
				{image && !imgError ? (
					<Image
						src={image}
						alt={defaultVersion.name}
						fill
						className="object-cover"
						onError={() => setImgError(true)}
					/>
				) : (
					<span className="text-sm text-white/70 px-4 text-center">
						Produto sem imagem
					</span>
				)}
				{noneActive && (
					<span className="absolute top-2 right-2 bg-gray-900/80 text-gray-300 text-xs px-2 py-1 rounded-full">
						Inativo
					</span>
				)}
			</div>

			<div className="p-4">
				<div className="flex items-start justify-between gap-2 mb-2">
					<h3 className="font-semibold text-slate-900 dark:text-white">
						{defaultVersion.name}
					</h3>
					{versions.length > 1 && (
						<span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20">
							{versions.length} versões
						</span>
					)}
				</div>

				{systemClasses.length > 0 && (
					<div className="flex flex-wrap gap-1.5 mb-2">
						{systemClasses.map((sc) => {
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
				)}

				<p className="text-sm text-slate-600 dark:text-gray-400 mb-4 line-clamp-2">
					{defaultVersion.description}
				</p>

				<div className="border-t border-slate-200 dark:border-gray-800 pt-4 text-sm">
					<span className="text-slate-500 dark:text-gray-500">
						A partir de:{' '}
					</span>
					<span className="text-slate-900 dark:text-white font-medium">
						{formatCurrency(startingPrice, 'BRL')}
					</span>
				</div>
			</div>
		</Link>
	);
}
