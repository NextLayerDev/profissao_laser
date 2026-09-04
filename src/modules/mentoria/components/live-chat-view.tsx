'use client';

// Apresentação do chat da live — recebe as mensagens já carregadas e devolve o
// envio. Quem busca, quem assina o Realtime e quem muta é o `live-chat.tsx`.
//
// Separado para caber na rota de conferência: um chat com movimento de verdade
// só existe durante uma transmissão ao vivo, que é exatamente o estado que não
// dá para reproduzir sob demanda.

import { Avatar, Button, Input } from '@upvox-dev/ui';
import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { MntLiveChatMessage } from '../types';

const FALLBACK_NAME = 'Aluno';

/** "Maria Fernanda dos Santos" → "MS". Só o primeiro e o último nome. */
function initialsOf(name: string): string {
	const parts = name.trim().split(/\s+/);
	const first = parts[0]?.[0] ?? '';
	const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
	return `${first}${last}`;
}

export function LiveChatView({
	messages,
	sending,
	onSend,
}: {
	messages: MntLiveChatMessage[];
	sending: boolean;
	onSend: (body: string) => void;
}) {
	const [text, setText] = useState('');
	const bottomRef = useRef<HTMLDivElement>(null);

	// Depende de `messages.length`: com a lista de dependências vazia o chat só
	// rolava no mount, então toda mensagem que chegava durante a live ficava
	// abaixo da dobra.
	useEffect(() => {
		if (messages.length === 0) return;
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages.length]);

	const send = () => {
		const body = text.trim();
		if (!body || sending) return;
		setText('');
		onSend(body);
	};

	return (
		<div className="flex flex-col h-full rounded-card border border-subtle bg-surface overflow-hidden">
			<div className="px-4 py-3 border-b border-subtle text-label text-primary">
				Chat da live
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
				{messages.length === 0 && (
					<p className="text-caption text-muted text-center py-6">
						Seja o primeiro a mandar uma mensagem!
					</p>
				)}
				{messages.map((m) => {
					const name = m.user_name ?? FALLBACK_NAME;
					return (
						<div key={m.id} className="flex items-start gap-2">
							<Avatar
								size="sm"
								name={name}
								initials={initialsOf(name)}
								className="shrink-0"
							/>
							<div className="min-w-0 flex-1">
								{/* `text-brand` é valor de modo claro e o DS não publica versão
								    escura dele — o mesmo token é FUNDO do botão primário, onde
								    precisa continuar #7c3aed. Até o DS ter tons semânticos de
								    texto para o escuro, o par `dark:` fica. */}
								<span className="text-caption text-brand dark:text-violet-400">
									{name}
								</span>
								<p className="text-body text-secondary wrap-break-word">
									{m.body}
								</p>
							</div>
						</div>
					);
				})}
				<div ref={bottomRef} />
			</div>

			<div className="p-3 border-t border-subtle flex items-center gap-2">
				<Input
					className="flex-1"
					value={text}
					onChangeText={setText}
					placeholder="Escreva uma mensagem..."
					accessibilityLabel="Mensagem para o chat da live"
					// `maxLength` e o envio pelo Enter não são props do `Input`: passam
					// pelo `inputProps`, que o DS repassa ao TextInput. No web,
					// `onSubmitEditing` é o Enter.
					inputProps={{
						maxLength: 500,
						returnKeyType: 'send',
						onSubmitEditing: send,
					}}
				/>
				<Button
					variant="primary"
					size="md"
					onPress={send}
					disabled={!text.trim()}
					loading={sending}
					accessibilityLabel="Enviar mensagem"
				>
					{/* Ícone dentro do Button não herda cor — a classe vai explícita. */}
					<Send className="w-4 h-4 text-on-brand" aria-hidden />
				</Button>
			</div>
		</div>
	);
}
