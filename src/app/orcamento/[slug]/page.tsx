'use client';

import { useQuery } from '@tanstack/react-query';
import {
	AlertTriangle,
	ArrowRight,
	Info,
	MessageCircle,
	ShieldCheck,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { QuotePreview } from '@/modules/orcamento/components/quote-preview';
import { QuoteProgress } from '@/modules/orcamento/components/quote-progress';
import {
	corSegura,
	ERRO_NEUTRO,
	type ErroAmigavel,
	type EstimateResult,
	EXTENSOES,
	erroAmigavel,
	getQuoteLink,
	linkWhatsapp,
	logoSegura,
	MAX_ARQUIVO_MB,
	type MaterialPublico,
	mm,
	NONCE_IDADE_MINIMA_MS,
	postEstimate,
	reais,
} from '@/modules/orcamento/services/public-quote.service';
import { WidgetField } from '@/modules/tools/components/tool-widgets';

/**
 * PÁGINA PÚBLICA DE ORÇAMENTO — quem lê isto é o cliente final do profissional.
 *
 * Ele abriu um link no WhatsApp, no celular, não tem conta aqui, não sabe o que
 * é laser e não vai ler instrução. Três decisões saem daí e explicam o resto do
 * arquivo:
 *
 * 1. FORA DO SHELL. Sem sidebar, sem header do app, sem paleta de comandos. O
 *    branding é do PROFISSIONAL (logo, cor, título); nós aparecemos uma vez, no
 *    rodapé. `AdminLayoutWrapper` já ignora `/orcamento`, e o `AuthGuard` teve
 *    de ganhar o prefixo na lista pública — sem isso a página redireciona um
 *    estranho para `/login`.
 * 2. UMA COLUNA, TRÊS PASSOS. Arquivo → opções → preço. Nada de duas colunas
 *    "que colapsam": o layout de celular é o layout, ponto.
 * 3. NENHUM JARGÃO EM NENHUM ERRO. O backend responde com códigos
 *    (`arquivo_invalido`, `sessao_expirada`, …); a tradução para frase humana
 *    vive em `erroAmigavel`, e status HTTP nunca chega na tela.
 */

type Fase = 'form' | 'enviando' | 'calculando';

const espera = (ms: number) =>
	new Promise<void>((r) => {
		setTimeout(r, ms);
	});

/** Rótulo de uma família de materiais: "3 a 9 mm", "6 mm". */
function faixaDeEspessuras(m: MaterialPublico): string {
	const e = [...m.espessuras].sort((a, b) => a - b);
	if (e.length === 0) return 'sem espessura cadastrada';
	if (e.length === 1) return `${mm(e[0])} mm`;
	return `${mm(e[0])} a ${mm(e[e.length - 1])} mm`;
}

export default function OrcamentoPublicoPage() {
	const params = useParams<{ slug: string }>();
	const slug = typeof params?.slug === 'string' ? params.slug : '';

	const link = useQuery({
		queryKey: ['orcamento-publico', slug],
		queryFn: () => getQuoteLink(slug),
		enabled: slug.length > 0,
		retry: false,
		// O `nonce` vence em 30 min. Renovar de 15 em 15 evita que alguém que
		// deixou a aba aberta durante o almoço leve um erro no primeiro clique. O
		// GET não cobra vox nem conta para o teto por IP (só o POST conta).
		staleTime: 0,
		refetchInterval: 15 * 60_000,
		refetchOnWindowFocus: true,
	});

	const info = link.data;
	const cor = corSegura(info?.cor ?? '');
	const logo = logoSegura(info?.logo_url ?? '');

	/* ───────────────────────────── formulário ───────────────────────────── */

	const [arquivo, setArquivo] = useState<File | null>(null);
	const [materialId, setMaterialId] = useState('');
	const [espessura, setEspessura] = useState<number | undefined>();
	const [qtd, setQtd] = useState(1);
	const [lead, setLead] = useState<Record<string, string>>({});
	const [consentimento, setConsentimento] = useState(false);
	const [armadilha, setArmadilha] = useState('');

	const [fase, setFase] = useState<Fase>('form');
	const [pctUpload, setPctUpload] = useState(0);
	const [inicio, setInicio] = useState(0);
	const [resultado, setResultado] = useState<EstimateResult | null>(null);
	const [erro, setErro] = useState<ErroAmigavel | null>(null);
	const [aviso, setAviso] = useState<string | null>(null);

	const abortRef = useRef<AbortController | null>(null);
	const resultadoRef = useRef<HTMLDivElement>(null);

	// Qualquer mudança nas opções invalida o preço na tela. Deixar o número
	// antigo ao lado de uma escolha nova é mentir com um valor exato.
	const invalida = useCallback(() => {
		setResultado(null);
		setErro(null);
		setAviso(null);
	}, []);

	const materiais = useMemo(() => info?.materiais ?? [], [info?.materiais]);

	// `SegmentedWidget` usa o texto da opção como rótulo E como chave React.
	// Mandar o `id` deixaria o cliente escolhendo entre siglas ("mdf", "acr");
	// mandar só o `nome` quebra se dois materiais tiverem o mesmo nome. Nome,
	// desempatado por um contador — sempre único, sempre legível.
	const opcoesMaterial = useMemo(() => {
		const vistos = new Map<string, number>();
		return materiais.map((m) => {
			const base = m.nome.trim() || m.id;
			const n = (vistos.get(base) ?? 0) + 1;
			vistos.set(base, n);
			return { rotulo: n === 1 ? base : `${base} (${n})`, material: m };
		});
	}, [materiais]);

	const material = materiais.find((m) => m.id === materialId) ?? null;
	const rotuloMaterial =
		opcoesMaterial.find((o) => o.material.id === materialId)?.rotulo ?? '';

	const espessuras = useMemo(
		() => (material ? [...material.espessuras].sort((a, b) => a - b) : []),
		[material],
	);

	// Escolha única não é escolha: pré-seleciona e poupa um toque no celular.
	useEffect(() => {
		if (!materialId && materiais.length === 1) setMaterialId(materiais[0].id);
	}, [materiais, materialId]);
	useEffect(() => {
		if (espessura === undefined && espessuras.length === 1) {
			setEspessura(espessuras[0]);
		}
	}, [espessuras, espessura]);

	useEffect(() => {
		if (resultado) {
			resultadoRef.current?.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			});
		}
	}, [resultado]);

	// Sair da página no meio do envio não pode deixar a requisição pendurada.
	useEffect(() => () => abortRef.current?.abort(), []);

	const pedeLead = (info?.campos_lead.length ?? 0) > 0;
	const qtdMax = info?.qtd_max ?? 50;

	/* ────────────────────────────── validação ────────────────────────────── */

	/** Falta alguma coisa? Devolve a frase que o visitante precisa ler. */
	function oQueFalta(): string | null {
		if (!arquivo) return 'Envie o arquivo do seu desenho para continuar.';
		if (!material) return 'Escolha o material da peça.';
		if (espessura === undefined) return 'Escolha a espessura do material.';
		if (!Number.isInteger(qtd) || qtd < 1 || qtd > qtdMax) {
			return `Informe uma quantidade entre 1 e ${qtdMax} peças.`;
		}
		if (pedeLead) {
			for (const campo of info?.campos_lead ?? []) {
				if (campo.name === 'consentimento' || !campo.required) continue;
				if (!(lead[campo.name] ?? '').trim()) {
					return `Preencha o campo "${campo.label}" para receber o preço.`;
				}
			}
			if (!consentimento) {
				return 'Marque a autorização de contato para continuar.';
			}
		}
		return null;
	}

	/* ──────────────────────────────── envio ──────────────────────────────── */

	/**
	 * O servidor recusa nonce com menos de 3 s de vida (defesa contra robô).
	 *
	 * A idade é medida contra `dataUpdatedAt`, que é o relógio do BROWSER na hora
	 * em que a resposta chegou — ou seja, sempre um pouco DEPOIS do carimbo que o
	 * servidor pôs no nonce. O erro joga para o lado seguro: esperamos de mais,
	 * nunca de menos.
	 */
	async function esperaNonceAmadurecer(desde: number) {
		const idade = Date.now() - desde;
		if (idade < NONCE_IDADE_MINIMA_MS) {
			await espera(NONCE_IDADE_MINIMA_MS - idade);
		}
	}

	async function enviar(tentativa = 0, nonceExplicito?: string) {
		const falta = oQueFalta();
		if (falta) {
			setAviso(falta);
			setErro(null);
			return;
		}
		if (!info || !arquivo || !material || espessura === undefined) return;

		setAviso(null);
		setErro(null);
		setResultado(null);
		setInicio(Date.now());
		setPctUpload(0);
		setFase('enviando');

		const controller = new AbortController();
		abortRef.current = controller;

		try {
			if (!nonceExplicito) await esperaNonceAmadurecer(link.dataUpdatedAt);

			const r = await postEstimate(
				slug,
				{
					nonce: nonceExplicito ?? info.nonce,
					material: material.id,
					espessuraMm: espessura,
					qtd,
					arquivo,
					honeypot: armadilha,
					...(pedeLead
						? {
								lead: {
									nome: lead.nome ?? '',
									whatsapp: lead.whatsapp ?? '',
									email: lead.email ?? '',
									empresa: lead.empresa ?? '',
									consentimento,
								},
							}
						: {}),
				},
				{
					signal: controller.signal,
					onUploadProgress: (pct) => {
						setPctUpload(pct);
						// Bytes acabaram de sair: a partir daqui quem trabalha é o
						// servidor, e não há mais o que medir.
						if (pct >= 100) setFase('calculando');
					},
				},
			);

			if (r.price_total_cents === undefined) {
				// Caminho do honeypot (`200 {}`). Um humano não chega aqui — o campo
				// é invisível e fica vazio. Se chegou, a resposta neutra é a certa.
				setErro(ERRO_NEUTRO);
				return;
			}
			setResultado(r);
		} catch (e) {
			const amigavel = erroAmigavel(e);
			// Nonce vencido só quer dizer que a página ficou aberta demais. Nada foi
			// cobrado (o servidor recusa ANTES de calcular), então repetir sozinho é
			// seguro — e poupa o visitante de um erro que não é dele. Uma vez só.
			if (amigavel.renovaSessao && tentativa === 0) {
				const nova = await link.refetch();
				const nonce = nova.data?.nonce;
				if (nonce) {
					await espera(NONCE_IDADE_MINIMA_MS);
					return enviar(1, nonce);
				}
			}
			setErro(amigavel);
		} finally {
			abortRef.current = null;
			setFase('form');
		}
	}

	/* ─────────────────────────────── telas ─────────────────────────────── */

	if (link.isLoading) {
		return (
			<Moldura cor={cor}>
				<div className="space-y-3">
					<div className="h-8 w-2/3 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
					<div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
					<div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
				</div>
			</Moldura>
		);
	}

	if (link.isError || !info) {
		const e = erroAmigavel(link.error);
		return (
			<Moldura cor={cor}>
				<Recado tom="erro" titulo={e.titulo}>
					{e.texto}
				</Recado>
			</Moldura>
		);
	}

	const enviando = fase !== 'form';

	return (
		<Moldura cor={cor}>
			{/* ── cabeçalho: a marca é do PROFISSIONAL ─────────────────────────── */}
			<header className="flex items-center gap-3">
				{logo ? (
					<img
						src={logo}
						alt=""
						className="h-12 w-12 shrink-0 rounded-xl object-contain"
					/>
				) : null}
				<div className="min-w-0">
					{/* A EMPRESA vem da marca do profissional (`usar_marca` no link) e é
					    o que transforma isto numa proposta assinada em vez de um
					    formulário anônimo. Quando ele não cadastrou marca, `empresa` é
					    vazio e a página fica exatamente como sempre foi: só o título. */}
					{info.empresa ? (
						<p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--screen-accent,#7c3aed)]">
							{info.empresa}
						</p>
					) : null}
					<h1 className="text-xl font-semibold leading-tight text-slate-900 dark:text-white">
						{info.titulo}
					</h1>
					<p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
						Envie seu desenho e veja o preço na hora.
					</p>
				</div>
			</header>

			{/* ── resultado ───────────────────────────────────────────────────── */}
			{resultado?.price_total_cents !== undefined ? (
				<div ref={resultadoRef} className="scroll-mt-4">
					<Resultado
						r={resultado}
						mostrarPrazo={info.mostrar_prazo}
						pedeLead={pedeLead}
						titulo={info.titulo}
						empresa={info.empresa}
						whatsapp={info.whatsapp}
					/>
				</div>
			) : null}

			{/* ── 1. arquivo ──────────────────────────────────────────────────── */}
			<Passo n={1} titulo="Seu desenho">
				<WidgetField
					control={{
						bind: 'input.arquivo',
						widget: 'file',
						label: 'Arquivo do corte',
						accept: [...EXTENSOES],
						maxMb: MAX_ARQUIVO_MB,
					}}
					value={arquivo ?? undefined}
					onChange={(v) => {
						setArquivo(v instanceof File ? v : null);
						invalida();
					}}
				/>
				<p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
					Precisa ser um desenho vetorial: <strong>DXF</strong> (o mais comum)
					ou <strong>SVG</strong>, de até {MAX_ARQUIVO_MB} MB. Foto, PDF e print
					não dão para cortar — se você não tem o arquivo, peça ao seu
					projetista “o DXF do corte”.
				</p>

				<QuotePreview
					arquivo={arquivo}
					larguraMm={resultado?.dims_mm?.largura}
					alturaMm={resultado?.dims_mm?.altura}
					cor={cor}
				/>
			</Passo>

			{/* ── 2. material, espessura, quantidade ──────────────────────────── */}
			<Passo n={2} titulo="Material e quantidade">
				{opcoesMaterial.length === 0 ? (
					<Recado tom="aviso" titulo="Nenhum material disponível">
						Este link ainda não tem materiais liberados. Fale com o
						profissional.
					</Recado>
				) : (
					<WidgetField
						control={{
							bind: 'input.material',
							widget: 'segmented',
							label: 'Material',
							options: opcoesMaterial.map((o) => o.rotulo),
							describe: Object.fromEntries(
								opcoesMaterial.map((o) => [
									o.rotulo,
									faixaDeEspessuras(o.material),
								]),
							),
						}}
						value={rotuloMaterial}
						onChange={(v) => {
							const achado = opcoesMaterial.find((o) => o.rotulo === String(v));
							setMaterialId(achado?.material.id ?? '');
							setEspessura(undefined);
							invalida();
						}}
					/>
				)}

				{espessuras.length > 0 ? (
					<WidgetField
						control={{
							bind: 'input.espessura',
							widget: 'segmented',
							label: 'Espessura (mm)',
							options: espessuras,
						}}
						value={espessura}
						onChange={(v) => {
							setEspessura(typeof v === 'number' ? v : undefined);
							invalida();
						}}
					/>
				) : null}

				<WidgetField
					control={{
						bind: 'input.qtd',
						widget: 'number',
						label: 'Quantas peças',
						min: 1,
						max: qtdMax,
						step: 1,
					}}
					value={qtd}
					onChange={(v) => {
						setQtd(typeof v === 'number' && Number.isFinite(v) ? v : 1);
						invalida();
					}}
				/>
			</Passo>

			{/* ── 3. contato + LGPD ───────────────────────────────────────────── */}
			{pedeLead ? (
				<Passo n={3} titulo="Para quem é o orçamento">
					<div className="space-y-3">
						{info.campos_lead
							.filter((c) => c.name !== 'consentimento')
							.map((c) => (
								<CampoContato
									key={c.name}
									name={c.name}
									label={c.label}
									required={c.required}
									value={lead[c.name] ?? ''}
									onChange={(v) => setLead((p) => ({ ...p, [c.name]: v }))}
								/>
							))}
					</div>

					{/* CONSENTIMENTO EXPLÍCITO: o servidor recusa o pedido sem ele, e a
					    tela diz, sem eufemismo, para quem vai o dado e para quê. Quem
					    marca isto é um terceiro que nunca aceitou nada com a gente. */}
					<label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
						<input
							type="checkbox"
							checked={consentimento}
							onChange={(e) => {
								setConsentimento(e.target.checked);
								setAviso(null);
							}}
							className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--screen-accent,#7c3aed)]"
						/>
						<span className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
							<strong className="block text-slate-800 dark:text-slate-100">
								Autorizo o contato sobre este orçamento.
							</strong>
							Seu nome e WhatsApp vão para <strong>{info.titulo}</strong>, que é
							quem vai te responder. A Profissão Laser só guarda o registro para
							entregar esse contato — não vende, não usa para propaganda nem
							repassa para mais ninguém. Para corrigir ou apagar seus dados,
							peça ao profissional a qualquer momento.
						</span>
					</label>
				</Passo>
			) : null}

			{/* Honeypot. Fora da tela em vez de `display:none`: robô de formulário
			    costuma pular o que está escondido por CSS de visibilidade, mas
			    preenche o que só está deslocado. Sem `required`, sem `label`, fora da
			    ordem de tabulação e escondido do leitor de tela. */}
			<input
				type="text"
				name="website"
				tabIndex={-1}
				autoComplete="off"
				aria-hidden="true"
				value={armadilha}
				onChange={(e) => setArmadilha(e.target.value)}
				className="absolute left-[-9999px] top-0 h-px w-px opacity-0"
			/>

			{/* ── ação ────────────────────────────────────────────────────────── */}
			{enviando ? (
				<QuoteProgress
					fase={fase === 'enviando' ? 'enviando' : 'calculando'}
					pctUpload={pctUpload}
					inicio={inicio}
				/>
			) : (
				<button
					type="button"
					onClick={() => void enviar()}
					className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--screen-accent,#7c3aed)] px-5 py-4 text-base font-semibold text-white shadow-lg shadow-black/10 transition-opacity hover:opacity-90 active:opacity-80"
				>
					{resultado ? 'Recalcular' : 'Ver o preço'}
					<ArrowRight className="h-4 w-4" />
				</button>
			)}

			{aviso ? (
				<Recado tom="aviso" titulo="Falta um passo">
					{aviso}
				</Recado>
			) : null}

			{erro ? (
				<Recado tom="erro" titulo={erro.titulo}>
					{erro.texto}
				</Recado>
			) : null}
		</Moldura>
	);
}

