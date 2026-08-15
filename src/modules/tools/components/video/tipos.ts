/**
 * O VÍDEO DO ANÚNCIO — os tipos que a tela inteira compartilha.
 *
 * ┌─ AS DUAS REGRAS QUE ESTE ARQUIVO EXISTE PARA SUSTENTAR ──────────────────┐
 * │ ① A TELA NÃO SABE O QUE ESTÁ VENDENDO — ela LÊ. A promessa ("8 segundos, │
 * │    com áudio, marca d'água SynthID"), a comparação com o vídeo grátis e   │
 * │    os movimentos sugeridos vêm de `ui.video` na definition, como dado.    │
 * │    No dia em que o modelo mudar de duração, de trilha ou de marca d'água, │
 * │    a correção é editar um rascunho — não esperar um deploy do front. Uma  │
 * │    promessa que só o deploy conserta é uma promessa que fica errada por   │
 * │    uma semana, numa tela que cobra 12 voxxys.                            │
 * │                                                                          │
 * │ ② NADA AQUI INVENTA PREÇO. O número que a tela mostra é o do              │
 * │    `useToolBilling`, que o lê de `entitlements` (a linha de `public.tools`│
 * │    do upvox). Uma constante `12` escrita no componente seria uma segunda  │
 * │    fonte de verdade que diverge do que o servidor debita — e a tela       │
 * │    mentiria com convicção.                                               │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Nada aqui importa React nem serviço: é tipo e função pura, para poder ser
 * lido pelo hook do run e pelos cartões da tela sem ninguém arrastar ninguém
 * para dentro do próprio bundle.
 */

/* ═══════════════════ leitores tolerantes ═══════════════════ */

function texto(v: unknown): string {
	return typeof v === 'string' ? v.trim() : '';
}

function objeto(v: unknown): Record<string, unknown> | null {
	return v && typeof v === 'object' && !Array.isArray(v)
		? (v as Record<string, unknown>)
		: null;
}

function lista(v: unknown): Record<string, unknown>[] {
	return Array.isArray(v)
		? v.map(objeto).filter((o): o is Record<string, unknown> => o !== null)
		: [];
}

function numero(v: unknown): number {
	const n = typeof v === 'number' ? v : Number(v);
	return Number.isFinite(n) ? n : 0;
}

/* ═══════════════════ o que a definition diz ═══════════════════ */

/** Um item da ficha do produto ("8 segundos", "com áudio", "SynthID"). */
export interface ItemDaEntrega {
	icon: string;
	titulo: string;
	texto: string;
}

/** Uma coluna da comparação grátis × pago. */
export interface ColunaDaComparacao {
	titulo: string;
	preco: string;
	itens: string[];
}

export interface ComparacaoUi {
	gratis: ColunaDaComparacao;
	pago: ColunaDaComparacao;
	nota: string;
}

/** Um movimento sugerido — o texto já vem pronto para o modelo. */
export interface SugestaoDeMovimento {
	value: string;
	label: string;
	texto: string;
}

export interface MovimentoUi {
	titulo: string;
	ajuda: string;
	/** Exemplo mostrado dentro do campo vazio — nunca o valor enviado. */
	placeholder: string;
	/**
	 * `true` quando o campo pode ficar em branco (quem escreve o roteiro é o
	 * Diretor de Movimento, que VÊ a arte). Padrão `true`: o rótulo dizia
	 * "opcional" e o botão exigia texto — dois lados dizendo coisas opostas.
	 */
	opcional: boolean;
	/** A frase anti-remodelagem. Ver `faltaRegraDeOuro`. */
	regraDeOuro: string;
	/** Descrever tipografia foi o que corrompeu o logo na única geração que o fez. */
	avisoTexto: string;
	/** Texto chapado na arte desbota no vídeo — medido em 4 de 4 gerações. */
	avisoManchete: string;
	sugestoes: SugestaoDeMovimento[];
}

export interface ArteUi {
	titulo: string;
	ajuda: string;
	vazio: string;
	avisoProporcao: string;
}

/** Um cartão de formato (`9:16`, `16:9`). O valor viaja verbatim para o run. */
export interface FormatoCard {
	value: string;
	label: string;
	hint: string;
	icon: string;
}

export interface VideoUi {
	titulo: string;
	subtitulo: string;
	entrega: ItemDaEntrega[];
	comparacao: ComparacaoUi;
	movimento: MovimentoUi;
	arte: ArteUi;
	formatos: FormatoCard[];
	espera: { titulo: string; nota: string };
	pronto: { titulo: string; nota: string };
	historico: { titulo: string; vazio: string };
}

