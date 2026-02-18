import { ArrowRight } from 'lucide-react';
import { quickAccessItems } from '@/utils/constants/dashboard';

export function QuickAccess() {
	return (
		<div className="lg:col-span-2">
			<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
				Acesso Rápido
			</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{quickAccessItems.map((item) => (
					<button
						type="button"
						key={item.title}
						className="flex items-center justify-between bg-[#1a1a1d] rounded-2xl p-5 border border-gray-800/50 hover:border-violet-500/50 hover:bg-[#1f1f22] transition-all duration-300 group"
					>
						<div className="flex items-center gap-4">
							<div className={`${item.iconBg} p-3 rounded-xl`}>
								<item.icon className="w-5 h-5 text-white" />
							</div>
							<div className="text-left">
								<div className="font-semibold">{item.title}</div>
								<div className="text-sm text-gray-500">{item.subtitle}</div>
							</div>
						</div>
						<ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
					</button>
				))}
			</div>
		</div>
	);
}
