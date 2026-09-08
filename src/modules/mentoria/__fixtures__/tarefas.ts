// Fixtures de Tarefas — todos os status, prioridades e tipos de evidência na
// mesma tela: na prática nunca aparece tudo junto, mas a rota de conferência
// precisa dos cinco status (`pending`/`in_progress`/`done`/`overdue`/
// `cancelled`) e das duas formas de evidência (arquivo/link com `url`, nota de
// texto sem `url`) ao mesmo tempo para caçar texto ilegível nos dois temas.

import type { MntTask, MntTaskEvidence } from '../types';

const JOURNEY_ID = 'journey-fixture';

function evidence(
	id: string,
	kind: MntTaskEvidence['kind'],
	overrides: Partial<MntTaskEvidence> = {},
): MntTaskEvidence {
	return {
		id,
		task_id: 'task-fixture',
		kind,
		url: null,
		note: null,
		created_at: '2026-08-20T12:00:00.000Z',
		...overrides,
	};
}

function task(id: string, overrides: Partial<MntTask> = {}): MntTask {
	return {
		id,
		journey_id: JOURNEY_ID,
		title: `Tarefa ${id}`,
		description: null,
		origin_type: 'manual',
		origin_id: null,
		due_date: null,
		priority: 'medium',
		status: 'pending',
		completed_at: null,
		mentor_comment: null,
		mentor_validated_at: null,
		created_at: '2026-08-15T12:00:00.000Z',
		evidences: [],
		...overrides,
	};
}

export const tasksEmptyFixture: MntTask[] = [];

export const tasksMixedFixture: MntTask[] = [
	task('overdue-1', {
		title: 'Levantar o custo de aquisição por canal',
		description: 'Planilha com CAC separado por origem do lead.',
		status: 'overdue',
		priority: 'high',
		due_date: '2026-08-01',
		origin_type: 'meeting',
	}),
	task('pending-1', {
		title: 'Definir a primeira ação dos próximos 48h',
		status: 'pending',
		priority: 'high',
		due_date: '2026-09-10',
		origin_type: 'goal',
	}),
	task('pending-2', {
		title: 'Cadastrar o organograma no mapa da empresa',
		status: 'pending',
		priority: 'low',
	}),
	task('in-progress-1', {
		title: 'Montar o funil comercial na ferramenta',
		description: 'Da entrada de lead até o fechamento.',
		status: 'in_progress',
		priority: 'medium',
		due_date: '2026-09-20',
		origin_type: 'tool',
	}),
	task('done-1', {
		title: 'Desenhar o organograma atual',
		status: 'done',
		priority: 'medium',
		completed_at: '2026-08-18T15:00:00.000Z',
		origin_type: 'meeting',
		mentor_validated_at: '2026-08-19T10:00:00.000Z',
		mentor_comment:
			'Ficou claro quem responde por cada área. Falta só formalizar com a equipe.',
		evidences: [
			evidence('ev-link-1', 'link', {
				url: 'https://drive.example.com/organograma.pdf',
				note: 'Organograma em PDF',
			}),
			evidence('ev-text-1', 'text', {
				note: 'Conversei com a equipe na reunião de segunda.',
			}),
		],
	}),
	task('cancelled-1', {
		title: 'Contratar consultoria externa de marketing',
		status: 'cancelled',
		priority: 'low',
	}),
];
