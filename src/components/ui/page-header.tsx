import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	icon?: LucideIcon;
	variant?: 'compact' | 'featured';
	backgroundImage?: string;
}

export function PageHeader({
	title,
	subtitle,
	icon: Icon,
	variant = 'compact',
	backgroundImage,
}: PageHeaderProps) {
	if (variant === 'featured') {
		return (
			<div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 mb-8">
				{backgroundImage && (
					<div
						className="absolute inset-0 bg-cover bg-center"
						style={{ backgroundImage: `url(${backgroundImage})` }}
					/>
				)}
				<div className="absolute inset-0 bg-slate-900/70 dark:bg-black/70 grain-texture" />
				<div className="relative z-10 px-8 py-10">
					<div className="flex items-center gap-4">
						{Icon && (
							<div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center">
								<Icon className="w-6 h-6 text-violet-400" />
							</div>
						)}
						<div>
							<h1 className="font-display text-2xl font-bold text-white">
								{title}
							</h1>
							{subtitle && <p className="text-slate-300 mt-1">{subtitle}</p>}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-4 mb-8">
			<div className="w-1 h-10 rounded-full bg-violet-600" />
			{Icon && (
				<div className="w-10 h-10 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center">
					<Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
				</div>
			)}
			<div>
				<h1 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
					{title}
				</h1>
				{subtitle && (
					<p className="text-slate-500 dark:text-gray-400 text-sm">
						{subtitle}
					</p>
				)}
			</div>
		</div>
	);
}
