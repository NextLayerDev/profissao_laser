'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const faqItems = [
	{
		question: 'Como funciona a Comunidade Profissão Laser?',
		answer:
			'A Comunidade é dedicada aos profissionais que trabalham no mercado de gravação a laser com máquinas Fiber ou CO2 para personalização de produtos.',
	},
	{
		question: 'A Comunidade Profissão Laser é um curso?',
		answer:
			'Não. No entanto, os membros da nossa Comunidade tem disponível um curso gravado ensinando os primeiros passos até passos mais avançados, além das gravações de todas as nossas reuniões exclusivas. A Comunidade Profissão Laser, foca em prestar Suporte Especializado para os seus membros, além de termos nosso Grupo Exclusivo no WhatsApp e no Facebook para compartilhamento de informações, fornecedores de produtos, e tudo o que for relevante para o nosso mercado.',
	},
	{
		question: 'Como são as reuniões ao vivo?',
		answer:
			'Semanalmente temos uma reunião ao vivo somente para os membros da Comunidade. Nossa equipe envia o link de acesso de participação em nossos grupos, e quem desejar entrar na reunião ao vivo, para tirar dúvidas com nossos instrutores, e interagindo com o conteúdo programado. As vagas para a sala são limitadas, e uma vez estando lotada, só será possível assistir ao vivo através do grupo fechado no Facebook. A gravação das lives também ficarão disponíveis na área de membro na Hotmart.',
	},
	{
		question: 'Quais softwares são usados?',
		answer:
			'Usamos os softwares mais usados no mercado. Corel Draw e Ezcad são os principais, visto que a maior parte do mercado faz uso desses softwares. Também temos aulas sobre o LightBurn, e ensinamos o trabalho com vetores em vários softwares.',
	},
	{
		question: 'Como funciona o Suporte?',
		answer:
			'Nosso suporte atende todos os dias úteis de 8h às 16h30. Nosso atendimento é via WhatsApp, e realizamos o atendimento por chat, chamada de vídeo e acesso remoto. A solicitação de suporte é ILIMITADA. Atendemos desde configurações básicas da máquina até mesmo arrumando vetores em caso de urgências.',
	},
	{
		question: 'Como funciona a renovação?',
		answer:
			'Trabalhamos com 3 assinaturas: MENSAL, TRIMESTRAL e ANUAL. Ao final de cada ciclo, não havendo solicitação de cancelamento, a assinatura é renovada automaticamente.',
	},
	{
		question: 'Posso cancelar minha assinatura a qualquer momento?',
		answer:
			'Sim, sua assinatura pode ser cancelada a qualquer momento. No entanto, ao passar os 7 dias de garantia, não é possível solicitar o reembolso. O acesso aos nossos serviços continuarão até o vencimento da sua assinatura vigente.',
	},
	{
		question: 'Como funciona a garantia?',
		answer:
			'Você pode usar a Comunidade Profissão Laser por até 7 dias e solicitar o reembolso caso não deseje ser membro da Comunidade. A solicitação de reembolso durante a garantia deve ser feita no seu painel da Hotmart.',
	},
	{
		question: 'Como é feito pagamento?',
		answer:
			'A assinatura da Comunidade Profissão Laser é realizada através da Hotmart que disponibiliza o pagamento por PIX, Cartão ou Boleto.',
	},
	{
		question:
			'Será descontado o valor total da assinatura de uma vez no meu limite de cartão?',
		answer:
			'Sim. O valor total das assinaturas (TRIMESTRAL e ANUAL) são descontadas de uma única vez do limite do cartão, já o pagamento pode ser parcelado em até 12x.',
	},
	{
		question: 'A Comunidade Profissão Laser vende máquinas?',
		answer:
			'NÓS NÃO VENDEMOS MÁQUINAS. Nós buscamos ensinar nossos membros as diferenças entre cada máquina disponível no mercado, e qual a aplicação que cada uma delas pode ter.',
	},
	{
		question:
			'A Comunidade Profissão Laser possui algum vínculo de venda de máquinas com alguma empresa?',
		answer:
			'A Comunidade Profissão Laser é focada em prestar suporte aos profissionais do mercado de gravação a laser, por esse motivo temos parcerias de prestação de Suporte. Quando a pessoa compra um equipamento com nossos parceiros, ela ganha 30 dias de acesso gratuito a todos os nossos serviços, incluindo o Suporte Especializado. No entanto, não somos comissionados por nenhuma venda de equipamento.',
	},
];

export function FaqSection() {
	const [openIndex, setOpenIndex] = useState<number | null>(null);
	const { ref, isVisible } = useScrollReveal();

	return (
		<section className="bg-[#0d0d0f] py-20 md:py-28 px-6">
			<div
				ref={ref}
				className={`max-w-3xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
			>
				<p className="text-[#f2295b] uppercase tracking-widest text-sm font-bold text-center mb-3">
					Dúvidas frequentes
				</p>
				<h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
					FAQ
				</h2>
				<p className="text-gray-400 text-center mb-10">
					Está com alguma dúvida?
				</p>

				<div className="space-y-3">
					{faqItems.map((item, index) => (
						<div
							key={item.question}
							className={`bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'border-[#f2295b]/20' : 'hover:border-white/[0.12]'}`}
						>
							<button
								type="button"
								onClick={() => setOpenIndex(openIndex === index ? null : index)}
								className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer"
							>
								<span className="text-white font-medium text-sm pr-4">
									{item.question}
								</span>
								<ChevronDown
									className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
										openIndex === index ? 'rotate-180 text-[#f2295b]' : ''
									}`}
								/>
							</button>
							<div
								className={`grid transition-all duration-300 ${openIndex === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
							>
								<div className="overflow-hidden">
									<div className="px-6 pb-4 border-t border-white/5">
										<p className="text-gray-400 text-sm leading-relaxed pt-4">
											{item.answer}
										</p>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
