'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, FileUp, Pencil, Plus, X } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import { listCollection } from '../../services/collections.service';
import type { MaterialDaBase } from './materiais';
import { PerfilCurtoForm } from './perfil-curto';
import { reais } from './tipos';

/**
 * OS PASSOS — o paredão de doze campos virou três perguntas.
 *
 * Só o passo em aberto mostra controle; os fechados viram uma linha de resumo
 * com um lápis. Isso não é enfeite: os três primeiros campos decidem 100% do
 * orçamento mais comum, e enterrá-los no meio de "unidade do arquivo", "preço do
 * material por quilo" e "largura da chapa" é o que fazia a ferramenta parecer um
 * painel de configuração de laser em vez de uma calculadora de preço.
 *
 * O que saiu da tela e por quê:
 *  • `unidade`, `preco_kg`, `chapa_w`, `chapa_h`, `velocidade_mm_s` — o back já
 *    resolve todos (arquivo, coleção `materiais` e cascata de `cut-speed.ts`).
 *    Pedir isso na cara do aluno é pedir que ele responda o que o sistema sabe.
 *  • O SLIDER de quantidade (1 a 100.000 num arrastão) virou campo digitado com
 *    atalhos. Ninguém acerta 250 arrastando.
 */

/* ─────────────────────────── casca de um passo ─────────────────────────── */

