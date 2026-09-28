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
	/** `onError` devolve o texto ao campo quando o envio falha. */
	onSend: (body: string, cb?: { onError?: () => void }) => void;
}) {
	const [text, setText] = useState('');
	const listRef = useRef<HTMLDivElement>(null);
	// Só acompanha o fim se o aluno já estava lá: quem rolou para ler o
	// histórico não é puxado de volta.
	const stickRef = useRef(true);
	const lastId = messages.at(-1)?.id;

	// Depende do id da última mensagem, não do `length`: a API devolve só as
	// últimas 100, e a partir daí o length parava em 100 e o chat não rolava
	// mais. E rola só o container: `scrollIntoView` arrastava a janela junto e,
	// no celular, tirava o vídeo da tela a cada mensagem.
	useEffect(() => {
		const el = listRef.current;
		if (!el || !lastId || !stickRef.current) return;
		el.scrollTop = el.scrollHeight;
	}, [lastId]);

	const send = () => {
		const body = text.trim();
		if (!body || sending) return;
		setText('');
		stickRef.current = true;
		onSend(body, { onError: () => setText((t) => t || body) });
	};

	return (
		<div className="flex flex-col h-full rounded-card border border-subtle bg-surface overflow-hidden">
			<div className="px-4 py-3 border-b border-subtle text-label text-primary">
				Chat da live
			</div>

			<div
				ref={listRef}
				onScroll={(e) => {
					const el = e.currentTarget;
					stickRef.current =
						el.scrollHeight - el.scrollTop - el.clientHeight < 80;
				}}
				className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
			>
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
