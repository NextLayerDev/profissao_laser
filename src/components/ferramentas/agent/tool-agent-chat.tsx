'use client';

import {
	Check,
	Loader2,
	RotateCcw,
	Send,
	Sparkles,
	Square,
	X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToolAgent } from '@/modules/tools/hooks/use-tool-agent';
import type { BuilderState } from '../builder-model';

/** Ideias-semente: o 1º turno propõe uma ferramenta pronta pro nicho escolhido. */
const NICHES = [
	'Marmoraria',
	'Loja de camisetas',
	'Convites de casamento',
	'Brindes personalizados',
	'Placas e letreiros',
	'Joalheria',
];

interface Props {
	state: BuilderState;
	setState: (s: BuilderState) => void;
}

/**
 * Painel do Agente "Engenheiro de Ferramentas": conversa em PT-BR simples e MONTA
 * a ferramenta ao vivo no mesmo canvas/prévia (compartilha `state`/`setState`).
 * Nunca publica — só monta; Publicar continua sendo botão do usuário.
 */
export function ToolAgentChat({ state, setState }: Props) {
	const { messages, streaming, send, stop, reset } = useToolAgent(
		state,
		setState,
	);
	const [input, setInput] = useState('');
	const listRef = useRef<HTMLDivElement>(null);

	// auto-scroll pro fim a cada nova mensagem / token (depende de `messages` de
	// propósito: re-roda a cada atualização do transcript, não só na 1ª).
	// biome-ignore lint/correctness/useExhaustiveDependencies: rola a cada msg/token novo
	useEffect(() => {
		const el = listRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages]);

	const doSend = (text?: string) => {
		const msg = (text ?? input).trim();
		if (!msg || streaming) return;
		send(msg);
		setInput('');
	};

	const empty = messages.length === 0;

	return (
		<aside className="forge-rise flex h-[70vh] flex-col self-start overflow-hidden rounded-2xl border border-white/10 bg-[#0c0f12]/85 backdrop-blur lg:sticky lg:top-[148px] lg:h-[calc(100vh-10rem)]">
			{/* cabeçalho */}
			<div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
				<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-violet-300 ring-1 ring-violet-400/30">
					<Sparkles className="h-4 w-4" />
				</span>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold text-white">
						Engenheiro de Ferramentas
					</p>
					<p className="truncate font-mono text-[10px] text-violet-300/60">
						monta pra você · não publica
					</p>
				</div>
				{messages.length > 0 && (
					<button
						type="button"
						onClick={reset}
						title="Nova conversa"
						className="rounded-lg border border-white/10 bg-black/20 p-1.5 text-slate-400 hover:text-white"
					>
						<RotateCcw className="h-3.5 w-3.5" />
					</button>
				)}
			</div>

			{/* mensagens */}
			<div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
				{empty ? (
					<div className="flex h-full flex-col items-center justify-center gap-4 text-center">
						<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20">
							<Sparkles className="h-6 w-6" />
						</span>
						<div>
							<p className="text-sm font-semibold text-white">
								Conte sua ideia que eu monto.
							</p>
							<p className="mt-1 text-xs text-slate-400">
								Descreva o que a ferramenta deve fazer — ou comece por um nicho:
							</p>
						</div>
						<div className="flex flex-wrap justify-center gap-1.5">
							{NICHES.map((n) => (
								<button
									key={n}
									type="button"
									onClick={() =>
										doSend(
											`Quero uma ferramenta de IA pra ${n.toLowerCase()}. Pode propor e montar pra mim?`,
										)
									}
									className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-slate-300 transition-colors hover:border-violet-400/40 hover:text-white"
								>
									{n}
								</button>
							))}
						</div>
					</div>
				) : (
					messages.map((m) => (
						<div
							key={m.id}
							className={m.role === 'user' ? 'flex justify-end' : ''}
						>
							{m.role === 'user' ? (
								<div className="max-w-[85%] rounded-2xl rounded-br-sm bg-violet-600/90 px-3 py-2 text-sm text-white">
									{m.text}
								</div>
							) : (
								<div className="max-w-[92%] space-y-2">
									{m.text && (
										<div className="whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
											{m.text}
											{streaming && !m.text.trim() && (
												<Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
											)}
										</div>
									)}
									{m.actions.length > 0 && (
										<ul className="space-y-1 pl-1">
											{m.actions.map((a, i) => (
												<li
													key={`${m.id}-act-${i}`}
													className="flex items-center gap-1.5 text-[11px] text-slate-400"
												>
													{a.ok ? (
														<Check className="h-3 w-3 shrink-0 text-emerald-400" />
													) : (
														<X className="h-3 w-3 shrink-0 text-rose-400" />
													)}
													<span className={a.ok ? '' : 'text-rose-300/80'}>
														{a.label}
													</span>
												</li>
											))}
										</ul>
									)}
									{m.cost != null && m.cost > 0 && (
										<p className="pl-1 font-mono text-[10px] text-rose-300/70">
											−{m.cost} vox
											{m.insufficient ? ' · saldo insuficiente' : ''}
										</p>
									)}
								</div>
							)}
						</div>
					))
				)}
			</div>

			{/* composer */}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					doSend();
				}}
				className="flex items-end gap-2 border-t border-white/10 p-3"
			>
				<textarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							doSend();
						}
					}}
					rows={1}
					placeholder="Ex.: gravar o nome do cliente numa placa…"
					className="max-h-32 flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none"
				/>
				{streaming ? (
					<button
						type="button"
						onClick={stop}
						title="Parar"
						className="shrink-0 rounded-xl bg-rose-600/90 p-2.5 text-white transition-colors hover:bg-rose-500"
					>
						<Square className="h-4 w-4" />
					</button>
				) : (
					<button
						type="submit"
						disabled={!input.trim()}
						className="shrink-0 rounded-xl bg-violet-600 p-2.5 text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
					>
						<Send className="h-4 w-4" />
					</button>
				)}
			</form>
		</aside>
	);
}
