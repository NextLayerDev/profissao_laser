'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/products';
import { formatCurrency } from '@/utils/format-currency';

interface VersionSelectorProps {
	versions: Product[];
	currentId: string;
	onNewVersion: () => void;
}

function versionLabel(version: Product, index: number): string {
	const parts = [version.machine, version.software].filter(
		(x): x is string => !!x,
	);
	const base = parts.length > 0 ? parts.join(' · ') : `Versão ${index + 1}`;
	return `${base} · ${formatCurrency(version.price, 'BRL')} · ${version.status}`;
}

export function VersionSelector({
	versions,
	currentId,
	onNewVersion,
}: VersionSelectorProps) {
	const router = useRouter();

	return (
		<div className="flex items-center gap-2">
			{versions.length > 1 && (
				<select
					value={currentId}
					onChange={(e) => router.push(`/products/${e.target.value}`)}
					className="bg-slate-100 dark:bg-[#252528] text-xs px-3 py-1.5 rounded-full text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-800 focus:outline-none focus:ring-1 focus:ring-violet-500"
				>
					{versions.map((v, i) => (
						<option key={v.id} value={v.id}>
							{versionLabel(v, i)}
						</option>
					))}
				</select>
			)}
			<button
				type="button"
				onClick={onNewVersion}
				className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#252528] text-xs px-3 py-1.5 rounded-full text-slate-600 dark:text-gray-300 hover:text-violet-500 transition-colors"
			>
				<Plus className="w-3.5 h-3.5" />
				Nova versão
			</button>
		</div>
	);
}
