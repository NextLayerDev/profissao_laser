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

const SHADOW_COLORS: Record<string, string> = {
	'from-emerald-500 to-teal-500': 'shadow-emerald-500/20',
	'from-blue-500 to-blue-600': 'shadow-blue-500/20',
	'from-purple-500 to-violet-600': 'shadow-purple-500/20',
	'from-pink-500 to-rose-500': 'shadow-pink-500/20',
	'from-rose-500 to-red-500': 'shadow-rose-500/20',
	'from-emerald-500 to-green-600': 'shadow-emerald-500/20',
	'from-violet-500 to-indigo-600': 'shadow-violet-500/20',
	'from-cyan-500 to-blue-500': 'shadow-cyan-500/20',
	'from-blue-600 to-indigo-700': 'shadow-blue-600/20',
	'from-pink-500 to-orange-400': 'shadow-pink-500/20',
	'from-violet-500 to-purple-600': 'shadow-violet-500/20',
	'from-sky-400 to-blue-500': 'shadow-sky-500/20',
	'from-lime-400 to-green-500': 'shadow-lime-500/20',
	'from-pink-400 to-rose-500': 'shadow-pink-400/20',
};

export function QuickAccessGrid({ features }: QuickAccessGridProps) {
	return (
		<section>
			<div className="flex justify-between items-end mb-5">
				<h3 className="text-xl font-bold text-slate-900 dark:text-white">
					Acesso Rapido
				</h3>
				<button
					type="button"
					onClick={() =>
						toast('Em breve', {
							description: 'Personalizacao estara disponivel em breve!',
						})
					}
					className="text-xs text-slate-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-400 font-medium transition-colors flex items-center gap-1"
				>
					Personalizar
					<Settings className="w-3.5 h-3.5" />
				</button>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
				{quickAccessItems.map(
					({ label, description, Icon, gradient, featureKey, href }) => {
						const hasAccess = featureKey
							? (features?.[featureKey] ?? false)
							: true;
						const isComingSoon = !href && !featureKey;
						const isLocked = featureKey && !hasAccess;
						const shadowColor =
							SHADOW_COLORS[gradient] || 'shadow-violet-500/20';

						const handleClick = () => {
							if (isComingSoon || (!href && !isLocked)) {
								toast('Em breve', {
									description: `${label} estara disponivel em breve!`,
								});
							}
						};

						const cardContent = (
							<>
								<div
									className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
										isLocked
											? 'bg-slate-200 dark:bg-gray-800/60'
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
												? 'text-slate-400/60 dark:text-gray-600'
												: 'text-white/70'
										}`}
									>
										{description}
									</p>
								</div>
							</>
						);

						const baseClass = `group relative rounded-xl p-3 flex flex-col gap-2.5 transition-all duration-200 bg-gradient-to-br ${gradient} border border-white/10 ${
							isLocked
								? 'opacity-50 cursor-not-allowed saturate-0'
								: `hover:scale-[1.02] hover:brightness-110 cursor-pointer shadow-lg ${shadowColor}`
						} ${isComingSoon ? 'opacity-75' : ''}`;

						const hoverLine = !isLocked ? (
							<div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
								onClick={handleClick}
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
