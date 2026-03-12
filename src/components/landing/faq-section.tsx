'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

const faqItems = [
	{
		question: 'Como funciona a Comunidade Profissao Laser?',
		answer:
			'A Comunidade e dedicada aos profissionais que trabalham no mercado de gravacao a laser com maquinas Fiber ou CO2 para personalizacao de produtos.',
	},
	{
		question: 'A Comunidade Profissao Laser e um curso?',
		answer:
			'Nao. No entanto, os membros da nossa Comunidade tem disponivel um curso gravado ensinando os primeiros passos ate passos mais avancados, alem das gravacoes de todas as nossa reunioes exclusivas. A Comunidade Profissao Laser, foca em prestar Suporte Especializado para os seus membros, alem de termos nosso Grupo Exclusivo no WhatsApp e no Facebook para compartilhamento de informacoes, fornecedores de produtos, e tudo o que for relevante para o nosso mercado.',
	},
	{
		question: 'Como sao as reunioes ao vivo?',
		answer:
			'Semanalmente temos um reuniao ao vivo somente para os membros da Comunidade. Nossa equipe envia o link de acesso de participacao em nossos grupos, e quem desejar entrar na reuniao ao vivo, para tirar duvidas com nossos instrutores, e interagindo com o conteudo programado. As vagas para a sala sao limitadas, e uma vez estando lotada, so sera possivel assistir ao vivo atraves do grupo fechado no Facebook. A gravacao das lives tambem ficaram disponiveis na area de membro na Hotmart.',
	},
	{
		question: 'Quais softwares sao usados?',
		answer:
			'Usamos os softwares mais usados no mercado. Corel Draw e Ezcad sao os principais, visto que a maior parte do mercado faz uso desses softwares. Tambem temos aulas sobre o LightBurn, e ensinamos o trabalho com vetores em varios softwares.',
	},
	{
		question: 'Como funciona o Suporte?',
		answer:
			'Nosso suporte atende todos os dias uteis de 8h as 16h30. Nosso atendimento e via WhatsApp, e realizamos o atendimento por chat, chamada de video e acesso remoto. A solicitacao de suporte e ILIMITADA. Atendemos desde configuracoes basicas da maquina ate mesmo arrumando vetores em caso de urgencias.',
	},
	{
		question: 'Quem pode participar do Sorteio de Maquinas?',
		answer:
			'Todos os membros assinantes do Plano Anual, com mais de 7 dias ativo na Comunidade estao participando automaticamente dos nossos sorteios internos. Se o membro sorteado estiver com plano inadimplente, nao podera concorrer aos sorteios.',
	},
	{
		question: 'Como funciona a renovacao?',
		answer:
			'Trabalhamos com 3 assinaturas: MENSAL, TRIMESTRAL e ANUAL. Ao final de cada ciclo, nao havendo solicitacao de cancelamento, a assinatura e renovada automaticamente.',
	},
	{
		question: 'Posso cancelar minha assinatura a qualquer momento?',
		answer:
			'Sim, sua assinatura pode ser cancelada a qualquer momento. No entanto, ao passar os 7 dias de garantia, nao e possivel solicitar o reembolso. O acesso aos nossos servicos continuarao ate o vencimento da sua assinatura vigente.',
	},
	{
		question: 'Como funciona a garantia?',
		answer:
			'Voce pode usar a Comunidade Profissao Laser por ate 7 dias e solicitar o reembolso caso nao deseje ser membro da Comunidade. A solicitacao de reembolso durante a garantia deve ser feita no seu painel da Hotmart.',
	},
	{
		question: 'Como e feito pagamento?',
		answer:
			'A assinatura da Comunidade Profissao Laser e realizada atraves da Hotmart que disponibiliza o pagamento por PIX, Cartao ou Boleto.',
	},
	{
		question:
			'Sera descontado o valor total da assinatura de uma vez no meu limite de cartao?',
		answer:
			'Sim. O valor total das assinaturas (TRIMESTRAL e ANUAL) sao descontadas de uma unica vez do limite do cartao, ja o pagamento pode ser parcelado em ate 12x.',
	},
	{
		question: 'A Comunidade Profissao Laser vende maquinas?',
		answer:
			'NOS NAO VENDEMOS MAQUINAS. Nos buscamos ensinar nossos membros as diferencas entre cada maquina disponivel no mercado, e qual a aplicacao que cada uma delas pode ter.',
	},
	{
		question:
			'A Comunidade Profissao Laser possui algum vinculo de venda de maquinas com alguma empresa?',
		answer:
			'A Comunidade Profissao Laser e focada em prestar suporte aos profissionais do mercado de gravacao a laser, por esse motivo temos parcerias de prestacao de Suporte. Quando a pessoa compra um equipamento com nossos parceiros, ela ganha 30 dias de acesso gratuito a todos os nossos servicos, incluindo o Suporte Especializado. No entanto, nao somos comissionados por nenhuma venda de equipamento.',
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
					Duvidas frequentes
				</p>
				<h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
					FAQ
				</h2>
				<p className="text-gray-400 text-center mb-10">
					Esta com alguma duvida?
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
