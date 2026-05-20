'use client';

import { ScrollReveal, StaggerReveal } from './scroll-reveal';

const journeySteps = [
	'Iniciando no Mercado de gravação a laser',
	'Quais produtos começar - fornecedores indicados',
	'Implantando o sistema de controle total',
	'Escalando lucros dos meus produtos',
	'Gestão completa da Empresa',
	'Implantando Omni resposta',
	'Implantando IA de prévias e vendas',
	'Fazendo Criativos e anúncios',
	'Montando o E-Commerce',
	'Gestão de Produção',
];

export function JourneySection() {
	return (
		<section className="bg-ink-900 py-20 md:py-28 px-6">
			<div className="max-w-5xl mx-auto">
				<ScrollReveal>
					<p className="text-violet-400 uppercase tracking-widest text-sm font-bold mb-3">
						Sua jornada
					</p>
					<div className="flex items-center gap-3 mb-8">
						<span className="text-violet-400 text-5xl font-black">10k</span>
						<div>
							<h2 className="text-2xl md:text-3xl font-bold text-white">
								Trilha do
							</h2>
							<h2 className="text-2xl md:text-3xl font-bold text-white">
								Empreendedor
							</h2>
						</div>
					</div>
				</ScrollReveal>

				<div className="space-y-3">
					{journeySteps.map((step, index) => (
						<StaggerReveal key={step} delay={index * 0.07}>
							<div className="flex items-center gap-4 bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-xl px-6 py-4">
								<div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
									<span className="text-violet-400 text-sm font-bold">
										{index + 1}
									</span>
								</div>
								<p className="text-white font-medium">{step}</p>
							</div>
						</StaggerReveal>
					))}
				</div>
			</div>
		</section>
	);
}
