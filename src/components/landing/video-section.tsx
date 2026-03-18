'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

export function VideoSection() {
	const { ref, isVisible } = useScrollReveal();

	const scrollToVideo = () => {
		document
			.getElementById('cursos')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	return (
		<section
			id="video-section"
			className="bg-[#0d0d0f] py-20 md:py-28 px-6 scroll-mt-20"
		>
			<div
				ref={ref}
				className={`max-w-4xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
			>
				<p className="text-[#f2295b] uppercase tracking-widest text-sm font-bold text-center mb-3">
					Assista agora
				</p>
				<h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
					Aprenda a{' '}
					<span className="bg-gradient-to-r from-[#f2295b] to-violet-500 bg-clip-text text-transparent italic font-extrabold">
						personalizar com gravação a laser
					</span>{' '}
					os{' '}
					<span className="bg-gradient-to-r from-violet-500 to-[#f2295b] bg-clip-text text-transparent italic font-extrabold">
						produtos mais vendidos
					</span>{' '}
					nos e-commerces
				</h2>

				<p className="text-gray-400 text-center text-lg leading-relaxed mb-10 max-w-3xl mx-auto">
					Na{' '}
					<span className="text-[#f2295b] font-semibold">
						Comunidade Profissão Laser
					</span>{' '}
					temos lives fechadas exclusivas para membros de personalizações de
					produtos que são campeões de vendas, mostrando todas as configurações
					necessárias em diferentes artes, e você pode{' '}
					<span className="text-white font-semibold underline decoration-[#f2295b]/50 underline-offset-4">
						tirar suas dúvidas ao Vivo.
					</span>
				</p>

				{/* Embedded YouTube video */}
				<div className="relative aspect-video rounded-3xl overflow-hidden mb-5 border border-white/10 shadow-2xl shadow-violet-900/20">
					<iframe
						src="https://www.youtube.com/embed/EHI-vDIjUk4"
						title="Aprenda a personalizar com gravação a laser"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowFullScreen
						className="absolute inset-0 w-full h-full"
					/>
				</div>

				{/* Instructors */}
				<div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
					<div className="flex items-center gap-3">
						<Image
							src="/img/FERNANDO02.jpeg"
							alt="Fernando Nucci"
							width={44}
							height={44}
							className="rounded-xl object-cover"
						/>
						<div>
							<p className="text-white text-sm font-bold leading-tight">
								Fernando Nucci
							</p>
							<p className="text-gray-500 text-[11px]">Instrutor</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Image
							src="/img/GIOVANI01.jpeg"
							alt="Giovani Meinhardt"
							width={44}
							height={44}
							className="rounded-xl object-cover"
						/>
						<div>
							<p className="text-white text-sm font-bold leading-tight">
								Giovani Meinhardt
							</p>
							<p className="text-gray-500 text-[11px]">Instrutor</p>
						</div>
					</div>
				</div>

				<button
					type="button"
					onClick={scrollToVideo}
					className="flex items-center justify-center gap-2 bg-[#f2295b] hover:bg-[#e0214f] text-white text-lg font-bold uppercase tracking-wide px-8 py-4 rounded-xl transition-all duration-300 w-full shadow-lg shadow-[#f2295b]/20 hover:shadow-[#f2295b]/30 cursor-pointer"
				>
					Quero aproveitar esta oportunidade
					<ChevronRight className="w-5 h-5" />
				</button>
			</div>
		</section>
	);
}
