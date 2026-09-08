/**
 * O ATELIÊ — os tipos que a tela inteira compartilha.
 *
 * A ferramenta mudou de pergunta: antes ela perguntava QUAL OPERAÇÃO TÉCNICA o
 * aluno queria (variação, máscara, textura repetível), que é jargão de designer;
 * agora ele sobe a foto do produto, diz o que quer vender e recebe a peça pronta
 * com a cara da empresa dele. Um time de especialistas (`ai.art_team`, main API)
 * lê a foto, a marca cadastrada e os anúncios de referência e escreve o PROMPT;
 * o gerador de imagem vem depois, no nó seguinte do pipeline.
 *
 * ┌─ AS DUAS REGRAS QUE ESTE ARQUIVO EXISTE PARA SUSTENTAR ──────────────────┐
 * │ ① A TELA NÃO CONHECE "post" NEM "anuncio" PELO NOME. Os caminhos são     │
 * │    DADO (`ui.atelie.entregas[]` na definition) e cada cartão carrega      │
 * │    tudo o que o run daquele caminho precisa. A tela COPIA — ver           │
 * │    `EntregaCard` e `entregasDaDefinition`. Um caminho novo criado na      │
 * │    Fábrica amanhã aparece sozinho, sem deploy do front — e um caminho     │
 * │    APAGADO some sozinho, que foi o que aconteceu com "Arte para gravar".  │
 * │                                                                          │
 * │ ② TODO ESPECIALISTA PAGO PRECISA DE PONTO DE RENDER. Um especialista que  │
 * │    roda, é cobrado e não aparece é dinheiro queimado em silêncio (isso    │
 * │    reprovou quatro rodadas da Central de Inteligência). Por isso           │
 * │    `agentes` é o contrato GENÉRICO e obrigatório de `SaidaDoAtelie`, e os │
 * │    campos nomeados (`ficha_produto`, `direcao_arte`, …) são só ATALHOS,   │
 * │    todos opcionais: se o admin renomear uma chave do roster, o atalho     │
 * │    some e o cartão daquele especialista continua de pé.                   │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Nada aqui importa React nem serviço: é tipo e função pura, para poder ser lido
 * pelo hook do stream, pelos cartões da mesa e pela tela do resultado sem
 * ninguém arrastar ninguém para dentro do próprio bundle.
 */

/* ═══════════════════ as três ondas ═══════════════════ */

/**
 * A ONDA em que um especialista roda — e, por consequência, o lugar dele na mesa.
 *
 * `descoberta`     lê o material cru: a foto, a marca, os anúncios de referência;
 * `aprofundamento` recebe o que a descoberta levantou e decide a arte e o texto;
 * `sintese`        lê as duas anteriores e escreve o pedido final da imagem.
 *
 * As barreiras são REAIS no motor (a onda 2 só começa quando a 1 fecha), e é por
 * isso que a mesa pode desenhar três faixas sem encenar nada.
 */
export type FaseAtelie = 'descoberta' | 'aprofundamento' | 'sintese';

/** Ordem de execução. Serve para agrupar a mesa sem hard-code no componente. */
export const ORDEM_DAS_ONDAS: readonly FaseAtelie[] = [
	'descoberta',
	'aprofundamento',
	'sintese',
] as const;

/**
 * `pesquisa` é o nome ANTIGO da onda 1 e continua chegando pelo stream: está
 * gravado nos registros de roster criados antes das três ondas. Traduzir aqui é o
 * que dispensa migração — o dado velho continua válido e quer dizer o mesmo.
 *
 * Qualquer outro valor cai em `descoberta` DE PROPÓSITO. Um especialista com a
 * fase corrompida tem que aparecer na mesa mesmo assim: sumir com quem o aluno
 * pagou para ver é o defeito mais caro desta ferramenta.
 *
 * (A Central tem uma função idêntica dentro de `intel/war-room.tsx`. Ela não é
 * importada aqui de propósito: aquele arquivo é um componente cliente de 70 KB
 * com animações, e arrastá-lo para o bundle do Ateliê por causa de três linhas
 * seria pagar caro por não repetir uma cadeia de `if`.)
 */
export function normalizarFase(v: unknown): FaseAtelie {
	if (v === 'sintese') return 'sintese';
	if (v === 'aprofundamento') return 'aprofundamento';
	return 'descoberta';
}

/* ═══════════════════ os caminhos (passo 1) ═══════════════════ */

