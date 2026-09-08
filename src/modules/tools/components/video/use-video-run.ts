'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useToolBilling } from '../../hooks/use-tool-billing';
import {
	aguardarResultadoSalvo,
	buscarResultadoSalvo,
	runToolStream,
} from '../../services/tool-stream.service';
import { lerVideoPronto, mensagemDoAluno, type VideoPronto } from './tipos';

/**
 * O RUN DO VÍDEO — cobrar, acompanhar por minutos e SOBREVIVER À ABA FECHADA.
 *
 * ┌─ O PROBLEMA QUE ESTE ARQUIVO RESOLVE, EM UMA FRASE ──────────────────────┐
 * │ O aluno PAGA ANTES (o `/invoke` do upvox debita os 12 voxxys e devolve um │
 * │ `invocation_id`) e o trabalho só termina MINUTOS DEPOIS. Entre uma coisa  │
 * │ e outra cabe tudo: o wi-fi cair, o celular dormir, ele trocar de aba, o   │
 * │ proxy do gateway cortar um stream mudo. Nenhum desses eventos pode custar │
 * │ o vídeo dele.                                                            │
 * │                                                                          │
 * │ A resposta NÃO é uma fila nem uma tabela de job. É esta cadeia, que já    │
 * │ existia peça por peça:                                                   │
 * │   ① o pipeline termina em `collection.save`, que grava ANTES de responder;│
 * │   ② a linha carrega o `run_id` que ESTA TELA gerou;                       │
 * │   ③ o `run_id` fica no `localStorage` até o vídeo ser encontrado;         │
 * │   ④ ao voltar, a tela pergunta pelo `run_id` e acha o vídeo — hoje, ou    │
 * │      amanhã, ou de outro aparelho.                                        │
 * │ Trinta linhas no lugar de uma fila, uma tabela de estado e um reaper.     │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ O QUE ESTE ARQUIVO **NÃO** RESOLVE, e não vou fingir que resolve ───────┐
 * │ DUAS ABAS = DOIS VÍDEOS = 24 VOXXYS. O guard de re-entrância abaixo é por │
 * │ COMPONENTE: ele fecha o duplo clique e o clique ansioso, que são o caso   │
 * │ real de todo dia. Duas abas abertas na mesma ferramenta continuam sendo   │
 * │ duas invocações — não existe dedupe por (aluno, tool, pedido) em lugar    │
 * │ nenhum do sistema, e inventar um aqui seria inventar cobrança nova.       │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

/** A coleção onde o pipeline grava — precisa casar com o seed. */
const COLECAO = 'videos';

/**
 * ⚠ A CHAVE DA RETOMADA MORA NO `localStorage`, E NÃO NO ESTADO DO REACT.
 *
 * Estado do React morre com a página, que é EXATAMENTE o caso que precisamos
 * cobrir: o aluno fecha a aba no meio de um run de 12 voxxys. Com a chave em
 * disco, reabrir a ferramenta amanhã ainda sabe qual run procurar.
 *
 * `sessionStorage` não serviria: ele também morre ao fechar a aba.
 */
const CHAVE_DO_RUN = 'estudio_video:run_pendente';

/**
 * Teto da espera passiva na retomada: 6 minutos, o mesmo prazo do bloco. Além
 * dele o run já terá estourado no servidor e sido estornado — continuar
 * perguntando só gastaria requisição.
 */
const TETO_DA_RETOMADA_MS = 360_000;

export type EstadoDoVideo =
	| 'parado'
	| 'rodando'
	/** Reconectou com um run que já estava em curso (aba reaberta). */
	| 'retomando'
	| 'pronto'
	| 'erro';

export interface ProgressoDoVideo {
	/** `enfileirado` → `aguardando` → `baixando`. Vem do bloco. */
	fase: string;
	decorridoS: number;
	prazoS: number;
}

export interface PedidoDeVideo {
	/** `entry_id` da arte na galeria do Ateliê. */
	arteId: string;
	movimento: string;
	aspecto: string;
}

export interface UseVideoRun {
	estado: EstadoDoVideo;
	progresso: ProgressoDoVideo | null;
	video: VideoPronto | null;
	erro: string | null;
	/** `true` quando o acompanhamento caiu mas o run continua no servidor. */
	desconectado: boolean;
	billing: ReturnType<typeof useToolBilling>;
	rodar: (pedido: PedidoDeVideo) => Promise<void>;
	/** Volta para o formulário sem apagar o vídeo de "Meus vídeos". */
	limpar: () => void;
}

