'use client';

import { useScrollReveal } from '@/hooks/use-scroll-reveal';

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
	const { ref, isVisible } = useScrollReveal();

	return (
		<section className="bg-[#0d0d0f] py-20 md:py-28 px-6">
			<div
				ref={ref}
				className={`max-w-5xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
			>
				{/* Trilha do Empreendedor */}
				<div>
					<p className="text-[#f2295b] uppercase tracking-widest text-sm font-bold mb-3">
						Sua jornada
					</p>
					<div className="flex items-center gap-3 mb-8">
						<span className="text-[#f2295b] text-5xl font-black">10k</span>
						<div>
							<h2 className="text-2xl md:text-3xl font-bold text-white">
								Trilha do
							</h2>
							<h2 className="text-2xl md:text-3xl font-bold text-white">
								Empreendedor
							</h2>
						</div>
					</div>

					<div className="space-y-3">
						{journeySteps.map((step, index) => (
							<div
								key={step}
								className={`flex items-center gap-4 bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-xl px-4 sm:px-6 py-3.5 sm:py-4 transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
								style={{
									transitionDelay: `${200 + index * 100}ms`,
								}}
							>
								<div className="w-8 h-8 rounded-full bg-[#f2295b]/20 flex items-center justify-center flex-shrink-0">
									<span className="text-[#f2295b] text-sm font-bold">
										{index + 1}
									</span>
								</div>
								<p className="text-white font-medium">{step}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