/**
 * UM CARTÃO DE `ui.atelie.entregas[]` — o caminho que o aluno clica no passo 1.
 *
 * Hoje são três (post, anúncio de marketplace, foto em cena), mas a tela não
 * sabe disso: ela desenha o que vier e, no run, COPIA os campos deste objeto
 * para os inputs correspondentes:
 *
 *   `value`        → `input.entrega`        (filtra o roster e alimenta `{entrega}`)
 *   `frase`        → `input.entrega_frase`  ("um post para redes sociais" — é ela
 *                                            que entra no pedido de cada
 *                                            especialista; o slug sozinho produz
 *                                            "uma arte de post", que o modelo
 *                                            copia torto para dentro do prompt)
 *   `modo_geracao` → `input.modo_geracao`   (os três cartões de hoje mandam
 *                                            `texto_imagem`; quem usa
 *                                            `vetorizavel` é o AJUSTE "Deixar
 *                                            pronta para gravar", sobre a arte
 *                                            já pronta)
 *   `aspecto`      → `input.aspect`, como SUGESTÃO — o aluno troca o formato depois.
 *
 * `modo_geracao` é `string`, e não uma união fechada, pelo mesmo motivo de sempre:
 * a tela copia, não decide. Hoje o motor conhece `texto_imagem` e `vetorizavel`;
 * um terceiro modo criado na definition tem que atravessar esta tela intacto.
 *
 * `aviso` é OPCIONAL e hoje nenhum cartão traz um — quem trazia era "Arte para
 * gravar", que saiu. O campo fica: é como um caminho futuro avisa que entrega
 * algo diferente do que o cartão sugere, sem precisar de código novo aqui.
 */
export interface EntregaCard {
	value: string;
	label: string;
	icon: string;
	aspecto: string;
	frase: string;
	modo_geracao: string;
	hint: string;
	aviso?: string;
}

function texto(v: unknown): string {
	return typeof v === 'string' ? v.trim() : '';
}

function objeto(v: unknown): Record<string, unknown> | null {
	return v && typeof v === 'object' && !Array.isArray(v)
		? (v as Record<string, unknown>)
		: null;
}

/**
 * Lê os caminhos da definition. NUNCA lança e NUNCA devolve item pela metade.
 *
 * O parâmetro é a definition INTEIRA (o que `useToolDefinition` devolve), não o
 * `ui`: `{ definition?: unknown }` é um "weak type" para o TypeScript, então
 * passar o objeto errado por engano vira erro de compilação em vez de uma lista
 * vazia silenciosa — que é justamente o modo de falha caro aqui (a tela abre sem
 * nenhum cartão e ninguém consegue começar).
 *
 * Um item só entra se tiver `value` E `label`: sem `value` o run não sabe o que
 * pedir, e sem `label` o cartão não tem o que dizer. `frase`, `aspecto` e
 * `modo_geracao` faltando são degradação aceitável — o bloco cai no slug e o
 * motor no default do input —, então o item continua clicável.
 *
 * Definition velha, `ui.atelie` ausente, `entregas` que não é array, item que não
 * é objeto: tudo resulta em lista vazia ou item pulado. Quem chama decide o que
 * mostrar quando não vier nada (a tela do Ateliê mostra o convite a atualizar a
 * ferramenta, não um erro).
 */
export function entregasDaDefinition(
	def: { definition?: unknown } | null | undefined,
): EntregaCard[] {
	const doc = objeto(def?.definition);
	const ui = objeto(doc?.ui);
	const atelie = objeto(ui?.atelie);
	const lista = atelie?.entregas;
	if (!Array.isArray(lista)) return [];

	const cartoes: EntregaCard[] = [];
	for (const cru of lista) {
		const item = objeto(cru);
		if (!item) continue;
		const value = texto(item.value);
		const label = texto(item.label);
		if (!value || !label) continue;
		const aviso = texto(item.aviso);
		cartoes.push({
			value,
			label,
			icon: texto(item.icon),
			aspecto: texto(item.aspecto),
			frase: texto(item.frase),
			modo_geracao: texto(item.modo_geracao),
			hint: texto(item.hint),
			...(aviso ? { aviso } : {}),
		});
	}
	return cartoes;
}

/* ═══════════════════ os ajustes (sobre o resultado) ═══════════════════ */

/**
 * UM AJUSTE de `ui.atelie.ajustes[]` — o que se pode fazer EM CIMA da arte pronta.
 *
 * ┌─ `custa` NÃO É RÓTULO: É A ROTA ────────────────────────────────────────┐
 * │ `local`  → `POST /api/tool-run/:key/preview`, que NÃO cobra. Hoje é só o │
 * │            `ampliar`: sharp Lanczos no nosso servidor, sem sair da       │
 * │            máquina. Debitar voxxy por isso seria cobrar por nada.        │
 * │ `modelo` → o run normal, COBRADO, pela mesma `tool_key` e pelo mesmo     │
 * │            invoke/settle/refund de sempre.                               │
 * │                                                                          │
 * │ Quem decide de verdade é o servidor (`skipInPreview`, main API): esta    │
 * │ lista é a MESMA informação em forma de tela. Um valor desconhecido cai   │
 * │ no lado PAGO em `ajusteCusta` — a dúvida nunca pende para "de graça".    │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * `pede_texto` é o `superRefine` do bloco de imagem: `variacao` e `vetorizavel`
 * recusam o run sem prompt. Sem este campo a tela deixaria clicar e o motor
 * devolveria "Descreva o que você quer gerar" depois do clique — e, no caminho
 * cobrado, depois do débito.
 */
