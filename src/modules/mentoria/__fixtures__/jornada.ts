// Fixtures da Jornada (linha do tempo e detalhe do encontro).
//
// O status de cada encontro (`locked`/`available`/`in_progress`/`done`) é
// calculado pelo backend, que libera um encontro por vez: ver a lista com
// concluídos, um em andamento e bloqueados ao mesmo tempo — ou com feedback do
// mentor já escrito — exigiria avançar uma jornada real inteira. Daí os
// cenários montados à mão aqui.

import type { MntJourneyMeeting, MntMeetingTemplate, MntTask } from '../types';

const JOURNEY_ID = 'journey-fixture';

function template(
	position: number,
	title: string,
	overrides: Partial<MntMeetingTemplate> = {},
): MntMeetingTemplate {
	return {
		id: `tpl-${position}`,
		program_key: 'profissao_laser_360',
		position,
		version: 1,
		title,
		subtitle: null,
		description: null,
		objectives: null,
		content_md: null,
		tool_definition_ids: [],
		exercise_form_template_id: null,
		task_prompts: [],
		indicator_hint: null,
		expected_result: null,
		is_final: false,
		published: true,
		created_at: '2026-01-10T12:00:00.000Z',
		updated_at: '2026-01-10T12:00:00.000Z',
		...overrides,
	};
}

function meeting(
	position: number,
	status: MntJourneyMeeting['status'],
	tpl: MntMeetingTemplate,
	overrides: Partial<MntJourneyMeeting> = {},
): MntJourneyMeeting {
	return {
		id: `meeting-${position}`,
		journey_id: JOURNEY_ID,
		meeting_template_id: tpl.id,
		template_version: tpl.version,
		position,
		status,
		scheduled_at: null,
		student_completed_at: status === 'done' ? '2026-03-05T14:00:00.000Z' : null,
		mentor_feedback: null,
		mentor_validated_by: null,
		mentor_validated_at: null,
		created_at: '2026-01-10T12:00:00.000Z',
		updated_at: '2026-03-05T14:00:00.000Z',
		template: tpl,
		...overrides,
	};
}

// ── Estado 1 — turma ainda não configurada ───────────────────────────────────

export const meetingsEmptyFixture: MntJourneyMeeting[] = [];

// ── Estado 2 — jornada em andamento ──────────────────────────────────────────
//
// Cobre de uma vez os quatro status, o encontro agendado, o feedback do mentor
// e o selo de validação — combinação que na prática nunca aparece junta.

export const meetingsInProgressFixture: MntJourneyMeeting[] = [
	meeting(
		1,
		'done',
		template(1, 'Raio-X da sua empresa', {
			subtitle: 'O retrato de onde você está hoje',
		}),
		{
			mentor_validated_at: '2026-02-12T18:00:00.000Z',
			mentor_validated_by: 'mentor-1',
			mentor_feedback:
				'Diagnóstico bem preenchido. Atenção ao custo de aquisição: está alto para o seu ticket médio.',
		},
	),
	meeting(
		2,
		'done',
		template(2, 'Propósito, visão e valores', {
			subtitle: 'Para onde a empresa vai',
		}),
	),
	meeting(
		3,
		'in_progress',
		template(3, 'Mapa de processos', {
			subtitle: 'Como o trabalho acontece de verdade',
		}),
		{ scheduled_at: '2026-09-15T19:00:00.000Z' },
	),
	meeting(4, 'available', template(4, 'Organograma e papéis')),
	meeting(5, 'locked', template(5, 'Indicadores que importam')),
	meeting(6, 'locked', template(6, 'Funil comercial')),
];

// ── Estado 3 — jornada concluída ─────────────────────────────────────────────

export const meetingsAllDoneFixture: MntJourneyMeeting[] = [
	meeting(1, 'done', template(1, 'Raio-X da sua empresa'), {
		mentor_validated_at: '2026-02-12T18:00:00.000Z',
		mentor_validated_by: 'mentor-1',
	}),
	meeting(2, 'done', template(2, 'Propósito, visão e valores')),
	meeting(3, 'done', template(3, 'Mapa de processos')),
	meeting(4, 'done', template(4, 'Plano de voo', { is_final: true }), {
		mentor_feedback:
			'Jornada completa. Agora é manter o ritmo dos indicadores.',
	}),
];

