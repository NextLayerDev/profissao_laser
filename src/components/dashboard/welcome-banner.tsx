import { Home, Sparkles } from 'lucide-react';

export function WelcomeBanner() {
	return (
		<div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-violet-600 via-purple-600 to-fuchsia-500 p-8 mb-8">
			<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
			<div className="relative flex items-center justify-between">
				<div className="flex items-center gap-5">
					<div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
						<Home className="w-8 h-8 text-white" />
					</div>
					<div>
						<h2 className="text-2xl font-bold text-white">
							Olá, bem-vindo de volta!
						</h2>
						<p className="text-white/80 mt-1">
							Aqui está um resumo do seu negócio hoje
						</p>
					</div>
				</div>
				<button
					type="button"
					className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
				>
					<Sparkles className="w-4 h-4 text-yellow-300" />
					<span className="text-sm font-medium">Última atualização: Hoje</span>
				</button>
			</div>
		</div>
	);
}