export interface AjusteCard {
	value: string;
	label: string;
	icon: string;
	/** `'local'` (grátis) ou `'modelo'` (cobrado). Ver a caixa acima. */
	custa: string;
	pede_texto: boolean;
	hint: string;
	placeholder?: string;
}

/** `true` só quando o ajuste é declaradamente local. Desconhecido ⇒ cobra. */
export function ajusteCusta(a: AjusteCard | null | undefined): boolean {
	return a?.custa !== 'local';
}

/**
 * Lê os ajustes da definition. Mesma disciplina de `entregasDaDefinition`:
 * nunca lança, nunca devolve item pela metade, e um item sem `value`/`label`
 * é pulado — um botão sem `value` não sabe o que pedir ao motor.
 */
export function ajustesDaDefinition(
	def: { definition?: unknown } | null | undefined,
): AjusteCard[] {
	const doc = objeto(def?.definition);
	const atelie = objeto(objeto(doc?.ui)?.atelie);
	const lista = atelie?.ajustes;
	if (!Array.isArray(lista)) return [];

	const cartoes: AjusteCard[] = [];
	for (const cru of lista) {
		const item = objeto(cru);
		if (!item) continue;
		const value = texto(item.value);
		const label = texto(item.label);
		if (!value || !label) continue;
		const placeholder = texto(item.placeholder);
		cartoes.push({
			value,
			label,
			icon: texto(item.icon),
			custa: texto(item.custa),
			pede_texto: item.pede_texto === true,
			hint: texto(item.hint),
			...(placeholder ? { placeholder } : {}),
		});
	}
	return cartoes;
}

/**
 * ┌─ "TODOS OS TAMANHOS" (`ui.atelie.todos_os_tamanhos`) ────────────────────┐
 * │ O cartão que aparece ao lado das pílulas de formato. Ele é DADO pela      │
 * │ mesma regra dos caminhos e dos ajustes: a tela não conhece a opção pelo   │
 * │ nome, e uma definition sem esta chave simplesmente não desenha o cartão — │
 * │ o passo do formato continua exatamente o que sempre foi.                  │
 * │                                                                          │
 * │ `aspecto` é o que a tela COPIA para `input.aspect` quando o aluno escolhe │
 * │ "todos": é o formato em que a arte vai ser GERADA, e dele o kit deriva os │
 * │ outros. Sem `aspecto` o cartão não sai — mandar o run com o formato       │
 * │ anterior entregaria um kit derivado do quadro errado, calado.             │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * `null` quando a definition não declara (ou declara pela metade): quem chama
 * decide o que fazer, e no Ateliê a decisão é não desenhar nada.
 */
export interface TodosOsTamanhosCard {
	label: string;
	hint: string;
	/** O formato em que a arte é gerada. Tem de existir em `input.aspect.options`. */
	aspecto: string;
	nota: string;
}

export function todosOsTamanhosDaDefinition(
	def: { definition?: unknown } | null | undefined,
): TodosOsTamanhosCard | null {
	const doc = objeto(def?.definition);
	const t = objeto(objeto(objeto(doc?.ui)?.atelie)?.todos_os_tamanhos);
	if (!t) return null;
	const label = texto(t.label);
	const aspecto = texto(t.aspecto);
	// Sem rótulo o cartão não tem o que dizer; sem `aspecto` ele não sabe em que
	// quadro pedir a arte — e nos dois casos ficar calado é melhor que adivinhar.
	if (!label || !aspecto) return null;
	return { label, aspecto, hint: texto(t.hint), nota: texto(t.nota) };
}

/** O texto do cabeçalho da seção do kit (`ui.atelie.kit`), com padrão. */
export function kitDaDefinition(
	def: { definition?: unknown } | null | undefined,
): {
	titulo: string;
	nota: string;
} {
	const doc = objeto(def?.definition);
	const k = objeto(objeto(objeto(doc?.ui)?.atelie)?.kit);
	return {
		titulo: texto(k?.titulo) || 'O kit desta arte',
		nota: texto(k?.nota),
	};
}

/** Os textos da seção do vídeo (`ui.atelie.video`), com padrão. */
export interface VideoUi {
	titulo: string;
	nota: string;
	/** O que o aluno FAZ com o arquivo — e por que ele é mudo. */
	ajuda: string;
}

export function videoDaDefinition(
	def: { definition?: unknown } | null | undefined,
): VideoUi {
	const doc = objeto(def?.definition);
	const v = objeto(objeto(objeto(doc?.ui)?.atelie)?.video);
	/**
	 * Padrão embutido, e não `null` como no cartão de "Todos os tamanhos": lá a
	 * ausência da chave significa "não ofereça a opção"; aqui quem decide se a
	 * seção existe é o RESULTADO (`saida.video`), não o texto. Uma definition sem
	 * `ui.atelie.video` continua entregando o vídeo — só com a palavra padrão.
	 */
	return {
		titulo: texto(v?.titulo) || 'O anúncio em vídeo',
		nota: texto(v?.nota),
		ajuda: texto(v?.ajuda),
	};
}

