'use client';

import {
	AlertTriangle,
	Check,
	ImagePlus,
	Loader2,
	Plus,
	RefreshCw,
	X,
} from 'lucide-react';
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useMarcaAtiva, useMarcaDisponivel } from '../../hooks/use-marca';
import {
	COR_PADRAO,
	iniciais,
	lerMarca,
	type Marca,
	textoSobre,
} from '../../lib/marca';
import { resolveToolIcon } from '../../lib/tool-icons';
import { MarcaForm } from '../marca/marca-form';
import {
	type EntregaCard,
	type EstadoAtelie,
	entregasDaDefinition,
} from './tipos';

/**
 * O ATELIÊ — OS TRÊS PASSOS.
 *
 * ① O que você vai fazer  ② Seu produto  ③ Sua marca
 *
 * Esta ferramenta existe para quem quer UMA ARTE e não quer ler. Ela não pergunta
 * qual operação técnica o aluno quer (variação, máscara, textura repetível): ele
 * sobe a foto do produto dele, diz o que vende, e o time escreve o resto. Por isso
 * a régua destes três componentes é o VOCABULÁRIO, não a densidade: nenhuma
 * palavra de designer, nenhuma chave de JSON, nenhum "modelo".
 *
 * ┌─ AS REGRAS QUE ESTES TRÊS PASSOS EXISTEM PARA CUMPRIR ───────────────────┐
 * │ ① A TELA NÃO CONHECE "post" NEM "anuncio" PELO NOME. O passo 1 desenha o  │
 * │    que vier de `ui.atelie.entregas[]` e COPIA os campos do cartão para o  │
 * │    estado — um caminho criado na Fábrica amanhã aparece sozinho, e um     │
 * │    apagado some sozinho (foi assim que "Arte para gravar" saiu).          │
 * │                                                                          │
 * │ ② `input.pedido` É JSON E O ALUNO NUNCA VÊ ISSO. O passo 2 faz duas       │
 * │    perguntas em português; quem serializa é o hook do run, num lugar só.  │
 * │                                                                          │
 * │ ③ A MARCA QUE VALE É A DO SERVIDOR. O passo 3 grava a escolha com         │
 * │    `usar(id)` (campo `principal` da coleção) em vez de guardá-la só na    │
 * │    tela — já houve a versão em que a tela dizia "em uso" numa marca e a   │
 * │    arte saía com outra, sem erro e sem como desconfiar.                   │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Cada passo é CONTROLADO: recebe o `EstadoAtelie` e um `onMudar`. Nenhum deles
 * abre run, nenhum deles conhece billing e nenhum deles decide navegação — quem
 * monta o stepper, cobra e roda é a tela do Ateliê.
 */

/**
 * O acento da tela, com FALLBACK embutido.
 *
 * `--screen-accent` é definido pelo container da ferramenta (ver `screen-ui.ts`),
 * mas estes passos precisam ficar de pé mesmo renderizados fora dele — num modal,
 * numa prévia, no dia em que alguém reusar o passo 3 em outra tool. O segundo
 * argumento do `var()` é o que garante isso.
 */
const ACENTO = 'var(--screen-accent, #7c3aed)';
/** Fundo tingido do acento — ícone, realce, cartão escolhido. */
const ACENTO_FRACO = `color-mix(in srgb, ${ACENTO} 12%, transparent)`;

const CAMPO_TEXTO =
	'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_45%,transparent)] dark:border-white/10 dark:bg-[#111] dark:text-slate-200';

const BOTAO_PRIMARIO =
	'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60';

/**
 * Teto dos dois campos de texto do passo 2.
 *
 * Não é frescura de banco: o que o aluno escreve entra LITERAL no pedido de seis
 * especialistas. Um parágrafo ali afoga a instrução do papel de cada um e o time
 * volta descrevendo o texto em vez de ler a foto. Cento e quarenta caracteres
 * cabem "caneca de porcelana com nome gravado a laser" com folga.
 */
const MAX_RESPOSTA = 140;

/** Até dois anúncios de referência — é o que o run aceita (`referencia1/2`). */
const MAX_REFERENCIAS = 2;

