'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useToolBilling } from '../../hooks/use-tool-billing';
import {
	createCollectionEntry,
	uploadCollectionImage,
} from '../../services/collections.service';
import {
	runToolPreview,
	type ToolInputSpec,
} from '../../services/tool-definitions.service';
import { runToolStream } from '../../services/tool-stream.service';
import {
	type AjusteCard,
	ajusteCusta,
	type EspecialistaVivo,
	type EstadoAtelie,
	type FaseAtelie,
	lerSaida,
	normalizarFase,
	ORDEM_DAS_ONDAS,
	type SaidaDoAtelie,
} from './tipos';

/**
 * O RUN DO ATELIÊ — cobrança, stream ao vivo e a mesa de criação.
 *
 * A tela do Ateliê chama só isto: `rodar(estado)` com o que o aluno montou, e lê
 * `especialistas` enquanto o time trabalha e `saida` quando a arte fica pronta.
 * O contrato de cobrança é o MESMO da Central de Inteligência — `useToolBilling`
 * + `runEngine` + `runToolStream` —, e isso não é gosto: existe um único caminho
 * de cobrança no app (invoke no upvox → motor no main API → settle/estorno), e
 * um segundo caminho seria um segundo lugar onde o aluno pode ser cobrado por
 * uma arte que não saiu.
 *
 * ┌─ POR QUE UM HOOK, E NÃO ISTO DENTRO DA TELA ─────────────────────────────┐
 * │ A Central resolveu tudo dentro do componente de 780 linhas, e o preço foi │
 * │ que o estado do stream e o desenho da sala de guerra viraram a mesma      │
 * │ coisa. O Ateliê tem três passos, uma mesa e uma tela de resultado, todos  │
 * │ escritos em paralelo: separar o motor da tela é o que deixa cada peça ser │
 * │ trocada sem tocar nas outras.                                            │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

/**
 * O estado do trabalho, na língua da tela.
 *
 * `erro` cobre DUAS coisas diferentes, e a tela precisa distinguir pelo campo
 * `desconectado`: um erro de verdade (o time não fechou, o saldo acabou) e uma
 * conexão que caiu — que NÃO é erro nenhum, porque o run continua no servidor.
 * Ver `AVISO_DESCONEXAO`.
 */
export type EstadoRun = 'parado' | 'rodando' | 'pronto' | 'erro';

/** Uma faixa da mesa: a onda e quem trabalha nela. */
export interface OndaDaMesa {
	fase: FaseAtelie;
	especialistas: EspecialistaVivo[];
}

/**
 * A FRASE HONESTA DA DESCONEXÃO — e ela é exportada para a tela não inventar
 * outra.
 *
 * O socket cair não cancela nada: o `POST /stream` do main API engole erro de
 * escrita de propósito, o run vai até o fim, a arte é gerada e gravada na galeria
 * do aluno. Dizer "cancelado" seria mentira em cima de trabalho já cobrado.
 *
 * ELA NÃO CITA MAIS O NOME DE UM LUGAR. Citava "Minhas artes", que não existia em
 * página nenhuma do app — a promessa que sustenta "o socket cair não é erro"
 * apontava para o vazio. Quem sabe se aquele lugar existe é a TELA (ela lê
 * `ui.history` da definition), então é ela que completa a frase. Ver
 * `GaleriaDoAtelie`.
 */
export const AVISO_DESCONEXAO =
	'A conexão caiu, mas o trabalho continua: a sua arte é gerada e guardada do mesmo jeito.';

/* ═══════════════════ o erro, na língua do aluno ═══════════════════ */

/**
 * Slugs que o servidor devolve como `message` e que NÃO são frases.
 *
 * O comentário do painel de erro dizia que a mensagem "já vem escrita PARA O
 * ALUNO". Não vem: `res.erro(status, err.message)` (main API,
 * `controllers/tool-run.ts`) repassa literalmente o que o gate de cobrança
 * levantou, e o gate levanta `billing_required` / `invalid_invocation`
 * (`src/lib/upvox-tools.ts`). Numa tela cujo arquivo-irmão proíbe a palavra
 * "modelo", o aluno podia ler `billing_required`.
 */
const ERRO_CONHECIDO: Record<string, string> = {
	billing_required:
		'Não consegui confirmar a cobrança desta arte. Recarregue a página e tente de novo — nada foi cobrado.',
	invalid_invocation:
		'A autorização desta arte expirou antes de o trabalho começar. É só tentar de novo — nada foi cobrado.',
};

/** Um slug de máquina: sem espaço nenhum, do jeito que o back o escreveu. */
const SLUG_CRU = /^[a-z0-9]+(?:[_.-][a-z0-9]+)*$/i;

/**
 * A mensagem do servidor → uma frase que o aluno entende.
 *
 * Três casos, e o último é o que importa: o que NÃO for reconhecido passa
 * adiante intacto, porque a maioria das mensagens desta ferramenta (o 502 do
 * time que não fechou, o texto do gate de plano) já é português de gente e
 * reescrevê-la em cima perderia o motivo real.
 */
