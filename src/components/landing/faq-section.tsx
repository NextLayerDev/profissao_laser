'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { ScrollReveal } from './scroll-reveal';

const FAQ_ITEMS = [
	{
		q: 'Como funciona o acesso à comunidade?',
		a: 'Assim que a assinatura é confirmada, você recebe acesso imediato à área de membros, ao grupo (Plus em diante) e a todas as ferramentas inclusas no seu plano. Tudo pelo computador ou celular.',
	},
	{
		q: 'Posso acessar pelo celular?',
		a: 'Sim. A plataforma é 100% responsiva e roda no Chrome, Safari, Edge ou no app via navegador. Você acompanha as aulas, baixa vetores e usa o chat de onde estiver.',
	},
	{
		q: 'Posso cancelar quando quiser?',
		a: 'Pode. O cancelamento é feito em poucos cliques no seu painel. Você continua com o acesso até o fim do ciclo já pago — sem multa, sem letras miúdas.',
	},
	{
		q: 'Como funciona o suporte?',
		a: 'O suporte técnico atende de segunda a sexta, com acesso remoto ao seu equipamento quando necessário, via WhatsApp e chat na comunidade. Solicitações ILIMITADAS dentro do horário de atendimento.',
	},
	{
		q: 'Os conteúdos são atualizados?',
		a: 'Sim. Adicionamos novas aulas, vetores e parâmetros frequentemente, acompanhando lançamentos de máquinas (Fiber, UV, CO₂ e Diodo) e atualizações dos softwares (Ezcad e Lightburn).',
	},
	{
		q: 'Quais as formas de pagamento?',
		a: 'PIX, boleto e cartão de crédito (até 12x sem juros no anual). Todo o pagamento é processado em ambiente seguro.',
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
				<span className="font-display text-white font-bold text-sm pr-4">
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
						<p className="text-slate-400 text-sm leading-relaxed">{item.a}</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export function FaqSection() {
	const [open, setOpen] = useState(0);
	const left = FAQ_ITEMS.slice(0, 3);
	const right = FAQ_ITEMS.slice(3);

	return (
		<section id="faq" className="relative px-5 md:px-8 py-16 md:py-20">
			<div className="max-w-6xl mx-auto">
				<ScrollReveal className="text-center mb-10">
					<h2 className="font-display text-3xl md:text-[2.5rem] font-black text-white tracking-tight">
						Dúvidas <span className="grad-brand">frequentes</span>
					</h2>
				</ScrollReveal>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
							const idx = i + 3;
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
