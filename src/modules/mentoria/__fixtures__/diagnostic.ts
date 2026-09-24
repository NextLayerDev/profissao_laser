// Fixtures do Diagnóstico / Foto Zero.
//
// Existem porque os três estados da tela são difíceis de alcançar de propósito
// num ambiente real, e o terceiro é IRREVERSÍVEL: uma vez congelada, a Foto
// Zero não volta (o backend recusa o segundo envio e o snapshot é imutável por
// trigger). Conferir o modo leitura "de verdade" custaria uma jornada queimada
// por rodada de ajuste.
//
// O template daqui NÃO é o de produção. O real (`diagnostico_raiox`, 5 blocos e
// 45 campos, no seed de `upvox-api`) não usa `select`, `scale`, `multiselect`
// nem `file` em campo nenhum — ou seja, metade dos ramos do DynamicForm nunca
// aparece na tela real e passaria despercebida numa migração visual. Este aqui
// tem um campo de CADA tipo, de propósito.

import type {
	DiagnosticState,
	MntFormSubmission,
	MntFormTemplate,
	MntSnapshot,
} from '../types';
import { UNKNOWN_ANSWER } from '../types';

const JOURNEY_ID = 'journey-fixture';
const TEMPLATE_ID = 'template-fixture';

/** Um campo de cada `FormFieldType`, incluindo os dois que caem no fallback. */
export const diagnosticTemplateFixture: MntFormTemplate = {
	id: TEMPLATE_ID,
	key: 'diagnostico_raiox',
	version: 1,
	title: 'Raio-X Inicial (fixture)',
	description:
		'Responda com sinceridade: não saber também é diagnóstico. Use "A LEVANTAR" quando não tiver o dado.',
	schema: {
		blocks: [
			{
				key: 'texto',
				title: 'Campos de texto',
				description: 'Cobre text, textarea e o fallback.',
				fields: [
					{
						key: 'nome',
						label: 'Nome do mentorado',
						type: 'text',
						required: true,
					},
					{ key: 'gargalo', label: 'Gargalo principal', type: 'textarea' },
					{
						key: 'capacidade',
						label: 'Capacidade produtiva',
						type: 'text',
						allow_unknown: true,
					},
					// `multiselect` e `file` existem no tipo mas o DynamicForm não os
					// renderiza — caem no <input type="text">. Estão aqui para que esse
					// fallback fique VISÍVEL em vez de ser descoberto em produção.
					{
						key: 'canais',
						label: 'Canais de venda (multiselect)',
						type: 'multiselect',
					},
					{ key: 'anexo', label: 'Anexo (file)', type: 'file' },
				],
			},
			{
				key: 'numeros',
				title: 'Números e datas',
				fields: [
					{
						key: 'funcionarios',
						label: 'Número de funcionários',
						type: 'number',
					},
					{
						key: 'faturamento',
						label: 'Faturamento médio mensal',
						type: 'currency',
						allow_unknown: true,
						metric_key: 'faturamento',
					},
					{ key: 'abertura', label: 'Data de abertura', type: 'date' },
				],
			},
			{
				key: 'escolhas',
				title: 'Escolhas',
				description:
					'select, boolean e scale — nenhum deles aparece no template real.',
				fields: [
					{
						key: 'porte',
						label: 'Porte da empresa',
						type: 'select',
						options: ['MEI', 'Microempresa', 'Pequeno porte', 'Médio porte'],
					},
					{
						key: 'exclusivo',
						label: 'Trabalha exclusivamente com laser?',
						type: 'boolean',
					},
					{ key: 'maturidade', label: 'Maturidade comercial', type: 'scale' },
				],
			},
		],
	},
	published: true,
	created_at: '2026-01-10T12:00:00.000Z',
	updated_at: '2026-01-10T12:00:00.000Z',
};

/**
 * Respostas que exercitam TODOS os ramos de `renderAnswer` do modo leitura:
 * vazio, ausente, "a levantar", booleano, array, número e texto multi-linha.
 */
const answersFixture: Record<string, unknown> = {
	nome: 'Ana Ribeiro',
	gargalo:
		'Produção parada esperando arte.\nO gargalo não é a máquina, é o tempo entre o pedido e o arquivo pronto.',
	capacidade: UNKNOWN_ANSWER,
	canais: ['Instagram', 'Indicação'],
	anexo: '',
	funcionarios: 3,
	faturamento: 18500.5,
	abertura: '2021-03-15',
	porte: 'Microempresa',
	exclusivo: true,
	// `maturidade` fica AUSENTE de propósito — é o ramo `undefined` → "—".
};

const draftFixture: MntFormSubmission = {
	id: 'submission-draft-fixture',
	journey_id: JOURNEY_ID,
	form_template_id: TEMPLATE_ID,
	context: 'diagnostic',
	context_ref_id: null,
	version: 1,
	answers: answersFixture,
	status: 'draft',
	submitted_at: null,
	created_at: '2026-01-12T09:00:00.000Z',
	updated_at: '2026-01-14T16:30:00.000Z',
};

const submittedFixture: MntFormSubmission = {
	...draftFixture,
	id: 'submission-sent-fixture',
	status: 'submitted',
	submitted_at: '2026-01-15T10:00:00.000Z',
	updated_at: '2026-01-15T10:00:00.000Z',
};

const fotoZeroFixture: MntSnapshot = {
	id: 'snapshot-fixture',
	journey_id: JOURNEY_ID,
	kind: 'foto_zero',
	label: 'Foto Zero da Empresa',
	payload: {
		form_key: 'diagnostico_raiox',
		form_version: 1,
		answers: answersFixture,
	},
	metrics: { faturamento: 18500.5 },
	taken_at: '2026-01-15T10:00:00.000Z',
};

/** Estado 1 — a turma não tem formulário publicado. */
export const diagnosticEmptyFixture: DiagnosticState = {
	template: null,
	draft: null,
	submitted: null,
	foto_zero: null,
};

/** Estado 2 — preenchimento, com rascunho já salvo. */
export const diagnosticDraftFixture: DiagnosticState = {
	template: diagnosticTemplateFixture,
	draft: draftFixture,
	submitted: null,
	foto_zero: null,
};

/** Estado 2b — preenchimento do zero, sem rascunho (a primeira visita). */
export const diagnosticBlankFixture: DiagnosticState = {
	template: diagnosticTemplateFixture,
	draft: null,
	submitted: null,
	foto_zero: null,
};

/** Estado 3 — Foto Zero congelada, modo leitura. */
export const diagnosticFrozenFixture: DiagnosticState = {
	template: diagnosticTemplateFixture,
	draft: draftFixture,
	submitted: submittedFixture,
	foto_zero: fotoZeroFixture,
};