/* ═══════════════════ o material que cada um olha ═══════════════════ */

/**
 * AS ENTRADAS DECLARADAS NO ROSTER (o campo `entrada` da coleção `agentes`).
 *
 * Elas moram aqui, e não em cada componente, porque DUAS peças precisam da mesma
 * verdade: a tela indexa as miniaturas por elas (só ela tem os `File` em mãos) e
 * a mesa escolhe por elas a frase de "não recebi este material". Antes de serem
 * compartilhadas, a mesa dizia "sem foto" para o Leitor das REFERÊNCIAS.
 *
 * O acoplamento com o dado do admin é inevitável e conhecido: uma `entrada` nova
 * criada na Fábrica não acha miniatura nem frase própria, e as duas peças caem no
 * degrau neutro (contagem em texto, "sem material"). É degradação, não quebra.
 */
export const ENTRADA_FOTO = 'foto_produto';
export const ENTRADA_REFERENCIAS = 'referencias';

/* ═══════════════════ a mesa de criação (ao vivo) ═══════════════════ */

/**
 * O estado de um cartão da mesa.
 *
 * `esperando` é o cartão que JÁ EXISTE na tela antes de trabalhar: o time inteiro
 * é anunciado de uma vez (`time_montado`) para o aluno ver por quantas pessoas
 * está pagando, não aparecer um por um como se a ferramenta improvisasse.
 */
export type EstadoEspecialista = 'esperando' | 'trabalhando' | 'ok' | 'falhou';

/**
 * UM CARTÃO DA MESA DE CRIAÇÃO, montado a partir dos eventos do stream.
 *
 * `n_imagens` é O QUE AQUELE ESPECIALISTA ESTÁ OLHANDO, e é o campo que impede a
 * mesa de mentir: o cartão do Leitor do Produto mostra a miniatura da foto porque
 * ele recebeu 1 imagem; o do Redator não mostra imagem nenhuma porque ele não viu
 * nenhuma. Ele só é confiável a partir do `agente_iniciou` (o anúncio do time não
 * carrega esse número) — antes disso é 0, que é a leitura honesta de "ainda não
 * começou".
 */
export interface EspecialistaVivo {
	chave: string;
	nome: string;
	icone: string;
	cor: string;
	/** O que ele está fazendo agora, na língua do aluno. Nunca fala de máquina. */
	frase: string;
	fase: FaseAtelie;
	n_imagens: number;
	estado: EstadoEspecialista;
	ms?: number;
	erro?: string;
	/**
	 * A ENTRADA declarada no roster: `foto_produto`, `referencias` ou `nenhuma`.
	 * Diz QUAL material ele olha; `n_imagens` diz QUANTO chegou.
	 */
	olhando?: string;
	/**
	 * Ele pede imagem e não recebeu nenhuma (`sem_foto` no anúncio do time).
	 *
	 * Não é falha: o Leitor do Produto sem foto e o Leitor das Referências sem
	 * referência continuam trabalhando com o texto que o aluno digitou. O cartão
	 * precisa dizer isso — senão a mesa anima uma lupa sobre uma imagem que não
	 * existe.
	 */
	semFoto?: boolean;
	/** Páginas que ele abriu, quando o aluno liga "olhar o que o mercado faz". */
	nFontes?: number;
}

/* ═══════════════════ a saída do run ═══════════════════ */

/** Um especialista no contrato GENÉRICO — o `agentes` do bloco. */
export interface AgenteDaMesa {
	chave: string;
	nome: string;
	icone: string;
	cor: string;
	fase: FaseAtelie;
	ok: boolean;
	ms: number;
	/** A ficha que ele devolveu. `null` quando ele respondeu em prosa. */
	json: unknown;
	/** A prosa, para quem NÃO devolveu JSON. Vazio quando devolveu. */
	texto: string;
	nFontes: number;
	erro: string;
}

/** Quem não entregou, com o motivo em português — a mesa mostra, honesta. */
export interface FalhaDoAtelie {
	chave: string;
	nome: string;
	erro: string;
}

/**
 * UMA PEÇA DO KIT — a mesma arte, recortada para outro formato.
 *
 * `pngBase64` é data URL, não URL de CDN: o kit inteiro sai de UMA geração e não
 * é arquivado peça a peça (arquivar quatro criaria quatro linhas por run em
 * "Minhas artes"). É o `<img>` e é o download.
 */
