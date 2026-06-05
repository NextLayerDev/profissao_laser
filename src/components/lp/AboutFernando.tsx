'use client';

import { motion } from 'motion/react';

export function AboutFernando() {
	return (
		<section id="sobre-fernando" className="py-10 lg:py-16">
			<div className="max-w-2xl lg:max-w-5xl mx-auto px-5 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="glass-card rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center lg:gap-10 text-center lg:text-left"
				>
					<div className="flex flex-col items-center lg:items-start lg:shrink-0">
						<div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-primary shadow-glow ring-2 ring-primary/40 overflow-hidden">
							<img
								src="/lp/fernando-profile.png"
								alt="Fernando Nucci"
								className="absolute inset-0 w-full h-full object-cover object-center"
							/>
						</div>
						<h3 className="mt-5 text-xl font-bold">Fernando Nucci</h3>
					</div>
					<p className="mt-5 lg:mt-0 text-sm text-muted-foreground leading-relaxed lg:self-center">
						Sou Fernando Nucci e trabalho no mercado de máquinas de gravação a
						laser a mais de 10 anos. Atualmente sou sócio de 5 empresas que
						faturam mais de 10 milhões de reais por ano. No mercado do laser, já
						vendi mais de 3 milhões de reais em 2023. Acompanho de perto a
						dificuldade dos profissionais do mercado de gravação a laser, e
						quero mostrar como é possível vencer neste mercado que ainda está
						apenas começando!
					</p>
				</motion.div>
			</div>
		</section>
	);
}