export function mensagemDoAluno(bruta: string): string {
	const t = (bruta ?? '').trim();
	if (!t) return 'A arte não saiu desta vez. Tente de novo.';

	const conhecido = ERRO_CONHECIDO[t.toLowerCase()];
	if (conhecido) return conhecido;

	// `input 'aspect' inválido`, `input 'foto' (imagem) é obrigatório` — a recusa
	// do motor por campo. O aluno não montou o payload: a tela montou.
	if (/^input\s+'/i.test(t)) {
		return 'O pedido foi montado de um jeito que a ferramenta não aceitou. Escolha o caminho e o formato de novo — se continuar, avise o suporte.';
	}

	// Instrução endereçada ao ADMIN (o roster vazio manda "cadastre o time na
	// coleção `agentes`"). Não é assunto de quem comprou uma arte.
	if (/coleç(ã|a)o|cadastre o time|nenhum especialista/i.test(t)) {
		return 'O time desta ferramenta ainda não está montado. Não é nada do seu lado — avise o suporte.';
	}

	// Slug cru sobrando: qualquer coisa sem um espaço sequer.
	if (SLUG_CRU.test(t)) {
		return 'A arte não saiu desta vez. Tente de novo — se continuar, avise o suporte.';
	}

	return t;
}

/** Frase de cada onda. É a etapa do run, não o cartão de ninguém. */
const ETAPA_DA_ONDA: Record<FaseAtelie, string> = {
	descoberta: 'Lendo a sua peça, a sua marca e as suas referências',
	aprofundamento: 'Decidindo a direção da arte e escrevendo o texto',
	sintese: 'Fechando o pedido da sua arte',
};

/**
 * Frase de cada nó do pipeline, para a espera nunca ficar muda.
 *
 * O nó `arte` é o mais importante daqui: entre o time terminar e a imagem chegar
 * passam dezenas de segundos em que o bloco de imagem NÃO emite progresso nenhum
 * (ele é uma chamada só). Sem esta frase a mesa fica parada com todos os cartões
 * verdes e o aluno acha que travou justamente no fim.
 */
const ETAPA_DO_NO: Record<string, string> = {
	marca: 'Buscando a identidade da sua marca',
	time: 'Reunindo o time',
	gerar: 'Desenhando a sua arte',
	/**
	 * `arte` é o KIT no fluxo de criar (recorta os formatos e carimba o logo) e o
	 * GERADOR no fluxo de ajustar. A frase serve aos dois de propósito: o aluno
	 * não precisa saber qual bloco está rodando, e nomear o nó pelo papel — "o
	 * último passo de imagem" — é o que faz uma frase só bastar.
	 */
	arte: 'Aplicando a sua marca e montando o kit',
	origem: 'Abrindo a arte que você escolheu',
	salvar: 'Guardando na sua galeria',
};

const ETAPA_INICIAL = 'Preparando…';

/**
 * O QUE A TELA MANDA NUM AJUSTE.
 *
 * `origemId` é o `entry_id` da arte na galeria, e NÃO os bytes: quem busca é o
 * servidor (`collection.image`), que confere o dono antes de baixar. Sem ele
 * não há ajuste — uma arte que não chegou a ser arquivada não tem de onde
 * herdar linhagem, e é justamente a linhagem que o ajuste existe para criar.
 */
export interface PedidoDeAjuste {
	origemId: string;
	ajuste: AjusteCard;
	/** O que o aluno escreveu. Obrigatório quando `ajuste.pede_texto`. */
	texto?: string;
	/** Só o `ampliar`. String porque o bloco valida um enum de strings. */
	fator?: string;
}

export interface UseAtelieRun {
	/** Cobra, abre o stream e roda. Ignora chamada repetida enquanto trabalha. */
	rodar: (estado: EstadoAtelie) => Promise<void>;
	/**
	 * Roda um AJUSTE sobre uma arte pronta. Pela rota NÃO COBRADA quando o
	 * ajuste é local (`ampliar`), pelo run cobrado de sempre quando ele chama o
	 * modelo. Ver `ajustar` no corpo do hook.
	 */
	ajustar: (pedido: PedidoDeAjuste) => Promise<void>;
	/** Para de ACOMPANHAR. Não cancela o run e não devolve voxxys — ver a regra. */
	cancelar: () => void;
	/** Volta para o começo, esquecendo a arte anterior (o "criar outra"). */
	limpar: () => void;
	estado: EstadoRun;
	/**
	 * O trabalho em curso é um AJUSTE, não uma criação.
	 *
	 * A tela precisa saber porque a mesa de criação não serve aqui: um ajuste não
	 * roda o time de seis, e a mesa mostraria "0 / — profissionais" com uma barra
	 * parada — inventando uma equipe que ninguém convocou e ninguém pagou.
	 */
	ajustando: boolean;
	/** A mesa inteira, em ordem de anúncio. Todo especialista pago está aqui. */
	especialistas: EspecialistaVivo[];
	/** A mesma mesa em três faixas — ondas vazias não entram. */
	ondas: OndaDaMesa[];
	/** A onda que está rodando agora. `null` antes do primeiro evento. */
	fase: FaseAtelie | null;
	/** O que está acontecendo, em uma linha. */
	etapa: string;
	/** Relógio de parede do run, em ms. Anda enquanto roda e congela no fim. */
	ms: number;
	saida: SaidaDoAtelie | null;
	erro: string | null;
	/** `true` quando o `erro` é só o socket: o run continua no servidor. */
	desconectado: boolean;
	/**
	 * O trabalho já está DE FATO no servidor — só a partir daqui parar de
	 * acompanhar é seguro. Ver `podeParar` no corpo do hook.
	 */
	podeParar: boolean;
	/** O aviso de custo, o saldo e o gate — renderize `billing.notice` na ação. */
	billing: ReturnType<typeof useToolBilling>;
}