export interface PecaDoKit {
	formato: string;
	rotulo: string;
	largura: number;
	altura: number;
	pngBase64: string;
	/** `true` na peça cuja proporção já era a da arte gerada. */
	e_a_principal: boolean;
	/**
	 * COMO a peça foi feita — `principal` | `recorte` | `extensao`.
	 *
	 * A tela precisa disto para não prometer a mesma coisa nos três casos: numa
	 * peça `extensao` a beirada foi COMPLETADA a partir da borda da arte (é o que
	 * "todos os tamanhos" autoriza), e aquela faixa não foi composta pelo time.
	 * Dizer é mais honesto do que o aluno descobrir olhando de perto.
	 *
	 * Opcional porque a chave é nova: uma arte gerada antes desta fase e reaberta
	 * do histórico não a tem, e a ausência é lida como "não sei", não como
	 * "recorte".
	 */
	origem_da_peca?: string;
	/** A marca entrou NESTA peça? O recorte pode ter comido a área reservada. */
	logo_aplicado: boolean;
	logo_motivo: string;
}

/**
 * UM FORMATO QUE NÃO SAIU, com o motivo.
 *
 * Isto NÃO é erro e precisa aparecer: um kit que volta com duas peças em vez de
 * quatro, sem explicação, lê-se como defeito. Com o motivo — "neste formato o
 * recorte cortaria o texto ao meio" —, lê-se como critério.
 */
export interface RecusaDoKit {
	formato: string;
	rotulo: string;
	motivo: string;
}

/**
 * O ANÚNCIO EM VÍDEO — a mesma arte, com a câmera andando por cima dela.
 *
 * ┌─ `url` E NÃO BASE64, AO CONTRÁRIO DE TODA IMAGEM DESTA TELA ─────────────┐
 * │ As peças do kit viajam como data URL porque são a resposta imediata de um │
 * │ run e cabem no JSON. O vídeo tem MEGABYTE: 1,3 MB de MP4 viram ~1,8 MB de │
 * │ base64, no mesmo payload que já carrega quatro imagens. E um              │
 * │ `<video src="data:...">` não aceita requisição por faixa — o navegador só │
 * │ toca depois de baixar o arquivo inteiro, e arrastar a linha do tempo      │
 * │ deixa de funcionar. Por isso o bloco sobe o arquivo e devolve o endereço. │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * `ok:false` NÃO É ERRO DA TELA: é o estado normal de um servidor sem `ffmpeg`
 * (a máquina de desenvolvimento, por exemplo). A arte é o produto; o vídeo é o
 * extra. Quando ele não sai, a seção diz por quê em vez de mostrar um player
 * vazio — e o run continua tendo entregue tudo o que foi pago.
 */
export interface VideoDoAnuncio {
	/** URL do MP4 no CDN. Vazia quando o vídeo não saiu. */
	url: string;
	/** Quadro de capa (`<video poster>`), para não ficar um retângulo preto. */
	posterUrl: string;
	/** `story_9x16` | `feed_1x1` — o id técnico, para nomear o arquivo. */
	formato: string;
	/** "Reels e Stories (9:16)" — o nome que o aluno entende. */
	rotulo: string;
	largura: number;
	altura: number;
	duracaoS: number;
	bytes: number;
	ok: boolean;
	/** Em português, nos DOIS casos: por que saiu assim, ou por que não saiu. */
	motivo: string;
	/** Relógio de parede da montagem. Só para o log/diagnóstico, não para a tela. */
	ms: number;
}

/**
 * O QUE O RUN DEVOLVE.
 *
 * `agentes` é o único campo OBRIGATÓRIO, e a razão é a regra ② do topo: ele
 * carrega todos os especialistas que rodaram, inclusive um sétimo que o admin
 * cadastre amanhã. A tela do resultado renderiza A PARTIR DAQUI; os campos
 * nomeados abaixo são atalhos de leitura para os seis de hoje e são TODOS
 * opcionais — um roster editado renomeia um deles sem quebrar nada.
 *
 * ARMADILHA JÁ PAGA UMA VEZ: o `output` da definition é ALLOW-LIST. Uma chave
 * que o bloco emite e a definition não lista é calculada, é PAGA e jogada fora
 * sem erro nenhum. Se um campo aqui estiver sempre `undefined` ao vivo, a
 * suspeita número 1 é a definition, não este tipo.
 *
 * O índice `[k: string]: unknown` no fim é deliberado: uma definition que crescer
 * uma chave nova continua legível sem editar este arquivo.
 */
export interface SaidaDoAtelie {
	/** O contrato genérico da mesa. Obrigatório. */
	agentes: AgenteDaMesa[];

	/* ── a arte (vem dos nós `arte` e `salvar`, não do time) ── */
	/** Base64 do PNG: aparece na tela no instante em que fica pronta. */
	preview?: string;
	/** URL no CDN — é ela que serve para baixar e para a ponte com a Vetorização. */
	url?: string;
	thumb?: string;
	entry_id?: string;