/** O contrato comum dos três passos. */
export interface PassoProps {
	/** O que o aluno montou até agora. */
	estado: EstadoAtelie;
	/** Aplica um pedaço novo no estado. O pai é quem funde e guarda. */
	onMudar: (patch: Partial<EstadoAtelie>) => void;
}

function tamanho(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Título de passo, para os três lerem igual. */
function Cabecalho({ titulo, linha }: { titulo: string; linha: string }) {
	return (
		<header className="space-y-1">
			<h2 className="text-xl font-bold text-slate-900 dark:text-white">
				{titulo}
			</h2>
			<p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
				{linha}
			</p>
		</header>
	);
}

/* ═══════════════════ ① o que você vai fazer ═══════════════════ */

/**
 * UM CARTÃO DE CAMINHO. Tudo o que ele mostra vem da definition — inclusive o
 * ícone, que chega como nome ('shopping-bag') e é resolvido pelo mesmo caminho
 * que os ícones das tools (`resolveToolIcon` normaliza kebab-case e cai no
 * `Wrench` quando o nome não existe, em vez de sumir com o cartão).
 */
function CartaoEntrega({
	card,
	escolhido,
	onEscolher,
}: {
	card: EntregaCard;
	escolhido: boolean;
	onEscolher: () => void;
}) {
	const Icone = resolveToolIcon(card.icon || 'sparkles');

	return (
		<button
			type="button"
			onClick={onEscolher}
			aria-pressed={escolhido}
			style={escolhido ? { borderColor: ACENTO } : undefined}
			className={`group flex h-full flex-col gap-3 rounded-2xl border-2 bg-white p-5 text-left transition-shadow hover:shadow-md dark:bg-[#1a1a1d] ${
				escolhido
					? 'shadow-md'
					: 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20'
			}`}
		>
			<span className="flex items-center gap-3">
				<span
					className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
					style={{ backgroundColor: ACENTO_FRACO, color: ACENTO }}
				>
					<Icone className="h-6 w-6" />
				</span>
				<span className="min-w-0 flex-1 text-base font-bold text-slate-900 dark:text-white">
					{card.label}
				</span>
				{escolhido ? (
					<span
						className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white"
						style={{ backgroundColor: ACENTO }}
					>
						<Check className="h-3.5 w-3.5" />
					</span>
				) : null}
			</span>

			{card.hint ? (
				<span className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
					{card.hint}
				</span>
			) : null}

			{/*
			 * O AVISO APARECE ANTES, E SEMPRE — não em hover, não depois de gerar.
			 * Nenhum cartão traz um hoje: quem trazia era "Arte para gravar", que
			 * saiu do produto. O render fica porque a razão dele continua de pé —
			 * quando um caminho entrega algo diferente do que o cartão sugere,
			 * descobrir isso DEPOIS custa uma arte paga.
			 */}
			{card.aviso ? (
				<span className="mt-auto flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-[11px] leading-snug text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
					<AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
					<span>{card.aviso}</span>
				</span>
			) : null}
		</button>
	);
}

/**
 * PASSO 1 — quatro cartões grandes, sem jargão, montados a partir da definition.
 *
 * `def` é a definition INTEIRA (o que `useToolDefinition` devolve), e o tipo é
 * fraco de propósito: passar `def.definition.ui` por engano vira erro de
 * compilação em vez de uma tela sem nenhum cartão.
 *
 * Clicar já avança (`onAvancar`) porque escolher o caminho é UMA decisão e um
 * botão "continuar" embaixo de quatro cartões só adiciona um clique a quem já
 * disse o que queria. A escolha continua trocável: voltar ao passo 1 mostra o
 * cartão marcado.
 */
export function PassoEntrega({
	def,
	estado,
	onMudar,
	onAvancar,
}: PassoProps & {
	def: { definition?: unknown } | null | undefined;
	/** Chamado DEPOIS do `onMudar` da escolha. Opcional: o pai é dono da navegação. */
	onAvancar?: () => void;
}) {
	const entregas = useMemo(() => entregasDaDefinition(def), [def]);

	/**
	 * O CARTÃO MANDA: `entrega` guarda o objeto inteiro (o hook do run copia
	 * `value`, `frase` e `modo_geracao` dele) e `aspecto` recebe a SUGESTÃO do
	 * caminho. Sugestão, não regra — o formato é escolha do aluno, e um cartão
	 * sem `aspecto` declarado não pode zerar o que ele já tinha escolhido.
	 */
	const escolher = (card: EntregaCard) => {
		onMudar({ entrega: card, aspecto: card.aspecto || estado.aspecto });
		onAvancar?.();
	};

	return (
		<section className="space-y-5">
			<Cabecalho
				titulo="O que você vai fazer?"
				linha="Escolha onde esta arte vai aparecer. O resto o time resolve."
			/>

			{entregas.length === 0 ? (
				/*
				 * Definition velha ou `ui.atelie` ausente. NÃO é erro do aluno e não
				 * adianta mandá-lo tentar de novo no mesmo segundo: a lista vem da
				 * ferramenta, não da conta dele.
				 */
				<p className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-sm leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
					Os caminhos desta ferramenta ainda não chegaram até aqui. Recarregue a
					página em instantes — se continuar assim, avise o suporte.
				</p>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{entregas.map((card) => (
						<CartaoEntrega
							key={card.value}
							card={card}
							escolhido={estado.entrega?.value === card.value}
							onEscolher={() => escolher(card)}
						/>
					))}
				</div>
			)}
		</section>
	);
}

/* ═══════════════════ ② seu produto ═══════════════════ */

/** A prévia local do arquivo, revogada ao trocar — senão o blob vaza a cada foto. */
function usePreviaLocal(file: File | null): string | null {
	const [url, setUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!file) {
			setUrl(null);
			return;
		}
		const u = URL.createObjectURL(file);
		setUrl(u);
		return () => URL.revokeObjectURL(u);
	}, [file]);

	return url;
}

