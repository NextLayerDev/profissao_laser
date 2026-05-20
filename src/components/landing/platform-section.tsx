'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { ScrollReveal, StaggerReveal } from './scroll-reveal';

const screenshots = [
	{
		src: '/img/primeiras-configuracoes-100-min.jpg',
		alt: 'Primeiras configurações',
	},
	{
		src: '/img/como-fazer-preenchimento-100-min.jpg',
		alt: 'Como fazer preenchimento',
	},
	{
		src: '/img/usando-fontes-personalizadas-100-min.jpg',
		alt: 'Usando fontes personalizadas',
	},
];

export function PlatformSection() {
	const scrollToVideo = () => {
		document
			.getElementById('cursos')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	return (
		<section className="bg-ink-900 py-20 md:py-28 px-6">
			<div className="max-w-4xl mx-auto text-center">
				<ScrollReveal>
					<p className="text-violet-400 uppercase tracking-widest text-sm font-bold mb-3">
						Plataforma completa
					</p>
					<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
						Plataforma com uma{' '}
						<span className="grad-brand">trilha de conhecimento</span>
						<br />
						para você acessar a hora que precisar
					</h2>

					<p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-3xl mx-auto">
						Chega de ficar procurando dicas aleatórias de como usar sua máquina
						de gravação a laser. Na nossa plataforma você terá o treinamento
						completo desde as configurações mais básicas até a produção de
						produtos mais complexos.
					</p>
				</ScrollReveal>

				{/* Screenshots */}
				<div className="relative mb-10">
					<div className="flex gap-4 overflow-hidden justify-center">
						{screenshots.map((shot, i) => (
							<StaggerReveal key={shot.alt} delay={i * 0.12}>
								<div className="relative w-64 h-44 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 shadow-xl">
									<Image
										src={shot.src}
										alt={shot.alt}
										fill
										className="object-cover"
									/>
								</div>
							</StaggerReveal>
						))}
					</div>
				</div>

				<ScrollReveal delay={0.3}>
					<button
						type="button"
						onClick={scrollToVideo}
						className="btn-accent inline-flex items-center justify-center gap-2 text-white text-lg font-bold uppercase tracking-wide px-8 py-4 rounded-xl transition-all duration-300 w-full max-w-2xl shadow-brand cursor-pointer"
					>
						Quero aproveitar esta oportunidade
						<ChevronRight className="w-5 h-5" />
					</button>
				</ScrollReveal>
			</div>
		</section>
	);
}
