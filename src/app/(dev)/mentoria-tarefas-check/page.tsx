'use client';

/**
 * Conferência visual de "Minhas tarefas" (Mentoria 360°).
 *
 * Renderiza `TarefasView` com fixtures, sem backend. Existe pelo mesmo motivo
 * de `mentoria-jornada-check`: ver os cinco status, a validação do mentor e os
 * dois tipos de evidência (arquivo/link com `url`, nota de texto sem `url`) ao
 * mesmo tempo é caro de reproduzir de propósito numa jornada real.
 *
 * Página de desenvolvimento, descartável — mesmo padrão de
 * `app/(dev)/mentoria-jornada-check`. Não está em `PUBLIC_PATHS` do
 * `AuthGuard`, então é preciso estar logado para abrir.
 */

import { useState } from 'react';
import { TarefasView } from '@/app/course/(shell)/mentoria/tarefas/_components/tarefas-view';
import {
	tasksEmptyFixture,
	tasksMixedFixture,
} from '@/modules/mentoria/__fixtures__/tarefas';

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

export default function TarefasCheckPage() {
	// Só para ver o efeito de `disabled`/"..." sem rede.
	const [pending, setPending] = useState(false);

	const noop = () => {};

	return (
		<div className="p-4 md:p-8">
			<header className="mb-8 max-w-5xl mx-auto">
				<h1 className="text-page text-primary">Tarefas — conferência</h1>
				<p className="mt-1 text-body text-secondary">
					Estados de "Minhas tarefas" com fixtures. Alterne o tema para caçar
					texto ilegível. O formulário de criação, os filtros e o anexo de link
					funcionam de verdade — só não chegam a nenhum backend.
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
				<Section
					title="1. Nenhuma tarefa"
					note="Estado vazio — sem tarefas manuais nem geradas por encontros/ferramentas."
				>
					<TarefasView
						tasks={tasksEmptyFixture}
						creating={pending}
						updatingTaskId={null}
						uploadingTaskId={null}
						addingLinkTaskId={null}
						onCreate={noop}
						onStatusChange={noop}
						onUpload={noop}
						onAddLink={noop}
					/>
				</Section>

				<Section
					title="2. Todos os status, prioridades e evidências"
					note="Atrasada, pendente, em andamento, concluída e cancelada na mesma lista; a concluída tem validação do mentor, comentário e as duas formas de evidência."
				>
					<TarefasView
						tasks={tasksMixedFixture}
						creating={pending}
						updatingTaskId={pending ? 'in-progress-1' : null}
						uploadingTaskId={pending ? 'pending-1' : null}
						addingLinkTaskId={pending ? 'pending-2' : null}
						onCreate={noop}
						onStatusChange={noop}
						onUpload={noop}
						onAddLink={noop}
					/>
				</Section>
			</div>
		</div>
	);
}
