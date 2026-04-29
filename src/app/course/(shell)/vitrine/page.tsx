import { LayoutGrid } from 'lucide-react';

export default function VitrineCoursePage() {
	return (
		<div className="p-4 md:p-8 max-w-4xl mx-auto">
			<div className="mb-6 flex items-center gap-3">
				<div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg p-2">
					<LayoutGrid className="w-5 h-5 text-white" />
				</div>
				<div>
					<h2 className="text-2xl font-black text-slate-900 dark:text-white">
						Vitrine
					</h2>
					<p className="text-slate-500 dark:text-gray-500 text-sm">
						Mostre seus trabalhos e inspire outros profissionais.
					</p>
				</div>
			</div>

			<div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800/50 rounded-2xl text-center">
				<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 flex items-center justify-center mb-4">
					<LayoutGrid className="w-8 h-8 text-sky-500" />
				</div>
				<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
					Em breve
				</h3>
				<p className="text-slate-500 dark:text-gray-500 text-sm max-w-xs">
					A vitrine de trabalhos da comunidade estará disponível em breve. Fique
					de olho!
				</p>
			</div>
		</div>
	);
}
