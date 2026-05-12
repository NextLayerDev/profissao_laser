'use client';

import { Calendar, Clock } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

export function NextLiveCard() {
	return (
		<section
			className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5"
			style={{
				boxShadow:
					'0 0 20px rgba(239,68,68,0.08), 0 0 40px rgba(239,68,68,0.04)',
			}}
		>
			{/* Background image */}
			<Image
				src="/img/LIVES.jpeg"
				alt=""
				aria-hidden
				fill
				className="object-cover"
			/>
			<div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/85 to-red-950/90 dark:from-[#12121a]/92 dark:via-[#12121a]/88 dark:to-red-950/90" />

			{/* Animated red glow border */}
			<div
				className="absolute inset-0 rounded-2xl pointer-events-none"
				style={{
					background:
						'linear-gradient(90deg, transparent, rgba(239,68,68,0.15), transparent)',
					animation: 'borderGlow 3s ease-in-out infinite',
				}}
			/>

			<div className="relative p-6">
				<div className="flex items-center gap-2 mb-4">
					<span className="relative flex h-3 w-3">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
						<span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
					</span>
					<span className="text-xs font-bold text-red-400 uppercase tracking-wider">
						AO VIVO
					</span>
				</div>

				<h3 className="text-lg font-bold text-white mb-2">Proxima Live</h3>

				<p className="text-base font-semibold text-gray-200 mb-3">
					Workshop: Tecnicas Avancadas de Corte a Laser
				</p>

				<div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
					<div className="flex items-center gap-1.5">
						<Calendar className="w-4 h-4" />
						<span>Quinta, 20:00</span>
					</div>
					<div className="flex items-center gap-1.5">
						<Clock className="w-4 h-4" />
						<span>1h30</span>
					</div>
				</div>

				<div className="flex items-center gap-3 mb-5">
					<Image
						src="/img/FERNANDO02.jpeg"
						alt="Fernando"
						width={40}
						height={40}
						className="w-10 h-10 rounded-full object-cover border-2 border-violet-500/50"
					/>
					<div>
						<p className="text-sm font-medium text-gray-200">Fernando</p>
						<p className="text-xs text-gray-500">Instrutor</p>
					</div>
				</div>

				<button
					type="button"
					onClick={() =>
						toast('Em breve', {
							description: 'Lembretes estarao disponiveis em breve!',
						})
					}
					className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-violet-500/20"
				>
					Definir lembrete
				</button>
			</div>

			<style jsx>{`
				@keyframes borderGlow {
					0%, 100% { opacity: 0; }
					50% { opacity: 1; }
				}
			`}</style>
		</section>
	);
}
