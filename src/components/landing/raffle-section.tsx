'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

export function RaffleSection() {
	const { ref, isVisible } = useScrollReveal();

	const scrollToVideo = () => {
		document
			.getElementById('cursos')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	return (
		<section className="bg-[#0d0d0f] py-20 md:py-28 px-6">
			<div
				ref={ref}
				className={`max-w-4xl mx-auto text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
			>
				<p className="text-[#f2295b] uppercase tracking-widest text-sm font-bold mb-3">
					Oportunidade unica
				</p>
				<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
					Sorteio da CO2 6040
					<br />
					para os participantes da Comunidade no Plano Anual
				</h2>

				<p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-3xl mx-auto">
					A Comunidade por si so ja e um excelente investimento, agora imagine
					entrar na Comunidade e ainda concorrer a esta maquina. Todos os
					integrantes do Plano Anual estarao concorrendo ao sorteio, desde que
					ainda esteja ativo.
				</p>

				{/* Machine image */}
				<div className="w-full max-w-md mx-auto aspect-square rounded-3xl overflow-hidden border border-white/10 relative mb-8 shadow-2xl shadow-violet-900/10">
					<Image
						src="/img/co²-6040_sorteio_23-min.png"
						alt="Maquina CO2 6040 - Sorteio"
						fill
						className="object-contain bg-gradient-to-b from-white/[0.03] to-transparent"
					/>
				</div>

				<button
					type="button"
					onClick={scrollToVideo}
					className="inline-flex items-center justify-center gap-2 bg-[#f2295b] hover:bg-[#e0214f] text-white text-lg font-bold uppercase tracking-wide px-8 py-4 rounded-xl transition-all duration-300 w-full max-w-2xl shadow-lg shadow-[#f2295b]/20 cursor-pointer"
				>
					Quero aproveitar esta oportunidade
					<ChevronRight className="w-5 h-5" />
				</button>
			</div>
		</section>
	);
}