/* ──────────────────────────── peças da tela ──────────────────────────── */

function Moldura({
	cor,
	children,
}: {
	cor: string;
	children: React.ReactNode;
}) {
	return (
		<div
			// `--screen-accent` é o contrato de cor dos widgets compartilhados: setar
			// aqui pinta foco, cards ativos, dropzone e barra de progresso com a cor
			// do profissional, sem uma linha de CSS nova.
			style={{ '--screen-accent': cor } as CSSProperties}
			className="min-h-screen bg-slate-50 dark:bg-[#0b0b0d]"
		>
			<div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-4 py-6 sm:py-10">
				{children}
				{/* A assinatura fica na MOLDURA, não na tela de sucesso: quem cai no
				    estado de erro ou de carregamento também precisa saber onde está.
				    Antes, quem abria um link morto via uma caixa vermelha solta numa
				    página em branco, sem uma única pista de origem. */}
				<footer className="pt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
					orçamento gerado por Profissão Laser
				</footer>
			</div>
		</div>
	);
}

function Passo({
	n,
	titulo,
	children,
}: {
	n: number;
	titulo: string;
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#141416]">
			<h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
				<span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--screen-accent,#7c3aed)] font-mono text-xs text-white">
					{n}
				</span>
				{titulo}
			</h2>
			{children}
		</section>
	);
}