/**
 * ┌─ POR QUE TODO CAMPO TEM PADRÃO, E NENHUM É OBRIGATÓRIO ─────────────────┐
 * │ Uma definition mal semeada não pode produzir uma tela MUDA numa          │
 * │ ferramenta paga: sem os textos, o aluno veria botões sem rótulo e um     │
 * │ preço sem explicação — e clicaria assim mesmo. Os padrões abaixo são a   │
 * │ versão mínima honesta do que a ferramenta faz.                          │
 * │                                                                          │
 * │ O que NÃO tem padrão são as LISTAS: `formatos` vazio deixa a tela sem    │
 * │ nenhum cartão para clicar, e é melhor um passo visivelmente vazio (que   │
 * │ alguém conserta no seed) do que um formato inventado aqui que o modelo   │
 * │ não aceita. Mesma regra do Ateliê com `entregas[]`.                     │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
export function videoUiDaDefinition(doc: unknown): VideoUi {
	const ui = objeto(objeto(doc)?.ui);
	const v = objeto(ui?.video);

	const comparacao = objeto(v?.comparacao);
	const movimento = objeto(v?.movimento);
	const arte = objeto(v?.arte);
	const espera = objeto(v?.espera);
	const pronto = objeto(v?.pronto);
	const historico = objeto(v?.historico);

	return {
		titulo: texto(ui?.title) || 'Vídeo do Anúncio',
		subtitulo:
			texto(ui?.subtitle) ||
			'Uma arte sua vira um vídeo curto, pronto para publicar.',

		entrega: lista(v?.entrega).map((i) => ({
			icon: texto(i.icon) || 'Sparkles',
			titulo: texto(i.titulo),
			texto: texto(i.texto),
		})),

		comparacao: {
			gratis: coluna(objeto(comparacao?.gratis), 'O vídeo que já veio da arte'),
			pago: coluna(objeto(comparacao?.pago), 'O vídeo gerado por IA'),
			nota: texto(comparacao?.nota),
		},

		movimento: {
			titulo: texto(movimento?.titulo) || 'Quer pedir algum movimento?',
			ajuda: texto(movimento?.ajuda),
			placeholder: texto(movimento?.placeholder),
			/**
			 * ⚠ Padrão `true`, e não `false`. Uma definition velha (semeada antes
			 * desta chave existir) tem de cair no comportamento CERTO, não no
			 * antigo: com o Diretor de Movimento no pipeline, campo vazio é o
			 * caminho bom — foi ele que escreveu o melhor dos quatro vídeos
			 * medidos. Exigir texto por omissão travaria o botão de quem apagasse.
			 */
			opcional: movimento?.opcional !== false,
			regraDeOuro: texto(movimento?.regra_de_ouro),
			avisoTexto: texto(movimento?.aviso_texto),
			avisoManchete: texto(movimento?.aviso_manchete),
			sugestoes: lista(movimento?.sugestoes)
				.map((s) => ({
					value: texto(s.value),
					label: texto(s.label),
					texto: texto(s.texto),
				}))
				.filter((s) => s.value && s.texto),
		},

		arte: {
			titulo: texto(arte?.titulo) || 'De qual arte?',
			ajuda: texto(arte?.ajuda),
			vazio:
				texto(arte?.vazio) ||
				'Você ainda não tem artes salvas. Crie uma no Estúdio de Imagens e volte aqui.',
			avisoProporcao: texto(arte?.aviso_proporcao),
		},

		formatos: lista(v?.formatos)
			.map((f) => ({
				value: texto(f.value),
				label: texto(f.label),
				hint: texto(f.hint),
				icon: texto(f.icon) || 'Smartphone',
			}))
			.filter((f) => f.value && f.label),

		espera: {
			titulo: texto(espera?.titulo) || 'Gerando o seu vídeo…',
			nota:
				texto(espera?.nota) ||
				'Pode sair desta tela: assim que ficar pronto, o vídeo aparece em "Meus vídeos".',
		},
		pronto: {
			titulo: texto(pronto?.titulo) || 'O seu vídeo',
			nota: texto(pronto?.nota),
		},
		historico: {
			titulo: texto(historico?.titulo) || 'Meus vídeos',
			vazio:
				texto(historico?.vazio) || 'Os vídeos que você gerar aparecem aqui.',
		},
	};
}

function coluna(
	o: Record<string, unknown> | null,
	tituloPadrao: string,
): ColunaDaComparacao {
	return {
		titulo: texto(o?.titulo) || tituloPadrao,
		preco: texto(o?.preco),
		itens: Array.isArray(o?.itens)
			? (o.itens as unknown[]).map(texto).filter(Boolean)
			: [],
	};
}