	/* ── atalhos do time (todos opcionais, ver a caixa acima) ── */
	ok_count?: number;
	ficha_produto?: unknown;
	regras_visuais?: unknown;
	referencias_lidas?: unknown;
	direcao_arte?: unknown;
	titulo?: string;
	chamada?: string;
	legenda?: string;
	hashtags?: string[];
	/** A frase que vai DENTRO da arte. Vazio é resposta legítima. */
	texto_na_arte?: string;
	prompt_final?: string;
	prompt_negativo?: string;
	/** Duas ou três linhas do porquê da arte ser assim, para o aluno ler. */
	por_que_assim?: string;
	/**
	 * O NOME da marca que temperou esta arte, ou `''`.
	 *
	 * É a única forma de distinguir "o aluno não cadastrou marca" de "a marca
	 * existe e não chegou" — dois estados que produzem a MESMA arte, e um deles é
	 * defeito.
	 */
	marca_usada?: string;
	falhas?: FalhaDoAtelie[];
	avisos?: string[];

	/* ── a assinatura da marca (F4) ── */
	/**
	 * O LOGO ENTROU NA ARTE? — e `logo_motivo` diz por quê, nos dois casos.
	 *
	 * As duas chaves existem porque "sem logo porque o aluno não cadastrou" e
	 * "sem logo porque o arquivo dele sumiria no preto e branco da peça de corte"
	 * produzem EXATAMENTE a mesma imagem. Sem elas, o aluno não tem como saber se
	 * falta ele fazer alguma coisa.
	 */
	logo_aplicado?: boolean;
	logo_motivo?: string;

	/* ── o kit (F4) ── */
	kit?: PecaDoKit[];
	kit_recusados?: RecusaDoKit[];
	kit_total?: number;
	kit_resumo?: string;

	/**
	 * O ANÚNCIO EM VÍDEO — `undefined` no fluxo `ajustar` (que não tem o nó) e em
	 * qualquer definition ainda não re-semeada. A seção some nesses casos, sem
	 * frase nenhuma: "não houve vídeo aqui" é diferente de "o vídeo falhou", e só
	 * o segundo merece explicação na tela.
	 */
	video?: VideoDoAnuncio;

	/**
	 * A FICHA DO AJUSTE — só chega no fluxo `ajustar`.
	 *
	 * `escala_real` × `escala_pedida` é o que impede o defeito mudo do `ampliar`:
	 * ele tem teto de 4096 px, então um "4×" pedido em cima de uma arte já grande
	 * vira ~1,55×. Antes o aluno pedia quatro vezes maior, recebia uma vez e meia
	 * e não tinha como saber.
	 */
	ajuste?: Record<string, unknown>;
	/**
	 * O custo em dólar do run. NÃO CHEGA MAIS AQUI, e é por isso que ele continua
	 * declarado: a chave saiu da allow-list do `output` na definition justamente
	 * porque estava viajando até o navegador de um aluno que pagou em voxxys —
	 * quem abrisse o devtools calculava a margem do produto. Se ela reaparecer
	 * ao vivo, alguém a recolocou no seed. O lugar dela é o log do servidor.
	 */
	custo_usd?: number;
	tempo_ms?: number;
	/** `mode`, `width`, `height`, `model`, `vectorReady`, `saved`, `save_error`. */
	meta?: Record<string, unknown>;

	[k: string]: unknown;
}

function numero(v: unknown, padrao = 0): number {
	const n = Number(v);
	return Number.isFinite(n) ? n : padrao;
}

function lista(v: unknown): unknown[] {
	return Array.isArray(v) ? v : [];
}

/**
 * A saída crua do run → `SaidaDoAtelie`, sem confiar em nada.
 *
 * Só `agentes` é normalizado de verdade (é o contrato genérico e a tela renderiza
 * por ele); o resto é copiado quando tem o tipo certo e some quando não tem. Um
 * campo ausente é ESTADO NORMAL aqui, não erro: o Redator pode legitimamente não
 * devolver texto para a arte, e a marca pode não existir.
 *
 * Um agente sem `chave` é descartado — sem chave não há como o componente casar o
 * card com o resultado dele. Fora isso, NADA é filtrado: quem falhou entra com
 * `ok: false` e o motivo, porque a mesa mostra quem não entregou.
 */
