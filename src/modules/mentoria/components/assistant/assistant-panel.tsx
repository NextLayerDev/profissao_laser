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
// Casca de UI: o painel abre, anima, sugere perguntas e deixa escrever — mas
// ainda NÃO conversa. Não existe endpoint de assistente conversacional para a
// Mentoria (ver docs/mentoria-360-design-system.md, seção B), e inventar uma
// resposta seria pior que anunciar a ausência. As bolhas de mensagem, o stream
// e o histórico entram junto com o backend.

import { Button, Card } from '@upvox-dev/ui';
import { ArrowUp, FileText, Globe, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FLOATING_COLUMN, ListRow } from '../ui';
import {
	ASSISTANT_DURATION,
	ASSISTANT_DURATION_REDUCED,
	ASSISTANT_EASE,
} from './motion';

/** Atalhos do desenho. Preenchem o composer em vez de enviar direto — sem
 *  backend, enviar não levaria a lugar nenhum, mas escrever já mostra a ideia. */
const SUGGESTIONS = [
	{ icon: FileText, label: 'Métricas importantes' },
	{ icon: Globe, label: 'Liste as prioridades' },
];

/** Teto do auto-grow do composer, em px. Acima disso ele rola. */
const COMPOSER_MAX_HEIGHT = 160;

/**
 * Escalonamento do miolo. O card chega inteiro num piscar; escalonar as partes
 * dá a leitura de "montando" em vez de "colado", e é o que sobra de vida num
 * painel que ainda não conversa.
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
	const composerRef = useRef<HTMLTextAreaElement>(null);
	const reduceMotion = useReducedMotion();

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
		if (open) composerRef.current?.focus();
	}, [open]);

	const growComposer = () => {
		const el = composerRef.current;
		if (!el) return;
		// Zera antes de medir: sem isso o `scrollHeight` nunca encolhe ao apagar.
		el.style.height = 'auto';
		el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
	};

	const send = () => {
		if (!draft.trim()) return;
		toast('Em breve', {
			description:
				'O Assistente ainda não está conectado — estamos preparando as respostas.',
		});
	};

	const useSuggestion = (label: string) => {
		setDraft(label);
		composerRef.current?.focus();
		// O valor só chega ao DOM no próximo paint; medir antes devolve a altura
		// antiga.
		requestAnimationFrame(growComposer);
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
						<Header onClose={onClose} />

						{/* É aqui que as bolhas entram quando houver stream. Hoje o corpo
						    é só as boas-vindas. */}
						<div className="min-h-0 flex-1 overflow-y-auto p-4">
							<Welcome onSuggestion={useSuggestion} />
						</div>

						<Composer
							ref={composerRef}
							value={draft}
							onChange={(v) => {
								setDraft(v);
								growComposer();
							}}
							onSend={send}
						/>
					</aside>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

// ── Cabeçalho ────────────────────────────────────────────────────────────────

function Header({ onClose }: { onClose: () => void }) {
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
					Assistente de Inteligência Artificial
				</span>
			</span>
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

function Welcome({ onSuggestion }: { onSuggestion: (label: string) => void }) {
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
					Nosso Assistente de IA pode cometer erros. Verifique se as informações
					estão corretas.{' '}
					{/* O desenho traz "Sujeito aos Termos" como link, mas o app não tem
					    rota de termos — link morto é pior que ausência, então fica texto. */}
					Sujeito aos Termos.
				</p>
			</motion.div>

			<div className="mt-2 space-y-2">
				{SUGGESTIONS.map(({ icon: Icon, label }, i) => (
					<motion.div
						key={label}
						{...rise(STAGGER.suggestion + i * STAGGER_STEP)}
					>
						<ListRow
							boxed
							leading={<Icon className="h-4 w-4 text-secondary" />}
							title={label}
							onSelect={() => onSuggestion(label)}
						/>
					</motion.div>
				))}
			</div>
		</Card>
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
}: {
	ref: React.RefObject<HTMLTextAreaElement | null>;
	value: string;
	onChange: (value: string) => void;
	onSend: () => void;
}) {
	return (
		<div className="flex shrink-0 items-end gap-2 border-subtle border-t p-3">
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
				className="max-h-40 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-body text-primary placeholder:text-muted focus-visible:outline-none"
			/>

			<Button
				variant="primary"
				onPress={onSend}
				disabled={!value.trim()}
				accessibilityLabel="Enviar mensagem"
				// O DS não tem botão circular: `rounded-control` é fixo no
				// `buttonContainer`. O `cn` do DS é tailwind-merge, então a
				// sobrescrita por className vence. Gap em A.5.
				className="h-9 w-9 shrink-0 rounded-full px-0"
			>
				<ArrowUp className="h-4 w-4 text-white" />
			</Button>
		</div>
	);
}