/* ═══════════════════ a regra de ouro ═══════════════════ */

/**
 * ⚠ O ALUNO APAGOU A FRASE QUE SEGURA O PRODUTO NO LUGAR?
 *
 * "O produto não muda de forma, cor nem acabamento." não é enfeite de prompt:
 * medido, sem ela o modelo REMODELA a peça e o aluno recebe o vídeo de um
 * produto que ele não fabrica — depois de pagar por ele. Como o campo é livre
 * (e tem que ser: quem sabe o que a peça faz é ele), a tela avisa ANTES do
 * clique em vez de corrigir por baixo.
 *
 * Avisar e não impor é deliberado: reescrever o texto de alguém sem pedir é
 * pior do que um vídeo torto, e há casos legítimos (um aluno que QUER a peça se
 * transformando numa animação). O bloco reforça a regra do lado do servidor.
 *
 * A comparação é frouxa de propósito — sem acentos, sem pontuação, minúsculas —
 * porque quem reescreve a frase com as próprias palavras ("o produto não pode
 * mudar de forma, cor ou acabamento") entendeu o recado e não precisa de aviso.
 */
export function faltaRegraDeOuro(
	movimento: string,
	regraDeOuro: string,
): boolean {
	if (!regraDeOuro) return false;
	const nucleo = simplificar(regraDeOuro)
		.split(' ')
		.filter((p) => p.length > 3);
	if (nucleo.length === 0) return false;
	const texto = simplificar(movimento);
	/** Metade das palavras longas da regra presentes já conta como "está lá". */
	const presentes = nucleo.filter((p) => texto.includes(p)).length;
	return presentes < Math.ceil(nucleo.length / 2);
}