function Recado({
	tom,
	titulo,
	children,
}: {
	tom: 'erro' | 'aviso' | 'info';
	titulo: string;
	children: React.ReactNode;
}) {
	const paleta = {
		erro: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200',
		aviso:
			'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200',
		info: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300',
	}[tom];
	const Icone = tom === 'erro' ? AlertTriangle : Info;
	return (
		<div
			role={tom === 'erro' ? 'alert' : 'status'}
			className={`flex gap-3 rounded-2xl border p-4 ${paleta}`}
		>
			<Icone className="mt-0.5 h-4 w-4 shrink-0" />
			<div className="min-w-0 space-y-1">
				<p className="text-sm font-semibold">{titulo}</p>
				<p className="text-xs leading-relaxed opacity-90">{children}</p>
			</div>
		</div>
	);
}

/**
 * Campos de contato escritos à mão, e não via `WidgetField`.
 *
 * O widget `text` genérico é um `input[type=text]` — no celular isso significa
 * teclado alfabético para digitar telefone e nenhum autopreenchimento. Aqui o
 * tipo do teclado é metade da usabilidade, então os campos de contato são a
 * exceção deliberada ao reuso.
 */
function CampoContato({
	name,
	label,
	required,
	value,
	onChange,
}: {
	name: string;
	label: string;
	required: boolean;
	value: string;
	onChange: (v: string) => void;
}) {
	const teclado: Record<
		string,
		{ type: string; inputMode?: 'tel' | 'email' | 'text'; autoComplete: string }
	> = {
		nome: { type: 'text', inputMode: 'text', autoComplete: 'name' },
		whatsapp: { type: 'tel', inputMode: 'tel', autoComplete: 'tel' },
		email: { type: 'email', inputMode: 'email', autoComplete: 'email' },
		empresa: { type: 'text', inputMode: 'text', autoComplete: 'organization' },
	};
	const cfg = teclado[name] ?? {
		type: 'text',
		inputMode: 'text' as const,
		autoComplete: 'off',
	};
	const id = `lead-${name}`;
	return (
		<div className="space-y-1.5">
			<label
				htmlFor={id}
				className="block text-sm font-medium text-slate-700 dark:text-slate-300"
			>
				{label}
				{required ? null : (
					<span className="ml-1 text-xs font-normal text-slate-400">
						(opcional)
					</span>
				)}
			</label>
			<input
				id={id}
				type={cfg.type}
				inputMode={cfg.inputMode}
				autoComplete={cfg.autoComplete}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_45%,transparent)] dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
			/>
		</div>
	);
}

