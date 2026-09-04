// Fixtures de Lives — os quatro status da sala na mesma tela e os três estados
// do detalhe (transmitindo, aguardando, encerrada).
//
// É o cenário mais caro de reproduzir de propósito da Mentoria: depende do
// mentor estar transmitindo naquele instante, e `ended` (encerrada com a
// gravação ainda processando) dura poucos minutos por live — justamente o
// estado que a listagem antiga deixava sumir da tela.

import type { LivePlayback, MntLiveChatMessage, MntLiveRoom } from '../types';

function live(
	id: string,
	status: MntLiveRoom['status'],
	overrides: Partial<MntLiveRoom> = {},
): MntLiveRoom {
	return {
		id,
		cohort_id: 'cohort-fixture',
		title: `Live ${id}`,
		description: null,
		scheduled_at: '2026-09-10T22:00:00.000Z',
		status,
		mux_playback_id: null,
		vod_playback_id: null,
		started_at: null,
		ended_at: null,
		created_at: '2026-09-01T12:00:00.000Z',
		...overrides,
	};
}

/** Turma nova: o mentor ainda não agendou nenhuma transmissão. */
export const livesEmptyFixture: MntLiveRoom[] = [];

/**
 * Um de cada status, incluindo `ended`. Traz também uma live sem descrição e
 * uma com descrição longa + título longo, para conferir `truncate`/`clamp`.
 */
export const livesAllStatusesFixture: MntLiveRoom[] = [
	live('live-active-1', 'active', {
		title: 'Precificação na prática: fechando o mês no azul',
		description: 'Tira-dúvidas ao vivo sobre a planilha de custos.',
		started_at: '2026-09-04T22:03:00.000Z',
		mux_playback_id: 'playback-fixture',
	}),
	live('live-idle-1', 'idle', {
		title: 'Encontro 4 — Gestão de equipe',
		description: 'Como montar a escala e cobrar resultado sem virar chefe.',
		scheduled_at: '2026-09-11T23:00:00.000Z',
	}),
	live('live-idle-2', 'idle', {
		title: 'Plantão de dúvidas',
		// Sem descrição e sem data: os dois vazios que a listagem precisa suportar.
		description: null,
		scheduled_at: null,
	}),
	live('live-ended-1', 'ended', {
		title: 'Captação de clientes pelo Instagram',
		description:
			'Encerrada há pouco — a gravação ainda está sendo processada pelo Mux e some da listagem antiga, que só conhecia idle/active/vod_ready.',
		started_at: '2026-09-03T22:00:00.000Z',
		ended_at: '2026-09-03T23:32:00.000Z',
	}),
	live('live-vod-1', 'vod_ready', {
		title:
			'Aula aberta: montando a vitrine de serviços da sua clínica de estética avançada',
		description:
			'Gravação completa do encontro, com a parte de objeções de preço a partir dos 48 minutos e o passo a passo da tabela que a Ana usou para reposicionar o carro-chefe dela sem perder a base de clientes antiga.',
		started_at: '2026-08-27T22:00:00.000Z',
		ended_at: '2026-08-27T23:45:00.000Z',
		vod_playback_id: 'playback-vod-fixture',
	}),
];

/** Detalhe: transmissão no ar. */
export const liveActiveFixture: MntLiveRoom = livesAllStatusesFixture[0];

/** Detalhe: agendada, player ainda fechado. */
export const liveIdleFixture: MntLiveRoom = livesAllStatusesFixture[1];

/** Detalhe: encerrada, gravação em processamento. */
export const liveEndedFixture: MntLiveRoom = livesAllStatusesFixture[3];

/** Token de playback ao vivo — o badge AO VIVO sai daqui, não do status. */
export const livePlaybackLiveFixture: LivePlayback = {
	playback_id: 'playback-fixture',
	token: 'token-fixture',
	kind: 'live',
	expires_in: 3600,
};

/** Token de playback da gravação: mesma moldura, sem o badge. */
export const livePlaybackVodFixture: LivePlayback = {
	playback_id: 'playback-vod-fixture',
	token: 'token-fixture',
	kind: 'vod',
	expires_in: 3600,
};

function message(
	id: string,
	userName: string | null,
	body: string,
): MntLiveChatMessage {
	return {
		id,
		live_room_id: 'live-active-1',
		user_id: `user-${id}`,
		user_name: userName,
		body,
		created_at: '2026-09-04T22:10:00.000Z',
	};
}

/** Chat ainda sem ninguém. */
export const chatEmptyFixture: MntLiveChatMessage[] = [];

/**
 * Chat cheio: nome longo, `user_name` nulo (cai no fallback "Aluno") e uma
 * mensagem no limite de 500 caracteres, que é onde a quebra costuma estourar.
 */
export const chatBusyFixture: MntLiveChatMessage[] = [
	message('msg-1', 'Ana Paula', 'Boa noite, pessoal!'),
	message('msg-2', 'Ana Paula', 'A planilha é a mesma do encontro passado?'),
	message(
		'msg-3',
		'Maria Fernanda dos Santos Albuquerque',
		'Consegui aplicar a tabela nova essa semana e já deu diferença no ticket.',
	),
	message('msg-4', null, 'Chegando atrasado, perdi alguma coisa?'),
	message(
		'msg-5',
		'Roberto',
		'Minha dúvida é sobre o carro-chefe: hoje eu cobro por sessão avulsa e a maioria dos clientes some depois da terceira. Faz sentido montar um pacote fechado de cinco sessões mesmo dando um desconto, ou eu estaria só antecipando receita e comendo a margem do mês que vem? A parte que não fecha na minha cabeça é como calcular o custo do produto por sessão quando o frasco rende um número diferente de aplicações a cada cliente, dependendo da área tratada e do protocolo.',
	),
];
