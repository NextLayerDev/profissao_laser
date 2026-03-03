import { alerts } from '@/utils/constants/dashboard';

export function Alerts() {
	return (
		<div>
			<h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-4">
				Alertas
			</h3>
			<div className="space-y-4">
				{alerts.map((alert) => (
					<div
						key={alert.title}
						className={`rounded-2xl p-5 border transition-all duration-300 ${
							alert.type === 'warning'
								? 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50'
								: 'bg-white dark:bg-[#1a1a1d] border-slate-200 dark:border-gray-800/50 hover:border-slate-300 dark:hover:border-gray-700 shadow-sm dark:shadow-none'
						}`}
					>
						<div className="flex items-start gap-3">
							<alert.icon
								className={`w-5 h-5 mt-0.5 ${
									alert.type === 'warning'
										? 'text-orange-500'
										: 'text-slate-500 dark:text-gray-400'
								}`}
							/>
							<div>
								<div className="font-semibold text-slate-900 dark:text-white">
									{alert.title}
								</div>
								<div className="text-sm text-slate-600 dark:text-gray-400 mt-1">
									{alert.subtitle}
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
