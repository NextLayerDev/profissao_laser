'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
	{
		q: 'O que é a Comunidade Profissão Laser?',
		a: 'A Comunidade Profissão Laser é uma plataforma completa para profissionais do mercado laser aprenderem, evoluírem e se conectarem. Você terá acesso a aulas gravadas, suporte online, parâmetros, vetorização, fornecedores, lives, networking e ferramentas exclusivas focadas no universo laser.',
	},
	{
		q: 'A Comunidade Profissão Laser é apenas um curso?',
		a: 'Não. A comunidade vai muito além de um curso tradicional. Ela funciona como um verdadeiro ecossistema para profissionais do laser, reunindo treinamentos completos, suporte técnico, ferramentas exclusivas, networking, atualizações constantes, eventos ao vivo e comunidade ativa — tudo em um único lugar.',
	},
	{
		q: 'Como funcionam as lives, workshops e encontros online?',
		a: 'Os encontros são realizados de forma online dentro da plataforma. Durante as lives e workshops você poderá aprender novas técnicas, acompanhar tendências do mercado, tirar dúvidas ao vivo, participar de análises e estudos práticos e interagir com outros membros. Os eventos podem acontecer ao vivo ou ficar gravados dependendo do plano.',
	},
	{
		q: 'Quais softwares e máquinas fazem parte dos treinamentos?',
		a: 'Softwares: LightBurn e EZCAD. Máquinas: Fiber Laser, CO2, UV e Diodo. Os conteúdos vão do básico ao avançado.',
	},
	{
		q: 'Como funciona o suporte online?',
		a: 'O suporte foi criado para ajudar você a evoluir com mais velocidade e segurança. Você poderá tirar dúvidas relacionadas a parâmetros, configuração, foco, velocidade, potência, materiais, vetorização, produção e setup das máquinas. Dependendo do plano, você terá acesso também ao grupo exclusivo e suporte prioritário.',
	},
	{
		q: 'Como funciona a renovação da assinatura?',
		a: 'A assinatura é renovada automaticamente conforme o plano escolhido (mensal ou anual). Você pode acompanhar, alterar ou cancelar dentro da sua conta.',
	},
	{
		q: 'Posso cancelar minha assinatura quando quiser?',
		a: 'Sim. Você pode solicitar o cancelamento da renovação automática a qualquer momento. Seu acesso permanecerá ativo até o final do período contratado.',
	},
	{
		q: 'Como funciona a garantia?',
		a: 'Você possui garantia de satisfação conforme as regras informadas na página de compra. Caso a plataforma não faça sentido para você dentro do período de garantia, poderá solicitar o reembolso conforme os critérios estabelecidos.',
	},
	{
		q: 'Quais são as formas de pagamento?',
		a: 'Cartão de crédito, PIX e boleto bancário. As opções podem variar conforme a plataforma de pagamento utilizada.',
	},
	{
		q: 'O valor anual é descontado de uma única vez no cartão?',
		a: 'Não necessariamente. Você pode escolher pagamento à vista ou parcelamento em até 12x no cartão de crédito. O parcelamento consome apenas o valor das parcelas no limite do cartão.',
	},
	{
		q: 'A Comunidade Profissão Laser vende máquinas laser?',
		a: 'Não. Nosso foco é treinamento, suporte, networking e ferramentas. Porém, dentro da comunidade você terá acesso a fornecedores parceiros, oportunidades, recomendações e networking com empresas do setor.',
	},
	{
		q: 'Sou iniciante. A comunidade é para mim?',
		a: 'Sim. A comunidade foi desenvolvida tanto para iniciantes quanto para profissionais mais avançados. Você encontrará conteúdos organizados para aprender desde os primeiros passos até técnicas mais avançadas.',
	},
	{
		q: 'Preciso já ter uma máquina laser?',
		a: 'Não. Mesmo quem ainda está pesquisando ou entrando no mercado pode aproveitar os conteúdos, networking e orientações da comunidade.',
	},
	{
		q: 'Posso acessar pelo celular?',
		a: 'Sim. A plataforma funciona tanto no computador quanto no smartphone.',
	},
	{
		q: 'Os conteúdos são atualizados?',
		a: 'Sim. A comunidade recebe constantemente novas aulas, atualizações, ferramentas, workshops, materiais e conteúdos exclusivos. O mercado laser evolui rápido — e a comunidade evolui junto.',
	},
];

export function Faq() {
	const [open, setOpen] = useState<number | null>(null);
	return (
		<section id="perguntas" className="py-8 lg:py-12">
			<div className="max-w-6xl mx-auto px-5 lg:px-8">
				<div className="text-center mb-6">
					<span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
						Perguntas frequentes
					</span>
					<h2 className="mt-2 text-2xl lg:text-3xl font-bold">
						Ainda com <span className="text-gradient">dúvidas?</span>
					</h2>
				</div>
				<div className="grid gap-2 lg:grid-cols-2 lg:gap-x-4 lg:gap-y-2">
					{faqs.map((f, i) => {
						const isOpen = open === i;
						return (
							<div key={f.q} className="glass-card rounded-lg px-4 h-fit">
								<button
									type="button"
									aria-expanded={isOpen}
									onClick={() => setOpen(isOpen ? null : i)}
									className="w-full flex items-center justify-between gap-3 text-left text-sm font-semibold py-3"
								>
									{f.q}
									<ChevronDown
										aria-hidden="true"
										className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${
											isOpen ? 'rotate-180' : ''
										}`}
									/>
								</button>
								{isOpen && (
									<div className="pb-3 text-xs text-muted-foreground leading-relaxed">
										{f.a}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
