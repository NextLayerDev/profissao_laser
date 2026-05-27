'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { ScrollReveal } from './scroll-reveal';

const FAQ_ITEMS = [
	{
		q: 'O que é a Comunidade Profissão Laser?',
		a: 'A Comunidade Profissão Laser é uma plataforma completa para profissionais do mercado laser aprenderem, evoluírem e se conectarem. Você terá acesso a aulas gravadas, suporte online, parâmetros, vetorização, fornecedores, lives, networking e ferramentas exclusivas focadas no universo laser.',
	},
	{
		q: 'A Comunidade Profissão Laser é apenas um curso?',
		a: 'Não. A comunidade vai muito além de um curso tradicional. Ela funciona como um verdadeiro ecossistema para profissionais do laser, reunindo:\n• treinamentos completos\n• suporte técnico\n• ferramentas exclusivas\n• networking\n• atualizações constantes\n• eventos ao vivo\n• comunidade ativa\nTudo em um único lugar.',
	},
	{
		q: 'Como funcionam as lives, workshops e encontros online?',
		a: 'Os encontros são realizados de forma online dentro da plataforma. Durante as lives e workshops você poderá:\n• aprender novas técnicas\n• acompanhar tendências do mercado\n• tirar dúvidas ao vivo\n• participar de análises e estudos práticos\n• interagir com outros membros\nOs eventos podem acontecer ao vivo ou ficar gravados dependendo do plano.',
	},
	{
		q: 'Quais softwares e máquinas fazem parte dos treinamentos?',
		a: 'Os treinamentos abrangem os principais softwares e equipamentos do mercado laser, incluindo:\nSoftwares: LightBurn e EZCAD.\nMáquinas: Fiber Laser, CO2, UV e Diodo.\nOs conteúdos vão do básico ao avançado.',
	},
	{
		q: 'Como funciona o suporte online?',
		a: 'O suporte online foi criado para ajudar você a evoluir com mais velocidade e segurança. Você poderá tirar dúvidas relacionadas a:\n• parâmetros\n• configuração\n• foco\n• velocidade\n• potência\n• materiais\n• vetorização\n• produção\n• setup das máquinas\nDependendo do plano, você também terá acesso ao grupo exclusivo e suporte prioritário.',
	},
	{
		q: 'Como funciona a renovação da assinatura?',
		a: 'A assinatura é renovada automaticamente conforme o plano escolhido (mensal ou anual). Você pode acompanhar, alterar ou cancelar sua assinatura dentro da sua conta.',
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
		a: 'Os pagamentos podem ser realizados por:\n• cartão de crédito\n• PIX\n• boleto bancário\nAs opções disponíveis podem variar conforme a plataforma de pagamento utilizada.',
	},
	{
		q: 'O valor anual é descontado de uma única vez no cartão?',
		a: 'Não necessariamente. Você poderá escolher pagamento à vista ou parcelamento em até 12x no cartão de crédito. O parcelamento consome apenas o valor correspondente das parcelas no limite do cartão, conforme as regras da operadora.',
	},
	{
		q: 'A Comunidade Profissão Laser vende máquinas laser?',
		a: 'Não. A Comunidade Profissão Laser não é uma loja de máquinas. Nosso foco é treinamento, suporte, networking e ferramentas para ajudar profissionais do mercado laser a evoluírem mais rápido. Porém, dentro da comunidade você terá acesso a:\n• fornecedores parceiros\n• oportunidades\n• recomendações\n• networking com empresas do setor',
	},
	{
		q: 'Sou iniciante. A comunidade é para mim?',
		a: 'Sim. A comunidade foi desenvolvida tanto para iniciantes quanto para profissionais mais avançados. Você encontrará conteúdos organizados para aprender desde os primeiros passos até técnicas mais avançadas do mercado.',
	},
	{
		q: 'Preciso já ter uma máquina laser?',
		a: 'Não. Mesmo quem ainda está pesquisando ou entrando no mercado pode aproveitar os conteúdos, networking e orientações da comunidade.',
	},
	{
		q: 'Posso acessar pelo celular?',
		a: 'Sim. A plataforma funciona tanto no computador quanto no smartphone, permitindo que você acompanhe os conteúdos de qualquer lugar.',
	},
	{
		q: 'Os conteúdos são atualizados?',
		a: 'Sim. A comunidade recebe constantemente:\n• novas aulas\n• atualizações\n• ferramentas\n• workshops\n• materiais\n• conteúdos exclusivos\nO mercado laser evolui rápido - e a comunidade evolui junto.',
	},
];

function FaqItem({
	item,
	open,
	onClick,
}: {
	item: (typeof FAQ_ITEMS)[number];
	open: boolean;
	onClick: () => void;
}) {
	return (
		<div
			className={`rounded-2xl border transition-all overflow-hidden ${
				open
					? 'bg-violet-500/[0.07] border-violet-500/40'
					: 'card-dark hover:border-violet-500/30'
			}`}
		>
			<button
				type="button"
				onClick={onClick}
				className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
			>
				<span className="font-display text-white font-bold text-sm leading-snug pr-4">
					{item.q}
				</span>
				<ChevronDown
					size={18}
					className={`text-slate-400 shrink-0 transition-transform duration-300 ${
						open ? 'rotate-180 text-violet-400' : ''
					}`}
				/>
			</button>
			<div
				className={`grid transition-all duration-300 ${
					open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
				}`}
			>
				<div className="overflow-hidden">
					<div className="px-5 pb-5 -mt-1">
						<div className="hairline-violet mb-4" />
						<p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
							{item.a}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export function FaqSection() {
	const [open, setOpen] = useState(0);
	const half = Math.ceil(FAQ_ITEMS.length / 2);
	const left = FAQ_ITEMS.slice(0, half);
	const right = FAQ_ITEMS.slice(half);

	return (
		<section id="faq" className="relative px-5 md:px-8 py-16 md:py-20">
			<div className="max-w-6xl mx-auto">
				<ScrollReveal className="text-center mb-10">
					<h2 className="font-display text-3xl md:text-[2.5rem] font-black text-white tracking-tight">
						Perguntas <span className="grad-brand">Frequentes</span>
					</h2>
				</ScrollReveal>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
					<div className="flex flex-col gap-3">
						{left.map((item, i) => (
							<FaqItem
								key={item.q}
								item={item}
								open={open === i}
								onClick={() => setOpen(open === i ? -1 : i)}
							/>
						))}
					</div>
					<div className="flex flex-col gap-3">
						{right.map((item, i) => {
							const idx = i + half;
							return (
								<FaqItem
									key={item.q}
									item={item}
									open={open === idx}
									onClick={() => setOpen(open === idx ? -1 : idx)}
								/>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
}
