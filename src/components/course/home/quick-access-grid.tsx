'use client';

import { Lock, Settings } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { CustomerFeatures, FeatureUpgradeTiers } from '@/types/classes';
import { quickAccessItems } from '@/utils/constants/quick-access';

interface QuickAccessGridProps {
	features: CustomerFeatures | null;
	upgradeTiers: FeatureUpgradeTiers | null;
	onSavedLessonsOpen: () => void;
}

export function QuickAccessGrid({ features }: QuickAccessGridProps) {
	return (
		<section>
			<div className="flex justify-between items-end mb-5">
				<h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
					Acesso Rapido
				</h3>
				<button
					type="button"
					onClick={() =>
						toast('Em breve', {
							description: 'Personalizacao estara disponivel em breve!',
						})
					}
					className="text-xs text-slate-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 font-medium transition-colors flex items-center gap-1"
				>
					Personalizar
					<Settings className="w-3.5 h-3.5" />
				</button>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
				{quickAccessItems.map(
					({ label, description, Icon, featureKey, href }) => {
						const hasAccess = featureKey
							? (features?.[featureKey] ?? false)
							: true;
						const isComingSoon = !href && !featureKey;
						const isLocked = featureKey && !hasAccess;

						const cardContent = (
							<>
								<div
									className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
										isLocked
											? 'bg-slate-200 dark:bg-white/[0.06]'
											: 'bg-white/20'
									}`}
								>
									{isLocked ? (
										<Lock className="w-4 h-4 text-slate-400 dark:text-gray-500" />
									) : (
										<Icon className="w-4 h-4 text-white" />
									)}
								</div>
								<div className="min-w-0">
									<p
										className={`text-sm font-bold leading-tight ${
											isLocked
												? 'text-slate-400 dark:text-gray-500'
												: 'text-white'
										}`}
									>
										{label}
									</p>
									<p
										className={`text-xs mt-0.5 leading-tight ${
											isLocked
												? 'text-slate-400/60 dark:text-gray-500'
												: 'text-white/70'
										}`}
									>
										{description}
									</p>
								</div>
							</>
						);

						const baseClass = `group relative rounded-lg p-3 flex flex-col gap-2.5 transition-all duration-200 bg-gradient-to-br from-violet-600 to-violet-700 border border-white/10 ${
							isLocked
								? 'opacity-50 cursor-not-allowed saturate-0'
								: 'hover:brightness-110 cursor-pointer shadow-lg shadow-violet-500/20'
						} ${isComingSoon ? 'opacity-75' : ''}`;

						const hoverLine = !isLocked ? (
							<div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-lg bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
						) : null;

						if (isLocked) {
							return (
								<div key={label} className={baseClass}>
									{cardContent}
								</div>
							);
						}

						if (href && hasAccess) {
							return (
								<Link key={label} href={href} className={baseClass}>
									{hoverLine}
									{cardContent}
								</Link>
							);
						}

						return (
							<button
								key={label}
								type="button"
								onClick={() => {
									if (isComingSoon || (!href && !isLocked)) {
										toast('Em breve', {
											description: `${label} estara disponivel em breve!`,
										});
									}
								}}
								className={`${baseClass} text-left`}
							>
								{hoverLine}
								{isComingSoon && (
									<span className="absolute top-2 right-2 px-2 py-0.5 bg-black/30 backdrop-blur-sm text-white/80 text-[10px] font-bold uppercase rounded-full tracking-wider">
										Em breve
									</span>
								)}
								{cardContent}
							</button>
						);
					},
				)}
			</div>
		</section>
	);
}
