'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/modules/catalog';
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
		<div className="flex items-center gap-1.5 flex-wrap">
			{versions.length > 1 &&
				versions.map((v, i) => {
					const isActive = v.id === currentId;
					const shortLabel =
						[v.machine, v.software].filter(Boolean).join(' · ') ||
						`Versão ${i + 1}`;
					return (
						<button
							key={v.id}
							type="button"
							title={versionLabel(v, i)}
							onClick={() => router.push(`/products/${v.id}`)}
							className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
								isActive
									? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30 ring-2 ring-violet-400/30'
									: 'bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-white/10 hover:border-violet-400/50 dark:hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400'
							}`}
						>
							{shortLabel}
						</button>
					);
				})}
			<button
				type="button"
				onClick={onNewVersion}
				className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full text-slate-500 dark:text-gray-500 border border-dashed border-slate-300 dark:border-white/15 hover:text-violet-500 dark:hover:text-violet-400 hover:border-violet-400/50 dark:hover:border-violet-500/40 transition-colors"
			>
				<Plus className="w-3 h-3" />
				Nova versão
			</button>
		</div>
	);
}
