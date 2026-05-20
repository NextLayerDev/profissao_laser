'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { ScrollReveal } from './scroll-reveal';

export function NetworkSection() {
	const scrollToVideo = () => {
		document
			.getElementById('cursos')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	return (
		<section className="bg-ink-900 py-20 md:py-28 px-6">
			<ScrollReveal className="max-w-5xl mx-auto">
				<div className="bg-white/[0.03] backdrop-blur-sm border border-violet-500/30 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 shadow-2xl shadow-violet-500/5">
					<div className="flex-1">
						<p className="text-violet-400 uppercase tracking-widest text-sm font-bold mb-3">
							Comunidade exclusiva
						</p>
						<h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
							Network é essencial para quem quer ter{' '}
							<span className="grad-brand">bons resultados</span> no mundo da
							gravação laser
						</h2>

						<p className="text-gray-400 text-lg leading-relaxed mb-8">
							A Comunidade é um GRUPO FECHADO, dedicado somente aos assinantes
							da plataforma. Você terá acesso a ferramentas como planilhas
							dedicadas aos profissionais do laser, além de poder acessar
							fornecedores com preços incríveis.
						</p>

						<button
							type="button"
							onClick={scrollToVideo}
							className="btn-accent inline-flex items-center gap-2 text-white text-base font-bold uppercase tracking-wide px-8 py-4 rounded-xl transition-all duration-300 shadow-brand cursor-pointer"
						>
							Quero aproveitar esta oportunidade
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>

					{/* Image */}
					<div className="flex-shrink-0 w-full md:w-80 aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 relative">
						<Image
							src="/img/maquina-laser-min-min.png"
							alt="Máquina de gravação a laser"
							fill
							className="object-cover"
						/>
					</div>
				</div>
			</ScrollReveal>
		</section>
	);
}