/**
 * A ÁREA DE SOLTAR — grande quando é a foto do produto (`hero`), discreta quando
 * é um anúncio de referência.
 *
 * O `<input>` fica FORA do botão de propósito (um controle interativo dentro de
 * outro é HTML inválido e alguns leitores de tela ignoram o de dentro), e o botão
 * de remover é irmão do botão grande pelo mesmo motivo.
 */
function Solta({
	titulo,
	ajuda,
	file,
	onEscolher,
	onRemover,
	hero,
}: {
	titulo: string;
	ajuda: string;
	file: File | null;
	onEscolher: (f: File) => void;
	onRemover: () => void;
	hero?: boolean;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [arrastando, setArrastando] = useState(false);
	const [recusado, setRecusado] = useState('');
	const previa = usePreviaLocal(file);

	/**
	 * O input do run é `type:'image'`. Um PDF arrastado aqui viajaria no multipart
	 * e só seria recusado no servidor — depois de o run ter começado. Barrar na
	 * hora custa uma linha e devolve uma frase que o aluno entende.
	 */
	const aceitar = (f: File | null | undefined) => {
		if (!f) return;
		if (!f.type.startsWith('image/')) {
			setRecusado('Isso não parece uma imagem. Mande uma foto (JPG ou PNG).');
			return;
		}
		setRecusado('');
		onEscolher(f);
	};

	const abrir = () => inputRef.current?.click();

	return (
		<div className="space-y-2">
			<div className="relative">
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={(e) => {
						aceitar(e.target.files?.[0]);
						// Zerar permite escolher DE NOVO o mesmo arquivo (o `change` não
						// dispara para um valor igual, e "trocar" pareceria travado).
						e.target.value = '';
					}}
				/>

				<button
					type="button"
					onClick={abrir}
					onDrop={(e) => {
						e.preventDefault();
						setArrastando(false);
						aceitar(e.dataTransfer.files[0]);
					}}
					onDragOver={(e) => {
						e.preventDefault();
						setArrastando(true);
					}}
					onDragLeave={(e) => {
						e.preventDefault();
						setArrastando(false);
					}}
					style={
						arrastando
							? { borderColor: ACENTO, backgroundColor: ACENTO_FRACO }
							: undefined
					}
					className={`group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${
						arrastando
							? ''
							: 'border-slate-300 hover:border-slate-400 dark:border-white/15 dark:hover:border-white/25'
					} ${file ? '' : hero ? 'py-14' : 'py-6'}`}
				>
					{file && previa ? (
						hero ? (
							<>
								{/* <img> intencional: miniatura de um blob local. */}
								<img
									src={previa}
									alt="A foto que você escolheu"
									className="max-h-72 w-full rounded-xl object-contain"
								/>
								<span className="mt-3 flex max-w-full items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
									<Check className="h-4 w-4 shrink-0 text-emerald-500" />
									<span className="truncate">{file.name}</span>
									<span className="shrink-0">· {tamanho(file.size)}</span>
									<span className="ml-1 hidden shrink-0 items-center gap-1 font-medium group-hover:inline-flex">
										<RefreshCw className="h-3.5 w-3.5" />
										Trocar
									</span>
								</span>
							</>
						) : (
							<span className="flex w-full items-center gap-3">
								{/* <img> intencional: miniatura de um blob local. */}
								<img
									src={previa}
									alt=""
									className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-white/10"
								/>
								<span className="min-w-0 flex-1 text-left">
									<span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-200">
										{file.name}
									</span>
									<span className="block text-xs text-slate-500 dark:text-slate-400">
										{tamanho(file.size)}
									</span>
								</span>
								<span className="shrink-0 text-xs font-medium text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">
									Trocar
								</span>
							</span>
						)
					) : (
						<>
							<span
								className={`grid shrink-0 place-items-center rounded-xl ${hero ? 'h-14 w-14' : 'h-10 w-10'}`}
								style={{ backgroundColor: ACENTO_FRACO, color: ACENTO }}
							>
								<ImagePlus className={hero ? 'h-7 w-7' : 'h-5 w-5'} />
							</span>
							<span
								className={`mt-3 font-semibold text-slate-800 dark:text-slate-100 ${hero ? 'text-base' : 'text-sm'}`}
							>
								{titulo}
							</span>
							<span className="mt-1 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
								{ajuda}
							</span>
						</>
					)}
				</button>

				{file ? (
					<button
						type="button"
						onClick={onRemover}
						aria-label={`Remover ${file.name}`}
						className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white/90 text-slate-500 backdrop-blur transition-colors hover:text-rose-600 dark:border-white/10 dark:bg-black/60 dark:text-slate-300"
					>
						<X className="h-4 w-4" />
					</button>
				) : null}
			</div>

			{recusado ? (
				<p className="text-xs text-amber-700 dark:text-amber-400">{recusado}</p>
			) : null}
		</div>
	);
}

/**
 * PASSO 2 — a foto do produto e duas perguntas em português.
 *
 * A foto é a PEÇA CENTRAL da tela, não um campo de formulário: é ela que impede
 * a arte de sair com um produto que não é o do aluno. As duas perguntas viram
 * `input.pedido` (uma string JSON) LÁ NO HOOK DO RUN — aqui elas são só duas
 * caixas de texto com pergunta de gente, e o aluno nunca vê uma chave de JSON.
 *
 * Tudo neste passo é opcional para o motor: sem foto e sem texto o run funciona e
 * a arte sai genérica. A tela diz o que cada coisa melhora, e não bloqueia.
 */
export function PassoProduto({ estado, onMudar }: PassoProps) {
	const idProduto = useId();
	const idPublico = useId();

	/**
	 * Troca uma referência pela posição. `null` remove — e o `splice` é o que
	 * mantém `referencias` sem buracos, porque o hook do run lê por
	 * desestruturação (`const [ref1, ref2] = referencias`): um `undefined` no
	 * meio jogaria a segunda referência fora em silêncio.
	 */
	const trocarReferencia = (i: number, f: File | null) => {
		const proximas = [...estado.referencias];
		if (f) proximas[i] = f;
		else proximas.splice(i, 1);
		onMudar({ referencias: proximas.slice(0, MAX_REFERENCIAS) });
	};

	return (
		<section className="space-y-6">
			<Cabecalho
				titulo="Seu produto"
				linha="Mostre a peça e conte em duas linhas o que ela é. É com isso que o time trabalha."
			/>

			<Solta
				hero
				titulo="Suba a foto do seu produto"
				ajuda="Pode ser foto de celular, tirada agora. Arraste aqui ou clique para escolher. Sem foto a arte sai genérica — com ela, sai com a SUA peça."
				file={estado.foto}
				onEscolher={(f) => onMudar({ foto: f })}
				onRemover={() => onMudar({ foto: null })}
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="space-y-1.5">
					<label
						htmlFor={idProduto}
						className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
					>
						O que é a sua peça?
					</label>
					<input
						id={idProduto}
						type="text"
						autoComplete="off"
						maxLength={MAX_RESPOSTA}
						value={estado.produto}
						onChange={(e) => onMudar({ produto: e.target.value })}
						placeholder="Caneca de porcelana com nome gravado"
						className={CAMPO_TEXTO}
					/>
					<p className="text-xs leading-snug text-slate-500 dark:text-slate-400">
						Poucas palavras. É o que impede o time de confundir a sua peça com
						outra coisa parecida na foto.
					</p>
				</div>

				<div className="space-y-1.5">
					<label
						htmlFor={idPublico}
						className="block text-sm font-semibold text-slate-800 dark:text-slate-100"
					>
						Para quem é?
					</label>
					<input
						id={idPublico}
						type="text"
						autoComplete="off"
						maxLength={MAX_RESPOSTA}
						value={estado.publico}
						onChange={(e) => onMudar({ publico: e.target.value })}
						placeholder="Presente de aniversário para casal"
						className={CAMPO_TEXTO}
					/>
					{/*
					 * A FRASE FOI MEDIDA, não escrita de cabeça — e MUDOU quando o dado
					 * passou a ser lido por alguém.
					 *
					 * A versão anterior avisava que este campo era descartado, e era
					 * verdade: contando os `{marcadores}` do roster (main API,
					 * `scripts/seed-agentes-arte.ts`), `{produto}` aparecia 8 vezes e
					 * `{publico}` NENHUMA — o que o aluno digitava aqui era serializado,
					 * transmitido, cobrado junto e jogado fora pelo interpolador, que só
					 * troca as chaves presentes no texto de cada especialista.
					 *
					 * Agora a `pergunta` do Redator interpola `{publico}` ("para vender
					 * {produto} para {publico}"), e é ela que decide o título, a chamada e
					 * a frase que vai DENTRO da arte. O que sobrou de verdadeiro na frase
					 * antiga é o resto do time: os outros cinco continuam trabalhando com
					 * o público da MARCA — que é o público da EMPRESA, não o comprador
					 * daquela peça. O mesmo marceneiro vende tábua para churrasqueiro e
					 * chaveiro para noiva, e a marca dele tem um público só.
					 *
					 * ⚠ Isto é DADO, não deploy: se alguém tirar `{publico}` da pergunta do
					 * Redator pela tela de coleção, esta ajuda volta a mentir.
					 */}
					<p className="text-xs leading-snug text-slate-500 dark:text-slate-400">
						Opcional, e é o que faz o texto falar de quem compra: entra no
						título, na chamada e na frase que vai dentro da arte. O resto da
						arte continua saindo da marca do passo 3.
					</p>
				</div>
			</div>

			<div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
				<div className="mb-1 flex items-baseline justify-between gap-3">
					<h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
						Viu um anúncio que você gostou?
					</h3>
					<span className="shrink-0 text-xs text-slate-400">
						Opcional · até {MAX_REFERENCIAS}
					</span>
				</div>
				{/*
				 * A FRASE ABAIXO É O CONTRATO DA REFERÊNCIA, e ela precisa estar aqui.
				 * O time olha o anúncio para aprender COMPOSIÇÃO — enquadramento, luz,
				 * onde entra o texto, como a peça é arrumada. Ele não copia cor, logo,
				 * fonte nem nome: isso vem da marca do aluno. Sem dizer isso, alguém
				 * sobe o anúncio de um concorrente esperando "faça igual a esse".
				 */}
				<p className="mb-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
					Suba a peça de alguém que você achou bonita. O time olha só a{' '}
					<strong className="font-semibold text-slate-700 dark:text-slate-200">
						montagem
					</strong>{' '}
					dela — enquadramento, luz, onde o texto entra. Cor, logo e jeito de
					falar continuam sendo os da sua marca, nunca os do anúncio.
				</p>

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{estado.referencias.map((f, i) => (
						<Solta
							key={`${f.name}-${f.size}-${f.lastModified}`}
							titulo="Anúncio de referência"
							ajuda="Arraste ou clique"
							file={f}
							onEscolher={(novo) => trocarReferencia(i, novo)}
							onRemover={() => trocarReferencia(i, null)}
						/>
					))}
					{estado.referencias.length < MAX_REFERENCIAS ? (
						<Solta
							titulo="Um anúncio que você gostou"
							ajuda="Arraste ou clique"
							file={null}
							onEscolher={(novo) =>
								trocarReferencia(estado.referencias.length, novo)
							}
							onRemover={() => undefined}
						/>
					) : null}
				</div>
			</div>
		</section>
	);
}

/* ═══════════════════ ③ sua marca ═══════════════════ */

/**
 * Um cartão da lista de marcas — a identidade DESENHADA, não descrita.
 *
 * É o logo sobre a cor de fundo dela e as três cores em bolinhas, porque é assim
 * que o aluno reconhece a marca dele numa lista de três em meio segundo. Um
 * `<select>` com o nome escrito exigiria que ele lembrasse qual nome deu a qual
 * cadastro.
 *
 * (O cartão da tela "Minha marca" é parecido e continua lá: aquele é de GESTÃO
 * — editar, excluir —, este é de ESCOLHA. Compartilhar os dois deixaria o botão
 * "Editar" no meio do fluxo de criar arte.)
 */
function CartaoMarca({
	marca,
	emUso,
	gravando,
	onUsar,
}: {
	marca: Marca;
	emUso: boolean;
	gravando: boolean;
	onUsar: () => void;
}) {
	const fundo = marca.fundo ?? COR_PADRAO.fundo;
	const primaria = marca.primaria ?? COR_PADRAO.primaria;
	const cores = [marca.primaria, marca.secundaria, marca.fundo].filter(
		(c): c is string => !!c,
	);

	return (
		<button
			type="button"
			onClick={onUsar}
			disabled={gravando}
			aria-pressed={emUso}
			style={emUso ? { borderColor: ACENTO } : undefined}
			className={`overflow-hidden rounded-2xl border-2 bg-white text-left transition-shadow hover:shadow-md disabled:opacity-70 dark:bg-[#1a1a1d] ${
				emUso
					? 'shadow-md'
					: 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20'
			}`}
		>
			<span
				className="flex items-center gap-3 px-4 py-4"
				style={{ backgroundColor: fundo }}
			>
				{marca.logo ? (
					// <img> intencional: URL de CDN que muda a cada envio do logo.
					<img
						src={marca.logo}
						alt=""
						className="h-10 w-10 shrink-0 rounded-lg object-contain"
					/>
				) : (
					<span
						className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold"
						style={{ backgroundColor: primaria, color: textoSobre(primaria) }}
					>
						{iniciais(marca.titulo)}
					</span>
				)}
				<span
					className="min-w-0 flex-1 truncate text-sm font-bold"
					style={{ color: primaria }}
				>
					{marca.titulo || 'Sem nome'}
				</span>
			</span>

			<span className="flex items-center gap-1.5 px-4 py-3">
				{cores.length ? (
					cores.map((c) => (
						<span
							key={c}
							title={c}
							className="h-3.5 w-3.5 rounded-full border border-black/10 dark:border-white/20"
							style={{ backgroundColor: c }}
						/>
					))
				) : (
					<span className="text-xs text-slate-400">Sem cores definidas</span>
				)}

				{gravando ? (
					<span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
						<Loader2 className="h-3 w-3 animate-spin" />
						Salvando
					</span>
				) : emUso ? (
					<span
						className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
						style={{ backgroundColor: ACENTO_FRACO, color: ACENTO }}
					>
						<Check className="h-3 w-3" />
						Nesta arte
					</span>
				) : (
					<span className="ml-auto text-[11px] font-medium text-slate-500 dark:text-slate-400">
						Usar esta
					</span>
				)}
			</span>
		</button>
	);
}

/**
 * PASSO 3 — a marca que vai temperar a arte.
 *
 * ┌─ POR QUE ESTE PASSO ESCREVE NO SERVIDOR ─────────────────────────────────┐
 * │ Não existe input de marca no run: o pipeline tem um `collection.query`    │
 * │ que lê as marcas do aluno e fica com a de `principal: true`. Então        │
 * │ escolher aqui é GRAVAR (`usar(id)`), e não guardar num estado. Enquanto a │
 * │ gravação não volta, o cartão diz "Salvando" — e se ela falhar, a tela     │
 * │ VOLTA o destaque para a marca que o servidor ainda tem, porque mostrar a  │
 * │ marca errada como escolhida é exatamente o defeito que custou uma rodada  │
 * │ inteira (a tela dizia uma coisa e a arte saía com outra).                 │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Sem marca nenhuma o passo vira o CONVITE — e o cadastro acontece AQUI DENTRO,
 * no formulário genérico. Mandar o aluno para `/course/minha-marca` no meio do
 * fluxo seria jogar fora a foto que ele acabou de subir: `File` não sobrevive à
 * navegação.
 *
 * A ferramenta continua funcionando sem marca. Isso é estado NORMAL, não erro:
 * a marca melhora o resultado, não destrava a ferramenta.
 */
export function PassoMarca({
	estado,
	onMudar,
	onGravando,
}: PassoProps & {
	/**
	 * Avisa que a escolha está indo para o servidor.
	 *
	 * Existe para o pai poder segurar o botão "Criar" por um segundo: um clique
	 * em "usar esta" seguido de um clique em criar geraria a arte com a marca
	 * ANTIGA, porque o `PATCH` ainda estava no ar. Opcional — quem não passar
	 * simplesmente não trava nada.
	 */
	onGravando?: (gravando: boolean) => void;
}) {
	const { entries, entry, usar, isLoading, isError } = useMarcaAtiva();
	const { disponivel, isLoading: carregandoDef } = useMarcaDisponivel();

	const [cadastrando, setCadastrando] = useState(false);
	const [gravandoId, setGravandoId] = useState<string | null>(null);
	const [erroTroca, setErroTroca] = useState('');
	/**
	 * A marca recém-cadastrada, esperando a lista alcançá-la.
	 *
	 * `usar(id)` procura o registro na lista JÁ CARREGADA e desiste quando não
	 * acha — e logo depois de salvar o refetch ainda está no ar, então marcar a
	 * marca nova como principal na hora não faria nada (o servidor ficaria com a
	 * principal antiga e a arte sairia com ela). Guardar o id e gravar quando o
	 * registro aparecer é o que fecha esse buraco sem tocar no hook compartilhado.
	 */
	const [recemCriada, setRecemCriada] = useState<string | null>(null);

	const entryId = entry?.id ?? null;
	/** O destaque segue o estado do formulário e cai no que o servidor tem. */
	const selecionada = estado.marcaId ?? entryId;

	const escolher = useCallback(
		async (id: string) => {
			if (!id) return;
			setErroTroca('');
			setGravandoId(id);
			onGravando?.(true);
			// Otimista: o destaque muda na hora, senão o clique parece perdido.
			onMudar({ marcaId: id });
			try {
				await usar(id);
			} catch {
				onMudar({ marcaId: entryId });
				setErroTroca(
					'Não consegui salvar a troca de marca. A arte sairia com a marca anterior — tente de novo antes de criar.',
				);
			} finally {
				setGravandoId(null);
				onGravando?.(false);
			}
		},
		[usar, onMudar, onGravando, entryId],
	);

	/**
	 * O estado do formulário precisa saber qual marca o SERVIDOR tem, senão o
	 * resumo do pai ("vai sair com a marca X") mostra vazio na primeira abertura.
	 *
	 * O `ref` é o que impede a briga: avisamos UMA vez por marca. Se o aluno
	 * escolher outra e a lista ainda não tiver atualizado, o efeito vê que já
	 * avisou daquela e não desfaz a escolha dele.
	 */
	const avisadoRef = useRef<string | null>(null);
	useEffect(() => {
		if (!entryId) return;
		if (estado.marcaId === entryId) {
			avisadoRef.current = entryId;
			return;
		}
		if (avisadoRef.current === entryId) return;
		avisadoRef.current = entryId;
		onMudar({ marcaId: entryId });
	}, [entryId, estado.marcaId, onMudar]);

	/** A marca nova apareceu na lista: agora `usar` encontra o registro. */
	useEffect(() => {
		if (!recemCriada) return;
		if (!entries.some((e) => e.id === recemCriada)) return;
		const id = recemCriada;
		setRecemCriada(null);
		void escolher(id);
	}, [recemCriada, entries, escolher]);

	if (carregandoDef || isLoading) {
		return (
			<section className="space-y-5">
				<Cabecalho
					titulo="Sua marca"
					linha="A arte sai com as cores, o logo e o jeito de falar da sua empresa."
				/>
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
				</div>
			</section>
		);
	}

	if (cadastrando) {
		return (
			<section className="space-y-5">
				<Cabecalho
					titulo="Cadastre a sua marca"
					linha="Uma vez só. Depois disso toda arte já sai com a sua identidade."
				/>
				<MarcaForm
					onClose={() => setCadastrando(false)}
					onSaved={(salvo) => {
						setCadastrando(false);
						// Ver `recemCriada`: gravar como principal só depois de a lista
						// enxergar o registro novo.
						setRecemCriada(salvo.id);
						onMudar({ marcaId: salvo.id });
					}}
					onDeleted={() => setCadastrando(false)}
				/>
			</section>
		);
	}

	return (
		<section className="space-y-5">
			<Cabecalho
				titulo="Sua marca"
				linha="A arte sai com as cores, o logo e o jeito de falar da sua empresa."
			/>

			{isError ? (
				<p className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
					Não consegui carregar as suas marcas agora. Dá para criar mesmo assim
					— a arte sai sem a sua identidade aplicada.
				</p>
			) : null}

			{entries.length === 0 ? (
				/* ── o convite ── */
				<div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#1a1a1d]">
					<h3 className="text-base font-bold text-slate-900 dark:text-white">
						Sua empresa tem uma cara. O time precisa conhecê-la.
					</h3>
					<p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
						Sem isso, cada arte sai de um jeito: outra cor, outro tom, outro
						logo. Você preenche uma vez — logo, cores, jeito de falar e o que a
						sua marca não é — e todas as ferramentas passam a criar com a sua
						identidade.
					</p>

					{disponivel ? (
						<button
							type="button"
							onClick={() => setCadastrando(true)}
							style={{ backgroundColor: ACENTO }}
							className={`${BOTAO_PRIMARIO} mt-5`}
						>
							<Plus className="h-4 w-4" />
							Cadastrar minha marca
						</button>
					) : (
						/*
						 * A coleção não aceita cadastro desta conta. Desenhar um formulário
						 * cujo salvar responderia 403 seria pior do que dizer isso — e o
						 * aluno segue criando sem marca, que continua valendo.
						 */
						<p className="mt-4 rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-500 dark:border-white/10 dark:text-slate-400">
							O cadastro da marca ainda não está liberado na sua conta. A arte
							continua saindo — só não sai com a sua identidade.
						</p>
					)}

					<p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
						Você pode seguir sem marca agora. A arte sai bonita do mesmo jeito —
						só não sai com a sua cara.
					</p>
				</div>
			) : (
				/* ── a escolha ── */
				<>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{entries.map((e) => (
							<CartaoMarca
								key={e.id}
								marca={lerMarca(e)}
								emUso={e.id === selecionada}
								gravando={gravandoId === e.id}
								onUsar={() => void escolher(e.id)}
							/>
						))}
					</div>

					{erroTroca ? (
						<p className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
							{erroTroca}
						</p>
					) : null}

					<div className="flex flex-wrap items-center justify-between gap-3">
						{/*
						 * A frase é literal de propósito: a escolha vale para TODAS as
						 * ferramentas, porque é a mesma marca principal que o Orçamento e a
						 * Central leem. Trocar aqui não é uma preferência desta tela.
						 */}
						<p className="max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
							A arte sai com a marca marcada aqui — e a escolha passa a valer
							também nas outras ferramentas.
						</p>
						{disponivel ? (
							<button
								type="button"
								onClick={() => setCadastrando(true)}
								className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
							>
								<Plus className="h-3.5 w-3.5" />
								Outra marca
							</button>
						) : null}
					</div>
				</>
			)}
		</section>
	);
}