export function Passo({
	numero,
	titulo,
	pergunta,
	resumo,
	aberto,
	pronto,
	onAbrir,
	children,
}: {
	numero: number;
	titulo: string;
	pergunta?: string;
	resumo?: ReactNode;
	aberto: boolean;
	pronto: boolean;
	onAbrir: () => void;
	children: ReactNode;
}) {
	return (
		/**
		 * ABERTO OCUPA A FILA INTEIRA.
		 *
		 * Os três passos moram numa grade de 3 colunas (ver o comentário no
		 * `index.tsx`): fechados são uma linha cada e cabem lado a lado. Aberto é
		 * outra coisa — dropzone de arquivo, seletor de material, o formulário de
		 * custo. Espremer isso num terço da tela é o formulário de sempre, só que
		 * pior. `col-span-full` só age dentro da grade; fora dela é inerte, então
		 * o componente continua servindo a quem o use empilhado.
		 */
		<section
			className={`rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#16161a] ${
				aberto ? 'lg:col-span-full' : ''
			}`}
		>
			<button
				type="button"
				onClick={onAbrir}
				className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
			>
				<span
					className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
						pronto
							? 'bg-emerald-500 text-white'
							: aberto
								? 'text-white'
								: 'bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500'
					}`}
					style={
						aberto && !pronto
							? { background: 'var(--screen-accent, #7c3aed)' }
							: undefined
					}
				>
					{pronto ? <Check className="h-4 w-4" /> : numero}
				</span>
				<span className="min-w-0 flex-1">
					<span className="block text-sm font-semibold text-slate-900 dark:text-white">
						{titulo}
					</span>
					{!aberto && resumo ? (
						<span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
							{resumo}
						</span>
					) : aberto && pergunta ? (
						<span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
							{pergunta}
						</span>
					) : null}
				</span>
				{!aberto ? (
					<Pencil className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
				) : null}
			</button>
			{aberto ? (
				<div className="border-t border-slate-200 px-4 py-4 sm:px-5 dark:border-white/10">
					{children}
				</div>
			) : null}
		</section>
	);
}

/* ─────────────────────── ① o arquivo da peça ──────────────────────── */

const EXTENSOES = ['dxf', 'svg'];
const MAX_MB = 20;

function tamanho(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PassoArquivo({
	arquivo,
	onChange,
}: {
	arquivo: File | null;
	onChange: (f: File | null) => void;
}) {
	const [erro, setErro] = useState<string | null>(null);
	const [arrastando, setArrastando] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const escolhe = (f: File | undefined) => {
		if (!f) return;
		const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
		if (!EXTENSOES.includes(ext)) {
			// Erro preso ao campo, não toast: ele tem que ficar ao lado do controle
			// que errou e não pode sumir sozinho.
			setErro(
				`Este é um arquivo .${ext}. O orçamento lê o desenho de corte: mande o DXF ou o SVG que você manda para a máquina.`,
			);
			return;
		}
		if (f.size > MAX_MB * 1024 * 1024) {
			setErro(`Arquivo maior que ${MAX_MB} MB.`);
			return;
		}
		setErro(null);
		onChange(f);
	};

	return (
		<div className="space-y-3">
			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				onDrop={(e) => {
					e.preventDefault();
					setArrastando(false);
					escolhe(e.dataTransfer.files[0]);
				}}
				onDragOver={(e) => {
					e.preventDefault();
					setArrastando(true);
				}}
				onDragLeave={(e) => {
					e.preventDefault();
					setArrastando(false);
				}}
				className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition-colors ${
					arrastando
						? 'border-[var(--screen-accent,#7c3aed)] bg-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_10%,transparent)]'
						: 'border-slate-200 hover:border-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_50%,transparent)] dark:border-white/10'
				}`}
			>
				<input
					ref={inputRef}
					type="file"
					accept=".dxf,.svg"
					onChange={(e) => {
						escolhe(e.target.files?.[0]);
						e.target.value = '';
					}}
					className="hidden"
				/>
				<span
					className="mb-3 rounded-xl p-3 text-white"
					style={{ background: 'var(--screen-accent, #7c3aed)' }}
				>
					<FileUp className="h-7 w-7" />
				</span>
				<span className="text-center text-sm font-medium text-slate-700 dark:text-slate-200">
					Arraste o desenho ou clique para escolher
				</span>
				<span className="mt-1 font-mono text-[11px] uppercase tracking-wide text-slate-400">
					dxf · svg
				</span>
			</button>

			{erro ? (
				<p
					role="alert"
					className="text-xs font-medium text-rose-600 dark:text-rose-400"
				>
					{erro}
				</p>
			) : null}

			{arquivo ? (
				<div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
					<span className="rounded-lg bg-white px-2 py-1.5 font-mono text-[11px] font-semibold uppercase text-slate-600 dark:bg-white/10 dark:text-slate-300">
						{arquivo.name.split('.').pop()}
					</span>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium text-slate-900 dark:text-white">
							{arquivo.name}
						</p>
						<p className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
							{tamanho(arquivo.size)}
						</p>
					</div>
					<button
						type="button"
						aria-label="Remover arquivo"
						onClick={() => onChange(null)}
						className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			) : null}

			<p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
				O contorno precisa estar fechado e o texto convertido em curvas — é o
				mesmo arquivo que a máquina corta. Nada é publicado: o desenho é lido no
				servidor só para medir a peça.
			</p>
		</div>
	);
}

/* ────────────────────── ② material, espessura, quantidade ────────────────── */

const chip =
	'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors';
const chipOff =
	'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300';

function chipOn(): string {
	return 'border-transparent text-white';
}

const estiloOn = {
	background: 'var(--screen-accent, #7c3aed)',
} as const;

