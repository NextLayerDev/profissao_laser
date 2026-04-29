'use client';

import { Lock } from 'lucide-react';
import Link from 'next/link';
import type { CustomerFeatures, FeatureUpgradeTiers } from '@/types/classes';
import { quickAccessItems } from '@/utils/constants/quick-access';

interface QuickAccessGridProps {
	features: CustomerFeatures | null;
	upgradeTiers: FeatureUpgradeTiers | null;
	onSavedLessonsOpen: () => void;
}

export function QuickAccessGrid({
	features,
	onSavedLessonsOpen,
}: QuickAccessGridProps) {
	return (
		<section>
			<div className="flex justify-between items-end mb-4">
				<h3 className="text-xl font-bold text-slate-900 dark:text-white">
					Acesso Rápido
				</h3>
			</div>
			<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
				{quickAccessItems.map(
					({ label, Icon, gradient, cardBg, featureKey, href }) => {
						const hasAccess = featureKey
							? (features?.[featureKey] ?? false)
							: true;
						const cardClass = `bg-linear-to-br ${cardBg} border border-slate-200 dark:border-gray-800/50 hover:border-violet-500/30 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all group ${hasAccess ? 'cursor-pointer hover:brightness-95 dark:hover:brightness-110' : 'opacity-60 cursor-not-allowed'}`;
						const content = (
							<>
								<div
									className={`w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
										hasAccess
											? `bg-linear-to-br ${gradient} shadow-md`
											: 'bg-slate-100 dark:bg-gray-800/40'
									}`}
								>
									{hasAccess ? (
										<Icon className="w-6 h-6 text-white" />
									) : (
										<Lock className="w-6 h-6 text-slate-400 dark:text-gray-600" />
									)}
								</div>
								<span className="text-sm font-medium text-slate-700 dark:text-gray-300 text-center leading-tight">
									{label}
								</span>
							</>
						);

						if (hasAccess && label === 'Aulas Salvas') {
							return (
								<button
									key={label}
									type="button"
									onClick={onSavedLessonsOpen}
									className={cardClass}
								>
									{content}
								</button>
							);
						}
						return href && hasAccess ? (
							<Link key={label} href={href} className={cardClass}>
								{content}
							</Link>
						) : (
							<div key={label} className={cardClass}>
								{content}
							</div>
						);
					},
				)}
			</div>
		</section>
	);
}
