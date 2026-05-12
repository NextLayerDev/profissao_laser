'use client';

import { Clock } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

const PARTICIPANT_GRADIENTS = [
	'linear-gradient(135deg, #8b5cf6, #d946ef)',
	'linear-gradient(135deg, #3b82f6, #06b6d4)',
	'linear-gradient(135deg, #ec4899, #f43f5e)',
];

export function WeeklyChallenge() {
	return (
		<div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5">
			<Image
				src="/img/img-destacada.jpg"
				alt=""
				aria-hidden
				fill
				className="object-cover"
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />

			<div className="relative p-5">
				<div className="flex items-center gap-2 mb-3">
					<span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-full tracking-wider">
						ATIVO
					</span>
					<div className="flex items-center gap-1 text-amber-400">
						<Clock className="w-3 h-3" />
						<span className="text-[10px] font-medium">4 dias restantes</span>
					</div>
				</div>

				<h3 className="text-base font-bold text-white mb-1">
					Criatividade em MDF
				</h3>
				<p className="text-xs text-gray-300 mb-4 leading-relaxed">
					Crie um projeto inovador usando MDF e compartilhe com a comunidade
				</p>

				<button
					type="button"
					onClick={() =>
						toast('Em breve', {
							description: 'Desafios estarao disponiveis em breve!',
						})
					}
					className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-violet-500/20 mb-4"
				>
					Participar do desafio
				</button>

				<div className="flex items-center gap-2">
					<div className="flex -space-x-1.5">
						{PARTICIPANT_GRADIENTS.map((bg, i) => (
							<div
								key={`skeleton-${i}`}
								className="w-6 h-6 rounded-full border-2 border-black/50 flex items-center justify-center text-[9px] font-bold text-white"
								style={{ background: bg }}
							>
								{['P', 'L', 'S'][i]}
							</div>
						))}
					</div>
					<span className="text-[11px] text-gray-400">163 participantes</span>
				</div>
			</div>
		</div>
	);
}