function simplificar(s: string): string {
	return s
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/* ═══════════════════ a proporção da arte ═══════════════════ */

/**
 * A ARTE CABE NO FORMATO PEDIDO?
 *
 * ⚠ Medido: uma arte 1:1 com `aspect_ratio:"9:16"` fez o modelo centralizar o
 * quadrado COM TARJA PRETA em cima e embaixo. O bloco hoje reenquadra com fundo
 * desfocado (melhor que a tarja), mas o resultado ainda é pior do que uma arte
 * que já nasceu na proporção certa — e o Estúdio sabe gerar `story_9x16`.
 *
 * Dizer isso ANTES do clique é o que separa "avisado" de "reclamação": depois
 * de pago, explicar por que as laterais estão borradas é desculpa.
 *
 * A tolerância é a MESMA do bloco (0,06 em log de razão): dois números
 * diferentes fariam a tela avisar sobre um reenquadramento que não aconteceu —
 * ou, pior, calar sobre um que aconteceu.
 */
const TOLERANCIA_DE_PROPORCAO = 0.06;

export function precisaReenquadrar(
	largura: number | null,
	altura: number | null,
	aspecto: string,
): boolean {
	const w = numero(largura);
	const h = numero(altura);
	if (w < 1 || h < 1) return false;
	const alvo = razaoDoAspecto(aspecto);
	if (!alvo) return false;
	return Math.abs(Math.log(w / h / alvo)) > TOLERANCIA_DE_PROPORCAO;
}

function razaoDoAspecto(aspecto: string): number | null {
	const [a, b] = aspecto.split(':').map(Number);
	if (!a || !b) return null;
	return a / b;
}

/* ═══════════════════ o resultado do run ═══════════════════ */

/**
 * O QUE A TELA MOSTRA DEPOIS DE PRONTO.
 *
 * As chaves espelham `output` da definition — que é ALLOW-LIST: o que o bloco
 * calcula e o `output` não lista é PAGO e descartado. Por isso este tipo e o
 * `output` do seed mudam na mesma edição.
 */
export interface VideoPronto {
	/** A URL do MP4 no CDN. É o `src` do player. */
	url: string;
	/** O `poster` — sem ele o player abre como um retângulo preto. */
	posterUrl: string;
	/** A arte de origem, para a tela mostrar de onde o vídeo saiu. */
	arteUrl: string;
	formato: string;
	rotulo: string;
	largura: number;
	altura: number;
	duracaoS: number;
	bytes: number;
	comAudio: boolean;
	/** Ressalvas de um vídeo que SAIU (a arte foi reenquadrada, por exemplo). */
	avisos: string[];
	/** O id da linha em "Meus vídeos". */
	entryId: string;
}

/**
 * Lê o `output` do run (ou a linha da coleção, na retomada) — as duas formas
 * caem aqui de propósito.
 *
 * ⚠ NA RETOMADA OS NOMES SÃO OUTROS. O run devolve `video_url`/`poster_url`; a
 * linha da coleção devolve `url`/`poster_url`, porque quem a escreveu foi o
 * `collection.save` com os campos declarados. Aceitar os dois é o que faz "o
 * aluno volta amanhã" mostrar exatamente a mesma tela de "acabou de sair" — sem
 * um segundo componente e sem um segundo caminho de leitura para manter.
 */
export function lerVideoPronto(
	o: Record<string, unknown> | null | undefined,
): VideoPronto | null {
	if (!o) return null;
	const url = texto(o.video_url) || texto(o.url);
	if (!url) return null;

	/**
	 * ⚠ OS DOIS FORMATOS, e não é preciosismo — é o contrato real dos dois nós.
	 *
	 * `video.ai_clip` junta as ressalvas numa STRING (o BlockSpec declara
	 * `avisos: string`, e é como ela viaja para a coleção); `ai.video_prompt`
	 * devolve um ARRAY. A versão anterior só aceitava array, então a ressalva
	 * mais comum de todas — "a sua arte é 1:1 e o vídeo é 9:16, ela entrou com as
	 * sobras desfocadas" — era calculada, gravada e nunca exibida, e o aluno lia
	 * o borrão das laterais como defeito de um vídeo de 12 voxxys.
	 */
	const juntar = (v: unknown): string[] => {
		if (Array.isArray(v)) return (v as unknown[]).map(texto).filter(Boolean);
		const s = texto(v);
		return s ? [s] : [];
	};
	const avisos = juntar(o.avisos);
	/**
	 * As ressalvas do Diretor de Movimento entram na MESMA lista: elas falam do
	 * pedido que o próprio aluno escreveu ("o seu pedido fala de texto na
	 * tela…"), e são as mais acionáveis das duas. Estavam sendo calculadas, pagas
	 * e descartadas até a chave `avisos_pedido` entrar na allow-list do `output`.
	 */
	for (const a of juntar(o.avisos_pedido)) {
		if (!avisos.includes(a)) avisos.push(a);
	}
	/**
	 * O `motivo` do `save_video` entra na mesma lista de ressalvas: ele é a
	 * frase que explica um vídeo que saiu COM ALGUMA COISA A DIZER. Duas listas
	 * separadas produziriam dois blocos de texto quase iguais embaixo do player.
	 */
	const motivo = texto(o.motivo);
	if (motivo && !avisos.includes(motivo)) avisos.push(motivo);

	return {
		url,
		posterUrl: texto(o.poster_url),
		arteUrl: texto(o.arte_url),
		formato: texto(o.formato),
		rotulo: texto(o.rotulo),
		largura: numero(o.largura),
		altura: numero(o.altura),
		duracaoS: numero(o.duracao_s),
		bytes: numero(o.bytes),
		/**
		 * `=== true` e não `Boolean(...)`: a linha da coleção pode devolver a
		 * string `"false"`, e `Boolean('false') === true` é a armadilha clássica
		 * que faria a tela prometer áudio num vídeo mudo.
		 */
		comAudio: o.com_audio === true || o.com_audio === 'true',
		avisos,
		entryId: texto(o.entry_id) || texto(o.id),
	};
}

/* ═══════════════════ formatação ═══════════════════ */

/**
 * `4345678` → `4,1 MB`. Quem vai publicar precisa saber o peso: o Instagram
 * recusa vídeo acima de 100 MB, e é o tipo de coisa que só se descobre na hora
 * errada.
 */
export function tamanhoLegivel(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) return '';
	const mb = bytes / 1_048_576;
	if (mb >= 1) return `${mb.toFixed(1).replace('.', ',')} MB`;
	return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Traduz o que chega do servidor como SLUG.
 *
 * O upvox recusa com códigos (`billing_required`, `insufficient_voxes`) e essas
 * palavras não podem aparecer na tela de quem está tentando publicar um Reels.
 * O que já vem em português passa intacto.
 */
export function mensagemDoAluno(msg: string): string {
	const m = msg.trim();
	if (!m) return 'Não foi possível gerar o vídeo agora.';
	if (m === 'billing_required' || m === 'subscription_required') {
		return 'Assine um plano para usar esta ferramenta.';
	}
	if (m === 'insufficient_voxes' || m === 'insufficient_balance') {
		return 'Saldo de voxxys insuficiente para gerar o vídeo.';
	}
	if (m === 'invalid_invocation' || m === 'invocation_in_use') {
		return 'Este vídeo já está sendo gerado. Aguarde o resultado.';
	}
	if (/^[a-z_]+$/.test(m)) return 'Não foi possível gerar o vídeo agora.';
	return m;
}
