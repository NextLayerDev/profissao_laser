'use client';

/**
 * Conferência visual da Jornada (Mentoria 360°) — linha do tempo e detalhe do
 * encontro.
 *
 * Renderiza `JornadaView` e `EncontroView` com fixtures, sem backend. Existe
 * porque o backend libera um encontro por vez: ver concluídos, em andamento e
 * bloqueados na mesma lista — ou um encontro já validado, com feedback do
 * mentor e tarefas sugeridas parcialmente adicionadas — é caro de reproduzir de
 * propósito numa jornada real.
 *
 * Página de desenvolvimento, descartável — mesmo padrão de
 * `app/(dev)/mentoria-indicadores-check`. Não está em `PUBLIC_PATHS` do
 * `AuthGuard`, então é preciso estar logado para abrir.
 */

import { useState } from 'react';
import { JornadaView } from '@/app/course/(shell)/mentoria/jornada/_components/jornada-view';
import { EncontroView } from '@/app/course/(shell)/mentoria/jornada/[meetingId]/_components/encontro-view';
import {
	meetingDetailFixture,
	meetingDiagnosticFixture,
	meetingDoneWithFeedbackFixture,
	meetingsAllDoneFixture,
	meetingsEmptyFixture,
	meetingsInProgressFixture,
	meetingTasksEmptyFixture,
	meetingTasksPartiallyAddedFixture,
	meetingWithTaskPromptsFixture,
} from '@/modules/mentoria/__fixtures__/jornada';

function Section({
	title,
	note,
	children,
}: {
	title: string;
	note: string;
	children: React.ReactNode;
}) {
	return (
		<section>
			<div className="mb-3 border-subtle border-b pb-2">
				<h3 className="text-section text-primary">{title}</h3>
				<p className="text-caption text-muted">{note}</p>
			</div>
			{children}
		</section>
	);
}

export default function JornadaCheckPage() {
	// Só para ver o efeito de `disabled`/"..." sem rede.
	const [pending, setPending] = useState(false);

	const log = (label: string) => (arg?: unknown) =>
		console.log(`[check] ${label}`, arg ?? '');

	return (
		<div className="p-4 md:p-8">
			<header className="mb-8 max-w-5xl mx-auto">
				<h1 className="text-page text-primary">Jornada — conferência</h1>
				<p className="mt-1 text-body text-secondary">
					Estados da linha do tempo e do detalhe do encontro com fixtures.
					Alterne o tema para caçar texto ilegível. Os cliques em "Concluir
					encontro" e "Adicionar" funcionam de verdade — só não chegam a nenhum
					backend. Os links dos cards levam para rotas reais, que sem jornada
					ativa caem no gate.
				</p>
				<div className="mt-3 flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => setPending((v) => !v)}
						aria-pressed={pending}
						className={`rounded-chip border px-3 py-1 text-caption transition ${
							pending
								? 'border-brand bg-brand-wash text-brand dark:text-violet-400'
								: 'border-subtle text-muted'
						}`}
					>
						{pending ? 'enviando (ligado)' : 'ocioso'}
					</button>
				</div>
			</header>

			<div className="space-y-14">
				<h2 className="text-title text-primary">Linha do tempo</h2>

				<Section
					title="1. Nenhum encontro"
					note="Estado vazio — turma ainda não configurada pela equipe."
				>
					<JornadaView meetings={meetingsEmptyFixture} />
				</Section>

				<Section
					title="2. Jornada em andamento"
					note="Os quatro status na mesma lista, mais encontro agendado, feedback do mentor e selo de validação."
				>
					<JornadaView meetings={meetingsInProgressFixture} />
				</Section>

				<Section
					title="3. Jornada concluída"
					note="Todos os encontros em 'done' — a linha do tempo inteira preenchida."
				>
					<JornadaView meetings={meetingsAllDoneFixture} />
				</Section>

				<h2 className="text-title text-primary">Detalhe do encontro</h2>

				<Section
					title="4. Encontro disponível"
					note="Objetivos, conteúdo e resultado esperado preenchidos; sem exercício nem tarefas sugeridas."
				>
					<EncontroView
						meeting={meetingDetailFixture}
						meetingTasks={meetingTasksEmptyFixture}
						canComplete
						completing={pending}
						onComplete={log('concluir encontro')}
						addingTask={pending}
						onAddTask={log('adicionar tarefa')}
					/>
				</Section>

				<Section
					title="5. Encontro 1 — CTA do diagnóstico"
					note="Tem exercício e está na posição 1, então mostra o atalho para o Raio-X em vez do texto genérico."
				>
					<EncontroView
						meeting={meetingDiagnosticFixture}
						meetingTasks={meetingTasksEmptyFixture}
						canComplete
						completing={pending}
						onComplete={log('concluir encontro')}
						addingTask={pending}
						onAddTask={log('adicionar tarefa')}
					/>
				</Section>

				<Section
					title="6. Tarefas sugeridas, parte já adicionada"
					note="Exercício com mentor: a primeira tarefa aparece como 'Adicionada', as outras duas com botão."
				>
					<EncontroView
						meeting={meetingWithTaskPromptsFixture}
						meetingTasks={meetingTasksPartiallyAddedFixture}
						canComplete
						completing={pending}
						onComplete={log('concluir encontro')}
						addingTask={pending}
						onAddTask={log('adicionar tarefa')}
					/>
				</Section>

				<Section
					title="7. Encontro concluído e validado"
					note="Com feedback do mentor e sem botão de concluir (canComplete falso)."
				>
					<EncontroView
						meeting={meetingDoneWithFeedbackFixture}
						meetingTasks={meetingTasksEmptyFixture}
						canComplete={false}
						completing={pending}
						onComplete={log('concluir encontro')}
						addingTask={pending}
						onAddTask={log('adicionar tarefa')}
					/>
				</Section>
			</div>
		</div>
	);
}