export function useAtelieRun(toolKey: string): UseAtelieRun {
	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;

	/**
	 * ┌─ `variationCount` É 1, E O KIT NÃO MUDA ISSO ───────────────────────────┐
	 * │ O comentário antigo dizia que o kit multi-peça (F4) mudaria ESTE número. │
	 * │ Ele não muda, e o motivo é medido: o `ai.image_studio` DESCARTA          │
	 * │ `variation_count` (o Zod tira a chave desconhecida), então subir para 3  │
	 * │ faria o aluno pagar TRÊS e receber UMA — sem erro em lugar nenhum.       │
	 * │                                                                          │
	 * │ O kit resolveu o problema por outro lado: UMA geração e os outros        │
	 * │ formatos saem dela por recorte, no nosso servidor. Custo medido: 1       │
	 * │ geração = US$ 0,1356 contra US$ 0,4069 de três. O ajuste cobrado usa     │
	 * │ este mesmo 1× — é uma imagem por run, dos dois lados.                    │
	 * └──────────────────────────────────────────────────────────────────────────┘
	 */
	const billing = useToolBilling(toolKey, courseSlug, 1);

	const [estado, setEstado] = useState<EstadoRun>('parado');
	const [especialistas, setEspecialistas] = useState<EspecialistaVivo[]>([]);
	const [fase, setFase] = useState<FaseAtelie | null>(null);
	const [etapa, setEtapa] = useState(ETAPA_INICIAL);
	const [ms, setMs] = useState(0);
	const [saida, setSaida] = useState<SaidaDoAtelie | null>(null);
	const [erro, setErro] = useState<string | null>(null);
	const [desconectado, setDesconectado] = useState(false);
	/** Ver `UseAtelieRun.ajustando`: a mesa de criação não vale para um ajuste. */
	const [ajustando, setAjustando] = useState(false);
	/**
	 * O `POST /stream` JÁ SAIU — e é isto que torna "acompanhar depois" seguro.
	 *
	 * ┌─ A JANELA QUE DEBITAVA SEM NINGUÉM TRABALHAR ───────────────────────────┐
	 * │ A mesa (com o botão "Acompanhar depois") aparecia no mesmo tick em que  │
	 * │ `rodar` começava — ou seja, DURANTE o `invokeTool` do upvox, que já      │
	 * │ debitou o voxxy. Um clique nessa janela (~100–500 ms) abortava o         │
	 * │ controller ANTES de o `fetch` do stream sair: o main API nunca recebia   │
	 * │ o run, então ninguém chamava `settleInvocation` nem `refundInvocation`.  │
	 * │ Resultado: voxxy debitado, invocação `pending` órfã para sempre, zero    │
	 * │ trabalho feito — e a tela voltava para "parado" sem dizer nada.          │
	 * │                                                                          │
	 * │ Enquanto isto for `false` a mesa não oferece o botão. A espera é de      │
	 * │ centésimos de segundo e o run inteiro leva ~2 min.                       │
	 * └──────────────────────────────────────────────────────────────────────────┘
	 */
	const [podeParar, setPodeParar] = useState(false);

	const abortRef = useRef<AbortController | null>(null);
	const inicioRef = useRef(0);
	/**
	 * TRAVA SÍNCRONA de re-entrância. `estado` é state e só atualiza no próximo
	 * render: dois cliques rápidos no botão (ou Enter + clique) passariam os dois
	 * pelo `if (estado === 'rodando')` e o aluno pagaria DUAS artes. A mesma trava
	 * existe no agente da Fábrica, pelo mesmo motivo e com o mesmo prejuízo.
	 */
	const rodandoRef = useRef(false);
	/** Diferencia "o aluno mandou parar" de "a conexão caiu" no mesmo abort. */
	const canceladoRef = useRef(false);

	/**
	 * O relógio anda de segundo em segundo. Não é enfeite: os eventos do stream
	 * chegam em rajadas separadas por dezenas de segundos (uma onda inteira roda
	 * em paralelo e não emite nada até terminar), então sem um tique próprio a
	 * tela congela por longos trechos de um run que está perfeitamente vivo.
	 */
	useEffect(() => {
		if (estado !== 'rodando') return;
		const id = setInterval(() => setMs(Date.now() - inicioRef.current), 1_000);
		return () => clearInterval(id);
	}, [estado]);

	/**
	 * Desmontar a tela fecha o socket — e SÓ o socket. O run segue no servidor,
	 * cobrado, e a arte cai na galeria. Não há nada a estornar aqui.
	 */
	useEffect(() => {
		return () => {
			canceladoRef.current = true;
			abortRef.current?.abort();
		};
	}, []);

	/**
	 * Mexe num cartão da mesa CRIANDO-O se ele não existir.
	 *
	 * O upsert é a regra ② em código: um evento de um especialista que não foi
	 * anunciado (o `time_montado` se perdeu, o admin cadastrou um sétimo, um
	 * proxy comeu um frame) tem que produzir um cartão mesmo assim. O caminho
	 * ingênuo — `map` sobre a lista existente — descarta o evento em silêncio, e
	 * aí um especialista roda, é cobrado e não aparece.
	 */
	const mexer = useCallback(
		(
			chave: string,
			patch: (e: EspecialistaVivo) => EspecialistaVivo,
			nascer: () => EspecialistaVivo,
		) => {
			if (!chave) return;
			setEspecialistas((as) =>
				as.some((a) => a.chave === chave)
					? as.map((a) => (a.chave === chave ? patch(a) : a))
					: [...as, patch(nascer())],
			);
		},
		[],
	);

	/** Um cartão mínimo, para quando o evento chega antes (ou no lugar) do anúncio. */
	const cartaoCru = useCallback(
		(ev: Record<string, unknown>, chave: string): EspecialistaVivo => ({
			chave,
			nome: typeof ev.nome === 'string' && ev.nome ? ev.nome : chave,
			icone: typeof ev.icone === 'string' ? ev.icone : '',
			cor: typeof ev.cor === 'string' ? ev.cor : '',
			frase: typeof ev.frase === 'string' ? ev.frase : '',
			fase: normalizarFase(ev.fase),
			n_imagens: 0,
			estado: 'esperando',
		}),
		[],
	);

	/** Traduz UM evento do stream em estado da mesa. */
	const aplicar = useCallback(
		(ev: Record<string, unknown>) => {
			const kind = String(ev.kind ?? '');

			// O motor carimba de qual nó do pipeline o evento saiu.
			if (kind === 'node_start') {
				const frase = ETAPA_DO_NO[String(ev.node ?? '')];
				if (frase) setEtapa(frase);
				return;
			}

			if (kind === 'time_montado') {
				/**
				 * O TIME INTEIRO VAI PARA A TELA ANTES DE QUALQUER TRABALHO. O aluno
				 * vê por quantos profissionais está pagando de uma vez, em vez de os
				 * cartões brotarem um a um como se a ferramenta improvisasse.
				 *
				 * `n_imagens` não vem aqui de propósito (só o `sem_foto`): quantas
				 * imagens cada um recebeu só se sabe no `agente_iniciou`, depois de o
				 * motor decidir. Nascer com 0 é a leitura honesta de "ainda não olhou".
				 */
				const lista = Array.isArray(ev.agentes) ? ev.agentes : [];
				const mesa: EspecialistaVivo[] = [];
				for (const cru of lista) {
					if (!cru || typeof cru !== 'object') continue;
					const a = cru as Record<string, unknown>;
					const chave = String(a.chave ?? '');
					if (!chave) continue;
					mesa.push({
						chave,
						nome: typeof a.nome === 'string' && a.nome ? a.nome : chave,
						icone: typeof a.icone === 'string' ? a.icone : '',
						cor: typeof a.cor === 'string' ? a.cor : '',
						frase: typeof a.frase === 'string' ? a.frase : '',
						fase: normalizarFase(a.fase),
						n_imagens: 0,
						estado: 'esperando',
						...(typeof a.entrada === 'string' ? { olhando: a.entrada } : {}),
						...(a.sem_foto === true ? { semFoto: true } : {}),
					});
				}
				/**
				 * FUNDE, NÃO SUBSTITUI.
				 *
				 * `setEspecialistas(mesa)` cru devolvia ao estado `esperando` qualquer
				 * cartão que já estivesse `trabalhando`/`ok` — bastava um
				 * `time_montado` reemitido ou fora de ordem para a mesa andar para
				 * trás na frente do aluno. O `mexer` foi escrito exatamente contra o
				 * caso simétrico (evento de quem não foi anunciado); este lado tinha
				 * ficado aberto. Hoje o bloco emite uma vez só e antes das ondas, então
				 * isto é rede — e rede barata.
				 */
				if (mesa.length > 0) {
					setEspecialistas((atuais) => {
						if (atuais.length === 0) return mesa;
						const porChave = new Map(atuais.map((a) => [a.chave, a]));
						return mesa.map((novo) => {
							const velho = porChave.get(novo.chave);
							// O que o anúncio traz é IDENTIDADE (nome, cor, papel); o que já
							// está na tela é PROGRESSO. Nunca se perde progresso.
							return velho
								? { ...novo, ...velho, nome: velho.nome || novo.nome }
								: novo;
						});
					});
				}
				return;
			}

			if (kind === 'onda') {
				const f = normalizarFase(ev.fase);
				setFase(f);
				setEtapa(ETAPA_DA_ONDA[f]);
				return;
			}

			if (kind === 'agente_iniciou') {
				const chave = String(ev.chave ?? '');
				const n = Number(ev.n_imagens);
				const olhando = typeof ev.olhando === 'string' ? ev.olhando : undefined;
				mexer(
					chave,
					(a) => ({
						...a,
						estado: 'trabalhando',
						// O anúncio do time pode ter vindo com nome/cor vazios (roster em
						// edição): o evento de início é a segunda chance de preencher.
						nome: typeof ev.nome === 'string' && ev.nome ? ev.nome : a.nome,
						icone:
							typeof ev.icone === 'string' && ev.icone ? ev.icone : a.icone,
						cor: typeof ev.cor === 'string' && ev.cor ? ev.cor : a.cor,
						frase:
							typeof ev.frase === 'string' && ev.frase ? ev.frase : a.frase,
						fase: ev.fase === undefined ? a.fase : normalizarFase(ev.fase),
						n_imagens: Number.isFinite(n) ? n : a.n_imagens,
						...(olhando ? { olhando } : {}),
					}),
					() => cartaoCru(ev, chave),
				);
				return;
			}

			/**
			 * `agente_concluiu` é o nome que o bloco emite hoje; `agente_terminou`
			 * aparece na documentação do contrato. Aceitar os dois custa uma linha e
			 * evita o pior defeito possível desta tela — um especialista que entregou
			 * ficar girando para sempre porque o nome do evento mudou de lado.
			 */
			if (kind === 'agente_concluiu' || kind === 'agente_terminou') {
				const chave = String(ev.chave ?? '');
				const dur = Number(ev.ms);
				mexer(
					chave,
					(a) => ({
						...a,
						estado: 'ok',
						...(Number.isFinite(dur) ? { ms: dur } : {}),
					}),
					() => cartaoCru(ev, chave),
				);
				return;
			}

			if (kind === 'agente_falhou') {
				const chave = String(ev.chave ?? '');
				/**
				 * O `erro` que chega aqui já é a frase PARA A TELA (o bloco separa a
				 * mensagem técnica, que vai para o log). Renderize-a como está: quem
				 * comprou uma arte não precisa ver "falha na chamada (500)".
				 */
				const msg = typeof ev.erro === 'string' ? ev.erro : '';
				mexer(
					chave,
					(a) => ({ ...a, estado: 'falhou', erro: msg }),
					() => cartaoCru(ev, chave),
				);
				return;
			}

			if (kind === 'agente_retry') {
				/**
				 * A resposta voltou vazia e o servidor está refazendo por outro
				 * caminho. A frase não pode falar de máquina: "Refazendo com outro
				 * modelo" entrega ao aluno a palavra MODELO, que é o vocabulário que
				 * esta tela existe para não usar. Um profissional refaz o trabalho.
				 */
				const chave = String(ev.chave ?? '');
				mexer(
					chave,
					(a) => ({ ...a, frase: 'Refazendo o trabalho…' }),
					() => cartaoCru(ev, chave),
				);
				return;
			}

			if (kind === 'fonte') {
				// Só existe quando o aluno liga "olhar o que o mercado está fazendo":
				// o roster nasce todo com busca desligada.
				const chave = String(ev.chave ?? '');
				mexer(
					chave,
					(a) => ({ ...a, nFontes: (a.nFontes ?? 0) + 1 }),
					() => cartaoCru(ev, chave),
				);
				return;
			}

			if (kind === 'prompt_pronto') {
				setEtapa(ETAPA_DO_NO.arte);
			}
		},
		[mexer, cartaoCru],
	);

	const rodar = useCallback(
		async (form: EstadoAtelie) => {
			if (rodandoRef.current) return;
			// O gate de saldo é do billing; o aviso inline (`billing.notice`) já está
			// na tela dizendo "comprar voxxys". Só não deixamos passar.
			if (billing.insufficient) return;

			rodandoRef.current = true;
			canceladoRef.current = false;
			inicioRef.current = Date.now();
			setAjustando(false);
			setEstado('rodando');
			setEspecialistas([]);
			setFase(null);
			setEtapa(ETAPA_INICIAL);
			setMs(0);
			setSaida(null);
			setErro(null);
			setDesconectado(false);
			setPodeParar(false);

			const ctrl = new AbortController();
			abortRef.current = ctrl;

			/**
			 * O `run_id` é exigido pelo cliente do stream (é por ele que a Central
			 * reencontra um dossiê depois de a aba fechar). NO ATELIÊ ELE AINDA NÃO
			 * RETOMA NADA: a definition não declara um input `run_id` e a galeria não
			 * guarda esse campo, então o valor viaja e é ignorado. Está aqui para o
			 * dia em que a galeria passar a gravá-lo — e para que ninguém prometa
			 * retomada na tela antes disso.
			 */
			const runId =
				globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random());

			/**
			 * `pedido` É JSON, E A TELA ESCONDE ISSO — a serialização mora AQUI, num
			 * lugar só. O bloco recebe `vars` como string JSON e interpola `{produto}`
			 * no pedido de cada especialista; o resolvedor do motor é RASO, então não
			 * há como a definition montar o objeto a partir de dois campos de texto.
			 * Ou chega serializado, ou o que o aluno digitou é DESCARTADO EM SILÊNCIO
			 * (o parser do bloco devolve `{}` para string que não é JSON).
			 *
			 * Chave vazia não entra: o interpolador do bloco já remove o buraco (e a
			 * preposição que sobra), e mandar `""` só engorda o payload.
			 */
			const pedido: Record<string, string> = {};
			if (form.produto.trim()) pedido.produto = form.produto.trim();
			if (form.publico.trim()) pedido.publico = form.publico.trim();

			const entrega = form.entrega;
			const [ref1, ref2] = form.referencias;

			/**
			 * O CARTÃO MANDA. `entrega`, `entrega_frase` e `modo_geracao` são copiados
			 * do que o aluno clicou — a tela não decide nenhum dos três. `aspect` é o
			 * único que ela pode ter mudado, porque o formato é escolha dele.
			 *
			 * `montarForm` (no serviço) PULA `''`, `null` e `undefined`, então campo
			 * em branco simplesmente não viaja e o default do input vale. É por isso
			 * que não há `?? default` nenhum aqui.
			 */
			const values: Record<string, unknown> = {
				entrega: entrega?.value ?? '',
				entrega_frase: entrega?.frase ?? '',
				modo_geracao: entrega?.modo_geracao ?? '',
				aspect: form.aspecto,
				pedido: JSON.stringify(pedido),
				buscar_web: form.buscarWeb ? 'true' : 'false',
				/**
				 * "TODOS OS TAMANHOS" — autoriza o kit a ESTENDER a arte onde o
				 * recorte destruiria a composição, em vez de recusar o formato.
				 *
				 * `'true'`/`'false'` como texto porque o multipart não tem booleano; o
				 * input é `type:'bool'` na definition e o motor converte. Mandar
				 * `String(false)` num input `string` seria a armadilha clássica
				 * (`Boolean('false') === true`) — aqui não é, e é de propósito.
				 *
				 * Ele viaja SEMPRE, inclusive `'false'`: `montarForm` só pula `''`, e
				 * mandar o valor explícito deixa o run legível no log de quem for
				 * investigar por que um kit saiu com quatro peças ou com uma.
				 */
				todos_os_tamanhos: form.todosOsTamanhos ? 'true' : 'false',
			};
			if (form.foto) values.foto = form.foto;
			if (ref1) values.referencia1 = ref1;
			if (ref2) values.referencia2 = ref2;

			/**
			 * ARMADILHA DO BILLING, e ela existe hoje na Central: `runEngine` pode
			 * voltar SEM NUNCA CHAMAR o motor — tool view-only, saldo insuficiente, ou
			 * o invoke no upvox recusando com 402/403. Nesses casos o toast já foi
			 * dado lá dentro, mas quem confia só no `for await` fica com a tela
			 * "trabalhando" para sempre, com uma mesa vazia e nenhum erro visível.
			 * Este sinalizador é o que garante que a tela sempre sai do limbo.
			 */
			let motorRodou = false;

			await billing.runEngine(async (invocationId) => {
				motorRodou = true;
				// A invocação existe e o `fetch` do stream é a próxima instrução: a
				// partir daqui, abortar o socket não deixa mais uma invocação órfã.
				setPodeParar(true);
				try {
					for await (const e of runToolStream({
						key: toolKey,
						runId,
						invocationId,
						signal: ctrl.signal,
						values,
					})) {
						if (e.type === 'progresso') {
							aplicar(e.ev);
						} else if (e.type === 'done') {
							setSaida(lerSaida(e.output));
							setMs(Date.now() - inicioRef.current);
							setEstado('pronto');
						} else if (e.type === 'erro') {
							// Erro de negócio (sem saldo, sem plano) ou o 502 do time que
							// não fechou — que é ESTORNADO no servidor. A mensagem pode vir
							// como SLUG (`billing_required`): `mensagemDoAluno` traduz o que
							// é de máquina e deixa passar o que já é português.
							const msg = mensagemDoAluno(e.message);
							toast.error(msg);
							setErro(msg);
							setMs(Date.now() - inicioRef.current);
							setEstado('erro');
						}
					}
				} catch (err) {
					/**
					 * Aqui só chega falha de REDE (ou o abort). E vale a regra dura: o
					 * socket cair NÃO cancela o run. O `/stream` do main API engole erro
					 * de escrita justamente para não jogar fora um trabalho cobrado — a
					 * arte é gerada e gravada na galeria de qualquer jeito.
					 *
					 * Por isso a tela não pode dizer "cancelado" nem "falhou": ela avisa
					 * que perdeu o ACOMPANHAMENTO e aponta para "Minhas artes".
					 */
					if (canceladoRef.current || (err as Error)?.name === 'AbortError') {
						return null;
					}
					setDesconectado(true);
					setErro(AVISO_DESCONEXAO);
					setMs(Date.now() - inicioRef.current);
					setEstado('erro');
				}
				return null;
			});

			/**
			 * A CAUDA SÓ VALE SE ESTE AINDA FOR O RUN CORRENTE.
			 *
			 * Cenário real: o aluno manda parar e clica "criar" de novo. O run A
			 * ainda está desenrolando o abort quando o B já começou — e a cauda do A,
			 * escrita do jeito ingênuo, zeraria o `rodandoRef` DO B. A partir daí um
			 * único clique passa pela trava de re-entrância e cobra uma segunda arte.
			 * `abortRef` é a identidade do run corrente, então comparar por ele é o
			 * que faz a cauda de um run velho não ter efeito nenhum.
			 */
			if (abortRef.current !== ctrl) return;
			rodandoRef.current = false;
			abortRef.current = null;

			if (!motorRodou) {
				// Sem toast: `useRunTool`/`useToolBilling` já mostraram o motivo real
				// (402, 403, plano). Duplicar viraria dois toasts para o mesmo evento.
				setEstado('parado');
				setEtapa(ETAPA_INICIAL);
			}
		},
		[billing, toolKey, aplicar],
	);

	/* ═══════════════════ os AJUSTES sobre o resultado ═══════════════════ */

	/**
	 * ┌─ AS DUAS ROTAS, E NENHUMA DELAS É NOVA ─────────────────────────────────┐
	 * │ Um ajuste LOCAL (`ampliar`) é sharp Lanczos no nosso servidor: não sai   │
	 * │ da máquina, não chama fornecedor nenhum. Debitar voxxy por isso seria    │
	 * │ cobrar por nada, então ele vai pelo `POST /api/tool-run/:key/preview`,   │
	 * │ que já existe e não cobra.                                              │
	 * │                                                                          │
	 * │ Um ajuste que CHAMA O MODELO (variação, vetorizar, remover fundo) vai    │
	 * │ pelo run normal: mesma `tool_key`, mesmo invoke → settle/refund. Nenhuma │
	 * │ linha de cobrança foi escrita para isto — é o mesmo caminho já provado,  │
	 * │ com um `flow` diferente.                                                │
	 * │                                                                          │
	 * │ QUEM MANDA É O SERVIDOR: `skipInPreview` (main API) só deixa o           │
	 * │ `ai.image_studio` rodar de graça nos modos que `lib/atelie/ajustes.ts`   │
	 * │ declara locais. Se esta tela pedir de graça um modo que não é, o         │
	 * │ servidor tira o nó do pipeline e a resposta volta sem imagem — a tela    │
	 * │ diz que não deu, e ninguém ganha uma chamada paga de brinde.             │
	 * └──────────────────────────────────────────────────────────────────────────┘
	 */

	/**
	 * O que o `/preview` precisa para saber o que é arquivo e o que é texto.
	 *
	 * São os MESMOS quatro inputs que a definition declara para o fluxo
	 * `ajustar`, e nenhum deles é imagem — a arte vai por `origem_id` e quem a
	 * busca é o servidor. Escrevê-los aqui evita arrastar a definition inteira
	 * para dentro deste hook só para o serviço decidir `append` de texto.
	 */
	const AJUSTE_INPUTS = useMemo<Record<string, ToolInputSpec>>(
		() => ({
			origem_id: { type: 'string' },
			modo: { type: 'string' },
			ajuste_texto: { type: 'string' },
			factor: { type: 'string' },
		}),
		[],
	);

	/**
	 * GUARDA A ARTE AMPLIADA NA GALERIA, e é o que fecha o buraco da rota grátis.
	 *
	 * O `/preview` não toca storage nem banco POR CONSTRUÇÃO (é uma rota sem
	 * cobrança e sem limite de uso). Sem este passo, a ampliação apareceria na
	 * tela e sumiria ao fechar a aba — e a árvore de iterações ganharia um galho
	 * que não existe.
	 *
	 * Usa os endpoints de coleção que já existem, na ordem em que o aluno os
	 * usaria à mão: sobe a imagem, cria o registro com `parent_id`. A coleção é
	 * `submissions.who:'student'` + `moderation:'none'` + `visibility:'owner'`,
	 * então ela nasce aprovada e do dono.
	 *
	 * FALHAR AQUI NÃO É ERRO DO AJUSTE. A imagem já está na tela e o botão de
	 * baixar funciona; o que se perde é o arquivamento, e é isso — e só isso —
	 * que a tela avisa.
	 */
	const arquivarAmpliada = useCallback(
		async (
			dataUrl: string,
			origemId: string,
			ajuste: AjusteCard,
		): Promise<{ url: string; entryId: string } | null> => {
			try {
				const resp = await fetch(dataUrl);
				const blob = await resp.blob();
				const arquivo = new File([blob], `ateliê-${ajuste.value}.png`, {
					type: 'image/png',
				});
				const subida = await uploadCollectionImage(toolKey, 'galeria', arquivo);
				const registro = await createCollectionEntry(toolKey, 'galeria', {
					title: `Ampliada — ${new Date().toLocaleDateString('pt-BR')}`,
					data: {
						url: subida.url,
						thumb_url: subida.url,
						modo: ajuste.value,
						...(subida.width ? { largura: subida.width } : {}),
						...(subida.height ? { altura: subida.height } : {}),
						/** A LINHA DA ÁRVORE — o mesmo campo que o pipeline grava. */
						parent_id: origemId,
					},
					visibility: 'owner',
				});
				return { url: subida.url, entryId: registro.id };
			} catch {
				return null;
			}
		},
		[toolKey],
	);

	const ajustar = useCallback(
		async ({ origemId, ajuste, texto, fator }: PedidoDeAjuste) => {
			if (rodandoRef.current) return;
			if (!origemId) {
				toast.error(
					'Esta arte ainda não está na sua galeria, então não dá para ajustá-la. Crie outra e tente de novo.',
				);
				return;
			}
			if (ajuste.pede_texto && !texto?.trim()) {
				toast.error('Escreva o que você quer mudar nesta arte.');
				return;
			}

			const cobra = ajusteCusta(ajuste);
			// O gate de saldo é do billing, e só vale para o caminho cobrado: barrar
			// o `ampliar` por saldo seria cobrar (em atrito) por algo de graça.
			if (cobra && billing.insufficient) return;

			rodandoRef.current = true;
			canceladoRef.current = false;
			inicioRef.current = Date.now();
			setAjustando(true);
			setEstado('rodando');
			/**
			 * A MESA É LIMPA, e isso não é detalhe: um ajuste NÃO roda o time de
			 * seis. Deixar os cartões da criação anterior na tela faria a espera do
			 * "ampliar" parecer o trabalho de seis especialistas que ninguém pagou.
			 */
			setEspecialistas([]);
			setFase(null);
			setEtapa(`${ajuste.label}…`);
			setMs(0);
			setSaida(null);
			setErro(null);
			setDesconectado(false);
			setPodeParar(false);

			const ctrl = new AbortController();
			abortRef.current = ctrl;

			const values: Record<string, unknown> = {
				origem_id: origemId,
				modo: ajuste.value,
			};
			if (texto?.trim()) values.ajuste_texto = texto.trim();
			if (fator) values.factor = fator;

			if (!cobra) {
				/* ── rota NÃO COBRADA ── */
				try {
					const r = await runToolPreview(toolKey, {
						values,
						inputSpec: AJUSTE_INPUTS,
						flow: 'ajustar',
						signal: ctrl.signal,
					});
					if (abortRef.current !== ctrl) return;
					if (!r.preview) {
						/**
						 * Sem imagem quer dizer que o servidor tirou o nó do pipeline —
						 * ou seja, ele NÃO considera este modo local. É exatamente o caso
						 * em que a tela não pode inventar um resultado.
						 */
						const msg =
							'Este ajuste não pôde ser feito por aqui. Tente de novo em instantes — nada foi cobrado.';
						toast.error(msg);
						setErro(msg);
						setEstado('erro');
						return;
					}
					const guardada = await arquivarAmpliada(r.preview, origemId, ajuste);
					if (abortRef.current !== ctrl) return;
					setSaida(
						lerSaida({
							preview: r.preview,
							...(guardada ? { url: guardada.url } : {}),
							...(guardada ? { entry_id: guardada.entryId } : {}),
							meta: { saved: Boolean(guardada) },
						}),
					);
					setMs(Date.now() - inicioRef.current);
					setEstado('pronto');
				} catch (err) {
					if (abortRef.current !== ctrl) return;
					if (canceladoRef.current || (err as Error)?.name === 'AbortError') {
						return;
					}
					const msg = mensagemDoAluno(
						(err as { response?: { data?: { message?: string } } })?.response
							?.data?.message ?? '',
					);
					toast.error(msg);
					setErro(msg);
					setEstado('erro');
				} finally {
					if (abortRef.current === ctrl) {
						rodandoRef.current = false;
						abortRef.current = null;
					}
				}
				return;
			}

			/* ── rota COBRADA: o mesmo caminho do run normal, com outro `flow` ── */
			const runId =
				globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
			let motorRodou = false;

			await billing.runEngine(async (invocationId) => {
				motorRodou = true;
				setPodeParar(true);
				try {
					for await (const e of runToolStream({
						key: toolKey,
						runId,
						invocationId,
						signal: ctrl.signal,
						flow: 'ajustar',
						values,
					})) {
						if (e.type === 'progresso') {
							aplicar(e.ev);
						} else if (e.type === 'done') {
							setSaida(lerSaida(e.output));
							setMs(Date.now() - inicioRef.current);
							setEstado('pronto');
						} else if (e.type === 'erro') {
							const msg = mensagemDoAluno(e.message);
							toast.error(msg);
							setErro(msg);
							setMs(Date.now() - inicioRef.current);
							setEstado('erro');
						}
					}
				} catch (err) {
					if (canceladoRef.current || (err as Error)?.name === 'AbortError') {
						return null;
					}
					setDesconectado(true);
					setErro(AVISO_DESCONEXAO);
					setMs(Date.now() - inicioRef.current);
					setEstado('erro');
				}
				return null;
			});

			if (abortRef.current !== ctrl) return;
			rodandoRef.current = false;
			abortRef.current = null;
			if (!motorRodou) {
				setEstado('parado');
				setEtapa(ETAPA_INICIAL);
			}
		},
		[billing, toolKey, aplicar, AJUSTE_INPUTS, arquivarAmpliada],
	);

	/**
	 * PARAR DE ACOMPANHAR — e a tela precisa dizer exatamente isso.
	 *
	 * Não existe cancelamento: o trabalho já foi autorizado e cobrado, e o
	 * servidor vai até o fim. Um botão escrito "cancelar" aqui prometeria estorno
	 * e produziria a pior reclamação possível ("cancelei e cobraram"). O nome da
	 * função é `cancelar` porque é o verbo do contrato do hook; o RÓTULO na tela
	 * é "sair" / "acompanhar depois", e o texto é o `AVISO_DESCONEXAO`.
	 */
	const cancelar = useCallback(() => {
		if (!rodandoRef.current) return;
		canceladoRef.current = true;
		abortRef.current?.abort();
		abortRef.current = null;
		rodandoRef.current = false;
		setPodeParar(false);
		setEstado('parado');
		setEtapa(ETAPA_INICIAL);
		/**
		 * `especialistas` NÃO é limpo aqui, e isso é o conserto.
		 *
		 * Quem limpa é o `limpar` (o "criar outra arte"). Antes a mesa sumia da
		 * tela no instante em que o aluno mandava parar de acompanhar — os seis
		 * cartões continuavam no estado do hook e nunca mais eram desenhados, num
		 * run JÁ COBRADO. Congelada, ela continua sendo a prova de por quantos
		 * profissionais ele pagou. Ver o ramo da mesa em `index.tsx`.
		 */
	}, []);

	const limpar = useCallback(() => {
		cancelar();
		setEspecialistas([]);
		setFase(null);
		setSaida(null);
		setErro(null);
		setDesconectado(false);
		setPodeParar(false);
		setMs(0);
		setEstado('parado');
	}, [cancelar]);

	/**
	 * A mesa em três faixas, na ordem em que o motor executa. Ondas vazias não
	 * entram: um roster sem ninguém no aprofundamento desenharia uma faixa oca.
	 */
	const ondas = useMemo<OndaDaMesa[]>(() => {
		const faixas: OndaDaMesa[] = [];
		for (const f of ORDEM_DAS_ONDAS) {
			const time = especialistas.filter((e) => e.fase === f);
			if (time.length > 0) faixas.push({ fase: f, especialistas: time });
		}
		return faixas;
	}, [especialistas]);

	return {
		rodar,
		ajustar,
		cancelar,
		limpar,
		estado,
		ajustando,
		especialistas,
		ondas,
		fase,
		etapa,
		ms,
		saida,
		erro,
		desconectado,
		podeParar,
		billing,
	};
}
