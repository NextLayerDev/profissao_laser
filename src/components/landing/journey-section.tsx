'use client';

import { Trophy } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const journeySteps = [
	'Iniciando no mercado da Gravacao a Laser',
	'Quais produtos eu posso comecar',
	'Escalando lucros dos meus com produtos personalizados',
	'Planilhas de controle financeiro',
	'Gestao da minha empresa',
	'Gestao financeira com planilhas de gerenciamento',
];

const milestones = [
	{ label: '10K', description: 'Faturamento de R$10.000 por mes' },
	{ label: '25K', description: 'Faturamento de R$25.000 por mes' },
	{ label: '80K', description: 'Faturamento de R$80.000 por mes' },
	{ label: '150K', description: 'Faturamento de R$150.000 por mes' },
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
				<div className="mb-20">
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
								className={`flex items-center gap-4 bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-xl px-6 py-4 transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
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

				{/* Conquistando Resultados */}
				<div>
					<p className="text-[#f2295b] uppercase tracking-widest text-sm font-bold mb-3">
						Resultados reais
					</p>
					<h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
						Conquistando Resultados
					</h2>
					<p className="text-gray-400 mb-8">
						Conquiste resultados e ganhe uma placa personalizada dos Mestres do
						Laser.
					</p>

					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{milestones.map((milestone, i) => (
							<div
								key={milestone.label}
								className={`bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 text-center hover:border-[#f2295b]/30 transition-all duration-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
								style={{
									transitionDelay: `${600 + i * 120}ms`,
								}}
							>
								<Trophy className="w-8 h-8 text-[#f2295b] mx-auto mb-3" />
								<p className="text-3xl font-black text-white mb-2">
									{milestone.label}
								</p>
								<p className="text-gray-400 text-sm">{milestone.description}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
