'use client';

import { Loader2, MessagesSquare, Send, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { perguntarSobreEntry } from '../../services/collections.service';

/**
 * A CAIXA DE PERGUNTAS — o dossiê deixa de ser documento e vira conversa.
 *
 * Veio do teste com o dono do produto: "abre uma caixa de perguntas pra ele
 * perguntar mais sobre o produto depois do resultado". Quem termina de ler um
 * dossiê sempre tem a pergunta seguinte, e ela é específica demais para caber
 * num relatório pronto — "e se eu vender em kit?" não é seção, é dúvida.
 *
 * As perguntas são CONTADAS: vêm incluídas na análise que já foi paga. Duas
 * consequências de interface saem daí — o saldo fica à vista, e a sugestão
 * PREENCHE o campo em vez de enviar, porque um clique errado queimaria uma
 * pergunta que o aluno não tem como repor.
 */

const SUGESTOES: Record<'produto' | 'mercado', string[]> = {
	produto: [
		'E se eu vender em kit?',
		'Quanto de material eu gasto?',
		'Como fotografo isso?',
	],
	mercado: [
		'Qual desses eu começo?',
		'Preciso de CNPJ?',
		'Quanto invisto pra começar?',
	],
};

interface Troca {
	p: string;
	r: string;
}

/** HTTP status de um erro do axios, quando existe. */
function statusDoErro(e: unknown): number | null {
	const s = (e as { response?: { status?: unknown } })?.response?.status;
	return typeof s === 'number' ? s : null;
}

/** O servidor já responde em português; só o fallback é nosso. */
function mensagemDoErro(e: unknown): string {
	const m = (e as { response?: { data?: { message?: unknown } } })?.response
		?.data?.message;
	return typeof m === 'string' && m.trim()
		? m
		: 'Não consegui responder agora. Tente de novo em instantes.';
}

export interface CaixaPerguntasProps {
	toolKey: string;
	colecao: string;
	entryId: string;
	/** Muda só as sugestões: quem tem a peça e quem procura o ramo perguntam coisas diferentes. */
	tipo: 'produto' | 'mercado';
	/** Cota conhecida antes da primeira pergunta. Sem ela o saldo só aparece na primeira resposta. */
	restantesIniciais?: number;
}

export function CaixaPerguntas({
	toolKey,
	colecao,
	entryId,
	tipo,
	restantesIniciais,
}: CaixaPerguntasProps) {
	const [trocas, setTrocas] = useState<Troca[]>([]);
	const [texto, setTexto] = useState('');
	const [enviando, setEnviando] = useState(false);
	const [restantes, setRestantes] = useState<number | null>(
		typeof restantesIniciais === 'number' ? restantesIniciais : null,
	);
	const campo = useRef<HTMLTextAreaElement>(null);

	const acabou = restantes === 0;
	const curta = texto.trim().length < 3;

	const enviar = async () => {
		const pergunta = texto.trim();
		if (enviando || acabou) return;
		if (pergunta.length < 3) {
			toast.error('Escreva a pergunta com pelo menos 3 letras.');
			return;
		}

		setEnviando(true);
		try {
			const r = await perguntarSobreEntry(
				toolKey,
				colecao,
				entryId,
				pergunta.slice(0, 500),
			);
			setTrocas((t) => [...t, { p: pergunta, r: r.resposta }]);
			// Saldo ausente não zera o contador da tela: some o crachá, e a caixa
			// continua aberta até o servidor dizer que acabou.
			if (typeof r.restantes === 'number') setRestantes(r.restantes);
			setTexto('');
		} catch (e) {
			/**
			 * 429 aqui significa UMA coisa só: a cota da análise acabou. O backend
			 * devolve 503 para soluço de provedor justamente para este ramo poder ser
			 * terminal. Sem fechar a caixa, o aluno lê um toast que some em segundos,
			 * vê o campo continuar aceso e tenta de novo indefinidamente — e o caso é
			 * real: reanalisar o mesmo produto reaproveita o registro, com a cota já
			 * gasta.
			 */
			if (statusDoErro(e) === 429) setRestantes(0);
			toast.error(mensagemDoErro(e));
		} finally {
			setEnviando(false);
		}
	};

	return (
		<section
			id="perguntas"
			className="mb-8 scroll-mt-32 rounded-2xl border p-5 print:hidden"
			style={{
				borderColor:
					'color-mix(in srgb, var(--screen-accent) 28%, transparent)',
				backgroundColor:
					'color-mix(in srgb, var(--screen-accent) 5%, transparent)',
			}}
		>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex items-center gap-3">
					<span
						className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
						style={{
							backgroundColor:
								'color-mix(in srgb, var(--screen-accent) 16%, transparent)',
							color: 'var(--screen-accent)',
						}}
					>
						<MessagesSquare className="h-4 w-4" />
					</span>
					<div className="min-w-0">
						<h3 className="font-display text-[15px] font-bold text-slate-100">
							Ficou alguma dúvida?
						</h3>
						<p className="text-[12px] leading-snug text-slate-400">
							Pergunte ao time sobre{' '}
							{tipo === 'produto' ? 'este produto' : 'este mercado'} — a
							resposta usa a pesquisa deste dossiê.
						</p>
					</div>
				</div>
				{restantes !== null ? (
					<span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[11px] tabular-nums text-slate-400">
						{restantes} pergunta{restantes === 1 ? '' : 's'} restante
						{restantes === 1 ? '' : 's'}
					</span>
				) : null}
			</div>

			{/* `aria-live`: quem não enxerga a tela precisa ser avisado de que a
			    resposta chegou — ela aparece longe do foco, sem barulho nenhum. */}
			{trocas.length > 0 ? (
				<ol aria-live="polite" className="mt-5 space-y-4">
					{trocas.map((t, i) => (
						<motion.li
							key={`${t.p.slice(0, 24)}-${i}`}
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
							className="space-y-2"
						>
							<p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-white/[0.06] px-3.5 py-2 text-[13px] leading-snug text-slate-200">
								{t.p}
							</p>
							<div className="flex gap-2.5">
								<span
									className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg"
									style={{
										backgroundColor:
											'color-mix(in srgb, var(--screen-accent) 14%, transparent)',
										color: 'var(--screen-accent)',
									}}
								>
									<Sparkles className="h-3.5 w-3.5" />
								</span>
								<p className="min-w-0 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-300">
									{t.r}
								</p>
							</div>
						</motion.li>
					))}
				</ol>
			) : null}

			{enviando ? (
				<p className="mt-4 flex items-center gap-2 text-[12px] text-slate-500">
					<Loader2 className="h-3.5 w-3.5 animate-spin" />O time está lendo o
					dossiê para te responder…
				</p>
			) : null}

			{/* Só na primeira: depois disso o aluno já sabe o que quer perguntar. */}
			{trocas.length === 0 && !acabou ? (
				<div className="mt-4 flex flex-wrap gap-2">
					{SUGESTOES[tipo].map((s) => (
						<button
							key={s}
							type="button"
							onClick={() => {
								setTexto(s);
								campo.current?.focus();
							}}
							className="rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-slate-400 transition-colors hover:border-white/25 hover:text-[var(--screen-accent)]"
						>
							{s}
						</button>
					))}
				</div>
			) : null}

			<div className="mt-4 flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 transition-colors focus-within:border-white/25">
				<textarea
					ref={campo}
					value={texto}
					rows={2}
					maxLength={500}
					disabled={acabou || enviando}
					onChange={(e) => setTexto(e.target.value)}
					aria-label="Sua pergunta sobre o dossiê"
					onKeyDown={(e) => {
						// `isComposing`: o Enter que confirma candidato de IME ou sugestão
						// de teclado de celular NÃO pode enviar — aqui isso queima uma das
						// perguntas inclusas, que não tem como repor.
						if (
							e.key === 'Enter' &&
							!e.shiftKey &&
							!e.nativeEvent.isComposing
						) {
							e.preventDefault();
							enviar();
						}
					}}
					placeholder={
						acabou
							? 'Suas perguntas desta análise acabaram.'
							: 'Escreva sua pergunta sobre o dossiê…'
					}
					className="min-h-[3rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] leading-relaxed text-slate-200 placeholder:text-slate-600 focus:outline-none disabled:opacity-50"
				/>
				<button
					type="button"
					onClick={enviar}
					disabled={enviando || acabou || curta}
					aria-label="Enviar pergunta"
					className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#08080a] transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
					style={{ backgroundColor: 'var(--screen-accent)' }}
				>
					{enviando ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Send className="h-4 w-4" />
					)}
				</button>
			</div>

			<div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-600">
				<span>
					{acabou
						? 'Rode uma nova análise para perguntar de novo.'
						: 'Enter envia · Shift+Enter quebra linha'}
				</span>
				{texto ? (
					<span className="shrink-0 font-mono tabular-nums">
						{texto.length}/500
					</span>
				) : null}
			</div>
		</section>
	);
}