/** O preço. É por isto que a pessoa abriu o link. */
function Resultado({
	r,
	mostrarPrazo,
	pedeLead,
	titulo,
	empresa,
	whatsapp,
}: {
	r: EstimateResult;
	mostrarPrazo: boolean;
	pedeLead: boolean;
	titulo: string;
	empresa: string;
	whatsapp: string;
}) {
	const total = r.price_total_cents ?? 0;
	const unit = r.price_unit_cents ?? 0;
	const qtd = r.qtd ?? 1;
	const desconto = r.desconto_pct ?? 0;

	/** As fichas da proposta, já sem as que não se aplicam a este orçamento. */
	const dados: { rotulo: string; valor: string }[] = [];
	if (r.dims_mm) {
		dados.push({
			rotulo: 'Tamanho do desenho',
			valor: `${mm(r.dims_mm.largura)} × ${mm(r.dims_mm.altura)} mm`,
		});
	}
	// "PEÇAS NO ARQUIVO: 7" ao lado de "10 peças · R$ 15,00 cada" fazia o cliente
	// perguntar se são 10 ou 70. Só aparece quando o desenho tem mais de uma peça
	// — e aí o rótulo já diz que a contagem é POR unidade.
	if (r.pecas !== undefined && r.pecas > 1) {
		dados.push({ rotulo: 'Peças em cada unidade', valor: String(r.pecas) });
	}
	if (mostrarPrazo && r.prazo_dias !== undefined) {
		dados.push({
			rotulo: 'Prazo estimado',
			valor: r.prazo_dias === 1 ? '1 dia útil' : `${r.prazo_dias} dias úteis`,
		});
	}

	// A mensagem já vai pronta: o cliente aperta um botão e o profissional recebe
	// o pedido com o valor que ELE mesmo orçou — sem "oi, quanto ficou mesmo?".
	const zap = linkWhatsapp(
		whatsapp,
		[
			`Olá! Fiz um orçamento no site${empresa ? ` da ${empresa}` : ''}.`,
			r.resumo ? `Peça: ${r.resumo}` : '',
			`Valor: ${reais(total)}${qtd > 1 ? ` (${qtd} peças)` : ''}`,
			'Quero fechar o pedido.',
		]
			.filter(Boolean)
			.join('\n'),
	);

	return (
		<div className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_35%,transparent)] bg-white shadow-lg shadow-black/5 dark:bg-[#141416]">
			<div className="bg-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_10%,transparent)] px-4 py-5">
				<p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
					Seu orçamento
				</p>
				<p className="mt-1 font-mono text-4xl font-bold tabular-nums leading-none text-slate-900 dark:text-white">
					{reais(total)}
				</p>
				<p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
					{qtd === 1 ? '1 peça' : `${qtd} peças · ${reais(unit)} cada`}
				</p>
				{/* A CONTA TEM QUE FECHAR NA CARA DO CLIENTE. Com desconto por
				    quantidade, `qtd × unitário` não dá o total, e a página não citava
				    o desconto em lugar nenhum: "10 peças · R$ 13,00 cada" em cima de
				    "R$ 123,50" some R$ 6,50 sem explicação e parece erro de quem
				    mandou. O desconto é uma condição comercial que o profissional
				    CONCEDE — dizer isso ao cliente é bom para ele. */}
				{desconto > 0 && qtd > 1 ? (
					<p className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
						Desconto por quantidade de {desconto.toFixed(0)}% já aplicado —{' '}
						{reais(Math.ceil(total / qtd))} por peça
					</p>
				) : null}
			</div>

			{dados.length > 0 ? (
				<dl className="grid grid-cols-2 gap-px bg-slate-200 text-sm dark:bg-white/10">
					{dados.map((d) => (
						<Dado key={d.rotulo} rotulo={d.rotulo}>
							{d.valor}
						</Dado>
					))}
					{/* Número ÍMPAR de fichas deixava meia célula com a cor do separador
					    — um retângulo cinza vazio no meio da proposta, que lê como
					    "faltou carregar alguma coisa". A célula de sobra é preenchida. */}
					{dados.length % 2 === 1 ? (
						<div className="bg-white dark:bg-[#141416]" />
					) : null}
				</dl>
			) : null}

			<div className="space-y-3 p-4">
				{r.resumo ? (
					<p className="text-xs text-slate-500 dark:text-slate-400">
						{r.resumo}
					</p>
				) : null}

				{/* FECHAR O PEDIDO. Antes desta versão o único botão da página era
				    "Recalcular": o cliente recebia o preço e não tinha para onde ir.
				    Sem WhatsApp cadastrado o botão não existe, e a página segue como
				    era — não inventamos um canal que o profissional não ofereceu. */}
				{zap ? (
					<a
						href={zap}
						target="_blank"
						rel="noopener noreferrer"
						className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
						style={{ background: 'var(--screen-accent, #7c3aed)' }}
					>
						<MessageCircle className="h-4 w-4" />
						Fechar pedido no WhatsApp
					</a>
				) : null}

				{/* HONESTIDADE DO NÚMERO. O motor marca `estimativa` quando a
				    velocidade de corte saiu de um modelo e não de uma medição — e o
				    cliente recebia esse preço com cara de fechado. Dizer isto agora
				    custa uma frase; descobrir na entrega custa o cliente. */}
				{r.estimativa ? (
					<p className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
						<Info className="mt-px h-3.5 w-3.5 shrink-0" />
						<span>
							Este é um <strong>valor estimado</strong>. Ele é confirmado
							{empresa ? ` pela ${empresa}` : ' pelo profissional'} antes de a
							produção começar.
						</span>
					</p>
				) : null}

				{r.avisos?.length ? (
					<div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/25 dark:bg-amber-500/10">
						<p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
							Sobre o seu desenho
						</p>
						<ul className="mt-1.5 space-y-1">
							{r.avisos.map((a) => (
								<li
									key={a}
									className="text-xs leading-relaxed text-amber-800 dark:text-amber-200/90"
								>
									{a}
								</li>
							))}
						</ul>
					</div>
				) : null}

				<p className="flex gap-2 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
					<ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" />
					<span>
						Valor calculado a partir do arquivo que você enviou. Pode mudar se o
						desenho mudar.
						{pedeLead
							? ` Seus dados de contato foram enviados para ${titulo}.`
							: ''}
					</span>
				</p>
			</div>
		</div>
	);
}

function Dado({
	rotulo,
	children,
}: {
	rotulo: string;
	children: React.ReactNode;
}) {
	return (
		<div className="bg-white px-4 py-3 dark:bg-[#141416]">
			<dt className="text-[11px] uppercase tracking-wide text-slate-400">
				{rotulo}
			</dt>
			<dd className="mt-0.5 font-mono text-sm tabular-nums text-slate-800 dark:text-slate-100">
				{children}
			</dd>
		</div>
	);
}
