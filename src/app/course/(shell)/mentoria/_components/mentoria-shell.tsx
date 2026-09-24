'use client';

// Grade da área da Mentoria 360°: navegação à esquerda, conteúdo no meio e o
// Assistente como TERCEIRA COLUNA à direita.
//
// O Assistente não é modal nem drawer sobreposto — ele vive no mesmo nível da
// página, empurrando o conteúdo em vez de cobri-lo. Por isso o estado de
// aberto/fechado mora aqui: o gatilho está no card de navegação (coluna 1) e o
// painel na coluna 3, e os dois precisam do mesmo booleano.
//
// Navegação e Assistente ficam presos na tela enquanto o meio rola. Duas coisas
// que isso exige, e que são fáceis de desfazer sem querer:
//
//   1. NADA de `items-start` aqui. Com ele a célula encolhe até a altura do
//      conteúdo, e um `sticky` sem célula alta não tem por onde correr — fica
//      parado. As colunas precisam esticar (`stretch`, o padrão).
//   2. Quem gruda é o card DENTRO da célula, não a célula. Por isso cada coluna
//      lateral é um wrapper que estica com um card `sticky` embaixo.
//
// O `layout.tsx` continua sendo server component; só a grade é client.
//
// ── Por que a terceira faixa existe sempre ───────────────────────────────────
//
// `grid-template-columns` só interpola entre listas com o MESMO número de
// faixas. Alternar entre duas e três colunas troca de estalo: o conteúdo pula
// de largura enquanto o painel ainda desliza, e no fechamento a página abre de
// volta antes de o card sair. Então no `xl` a terceira faixa está sempre lá — o
// que muda é a largura, de `0px` a 384px, na mesma curva e no mesmo tempo do
// card (ver assistant/motion.ts).
//
// O 384 é 360 de card + 24 de respiro: o gutter vai DENTRO da faixa (`gap-x-0`
// + `pl-6` na célula) em vez de sair do `gap` da grade. Com `gap` normal, uma
// faixa de `0px` ainda deixaria 24px de vão morto na direita com o painel
// fechado. Mesmo motivo do 284 na primeira faixa: 260 de card + 24 que o
// `pr-6` devolve como respiro.

import { useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { AssistantPanel } from '@/modules/mentoria/components/assistant/assistant-panel';
import {
	ASSISTANT_DURATION,
	ASSISTANT_EASE,
	assistantTrack,
} from '@/modules/mentoria/components/assistant/motion';
import { MentoriaNavCard } from './mentoria-nav-card';

export function MentoriaShell({ children }: { children: ReactNode }) {
	const [assistantOpen, setAssistantOpen] = useState(false);
	const reduceMotion = useReducedMotion();

	return (
		<div
			className={
				// Abaixo do `xl` valem as duas colunas de sempre, com `gap-6` normal —
				// lá o painel não é coluna, e sim uma linha própria (`lg:col-span-2` no
				// painel), porque entre `lg` e `xl` não cabem três.
				'grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)] ' +
				'xl:grid-cols-[284px_minmax(0,1fr)_var(--assistant-track)] xl:gap-x-0'
			}
			// `as CSSProperties`: o tipo do React não conhece custom properties.
			style={
				{
					'--assistant-track': assistantTrack(assistantOpen),
					// Inline e não classe utilitária porque a curva tem de ser exatamente
					// a mesma do card. Abaixo do `xl` a transição existe mas não tem o
					// que animar: o template daquele breakpoint não depende do estado.
					transition: reduceMotion
						? undefined
						: `grid-template-columns ${ASSISTANT_DURATION}s cubic-bezier(${ASSISTANT_EASE.join(',')})`,
				} as React.CSSProperties
			}
		>
			{/* Wrapper estica com a linha; o <nav> lá dentro é que é `sticky`. */}
			<div className="xl:pr-6">
				<MentoriaNavCard
					assistantOpen={assistantOpen}
					onToggleAssistant={() => setAssistantOpen((v) => !v)}
				/>
			</div>

			{/* `minmax(0,1fr)` na coluna e `min-w-0` aqui: sem os dois, uma tabela ou
			    um gráfico largo estica a coluna e força scroll horizontal na página
			    inteira em vez de rolar dentro do próprio container. */}
			<div className="min-w-0">{children}</div>

			<AssistantPanel
				open={assistantOpen}
				onClose={() => setAssistantOpen(false)}
			/>
		</div>
	);
}
