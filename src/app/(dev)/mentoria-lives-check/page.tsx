'use client';

/**
 * Conferência visual das Lives (Mentoria 360°).
 *
 * Renderiza `LivesView`, `LiveView` e `LiveChatView` com fixtures, sem backend.
 * É a tela da Mentoria com o estado mais caro de reproduzir de propósito: ver
 * uma transmissão no ar depende do mentor estar transmitindo naquele instante,
 * e `ended` — encerrada com a gravação ainda processando — dura poucos minutos
 * por live. Era justamente o status que a listagem antiga deixava sumir.
 *
 * O player aparece com a moldura e o badge, mas o iframe do Mux fica preto: o
 * token das fixtures não é assinado. O que se confere aqui é o enquadramento.
 *
 * Página de desenvolvimento, descartável — mesmo padrão de
 * `app/(dev)/mentoria-tarefas-check`. Não está em `PUBLIC_PATHS` do
 * `AuthGuard`, então é preciso estar logado para abrir.
 */

import { useState } from 'react';
import { LivesView } from '@/app/course/(shell)/mentoria/lives/_components/lives-view';
import {
	LiveNotFound,
	LiveView,
} from '@/app/course/(shell)/mentoria/lives/[liveId]/_components/live-view';
import {
	chatBusyFixture,
	chatEmptyFixture,
	liveActiveFixture,
	liveEndedFixture,
	liveIdleFixture,
	livePlaybackLiveFixture,
	livesAllStatusesFixture,
	livesEmptyFixture,
} from '@/modules/mentoria/__fixtures__/lives';
import { LiveChatView } from '@/modules/mentoria/components/live-chat-view';

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

export default function LivesCheckPage() {
	// Só para ver o botão de envio em `loading` sem rede.
	const [pending, setPending] = useState(false);

	const noop = () => {};

	// O chat de verdade busca sozinho; aqui entra a view pura com fixtures.
	const chat = (
		<LiveChatView messages={chatBusyFixture} sending={pending} onSend={noop} />
	);

	return (
		<div className="p-4 md:p-8">
			<header className="mb-8 max-w-5xl mx-auto">
				<h1 className="text-page text-primary">Lives — conferência</h1>
				<p className="mt-1 text-body text-secondary">
					Estados das lives com fixtures. Alterne o tema para caçar texto
					ilegível. O campo do chat e a rolagem funcionam de verdade — só não
					chegam a nenhum backend, e o iframe do player fica preto porque o
					token das fixtures não é assinado.
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
				<h2 className="text-title text-primary">Listagem</h2>

				<Section
					title="1. Nenhuma live"
					note="Turma nova: o mentor ainda não agendou nenhuma transmissão."
				>
					<LivesView lives={livesEmptyFixture} />
				</Section>

				<Section
					title="2. Os quatro status juntos"
					note="Ao vivo, agendadas (uma sem descrição e sem data), encerrada em processamento e gravação com título e descrição longos. A seção 'Encerradas' é nova: antes uma live nesse status sumia da tela."
				>
					<LivesView lives={livesAllStatusesFixture} />
				</Section>

				<h2 className="text-title text-primary">Detalhe</h2>

				<Section
					title="3. Transmitindo"
					note="Player com o badge AO VIVO (que sai do `kind` do token, não do status) e o chat ao lado."
				>
					<LiveView
						live={liveActiveFixture}
						playback={livePlaybackLiveFixture}
						playbackState="playing"
						chat={chat}
					/>
				</Section>

				<Section
					title="4. Aguardando transmissão"
					note="Sala agendada: o aviso ocupa exatamente a área do player."
				>
					<LiveView
						live={liveIdleFixture}
						playback={null}
						playbackState="waiting"
						chat={chat}
					/>
				</Section>

				<Section
					title="5. Encerrada, gravação processando"
					note="Estado de poucos minutos entre o fim da transmissão e o VOD ficar pronto."
				>
					<LiveView
						live={liveEndedFixture}
						playback={null}
						playbackState="ended"
						chat={chat}
					/>
				</Section>

				<Section
					title="6. Live não encontrada"
					note="Guarda de id inválido na URL. Antes esse caso caía no esqueleto e girava para sempre."
				>
					<LiveNotFound />
				</Section>

				<h2 className="text-title text-primary">Chat</h2>

				<Section
					title="7. Chat vazio e chat cheio"
					note="Nome longo, `user_name` nulo (cai em 'Aluno') e uma mensagem no limite de 500 caracteres. Use o botão do topo para ver o envio em andamento."
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-104">
						<LiveChatView
							messages={chatEmptyFixture}
							sending={pending}
							onSend={noop}
						/>
						<LiveChatView
							messages={chatBusyFixture}
							sending={pending}
							onSend={noop}
						/>
					</div>
				</Section>
			</div>
		</div>
	);
}