export function useVideoRun(toolKey: string): UseVideoRun {
	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;
	/**
	 * `variationCount` fica em 1 de propósito: a definition não declara
	 * `return_variations`, então o upvox cobra `vox_cost × 1` = 12. Passar outro
	 * número aqui faria a TELA mostrar um preço que o servidor não debita.
	 */
	const billing = useToolBilling(toolKey, courseSlug, 1);

	const [estado, setEstado] = useState<EstadoDoVideo>('parado');
	const [progresso, setProgresso] = useState<ProgressoDoVideo | null>(null);
	const [video, setVideo] = useState<VideoPronto | null>(null);
	const [erro, setErro] = useState<string | null>(null);
	const [desconectado, setDesconectado] = useState(false);

	/**
	 * ⚠ GUARD SÍNCRONO, E POR ISSO É `ref` E NÃO ESTADO.
	 *
	 * `billing.pending` só vira `true` depois de um render, e entre o primeiro e
	 * o segundo clique de um duplo clique não há render nenhum. Um `useState`
	 * aqui deixaria passar dois `/invoke` — 24 voxxys e US$ 0,80 de fornecedor
	 * por um vídeo que o aluno pediu uma vez.
	 */
	const rodandoRef = useRef(false);
	const abortRef = useRef<AbortController | null>(null);

	/* ═══════════════════ a retomada ═══════════════════ */

	/**
	 * AO ABRIR A TELA, PROCURA UM RUN PENDENTE.
	 *
	 * Três desfechos, e os três são normais:
	 *  · a linha já existe   → o vídeo aparece pronto, como se nada tivesse
	 *                          acontecido (aluno voltou amanhã);
	 *  · ainda não existe    → entra em `retomando` e fica perguntando até o
	 *                          prazo do bloco (aluno voltou no meio);
	 *  · o prazo estourou    → limpa a chave e não diz nada. O run falhou no
	 *                          servidor e JÁ FOI ESTORNADO lá; anunciar um erro
	 *                          antigo ao abrir a ferramenta assustaria sem motivo.
	 */
	useEffect(() => {
		const pendente =
			typeof window === 'undefined'
				? null
				: window.localStorage.getItem(CHAVE_DO_RUN);
		if (!pendente) return;

		const ctrl = new AbortController();
		let vivo = true;

		(async () => {
			try {
				const achado = await buscarResultadoSalvo(toolKey, COLECAO, pendente);
				if (!vivo) return;
				const pronto = lerVideoPronto(achado);
				if (pronto) {
					window.localStorage.removeItem(CHAVE_DO_RUN);
					setVideo(pronto);
					setEstado('pronto');
					return;
				}

				// Ainda não gravou: o run pode estar em curso agora mesmo.
				setEstado('retomando');
				const tardio = await aguardarResultadoSalvo(
					toolKey,
					COLECAO,
					pendente,
					{
						tetoMs: TETO_DA_RETOMADA_MS,
						signal: ctrl.signal,
					},
				);
				if (!vivo) return;
				const prontoTardio = lerVideoPronto(tardio);
				window.localStorage.removeItem(CHAVE_DO_RUN);
				if (prontoTardio) {
					setVideo(prontoTardio);
					setEstado('pronto');
				} else {
					setEstado('parado');
				}
			} catch {
				/**
				 * Falha de rede na retomada NÃO é erro de tela: o trabalho está no
				 * servidor de qualquer jeito, e a chave fica onde está para a próxima
				 * abertura tentar de novo.
				 */
				if (vivo) setEstado('parado');
			}
		})();

		return () => {
			vivo = false;
			ctrl.abort();
		};
	}, [toolKey]);

	/* ═══════════════════ o run ═══════════════════ */

	const rodar = useCallback(
		async (pedido: PedidoDeVideo) => {
			if (rodandoRef.current) return;
			/**
			 * O gate de saldo é do billing, e o aviso inline (`billing.notice`) já
			 * está na tela dizendo "comprar voxxys". Aqui só não deixamos passar —
			 * um botão que dispara e falha em 402 é o defeito que esta ferramenta já
			 * teve uma vez.
			 */
			if (billing.insufficient) return;

			rodandoRef.current = true;
			setEstado('rodando');
			setProgresso(null);
			setVideo(null);
			setErro(null);
			setDesconectado(false);

			const ctrl = new AbortController();
			abortRef.current = ctrl;

			const runId =
				globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
			/**
			 * ⚠ A CHAVE VAI PARA O DISCO **ANTES** DO `/invoke`, não depois.
			 *
			 * Entre o débito e a primeira resposta cabe um refresh acidental. Se a
			 * chave só fosse gravada no fim, esse refresh deixaria o aluno cobrado e
			 * sem nenhum jeito de reencontrar o vídeo — o pior desfecho possível
			 * numa tool paga. Gravar antes custa uma linha órfã no `localStorage`
			 * quando o run nem começa, e isso não custa nada a ninguém.
			 */
			try {
				window.localStorage.setItem(CHAVE_DO_RUN, runId);
			} catch {
				// Navegador com armazenamento bloqueado: a retomada some, o run não.
			}

			const values: Record<string, unknown> = {
				arte_id: pedido.arteId,
				movimento: pedido.movimento,
				aspecto: pedido.aspecto,
				run_id: runId,
			};

			/**
			 * ⚠ `runEngine` PODE VOLTAR SEM NUNCA CHAMAR O MOTOR — tool view-only,
			 * saldo insuficiente, ou o `/invoke` do upvox recusando com 402/403.
			 * Nesses casos o toast já foi dado lá dentro, mas quem confia só no
			 * `for await` fica com a tela "gerando" para sempre. Este sinalizador é
			 * o que garante que ela sempre sai do limbo.
			 */
			let motorRodou = false;

			await billing.runEngine(async (invocationId) => {
				motorRodou = true;
				try {
					for await (const e of runToolStream({
						key: toolKey,
						runId,
						invocationId,
						signal: ctrl.signal,
						values,
					})) {
						if (e.type === 'progresso') {
							/**
							 * O bloco emite um evento a cada consulta ao fornecedor (~5 s).
							 * Ele é a barra de progresso E o batimento cardíaco do canal: um
							 * stream mudo por minutos é a forma mais cara de descobrir qual é
							 * o timeout padrão do proxy do gateway.
							 */
							if (e.ev.kind === 'video_ia') {
								setProgresso({
									fase: String(e.ev.fase ?? 'aguardando'),
									decorridoS: Number(e.ev.decorrido_s ?? 0),
									prazoS: Number(e.ev.prazo_s ?? 0),
								});
							}
						} else if (e.type === 'done') {
							const pronto = lerVideoPronto(e.output);
							if (pronto) {
								/**
								 * O vídeo chegou pelo socket: a chave de retomada já cumpriu o
								 * papel dela e sai do disco. Deixá-la faria a PRÓXIMA abertura
								 * da tela ressuscitar este vídeo por cima do formulário.
								 */
								window.localStorage.removeItem(CHAVE_DO_RUN);
								setVideo(pronto);
								setEstado('pronto');
							} else {
								/**
								 * `done` sem URL só acontece se o `output` da definition tiver
								 * ficado desalinhado com o pipeline (chave que não existe = ela
								 * é calculada, PAGA e descartada). O vídeo pode estar gravado
								 * na coleção mesmo assim — daí apontar para "Meus vídeos" em
								 * vez de dizer que falhou.
								 */
								setErro(
									'O vídeo foi gerado, mas não voltou para esta tela. Ele está em "Meus vídeos", logo abaixo.',
								);
								setEstado('erro');
							}
						} else if (e.type === 'erro') {
							/**
							 * Erro de negócio (sem saldo, sem plano) ou falha do fornecedor —
							 * que é ESTORNADA no servidor, porque o bloco lança em vez de
							 * entregar vazio. A mensagem pode vir como slug.
							 */
							const msg = mensagemDoAluno(e.message);
							window.localStorage.removeItem(CHAVE_DO_RUN);
							toast.error(msg);
							setErro(msg);
							setEstado('erro');
						}
					}
				} catch {
					/**
					 * ⚠ AQUI SÓ CHEGA FALHA DE REDE, E ELA **NÃO** CANCELA O RUN.
					 *
					 * O `/stream` da main API engole erro de escrita justamente para não
					 * jogar fora um trabalho já cobrado: o vídeo continua sendo gerado,
					 * baixado e GRAVADO na coleção. Por isso a tela não pode dizer
					 * "falhou" — ela avisa que perdeu o ACOMPANHAMENTO e aponta para
					 * "Meus vídeos", que é onde o arquivo vai aparecer.
					 *
					 * A chave de retomada FICA no disco de propósito: é ela que faz a
					 * próxima abertura da tela reencontrar este vídeo.
					 */
					setDesconectado(true);
					setEstado('retomando');

					const tardio = await aguardarResultadoSalvo(toolKey, COLECAO, runId, {
						tetoMs: TETO_DA_RETOMADA_MS,
					});
					const pronto = lerVideoPronto(tardio);
					if (pronto) {
						window.localStorage.removeItem(CHAVE_DO_RUN);
						setVideo(pronto);
						setEstado('pronto');
					} else {
						setEstado('erro');
						setErro(
							'Perdemos o acompanhamento, mas o seu vídeo continua sendo gerado no servidor. Ele aparece em "Meus vídeos" assim que ficar pronto — pode fechar esta página.',
						);
					}
				}
				return null;
			});

			if (abortRef.current !== ctrl) return;
			rodandoRef.current = false;
			abortRef.current = null;

			if (!motorRodou) {
				/**
				 * Nunca houve invocação: nada foi cobrado e nada precisa ser retomado.
				 * Sem toast — `useToolBilling` já mostrou o motivo real (402, 403,
				 * plano), e duplicar viraria dois avisos para o mesmo evento.
				 */
				try {
					window.localStorage.removeItem(CHAVE_DO_RUN);
				} catch {
					// idem
				}
				setEstado('parado');
			}
		},
		[billing, toolKey],
	);

	const limpar = useCallback(() => {
		setVideo(null);
		setErro(null);
		setProgresso(null);
		setDesconectado(false);
		setEstado('parado');
	}, []);

	return {
		estado,
		progresso,
		video,
		erro,
		desconectado,
		billing,
		rodar,
		limpar,
	};
}
