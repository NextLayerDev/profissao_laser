'use client';

import { Check } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const features = [
	'Comunidade em Grupo Fechado',
	'Curso do Basico ao Avancado',
	'Suporte Especializado',
	'Lives Semanais Exclusivas',
	'Biblioteca de Vetores',
	'Lista de Fornecedores',
	'Sorteio da CO2 6040',
];

const plans = [
	{ name: 'Anual', price: '127', period: 'POR MES', popular: false },
	{ name: 'Trimestral', price: '197', period: 'POR MES', popular: true },
	{ name: 'Mensal', price: '327', period: 'POR MES', popular: false },
];

export function PricingSection() {
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
				className={`max-w-5xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
			>
				<p className="text-[#f2295b] uppercase tracking-widest text-sm font-bold text-center mb-3">
					Planos
				</p>
				<h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
					Escolha a melhor opcao e faca parte da
					<br />
					<span className="text-[#f2295b]">Comunidade Profissao Laser</span>
				</h2>

				<p className="text-gray-400 text-center text-lg mb-12 max-w-3xl mx-auto">
					A Comunidade e o investimento em uma ferramenta que vai te auxiliar a
					investir em conhecimento no mercado de produtos personalizados com
					gravacao a laser.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{plans.map((plan, i) => (
						<div
							key={plan.name}
							className={`relative bg-white/[0.04] backdrop-blur-sm rounded-3xl overflow-hidden border transition-all duration-500 ${
								plan.popular
									? 'border-[#f2295b]/50 shadow-2xl shadow-[#f2295b]/10 scale-[1.02]'
									: 'border-white/[0.08] hover:border-white/[0.15]'
							} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
							style={{ transitionDelay: `${200 + i * 150}ms` }}
						>
							{plan.popular && (
								<div className="absolute top-0 right-0 bg-[#f2295b] text-white text-xs font-bold uppercase px-4 py-1.5 rounded-bl-2xl">
									Popular
								</div>
							)}

							<div className="p-8">
								<h3 className="text-white text-xl font-bold mb-4">
									{plan.name}
								</h3>

								<div className="mb-6">
									<div className="flex items-baseline gap-1">
										<span className="text-gray-400 text-sm">R$</span>
										<span className="text-white text-5xl font-black">
											{plan.price}
										</span>
									</div>
									<p className="text-gray-500 text-sm">{plan.period}</p>
								</div>

								<ul className="space-y-3 mb-8">
									{features.map((feature) => (
										<li
											key={feature}
											className="flex items-center gap-3 text-gray-300 text-sm"
										>
											<div className="w-5 h-5 rounded-full bg-[#f2295b]/15 flex items-center justify-center flex-shrink-0">
												<Check className="w-3 h-3 text-[#f2295b]" />
											</div>
											{feature}
										</li>
									))}
								</ul>

								<button
									type="button"
									onClick={scrollToVideo}
									className={`block w-full text-center font-bold uppercase tracking-wide py-4 rounded-xl transition-all duration-300 cursor-pointer ${
										plan.popular
											? 'bg-[#f2295b] hover:bg-[#e0214f] text-white shadow-lg shadow-[#f2295b]/20'
											: 'bg-white/[0.07] hover:bg-white/[0.12] text-white'
									}`}
								>
									Quero este plano
								</button>
							</div>
						</div>
					))}
				</div>

				{/* Trust badges */}
				<div className="flex items-center justify-center gap-6 mt-10">
					<div className="flex items-center gap-2 text-gray-500 text-sm">
						<div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
							<Check className="w-3 h-3 text-emerald-400" />
						</div>
						Compra segura
					</div>
					<div className="text-gray-500 text-sm">Hotmart</div>
					<div className="text-gray-500 text-sm">Garantia de 7 dias</div>
				</div>
			</div>
		</section>
	);
}
