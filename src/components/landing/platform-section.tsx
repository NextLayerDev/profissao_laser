'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const screenshots = [
	{
		src: '/img/primeiras-configuracoes-100-min.jpg',
		alt: 'Primeiras configuracoes',
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
	const { ref, isVisible } = useScrollReveal();

	const scrollToVideo = () => {
		document
			.getElementById('video-compra')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	return (
		<section className="bg-[#0d0d0f] py-20 md:py-28 px-6">
			<div
				ref={ref}
				className={`max-w-4xl mx-auto text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
			>
				<p className="text-[#f2295b] uppercase tracking-widest text-sm font-bold mb-3">
					Plataforma completa
				</p>
				<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
					Plataforma com uma{' '}
					<span className="bg-gradient-to-r from-[#f2295b] to-violet-500 bg-clip-text text-transparent italic font-extrabold">
						trilha de conhecimento
					</span>
					<br />
					para voce acessar a hora que precisar
				</h2>

				<p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-3xl mx-auto">
					Chega de ficar procurando dicas aleatorias de como usar sua maquina de
					gravacao a laser. Na nossa plataforma voce tera o treinamento completo
					desde as configuracoes mais basicas ate a producao de produtos mais
					complexos.
				</p>

				{/* Screenshots */}
				<div className="relative mb-10">
					<div className="flex gap-4 overflow-hidden justify-center">
						{screenshots.map((shot, i) => (
							<div
								key={shot.alt}
								className={`relative w-64 h-44 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 shadow-xl transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
								style={{
									transitionDelay: `${300 + i * 150}ms`,
								}}
							>
								<Image
									src={shot.src}
									alt={shot.alt}
									fill
									className="object-cover"
								/>
							</div>
						))}
					</div>
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
