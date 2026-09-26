'use client';

// Painel do Assistente Empresarial da Mentoria 360°.
//
// É uma COLUNA da página, não um modal: entra ao lado do conteúdo, empurrando
// a grade, e some quando fechado. Por isso não tem backdrop, nem portal, nem
// trava de scroll do body — nada disso faz sentido para algo que divide o
// espaço com a página em vez de cobrir.
//
// Visualmente é um card flutuante: superfície única, presa na tela por `sticky`
// enquanto o conteúdo do meio rola por baixo. Altura, deslocamento e sombra
// saem de `FLOATING_COLUMN`, compartilhado com a navegação da coluna 1 — as
// duas colunas têm de bater lado a lado.
//
// Conversa de verdade com a upvox-api (POST .../assistant): o servidor monta o
// contexto da jornada e aplica o limite diário. O histórico fica na sessão do
// navegador (sessionStorage por jornada): sobrevive a trocar de página e ao
// F5, some ao fechar a aba — não guardamos conversa no servidor.

import { Button, Card } from '@upvox-dev/ui';
import { ArrowUp, FileText, Globe, RotateCcw, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { mntErrorText } from '@/app/course/(shell)/mentoria/_components/shared';
import {
	useAskAssistant,
	useAssistantUsage,
	useMentoriaBootstrap,
} from '../../hooks';
import type { AssistantMessage } from '../../types';
import { Markdown } from '../markdown';
import { FLOATING_COLUMN, ListRow } from '../ui';
import {
	ASSISTANT_DURATION,
	ASSISTANT_DURATION_REDUCED,
	ASSISTANT_EASE,
} from './motion';

/** Atalhos do desenho: enviam a pergunta completa direto. */
const SUGGESTIONS = [
	{
		icon: FileText,
		label: 'Métricas importantes',
		question: 'Quais métricas da minha empresa merecem atenção agora?',
	},
	{
		icon: Globe,
		label: 'Liste as prioridades',
		question: 'Liste minhas 3 prioridades para esta semana.',
	},
];

/** A API aceita até 20 mensagens: manda só o fim da conversa. */
const HISTORY_MAX = 20;
const CONTENT_MAX = 2000;
/** Teto da resposta na API; acima disso o histórico daria 400. */
const REPLY_MAX = 4000;

const forApi = (history: AssistantMessage[]) =>
	history.slice(-HISTORY_MAX).map((m) => ({
		role: m.role,
		content: m.content.slice(0, m.role === 'user' ? CONTENT_MAX : REPLY_MAX),
	}));

const storageKey = (journeyId: string) => `mentoria-assistant:${journeyId}`;

function loadHistory(journeyId: string): AssistantMessage[] {
	try {
		const raw = sessionStorage.getItem(storageKey(journeyId));
		const parsed: unknown = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed)
			? parsed.filter(
					(m): m is AssistantMessage =>
						(m?.role === 'user' || m?.role === 'assistant') &&
						typeof m?.content === 'string',
				)
			: [];
	} catch {
		return [];
	}
}

function saveHistory(journeyId: string, messages: AssistantMessage[]) {
	try {
		sessionStorage.setItem(storageKey(journeyId), JSON.stringify(messages));
	} catch {
		// Aba privada/cota cheia: a conversa segue só na memória.
	}
}

/** Teto do auto-grow do composer, em px. Acima disso ele rola. */
const COMPOSER_MAX_HEIGHT = 160;

/**
 * Escalonamento do miolo. O card chega inteiro num piscar; escalonar as partes
 * dá a leitura de "montando" em vez de "colado".
 *
 * Os atrasos entram DEPOIS do meio do percurso do card (0.42s): antes disso a
 * coluna ainda está abrindo, e conteúdo entrando dentro de uma faixa que se
 * mexe só faz confusão.
 */
const STAGGER: Record<'welcome' | 'suggestion', number> = {
	welcome: 0.18,
	suggestion: 0.26,
};

/** Passo entre um atalho e o próximo, em segundos. */
const STAGGER_STEP = 0.06;

