'use client';

import {
	Check,
	Download,
	Maximize,
	Play,
	Sparkles,
	Volume2,
} from 'lucide-react';
import Image from 'next/image';
import { ScrollReveal } from './scroll-reveal';

function VideoPlayerPlaceholder() {
	return (
		<div className="relative aspect-video rounded-2xl overflow-hidden card-dark">
			<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent z-10" />
			<div
				className="absolute inset-0"
				style={{
					background:
						'linear-gradient(135deg, #1a0a2e 0%, #0d0d0f 50%, #12121a 100%)',
				}}
			/>
			<div className="absolute inset-0 bg-grid opacity-[0.07]" />
			<div className="absolute top-5 left-5 flex items-center gap-2 text-white/90 z-10">
				<Sparkles size={14} className="text-violet-400" />
				<span className="font-display text-[11px] font-bold uppercase tracking-widest">
					Comunidade · Profissão Laser
				</span>
			</div>

			{/* Speaker silhouette */}
			<div className="absolute bottom-0 right-0 w-[55%] h-[78%]">
				<svg
					aria-hidden="true"
					viewBox="0 0 320 320"
					className="w-full h-full opacity-90"
				>
					<defs>
						<radialGradient id="speakerBg" cx="0.5" cy="0.4" r="0.6">
							<stop offset="0" stopColor="#7c3aed" stopOpacity="0.4" />
							<stop offset="1" stopColor="#000" stopOpacity="0" />
						</radialGradient>
					</defs>
					<rect x="0" y="0" width="320" height="320" fill="url(#speakerBg)" />
					<ellipse cx="170" cy="120" rx="38" ry="44" fill="#1a1535" />
					<path
						d="M70 320 C 80 230, 130 200, 170 200 C 210 200, 260 230, 270 320 Z"
						fill="#0f0a28"
					/>
					<path
						d="M155 205 L185 205 L175 240 L165 240 Z"
						fill="#7c3aed"
						opacity="0.8"
					/>
				</svg>
			</div>

			{/* Play button */}
			<button
				type="button"
				className="absolute inset-0 grid place-items-center group"
			>
				<div className="btn-accent w-20 h-20 rounded-full grid place-items-center shadow-brand-lg group-hover:scale-105 transition-transform">
					<Play size={28} className="text-white translate-x-0.5" />
				</div>
			</button>

			{/* Progress bar */}
			<div className="absolute bottom-0 left-0 right-0 px-3 pb-2 flex items-center gap-3 text-white/80 text-[11px]">
				<Play size={12} />
				<Volume2 size={13} />
				<span className="font-mono">1:32 / 2:45</span>
				<div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
					<div className="h-full w-1/3 bg-violet-400" />
				</div>
				<Download size={13} />
				<Maximize size={13} />
			</div>
		</div>
	);
}

export function VideoSection() {
	const bullets = [
		'Aprendizado contínuo',
		'Networking qualificado',
		'Suporte de verdade',
		'Oportunidades reais',
	];

	return (
		<section id="video" className="relative px-5 md:px-8 py-14 md:py-20">
			<div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_0.9fr_0.5fr] gap-10 items-center">
				<ScrollReveal>
					<VideoPlayerPlaceholder />
				</ScrollReveal>

				<ScrollReveal delay={0.15}>
					<h2 className="font-display text-3xl md:text-[2.25rem] font-black text-white leading-[1.15] tracking-tight">
						Mais que uma comunidade. Um ecossistema completo para você{' '}
						<span className="grad-brand">evoluir.</span>
					</h2>

					<p className="text-slate-400 mt-4 text-[15px] leading-relaxed max-w-xl">
						Conteúdo prático, networking, suporte e oportunidades reais para
						transformar sua carreira no mercado laser.
					</p>

					<ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
						{bullets.map((b) => (
							<li key={b} className="flex items-center gap-3 text-slate-200">
								<div className="w-6 h-6 rounded-full bg-violet-500/15 border border-violet-500/30 grid place-items-center shrink-0">
									<Check size={14} className="text-violet-400" />
								</div>
								<span className="text-[15px]">{b}</span>
							</li>
						))}
					</ul>
				</ScrollReveal>

				<ScrollReveal
					delay={0.25}
					className="relative hidden lg:block h-[360px]"
				>
					<div className="absolute inset-0 grid place-items-center">
						<div className="w-[78%] h-[62%] rounded-full bg-violet-600/35 blur-[60px]" />
					</div>
					<Image
						src="/img/profissional-hero.png"
						alt="Fernando Nucci — Especialista em Laser"
						fill
						sizes="260px"
						className="relative z-10 object-contain object-bottom drop-shadow-[0_10px_30px_rgba(139,92,246,0.45)]"
					/>
				</ScrollReveal>
			</div>
		</section>
	);
}
