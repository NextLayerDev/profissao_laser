'use client';

/**
 * Conferência da live por LINK EXTERNO, do ponto de vista do aluno.
 *
 * Renderiza `LivesView` e `LiveView` com fixtures, sem backend — as mesmas
 * views das rotas reais (`/course/mentoria/lives`), só que alimentadas à mão.
 *
 * Existe porque hoje não há como chegar nesse estado pela aplicação: a API
 * ainda não conhece o campo `source`, e criar a sala pelo admin responde 503
 * enquanto as credenciais do Mux não existirem. É a tela inteira do caminho
 * que vai valer quando a plataforma de live própria não estiver no meio.
 *
 * Página de desenvolvimento, descartável — mesmo padrão de
 * `app/(dev)/mentoria-lives-check`, que cobre o caminho do Mux. Não está em
 * `PUBLIC_PATHS` do `AuthGuard`, então é preciso estar logado para abrir.
 */

import { LivesView } from '@/app/course/(shell)/mentoria/lives/_components/lives-view';
import { LiveView } from '@/app/course/(shell)/mentoria/lives/[liveId]/_components/live-view';
import {
	chatBusyFixture,
	liveExternalActiveFixture,
	liveExternalVodFixture,
} from '@/modules/mentoria/__fixtures__/lives';
import { LiveChatView } from '@/modules/mentoria/components/live-chat-view';
import type { MntLiveRoom } from '@/modules/mentoria/types';

/** Agendada: existe só aqui, para ver o estado sem link à mostra. */
const liveExternalIdle: MntLiveRoom = {
	...liveExternalActiveFixture,
	id: 'live-external-idle',
	title: 'Mentoria ao vivo — Encontro 5',
	description: 'O link de acesso só aparece depois que o mentor iniciar.',
	status: 'idle',
	started_at: null,
	scheduled_at: '2026-09-18T23:00:00.000Z',
};

const ALL: MntLiveRoom[] = [
	liveExternalActiveFixture,
	liveExternalIdle,
	liveExternalVodFixture,
];

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

export default function LiveExternaCheckPage() {
	const noop = () => {};
	const chat = (
		<LiveChatView messages={chatBusyFixture} sending={false} onSend={noop} />
	);

	return (
		<div className="p-4 md:p-8">
			<header className="mb-8 max-w-5xl mx-auto">
				<h1 className="text-page text-primary">
					Live por link externo — visão do aluno
				</h1>
				<p className="mt-1 text-body text-secondary">
					Como fica a mentoria ao vivo enquanto a transmissão acontece fora da
					plataforma (Zoom, Meet, YouTube). No lugar do player entra o convite
					para sair — o chat continua aqui dentro. Alterne o tema para caçar
					texto ilegível; os botões abrem links de exemplo.
				</p>
			</header>

			<div className="space-y-14">
				<Section
					title="1. Listagem da turma"
					note="As três salas externas juntas. O agrupamento por status é o mesmo do caminho do Mux — o que muda é o que tem dentro do detalhe."
				>
					<LivesView lives={ALL} />
				</Section>

				<Section
					title="2. Detalhe — no ar"
					note="O botão leva ao Meet em outra aba. O pulso no ícone é o mesmo sinal de 'acontecendo agora' do badge da listagem."
				>
					<LiveView
						live={liveExternalActiveFixture}
						playback={null}
						playbackState="external"
						chat={chat}
					/>
				</Section>

				<Section
					title="3. Detalhe — agendada"
					note="Sala criada, mentor ainda não iniciou. Sem botão de propósito: o link não fica exposto antes da hora."
				>
					<LiveView
						live={liveExternalIdle}
						playback={null}
						playbackState="external"
						chat={chat}
					/>
				</Section>

				<Section
					title="4. Detalhe — gravação"
					note="Encerrada com o link de gravação que o admin colou ao encerrar. Não há VOD automático como no Mux."
				>
					<LiveView
						live={liveExternalVodFixture}
						playback={null}
						playbackState="external"
						chat={chat}
					/>
				</Section>
			</div>
		</div>
	);
}