export function PassoPeca({
	materiais,
	baseIndisponivel,
	material,
	espessura,
	qtd,
	atalhosQtd,
	onMaterial,
	onEspessura,
	onQtd,
}: {
	materiais: MaterialDaBase[];
	baseIndisponivel: boolean;
	material: string;
	espessura: number | undefined;
	qtd: number;
	atalhosQtd: number[];
	onMaterial: (familia: string) => void;
	onEspessura: (e: number | undefined) => void;
	onQtd: (q: number) => void;
}) {
	const escolhido = materiais.find((m) => m.familia === material);
	const espessuras = escolhido?.espessuras ?? [];
	// "Outra" só aparece depois que a base respondeu: sem ela, o campo livre já é
	// o único caminho e um botão a mais só confundiria.
	const [espessuraLivre, setEspessuraLivre] = useState(false);
	const livre = baseIndisponivel || espessuraLivre || espessuras.length === 0;

	return (
		<div className="space-y-5">
			<div>
				<p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
					Material
				</p>
				{baseIndisponivel ? (
					<input
						type="text"
						value={material}
						onChange={(e) => onMaterial(e.target.value)}
						placeholder="mdf, acrílico, aço carbono…"
						className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--screen-accent,#7c3aed)]/40 dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
					/>
				) : (
					<div className="flex flex-wrap gap-2">
						{materiais.map((m) => {
							const ativo = m.familia === material;
							return (
								<button
									key={m.id}
									type="button"
									disabled={!m.cortaALaser}
									title={
										m.cortaALaser
											? undefined
											: 'Este material não pode ser cortado a laser'
									}
									onClick={() => {
										onMaterial(m.familia);
										// Espessura de outro material quase nunca existe neste:
										// manter a anterior entregaria "MDF 1,2 mm" calado.
										setEspessuraLivre(false);
										onEspessura(m.espessuras[0]);
									}}
									className={`${chip} ${ativo ? chipOn() : chipOff} ${
										m.cortaALaser
											? ''
											: 'cursor-not-allowed line-through opacity-40'
									}`}
									style={ativo ? estiloOn : undefined}
								>
									{m.nome}
								</button>
							);
						})}
					</div>
				)}
				{escolhido && !escolhido.cortaALaser ? (
					<p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
						{escolhido.nome} não corta a laser (libera cloro ou derrete em vez
						de cortar). Escolha outro material.
					</p>
				) : null}
			</div>

			<div>
				<div className="mb-2 flex items-baseline justify-between gap-3">
					<p className="text-sm font-medium text-slate-700 dark:text-slate-300">
						Espessura
					</p>
					{espessuras.length > 0 ? (
						<button
							type="button"
							onClick={() => setEspessuraLivre((v) => !v)}
							className="text-[11px] font-semibold text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
						>
							{livre ? 'ver as da chapa' : 'outra espessura'}
						</button>
					) : null}
				</div>
				{livre ? (
					<div className="flex items-center gap-2">
						<input
							type="number"
							inputMode="decimal"
							min={0.1}
							max={100}
							step={0.1}
							value={espessura ?? ''}
							onChange={(e) => {
								const n = Number(e.target.value);
								onEspessura(Number.isFinite(n) && n > 0 ? n : undefined);
							}}
							className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--screen-accent,#7c3aed)]/40 dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
						/>
						<span className="text-sm text-slate-500 dark:text-slate-400">
							mm
						</span>
					</div>
				) : (
					<div className="flex flex-wrap gap-2">
						{espessuras.map((e) => {
							const ativo = espessura === e;
							return (
								<button
									key={e}
									type="button"
									onClick={() => onEspessura(e)}
									className={`${chip} font-mono tabular-nums ${ativo ? chipOn() : chipOff}`}
									style={ativo ? estiloOn : undefined}
								>
									{String(e).replace('.', ',')} mm
								</button>
							);
						})}
					</div>
				)}
				{!livre ? (
					<p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
						Estas são as chapas que existem para comprar.
					</p>
				) : null}
			</div>

			<div>
				<p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
					Quantas peças
				</p>
				<div className="flex flex-wrap items-center gap-2">
					<input
						type="number"
						inputMode="numeric"
						min={1}
						max={100000}
						step={1}
						value={qtd}
						onChange={(e) => {
							const n = Math.floor(Number(e.target.value));
							onQtd(Number.isFinite(n) && n >= 1 ? Math.min(n, 100000) : 1);
						}}
						className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--screen-accent,#7c3aed)]/40 dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
					/>
					{atalhosQtd.map((n) => (
						<button
							key={n}
							type="button"
							onClick={() => onQtd(n)}
							className={`${chip} font-mono tabular-nums ${qtd === n ? chipOn() : chipOff}`}
							style={qtd === n ? estiloOn : undefined}
						>
							{n}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

/* ───────────────────────── ③ o custo dele ──────────────────────────── */

/**
 * O perfil de custo saiu de "Ajustes avançados" para um passo próprio, e o
 * motivo está no banco: em quase um ano, ZERO perfis foram criados. Enquanto
 * não existir perfil, todo orçamento sai com os valores padrão do sistema — o
 * preço da máquina de outra pessoa — e a tela não dizia isso em lugar nenhum.
 *
 * O FORMULÁRIO do perfil (quantas perguntas, quais padrões) é da frente irmã;
 * aqui só entra a escolha, com o aviso honesto de quando não há nenhum.
 */
export function PassoCusto({
	toolKey,
	perfilId,
	acabamento,
	tempoManual,
	descontoPct,
	onPerfil,
	onAcabamento,
	onTempoManual,
	onDesconto,
}: {
	toolKey: string;
	perfilId: string;
	acabamento: number | undefined;
	tempoManual: number | undefined;
	descontoPct: number | undefined;
	onPerfil: (v: string) => void;
	onAcabamento: (v: number | undefined) => void;
	onTempoManual: (v: number | undefined) => void;
	onDesconto: (v: number | undefined) => void;
}) {
	const [criando, setCriando] = useState(false);
	const perfis = useQuery({
		queryKey: ['collection-options', toolKey, 'perfis', true],
		queryFn: () =>
			listCollection(toolKey, 'perfis', {
				pageSize: 100,
				mine: true,
				sort: 'recent',
			}),
		enabled: toolKey.length > 0,
		staleTime: 60_000,
	});
	const opcoes = perfis.data?.items ?? [];

	return (
		<div className="space-y-5">
			<div>
				<div className="flex items-center justify-between gap-2">
					<label
						htmlFor="orc-perfil"
						className="block text-sm font-medium text-slate-700 dark:text-slate-300"
					>
						Qual máquina e quais custos são os seus
					</label>
					{/* O botão "Criar" do widget genérico abria o formulário de 34
					    campos — o mesmo paredão que o banco provou que ninguém
					    termina (zero perfis em cerca de um ano). Aqui ele abre as
					    SEIS PERGUNTAS, e é por isso que esta tela monta o seletor à
					    mão em vez de usar `WidgetField`. */}
					<button
						type="button"
						onClick={() => setCriando(true)}
						className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--screen-accent,#7c3aed)] transition-colors hover:bg-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_12%,transparent)]"
					>
						<Plus className="h-3 w-3" />
						{opcoes.length > 0 ? 'Novo perfil' : 'Responder 6 perguntas'}
					</button>
				</div>
				<select
					id="orc-perfil"
					value={perfilId}
					disabled={perfis.isLoading}
					onChange={(e) => onPerfil(e.target.value)}
					className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--screen-accent,#7c3aed)]/40 dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
				>
					<option value="">
						{perfis.isLoading ? 'Carregando…' : '— valores padrão do sistema —'}
					</option>
					{opcoes.map((e) => (
						<option key={e.id} value={e.id}>
							{e.title}
						</option>
					))}
				</select>
				{!perfilId ? (
					<p className="mt-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/5 dark:text-amber-300">
						Sem perfil, o preço sai com os custos de uma máquina genérica — não
						a sua. Serve para ter uma ideia; não serve para fechar preço.{' '}
						<button
							type="button"
							onClick={() => setCriando(true)}
							className="font-semibold underline underline-offset-2"
						>
							São seis perguntas.
						</button>
					</p>
				) : null}
				{criando ? (
					<PerfilCurtoForm
						toolKey={toolKey}
						onClose={() => setCriando(false)}
						onSaved={(e) => onPerfil(e.id)}
					/>
				) : null}
			</div>

			{/* Estes dois são FATO DO TRABALHO, não da oficina, e por isso ficam
			    aqui e não no perfil: acabamento por peça foi medido como o campo
			    que mais move o preço (+42% a +87% sozinho) e vivia escondido atrás
			    de "Ajustes avançados". */}
			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<label
						htmlFor="orc-acabamento"
						className="block text-sm font-medium text-slate-700 dark:text-slate-300"
					>
						Acabamento por peça
					</label>
					<div className="mt-1.5 flex items-center gap-2">
						<span className="text-sm text-slate-400">R$</span>
						<input
							id="orc-acabamento"
							type="number"
							inputMode="decimal"
							min={0}
							step={0.5}
							value={acabamento ?? ''}
							placeholder="0"
							onChange={(e) => {
								const n = Number(e.target.value);
								onAcabamento(
									e.target.value === '' || !Number.isFinite(n) || n < 0
										? undefined
										: n,
								);
							}}
							className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--screen-accent,#7c3aed)]/40 dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
						/>
					</div>
					<p className="mt-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
						Lixa, verniz, embalagem, ímã colado. É o que mais muda o preço.
					</p>
				</div>

				<div>
					<label
						htmlFor="orc-manual"
						className="block text-sm font-medium text-slate-700 dark:text-slate-300"
					>
						Trabalho à mão por peça
					</label>
					<div className="mt-1.5 flex items-center gap-2">
						<input
							id="orc-manual"
							type="number"
							inputMode="decimal"
							min={0}
							step={1}
							value={tempoManual ?? ''}
							placeholder="0"
							onChange={(e) => {
								const n = Number(e.target.value);
								onTempoManual(
									e.target.value === '' || !Number.isFinite(n) || n < 0
										? undefined
										: n,
								);
							}}
							className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--screen-accent,#7c3aed)]/40 dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
						/>
						<span className="text-sm text-slate-500 dark:text-slate-400">
							min
						</span>
					</div>
					<p className="mt-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
						Montagem, colagem, rebarba — fora da máquina.
					</p>
				</div>
			</div>

			<div>
				<label
					htmlFor="orc-desconto"
					className="block text-sm font-medium text-slate-700 dark:text-slate-300"
				>
					Desconto que você negociou
				</label>
				<div className="mt-1.5 flex items-center gap-2">
					<input
						id="orc-desconto"
						type="number"
						inputMode="numeric"
						min={0}
						max={99}
						step={1}
						value={descontoPct ?? ''}
						placeholder="0"
						onChange={(e) => {
							const n = Number(e.target.value);
							onDesconto(
								e.target.value === '' || !Number.isFinite(n) || n < 0
									? undefined
									: Math.min(99, n),
							);
						}}
						className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--screen-accent,#7c3aed)]/40 dark:border-white/10 dark:bg-[#111] dark:text-slate-200"
					/>
					<span className="text-sm text-slate-500 dark:text-slate-400">%</span>
				</div>
				<p className="mt-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
					Em branco, vale a faixa por quantidade do seu perfil. Preenchido, este
					vence — e o resultado mostra se ele derruba o preço abaixo do custo.
				</p>
			</div>
		</div>
	);
}

/** Resumo de uma linha para o passo fechado. */
export function resumoDaPeca(
	materiais: MaterialDaBase[],
	material: string,
	espessura: number | undefined,
	qtd: number,
	sugerido = false,
): string {
	if (!material) return 'Escolha o material e a espessura';
	const nome = materiais.find((m) => m.familia === material)?.nome || material;
	const esp =
		espessura === undefined ? '' : ` ${String(espessura).replace('.', ',')} mm`;
	const base = `${nome}${esp} · ${qtd} peça${qtd > 1 ? 's' : ''}`;
	// "Sugerido" e não "escolhido": o mesmo arquivo em aço custa 2,6× o que
	// custa em MDF, e o aluno precisa saber que este ainda é o nosso palpite.
	return sugerido ? `${base} — sugerido, confira` : base;
}

/** Resumo do passo de custo. */
export function resumoDoCusto(
	perfilId: string,
	acabamento: number | undefined,
	descontoPct: number | undefined,
): string {
	const partes = [perfilId ? 'com o seu perfil' : 'valores padrão do sistema'];
	if (acabamento) partes.push(`acabamento ${reais(acabamento * 100)}`);
	if (descontoPct) partes.push(`${descontoPct}% de desconto`);
	return partes.join(' · ');
}
