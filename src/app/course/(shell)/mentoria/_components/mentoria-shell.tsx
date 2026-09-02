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

import type { ReactNode } from 'react';
import { useState } from 'react';
import { AssistantPanel } from '@/modules/mentoria/components/assistant/assistant-panel';
import { MentoriaNavCard } from './mentoria-nav-card';

export function MentoriaShell({ children }: { children: ReactNode }) {
	const [assistantOpen, setAssistantOpen] = useState(false);

	return (
		<div
			className={`grid grid-cols-1 gap-6 ${
				assistantOpen
					? // Entre lg e xl não cabem três colunas, então o painel desce e
						// ocupa a linha inteira (`lg:col-span-2` no próprio painel).
						'lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_360px]'
					: 'lg:grid-cols-[260px_minmax(0,1fr)]'
			}`}
		>
			{/* Wrapper estica com a linha; o <nav> lá dentro é que é `sticky`. */}
			<div>
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