// ── Detalhe do encontro ──────────────────────────────────────────────────────

/** Encontro comum, com os três blocos de texto do template preenchidos. */
export const meetingDetailFixture: MntJourneyMeeting = meeting(
	3,
	'available',
	template(3, 'Mapa de processos', {
		subtitle: 'Como o trabalho acontece de verdade',
		objectives:
			'Enxergar o caminho que um pedido percorre da entrada à entrega.\nIdentificar onde ele trava.',
		content_md:
			'Todo processo tem dono, entrada, saída e ponto de controle.\n\nComece pelo processo que mais gera retrabalho hoje — não pelo mais bonito de desenhar.',
		expected_result:
			'Um fluxo desenhado, com dono e prazo por etapa, e pelo menos um gargalo nomeado.',
	}),
	{ scheduled_at: '2026-09-15T19:00:00.000Z' },
);

/**
 * Encontro 1 com formulário de exercício: é o que dispara o CTA do Raio-X, hoje
 * deduzido de `position === 1` (ver o TODO em `encontro-view.tsx`).
 */
export const meetingDiagnosticFixture: MntJourneyMeeting = meeting(
	1,
	'available',
	template(1, 'Raio-X da sua empresa', {
		subtitle: 'O retrato de onde você está hoje',
		exercise_form_template_id: 'form-diagnostic',
		objectives: 'Levantar os números que a empresa tem hoje, sem maquiagem.',
	}),
);

/** Exercício com mentor + tarefas sugeridas — o caso com mais botões na tela. */
export const meetingWithTaskPromptsFixture: MntJourneyMeeting = meeting(
	4,
	'in_progress',
	template(4, 'Organograma e papéis', {
		subtitle: 'Quem responde pelo quê',
		exercise_form_template_id: 'form-org',
		objectives: 'Separar as funções das pessoas.',
		task_prompts: [
			{
				title: 'Desenhar o organograma atual',
				description: 'Como está hoje, não como deveria ser.',
				priority: 'high',
			},
			{
				title: 'Listar as responsabilidades de cada cargo',
				description: 'Uma linha por responsabilidade.',
				priority: 'medium',
			},
			{
				title: 'Definir um indicador por cargo',
				priority: 'low',
			},
		],
	}),
);

/** Encontro fechado: sem botão de concluir, com validação e feedback. */
export const meetingDoneWithFeedbackFixture: MntJourneyMeeting = meeting(
	2,
	'done',
	template(2, 'Propósito, visão e valores', {
		subtitle: 'Para onde a empresa vai',
		expected_result:
			'Propósito escrito em uma frase que a equipe consiga repetir.',
	}),
	{
		mentor_validated_at: '2026-04-02T18:00:00.000Z',
		mentor_validated_by: 'mentor-1',
		mentor_feedback:
			'O propósito ficou claro. Falta levar para a equipe: escreva-o na parede da oficina.',
	},
);

// ── Tarefas do encontro ──────────────────────────────────────────────────────

function task(title: string, meetingId: string): MntTask {
	return {
		id: `task-${title.slice(0, 12)}`,
		journey_id: JOURNEY_ID,
		title,
		description: null,
		origin_type: 'meeting',
		origin_id: meetingId,
		due_date: null,
		priority: 'medium',
		status: 'pending',
		completed_at: null,
		mentor_comment: null,
		mentor_validated_at: null,
		created_at: '2026-04-02T18:00:00.000Z',
		evidences: [],
	};
}

export const meetingTasksEmptyFixture: MntTask[] = [];

/** Uma das três tarefas sugeridas já adicionada — mostra os dois estados juntos. */
export const meetingTasksPartiallyAddedFixture: MntTask[] = [
	task('Desenhar o organograma atual', 'meeting-4'),
];