export function AssistantPanel({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const [draft, setDraft] = useState('');
	const [messages, setMessages] = useState<AssistantMessage[]>([]);
	const [error, setError] = useState<string | null>(null);
	const composerRef = useRef<HTMLTextAreaElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const reduceMotion = useReducedMotion();

	const journeyId = useMentoriaBootstrap().data?.journey?.id;
	const usage = useAssistantUsage(open ? journeyId : undefined);
	const ask = useAskAssistant(journeyId);
	const remaining = usage.data?.remaining_today;
	const exhausted = remaining === 0;

	// Histórico da sessão por jornada (a jornada chega depois do bootstrap).
	useEffect(() => {
		setMessages(journeyId ? loadHistory(journeyId) : []);
	}, [journeyId]);

	// Nova mensagem ou "pensando": rola até o fim.
	useEffect(() => {
		if (!open) return;
		const el = scrollRef.current;
		if (el && (messages.length || ask.isPending)) {
			el.scrollTo({ top: el.scrollHeight });
		}
	}, [open, messages.length, ask.isPending]);

	// Esc fecha. O listener vai em `document`, e não num `onKeyDown` de div: o
	// resto do app faz assim e só funciona quando a div está focada — por isso
	// Esc não fecha `modal-overlay` nem `source-drawer`.
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [open, onClose]);

	// Foco entra junto com o painel. Imperativo em vez de `autoFocus` porque o
	// composer só monta quando `open` vira true.
	useEffect(() => {
		// `preventScroll`: o foco não pode arrastar a página até o painel.
		if (open) composerRef.current?.focus({ preventScroll: true });
	}, [open]);

	const growComposer = () => {
		const el = composerRef.current;
		if (!el) return;
		// Zera antes de medir: sem isso o `scrollHeight` nunca encolhe ao apagar.
		el.style.height = 'auto';
		el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
	};

	const commit = (next: AssistantMessage[]) => {
		setMessages(next);
		if (journeyId) saveHistory(journeyId, next);
	};

	const send = (text = draft) => {
		const content = text.trim().slice(0, CONTENT_MAX);
		if (!content || !journeyId || ask.isPending || exhausted) return;
		const withQuestion = [...messages, { role: 'user' as const, content }];
		setError(null);
		setDraft('');
		commit(withQuestion);
		requestAnimationFrame(growComposer);
		ask.mutate(forApi(withQuestion), {
			onSuccess: ({ reply }) =>
				commit([...withQuestion, { role: 'assistant', content: reply }]),
			onError: (err) => {
				// A pergunta volta para o composer: nada se perde.
				commit(messages);
				setDraft(content);
				requestAnimationFrame(growComposer);
				setError(mntErrorText(err, 'Não consegui responder agora.'));
			},
		});
	};

	const reset = () => {
		commit([]);
		setError(null);
	};

	return (
		<AnimatePresence>
			{open && (
				<motion.div
					// `lg:col-span-2` cobre a faixa entre lg e xl, onde não cabem três
					// colunas e o painel desce para uma linha própria.
					//
					// `sticky` e não `fixed`: o course shell anima o <main> com
					// `transform`, e transform cria containing block — `fixed` ancoraria
					// no <main> em vez do viewport e o painel escaparia ao rolar. É a
					// mesma armadilha documentada em components/ui/modal-portal.tsx.
					// Esta div é a CÉLULA da grade: estica com a linha e não gruda.
					// Quem gruda é o <aside> dentro dela — `sticky` na própria célula
					// não teria por onde correr, porque a célula tem a altura do card.
					//
					// `xl:pl-6` é o respiro até o conteúdo. Ele mora aqui, e não no `gap`
					// da grade, porque a faixa da coluna anima até `0px` — com `gap`
					// sobraria um vão morto de 24px com o painel fechado
					// (ver mentoria-shell.tsx).
					className="min-w-0 lg:col-span-2 xl:col-span-1 xl:pl-6"
					initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
					animate={{ opacity: 1, x: 0 }}
					exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
					transition={{
						duration: reduceMotion
							? ASSISTANT_DURATION_REDUCED
							: ASSISTANT_DURATION,
						ease: ASSISTANT_EASE,
					}}
				>
					{/* Card flutuante: uma superfície só. Mesma altura e mesma sombra da
					    navegação — as duas saem de FLOATING_COLUMN justamente para não
					    divergirem. `overflow-hidden` faz o conteúdo respeitar o
					    arredondamento nas bordas. */}
					{/* `xl:w-90` em vez de largura fluida: no fechamento a faixa da
					    coluna encolhe até zero, e um card elástico reflowaria o texto
					    todo durante a saída — palavra quebrando de linha enquanto some.
					    Com a largura travada ele só desliza, e o excesso é recortado
					    pelo `overflow-x-clip` do <main> do curso. */}
					<aside
						aria-label="Assistente Empresarial"
						className={`${FLOATING_COLUMN.surface} ${FLOATING_COLUMN.stickyXl} flex flex-col overflow-hidden xl:w-90`}
					>
						<Header
							onClose={onClose}
							onReset={messages.length ? reset : undefined}
						/>

						<div
							ref={scrollRef}
							className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
							aria-live="polite"
						>
							{messages.length === 0 ? (
								<Welcome
									disabled={!journeyId || exhausted || ask.isPending}
									onSuggestion={(q) => send(q)}
								/>
							) : (
								messages.map((m, i) => (
									// Lista só cresce ou zera: o índice é estável.
									<Bubble key={i} message={m} />
								))
							)}
							{ask.isPending && <Thinking />}
						</div>

						<Composer
							ref={composerRef}
							value={draft}
							onChange={(v) => {
								setDraft(v);
								// Voltou a escrever: o aviso de erro dá lugar ao contador.
								setError(null);
								growComposer();
							}}
							onSend={() => send()}
							disabled={!journeyId || exhausted}
							busy={ask.isPending}
							status={
								error ??
								(!journeyId
									? 'Disponível quando sua jornada começar.'
									: exhausted
										? 'Você usou as perguntas de hoje. Volte amanhã.'
										: remaining !== undefined
											? `${remaining} ${remaining === 1 ? 'pergunta restante' : 'perguntas restantes'} hoje`
											: null)
							}
							isError={!!error}
						/>
					</aside>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

// ── Cabeçalho ────────────────────────────────────────────────────────────────

function Header({
	onClose,
	onReset,
}: {
	onClose: () => void;
	onReset?: () => void;
}) {
	return (
		<div className="flex shrink-0 items-center gap-3 border-subtle border-b px-4 py-3">
			<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-wash">
				{/* `text-brand` não tem token escuro no DS — daí o par `dark:`, mesma
				    ressalva das outras telas da Mentoria. */}
				<Sparkles className="h-4 w-4 text-brand dark:text-violet-400" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-label text-primary">
					Assistente de IA
				</span>
				<span className="block truncate text-caption text-secondary">
					Usa os dados da sua jornada
				</span>
			</span>
			{onReset && (
				<Button
					variant="ghost"
					onPress={onReset}
					accessibilityLabel="Nova conversa"
					className="h-8 w-8 shrink-0 rounded-full px-0"
				>
					<RotateCcw className="h-4 w-4 text-secondary" />
				</Button>
			)}
			<Button
				variant="ghost"
				onPress={onClose}
				accessibilityLabel="Fechar o assistente"
				className="-mr-2 h-8 w-8 shrink-0 rounded-full px-0"
			>
				{/* Ícone dentro de Button não herda o `buttonLabel` (que só veste o
				    <Text>), então a cor vai explícita. */}
				<X className="h-4 w-4 text-secondary" />
			</Button>
		</div>
	);
}

// ── Boas-vindas ──────────────────────────────────────────────────────────────

function Welcome({
	onSuggestion,
	disabled,
}: {
	onSuggestion: (question: string) => void;
	disabled: boolean;
}) {
	const reduceMotion = useReducedMotion();

	// Sem `exit`: na saída o card inteiro já esvanece de uma vez, e escalonar a
	// despedida só atrasaria o fechamento. O escalonamento é de chegada.
	const rise = (delay: number) => ({
		initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
		animate: { opacity: 1, y: 0 },
		transition: {
			duration: reduceMotion ? ASSISTANT_DURATION_REDUCED : 0.32,
			delay: reduceMotion ? 0 : delay,
			ease: ASSISTANT_EASE,
		},
	});

	return (
		<Card>
			<motion.div {...rise(STAGGER.welcome)}>
				<h2 className="text-page text-primary">Assistente Empresarial</h2>
				<p className="text-body text-secondary">
					Pergunte sobre sua empresa. Posso errar: confira.
				</p>
			</motion.div>

			<div className="mt-2 space-y-2">
				{SUGGESTIONS.map(({ icon: Icon, label, question }, i) => (
					<motion.div
						key={label}
						{...rise(STAGGER.suggestion + i * STAGGER_STEP)}
					>
						<ListRow
							boxed
							leading={<Icon className="h-4 w-4 text-secondary" />}
							title={label}
							onSelect={disabled ? undefined : () => onSuggestion(question)}
						/>
					</motion.div>
				))}
			</div>
		</Card>
	);
}

// ── Mensagens ────────────────────────────────────────────────────────────────

function Bubble({ message }: { message: AssistantMessage }) {
	if (message.role === 'user') {
		return (
			<div className="flex justify-end">
				<p className="max-w-[85%] whitespace-pre-line rounded-card bg-brand-wash px-3 py-2 text-body text-primary">
					{message.content}
				</p>
			</div>
		);
	}
	// Resposta do modelo vem em Markdown; o componente não interpreta HTML.
	return (
		<div className="max-w-[95%] rounded-card bg-surface-sunken px-3 py-2">
			<Markdown source={message.content} />
		</div>
	);
}

function Thinking() {
	return (
		<output className="block animate-pulse px-1 text-caption text-secondary">
			Pensando…
		</output>
	);
}

// ── Composer ─────────────────────────────────────────────────────────────────

// `<textarea>` cru em vez de `Input`/`Textarea` do DS: o `Input` é uma linha só
// e não expõe `onSubmitEditing` no topo, e o `Textarea` tem altura fixa por
// `size` com `multiline` embutido e fora de `inputProps` — nenhum dos dois
// cresce com o conteúdo, que é o mínimo de um composer. Gap em A.5.
function Composer({
	ref,
	value,
	onChange,
	onSend,
	disabled,
	busy,
	status,
	isError,
}: {
	ref: React.RefObject<HTMLTextAreaElement | null>;
	value: string;
	onChange: (value: string) => void;
	onSend: () => void;
	disabled: boolean;
	busy: boolean;
	status: string | null;
	isError: boolean;
}) {
	return (
		<div className="shrink-0 border-subtle border-t p-3">
			{status && (
				<p
					className={`px-2 pb-2 text-caption ${isError ? 'text-red-600 dark:text-red-400' : 'text-secondary'}`}
					role={isError ? 'alert' : undefined}
				>
					{status}
				</p>
			)}
			<div className="flex items-end gap-2">
				<textarea
					ref={ref}
					rows={1}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={(e) => {
						// Enter envia, Shift+Enter quebra linha — mesma convenção do
						// support-chat-widget e do tool-agent-chat.
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							onSend();
						}
					}}
					placeholder="Digite suas dúvidas..."
					aria-label="Mensagem para o assistente"
					maxLength={CONTENT_MAX}
					disabled={disabled}
					className="max-h-40 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-body text-primary placeholder:text-muted focus-visible:outline-none"
				/>

				<Button
					variant="primary"
					onPress={onSend}
					disabled={disabled || busy || !value.trim()}
					accessibilityLabel="Enviar mensagem"
					// O DS não tem botão circular: `rounded-control` é fixo no
					// `buttonContainer`. O `cn` do DS é tailwind-merge, então a
					// sobrescrita por className vence. Gap em A.5.
					className="h-9 w-9 shrink-0 rounded-full px-0"
				>
					<ArrowUp className="h-4 w-4 text-white" />
				</Button>
			</div>
		</div>
	);
}
