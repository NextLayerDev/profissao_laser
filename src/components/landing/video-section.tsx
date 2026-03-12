'use client';

import { ChevronRight, Play } from 'lucide-react';
import Image from 'next/image';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

export function VideoSection() {
	const { ref, isVisible } = useScrollReveal();

	const scrollToVideo = () => {
		document
			.getElementById('video-compra')
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
						personalizar com gravacao a laser
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
						Comunidade Profissao Laser
					</span>{' '}
					temos lives semanais de personalizacao dos produtos que sao campeoes
					de venda, mostrando todas as configuracoes necessarias em diferentes
					artes, e voce ainda pode{' '}
					<span className="text-white font-semibold underline decoration-[#f2295b]/50 underline-offset-4">
						tirar suas duvidas ao vivo.
					</span>
				</p>

				{/* Video with poster - opens YouTube */}
				<a
					href="https://www.youtube.com/PLACEHOLDER_VIDEO_ID"
					target="_blank"
					rel="noopener noreferrer"
					className="relative block aspect-video rounded-3xl overflow-hidden mb-8 border border-white/10 group cursor-pointer shadow-2xl shadow-violet-900/20"
				>
					<Image
						src="/img/thumbnail-youtube-min.png"
						alt="Video da comunidade"
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-700"
					/>
					<div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />

					{/* Play button */}
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="relative">
							<div className="absolute inset-0 rounded-full bg-[#f2295b]/20 animate-ping" />
							<div className="relative w-20 h-20 rounded-full bg-[#f2295b]/90 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-[#f2295b]/30 group-hover:bg-[#f2295b] group-hover:scale-110 transition-all duration-300">
								<Play className="w-8 h-8 text-white ml-1" />
							</div>
						</div>
					</div>

					{/* Instructor names overlay */}
					<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
						<div className="flex items-center gap-6">
							<div className="flex items-center gap-3">
								<Image
									src="/img/fernando-nucci_lw-min.jpg"
									alt="Fernando Nucci"
									width={48}
									height={48}
									className="rounded-xl object-cover"
								/>
								<div>
									<p className="text-white text-sm font-bold leading-tight">
										Fernando Nucci
									</p>
									<p className="text-gray-400 text-[11px]">Instrutor</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<Image
									src="/img/giovani-meinhardt-min.jpg"
									alt="Giovani Meinhardt"
									width={48}
									height={48}
									className="rounded-xl object-cover"
								/>
								<div>
									<p className="text-white text-sm font-bold leading-tight">
										Giovani Meinhardt
									</p>
									<p className="text-gray-400 text-[11px]">Instrutor</p>
								</div>
							</div>
						</div>
					</div>
				</a>

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