export function lerSaida(saida: Record<string, unknown> | null): SaidaDoAtelie {
	const o = saida ?? {};

	const agentes: AgenteDaMesa[] = [];
	for (const cru of lista(o.agentes)) {
		const a = objeto(cru);
		const chave = texto(a?.chave);
		if (!a || !chave) continue;
		agentes.push({
			chave,
			nome: texto(a.nome) || chave,
			icone: texto(a.icone),
			cor: texto(a.cor),
			fase: normalizarFase(a.fase),
			ok: a.ok === true,
			ms: numero(a.ms),
			json: a.json ?? null,
			texto: texto(a.texto),
			nFontes: numero(a.n_fontes),
			erro: texto(a.erro),
		});
	}

	const falhas: FalhaDoAtelie[] = [];
	for (const cru of lista(o.falhas)) {
		const f = objeto(cru);
		if (!f) continue;
		const chave = texto(f.chave);
		falhas.push({
			chave,
			nome: texto(f.nome) || chave,
			erro: texto(f.erro),
		});
	}

	const hashtags = lista(o.hashtags).map(String).filter(Boolean);
	const avisos = lista(o.avisos).map(String).filter(Boolean);
	const meta = objeto(o.meta);
	const ajuste = objeto(o.ajuste);

	/**
	 * O KIT, sem confiar em nada. Peça sem imagem é descartada — um card vazio no
	 * lugar de uma peça é pior do que uma peça a menos, e o `kit_resumo` já conta
	 * quantas saíram. `logo_aplicado` ausente lê-se como `false` (não entrou), que
	 * é o lado seguro: melhor a tela dizer "cadastre o logo" a mais do que dizer
	 * "está lá" sobre uma arte que não tem.
	 */
	const kit: PecaDoKit[] = [];
	for (const cru of lista(o.kit)) {
		const p = objeto(cru);
		const b64 = texto(p?.pngBase64);
		if (!p || !b64) continue;
		kit.push({
			formato: texto(p.formato),
			rotulo: texto(p.rotulo) || texto(p.formato),
			largura: numero(p.largura),
			altura: numero(p.altura),
			pngBase64: b64,
			e_a_principal: p.e_a_principal === true,
			/**
			 * COPIADO, e isto já esteve faltando: o campo era declarado no tipo, o
			 * bloco o emitia e o resultado o lia (`origem_da_peca === 'extensao'`),
			 * mas esta função montava a peça campo a campo e o esquecia — o spread
			 * `...o` do fim é do objeto de CIMA, não de cada peça. A linha "bordas
			 * completadas" nunca apareceu, e o aluno descobria a faixa inventada
			 * olhando de perto.
			 */
			origem_da_peca: texto(p.origem_da_peca) || undefined,
			logo_aplicado: p.logo_aplicado === true,
			logo_motivo: texto(p.logo_motivo),
		});
	}

	/**
	 * O VÍDEO, sem confiar em nada — e com a diferença entre AUSENTE e FALHOU.
	 *
	 * A chave inteira ausente (fluxo `ajustar`, definition antiga) devolve
	 * `undefined` e a seção nem existe. Presente com `ok:false`, ela existe e
	 * explica. Um vídeo `ok:true` sem `url` é tratado como falha: player sem
	 * arquivo é pior do que nenhuma seção.
	 */
	const v = objeto(o.video);
	const videoUrl = texto(v?.url);
	const videoMotivo = texto(v?.motivo);
	/**
	 * ┌─ OBJETO VAZIO ≠ VÍDEO QUE FALHOU — e a diferença era um defeito de tela ─┐
	 * │ `output.video` é declarado como LISTA na definition, e `projectOutput`   │
	 * │ MONTA O OBJETO de qualquer jeito: no fluxo `ajustar`, que não tem o nó   │
	 * │ do vídeo, a chave chega como `{url: undefined, ok: undefined, …}` — um   │
	 * │ objeto TRUTHY. Sem esta condição, toda ampliação e toda remoção de fundo │
	 * │ terminaria com "O vídeo não foi montado desta vez" embaixo da arte, num  │
	 * │ fluxo que nunca prometeu vídeo nenhum.                                   │
	 * │                                                                          │
	 * │ A regra é: a seção existe quando há um VÍDEO ou uma EXPLICAÇÃO. Sem os   │
	 * │ dois, não houve vídeo aqui — e disso não se fala.                        │
	 * └──────────────────────────────────────────────────────────────────────────┘
	 */
	const video: VideoDoAnuncio | undefined =
		v && (videoUrl || videoMotivo)
			? {
					url: videoUrl,
					posterUrl: texto(v.poster_url),
					formato: texto(v.formato),
					rotulo: texto(v.rotulo),
					largura: numero(v.largura),
					altura: numero(v.altura),
					duracaoS: numero(v.duracao_s),
					bytes: numero(v.bytes),
					ok: v.ok === true && Boolean(videoUrl),
					motivo: videoMotivo,
					ms: numero(v.ms),
				}
			: undefined;

	const kitRecusados: RecusaDoKit[] = [];
	for (const cru of lista(o.kit_recusados)) {
		const r = objeto(cru);
		const motivo = texto(r?.motivo);
		if (!r || !motivo) continue;
		kitRecusados.push({
			formato: texto(r.formato),
			rotulo: texto(r.rotulo) || texto(r.formato),
			motivo,
		});
	}

	return {
		// O cru viaja junto: uma chave que a definition passar a devolver amanhã já
		// fica legível (`saida.qualquer_coisa`) sem editar este arquivo.
		...o,
		agentes,
		falhas,
		hashtags,
		avisos,
		preview: texto(o.preview) || undefined,
		url: texto(o.url) || texto(o.primary) || undefined,
		thumb: texto(o.thumb) || undefined,
		entry_id: texto(o.entry_id) || undefined,
		ok_count: numero(o.ok_count),
		titulo: texto(o.titulo),
		chamada: texto(o.chamada),
		legenda: texto(o.legenda),
		texto_na_arte: texto(o.texto_na_arte),
		prompt_final: texto(o.prompt_final),
		prompt_negativo: texto(o.prompt_negativo),
		por_que_assim: texto(o.por_que_assim),
		marca_usada: texto(o.marca_usada),
		custo_usd: numero(o.custo_usd),
		tempo_ms: numero(o.tempo_ms),
		logo_aplicado: o.logo_aplicado === true,
		logo_motivo: texto(o.logo_motivo),
		kit,
		kit_recusados: kitRecusados,
		kit_total: numero(o.kit_total),
		kit_resumo: texto(o.kit_resumo),
		video,
		...(meta ? { meta } : {}),
		...(ajuste ? { ajuste } : {}),
	};
}

