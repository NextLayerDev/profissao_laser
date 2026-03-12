'use client';

import { Play } from 'lucide-react';
import Image from 'next/image';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

export function CoursesVideoSection() {
	const { ref, isVisible } = useScrollReveal();

	return (
		<section
			id="video-compra"
			className="bg-[#0d0d0f] pt-20 md:pt-28 pb-8 px-6 scroll-mt-20"
		>
			<div
				ref={ref}
				className={`max-w-4xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
			>
				<div className="text-center mb-10">
					<p className="text-[#f2295b] uppercase tracking-widest text-sm font-bold mb-3">
						Veja como funciona
					</p>
					<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
						Veja como nossos cursos podem{' '}
						<span className="bg-gradient-to-r from-[#f2295b] to-violet-500 bg-clip-text text-transparent font-extrabold">
							acelerar seus resultados
						</span>
					</h2>
					<p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
						Assista ao video e descubra como centenas de profissionais estao
						faturando mais com gravacao a laser usando nossos metodos
						exclusivos.
					</p>
				</div>

				{/* Video - opens YouTube */}
				<a
					href="https://www.youtube.com/PLACEHOLDER_VIDEO_ID"
					target="_blank"
					rel="noopener noreferrer"
					className="relative block aspect-video rounded-3xl overflow-hidden border border-white/10 group cursor-pointer shadow-2xl shadow-violet-900/20"
				>
					<Image
						src="/img/thumbnail-youtube-min.png"
						alt="Video sobre os cursos"
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-700"
					/>
					<div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />

					{/* Play button */}
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
						<div className="relative">
							<div className="absolute inset-0 rounded-full bg-[#f2295b]/20 animate-ping" />
							<div className="relative w-20 h-20 rounded-full bg-[#f2295b]/90 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-[#f2295b]/30 group-hover:bg-[#f2295b] group-hover:scale-110 transition-all duration-300">
								<Play className="w-8 h-8 text-white ml-1" />
							</div>
						</div>
					</div>

					{/* Instructors overlay */}
					<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
						<div className="flex items-center gap-6">
							<div className="flex items-center gap-3">
								<Image
									src="/img/fernando-nucci_lw-min.jpg"
									alt="Fernando Nucci"
									width={44}
									height={44}
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
									width={44}
									height={44}
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
			</div>
		</section>
	);
}
