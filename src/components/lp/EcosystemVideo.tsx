'use client';

import { Play } from 'lucide-react';
import { motion } from 'motion/react';

export function EcosystemVideo() {
	return (
		<section id="video" className="py-6 lg:py-10">
			<div className="max-w-7xl mx-auto px-5 lg:px-8">
				<div
					className="relative rounded-3xl px-6 lg:px-10 pt-5 lg:pt-6 pb-0 border border-primary/20 overflow-visible"
					style={{
						background:
							'radial-gradient(ellipse 80% 70% at 30% 50%, #6B29A7 0%, #2a0d4a 35%, #120526 65%, #090317 100%)',
					}}
				>
					{/* laser light rays from center-left */}
					<div
						aria-hidden
						className="absolute inset-0 pointer-events-none opacity-70"
						style={{
							background:
								'conic-gradient(from 220deg at 38% 55%, transparent 0deg, rgba(188,63,243,0.18) 18deg, transparent 36deg, transparent 60deg, rgba(188,63,243,0.12) 78deg, transparent 96deg)',
							mixBlendMode: 'screen',
						}}
					/>
					<div
						aria-hidden
						className="absolute pointer-events-none"
						style={{
							left: '32%',
							top: '50%',
							width: 520,
							height: 520,
							transform: 'translate(-50%,-50%)',
							background:
								'radial-gradient(circle, rgba(188,63,243,0.55) 0%, rgba(107,41,167,0.25) 40%, transparent 70%)',
							filter: 'blur(40px)',
						}}
					/>
					<div className="relative grid lg:grid-cols-12 gap-0 lg:gap-6 items-end">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.7 }}
							className="lg:col-span-5 flex flex-col pb-6 relative z-20"
						>
							<span className="inline-flex items-center gap-2 self-start text-[11px] font-semibold uppercase tracking-[0.22em] text-white mb-3 rounded-full px-3 py-1 bg-primary/25 border border-primary/40">
								<Play className="w-3 h-3 fill-primary text-primary" /> Aperte o
								play
							</span>
							<h2 className="text-2xl lg:text-3xl font-bold leading-tight">
								Mais que uma comunidade.
								<br />
								Um <span className="text-gradient">ecossistema</span> completo
								para você <span className="text-gradient">evoluir.</span>
							</h2>
							<p className="mt-3 text-sm text-muted-foreground max-w-md">
								Conteúdo prático, networking, suporte e oportunidades reais para
								transformar sua carreira no mercado laser.
							</p>
							<div className="mt-4 relative w-full rounded-2xl bg-card border border-primary/30 overflow-hidden shadow-glow aspect-video">
								<iframe
									src="https://www.youtube.com/embed/EHI-vDIjUk4?rel=0"
									title="Comunidade Profissão Laser"
									className="absolute inset-0 w-full h-full"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
									allowFullScreen
								/>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.7 }}
							className="lg:col-span-4 flex items-end justify-center self-end -mt-8 lg:-mt-16 order-2 lg:order-none w-full"
						>
							<img
								src="/lp/fernando.png"
								alt="Fernando Nucci, especialista em laser"
								className="w-[140%] max-w-none h-auto lg:w-auto lg:h-[600px] object-contain object-bottom relative z-0 mb-0 lg:mb-0 lg:-mt-28"
							/>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, x: 20 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.7 }}
							className="lg:col-span-3 flex flex-col justify-center pb-4 lg:pb-6 relative z-20 order-3 lg:order-none -mt-24 lg:mt-0"
						>
							<span className="text-primary font-display text-5xl lg:text-6xl leading-none mb-0 lg:mb-1">
								“
							</span>
							<p className="font-display text-base lg:text-xl leading-snug">
								O mercado não está ficando mais{' '}
								<em className="not-italic text-gradient">difícil</em>, ele está
								ficando mais <span className="text-gradient">profissional</span>
								.
							</p>
							<p className="mt-2 lg:mt-3 text-xs">
								<span className="text-gradient font-semibold">
									Fernando Nucci
								</span>
								<br />
								<span className="text-white/80">Especialista em Laser</span>
							</p>
						</motion.div>
					</div>
				</div>
			</div>
		</section>
	);
}