/* ═══════════════════ o que o aluno montou ═══════════════════ */

/**
 * O ESTADO DO FORMULÁRIO — o que o aluno montou nos três passos.
 *
 * `produto` e `publico` são as DUAS PERGUNTAS em português ("O que é a sua peça?"
 * e "Para quem é?"). Elas viram `input.pedido`, que hoje é uma STRING JSON — e
 * esconder isso é obrigação da tela: o aluno nunca vê chave de JSON. Quem
 * serializa é o hook do run (`use-atelie-run.ts`), num lugar só.
 *
 * ┌─ `marcaId` NÃO VAI NO RUN, E ISSO JÁ CONFUNDIU GENTE ───────────────────┐
 * │ Quem escolhe a marca é o SERVIDOR: o pipeline tem um `collection.query`  │
 * │ que lê as marcas do aluno e fica com a que tem `principal: true`. Não    │
 * │ existe input de marca. Mandar o id no multipart não faria nada.          │
 * │                                                                          │
 * │ Então a tela que deixa o aluno trocar de marca tem que gravar a escolha  │
 * │ ANTES de rodar, com `usar(id)` do `useMarcaAtiva()` — é essa gravação    │
 * │ que atravessa para o servidor. O campo aqui existe só para a tela saber  │
 * │ o que destacar. (Já foi só `localStorage`: a tela mostrava "em uso" numa │
 * │ marca e a arte saía com outra.)                                          │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * `aspecto` nasce do cartão escolhido e é editável: a sugestão é do caminho, a
 * palavra final é do aluno.
 */
export interface EstadoAtelie {
	/** O cartão clicado no passo 1. `null` = ainda não escolheu. */
	entrega: EntregaCard | null;
	/** A foto do produto dele. Sem ela a arte é genérica, mas o run funciona. */
	foto: File | null;
	/** Até dois anúncios que ele gostou → `referencia1` e `referencia2`. */
	referencias: File[];
	/** "O que é a sua peça?" */
	produto: string;
	/**
	 * "Para quem é?" — vira `{publico}` na `pergunta` do Redator, e é ele que
	 * decide o título, a chamada e a frase que vai DENTRO da arte. Os outros
	 * cinco especialistas continuam usando o público da MARCA (o da empresa, não
	 * o comprador daquela peça). Antes este campo era descartado em silêncio pelo
	 * interpolador — ver a caixa do campo em `passos.tsx`.
	 */
	publico: string;
	/** Formato pedido (`1:1`, `4:3`, `9:16`…). Começa no `aspecto` do cartão. */
	aspecto: string;
	/** Só para a tela destacar. Ver a caixa acima: NÃO viaja no run. */
	marcaId: string | null;
	/** "Olhar o que o mercado está fazendo" — desligado por padrão, e por decisão. */
	buscarWeb: boolean;
	/**
	 * "Todos os tamanhos" — o aluno pediu a arte em TODAS as dimensões.
	 *
	 * Ele não escolhe um formato E "todos": são a mesma decisão, e por isso este
	 * campo anda junto de `aspecto`. Ligado, `aspecto` passa a ser o do cartão
	 * (`ui.atelie.todos_os_tamanhos.aspecto`, o quadro de onde os outros são
	 * derivados); clicar numa pílula desliga.
	 *
	 * Continua sendo UMA geração — o que ele muda é o KIT, que passa a estender a
	 * arte onde o recorte destruiria a composição em vez de recusar o formato.
	 */
	todosOsTamanhos: boolean;
}

/** O formulário zerado, já com o cartão escolhido e o formato sugerido por ele. */
export function estadoInicialDoAtelie(
	entrega: EntregaCard | null = null,
): EstadoAtelie {
	return {
		entrega,
		foto: null,
		referencias: [],
		produto: '',
		publico: '',
		aspecto: entrega?.aspecto || '1:1',
		marcaId: null,
		buscarWeb: false,
		todosOsTamanhos: false,
	};
}
