'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Pencil, ShieldCheck, X } from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import {
	type CollectionEntry,
	createCollectionEntry,
} from '../../services/collections.service';
import {
	buildQuoteProfile,
	type CampoAssumido,
	listQuoteMachines,
	type PerfilDerivado,
} from '../../services/quote-profile.service';
import { reais } from './tipos';

/**
 * O PERFIL DE CUSTO EM SEIS PERGUNTAS — o muro dos 31 campos, derrubado na tela.
 *
 * ┌─ O PLACAR QUE MANDOU ESTA TELA EXISTIR ──────────────────────────────────┐
 * │ A coleção `perfis` tem 31 campos. Em cerca de um ano, o banco registrou   │
 * │ ZERO perfis criados — e sem perfil TODO orçamento sai com os custos de    │
 * │ uma máquina genérica, que é o preço da máquina de outra pessoa.           │
 * │                                                                          │
 * │ Não é que o formulário fosse chato: TREZE dos 31 campos um dono de        │
 * │ marcenaria não tem como responder (consumo de gás em m³/h, vida útil em   │
 * │ horas, supervisão em %, ineficiência de aceleração). E a medição mostrou  │
 * │ o tamanho do desperdício: errar em ±30% os SEIS campos de custo-hora ao   │
 * │ mesmo tempo move o preço entre −13% e +17%. Errar UMA resposta de         │
 * │ acabamento move +42%.                                                    │
 * │                                                                          │
 * │ Estávamos perguntando o consumo de gás para acertar 2%.                   │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * O QUE ESTA TELA NÃO FAZ, e é o mais importante: **não calcula nada**. As seis
 * respostas vão para `POST /api/quote/profile` e voltam os 31 campos já
 * derivados, cada um com a ORIGEM em português. Vida útil da máquina, hora do
 * dono, margem equivalente ao markup e imposto do regime são contas — e conta
 * de dinheiro neste produto mora em `lib/quote/`, nunca no navegador e nunca
 * num modelo de IA.
 *
 * O QUE ELA GRAVA: o registro COMPLETO, nunca as seis respostas soltas. Um
 * perfil "CO2 100 W" com os derivados em branco herdava o padrão de fibra
 * 1500 W e cobrava +46% em silêncio — medido. Gravar o número derivado é
 * também o que torna o perfil auditável: ele vê, discorda e corrige.
 */

/* ───────────────────────────── peças de tela ───────────────────────────── */

const campoNum =
	'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--screen-accent,#7c3aed)]/40 dark:border-white/10 dark:bg-[#111] dark:text-slate-100';

function Pergunta({
	numero,
	titulo,
	ajuda,
	children,
}: {
	numero: number;
	titulo: string;
	ajuda?: string;
	children: ReactNode;
}) {
	return (
		<section className="border-t border-slate-200 px-5 py-5 first:border-t-0 sm:px-6 dark:border-white/10">
			<div className="flex items-baseline gap-2.5">
				<span className="font-mono text-xs font-bold text-[var(--screen-accent,#7c3aed)]">
					{numero}
				</span>
				<div className="min-w-0 flex-1">
					<h3 className="text-sm font-semibold text-slate-900 dark:text-white">
						{titulo}
					</h3>
					{ajuda ? (
						<p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
							{ajuda}
						</p>
					) : null}
					<div className="mt-3">{children}</div>
				</div>
			</div>
		</section>
	);
}

const chip =
	'rounded-lg border px-3 py-2 text-sm font-medium transition-colors text-left';
const chipOff =
	'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300';
const chipOn = 'border-transparent text-white';
const estiloOn = { background: 'var(--screen-accent, #7c3aed)' } as const;

/* ─────────────────────── o que foi assumido, e por quê ────────────────── */

const ROTULO_ORIGEM: Record<string, string> = {
	maquina: 'da sua máquina',
	calculo: 'calculado',
	padrao: 'padrão',
};

/**
 * O CARTÃO DOS ASSUMIDOS — cada número que a ferramenta preencheu sozinha, com
 * a frase que diz de onde ele saiu e um lápis do lado.
 *
 * "Sua CO2 100 W gasta ~2,2 kW ligada · o tubo custa R$ 0,25 por hora de uso ·
 * você fica junto da máquina 35% do tempo." Um perfil que não mostra isso é um
 * perfil que ninguém audita — e o número que ninguém audita vira preço errado
 * sem dono.
 */
function Assumidos({
	itens,
	overrides,
	onOverride,
}: {
	itens: CampoAssumido[];
	overrides: Record<string, string | number>;
	onOverride: (campo: string, valor: string) => void;
}) {
	const [editando, setEditando] = useState<string | null>(null);
	if (itens.length === 0) return null;

	return (
		<div className="space-y-1.5">
			{itens.map((a) => {
				const corrigido = overrides[a.campo] !== undefined;
				const emEdicao = editando === a.campo;
				return (
					<div
						key={a.campo}
						className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-white/10 dark:bg-white/5"
					>
						<div className="flex items-center justify-between gap-3">
							<span className="min-w-0 flex-1 text-xs font-medium text-slate-700 dark:text-slate-200">
								{a.label}
							</span>
							{emEdicao ? (
								<input
									// biome-ignore lint/a11y/noAutofocus: o lápis abriu o campo; o cursor tem que estar nele
									autoFocus
									type="text"
									inputMode="decimal"
									defaultValue={String(overrides[a.campo] ?? a.valor)}
									onBlur={(e) => {
										onOverride(a.campo, e.target.value);
										setEditando(null);
									}}
									onKeyDown={(e) => {
										if (e.key === 'Enter') e.currentTarget.blur();
										if (e.key === 'Escape') setEditando(null);
									}}
									className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right font-mono text-xs tabular-nums dark:border-white/20 dark:bg-[#111] dark:text-white"
								/>
							) : (
								<button
									type="button"
									onClick={() => setEditando(a.campo)}
									className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-1.5 py-0.5 font-mono text-xs tabular-nums text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
								>
									{String(overrides[a.campo] ?? a.valor)}
									{a.unidade ? (
										<span className="font-sans text-[10px] text-slate-400">
											{a.unidade}
										</span>
									) : null}
									<Pencil className="h-3 w-3 text-slate-300 dark:text-slate-600" />
								</button>
							)}
						</div>
						<p className="mt-0.5 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
							{corrigido ? (
								<span className="font-medium text-emerald-600 dark:text-emerald-400">
									você corrigiu este valor
								</span>
							) : (
								<>
									{ROTULO_ORIGEM[a.origem] ?? a.origem}: {a.fonte}
								</>
							)}
						</p>
					</div>
				);
			})}
		</div>
	);
}

/* ────────────────────────────── o formulário ──────────────────────────── */

const MARKUPS = [
	{ pct: 50, texto: '1,5× o custo' },
	{ pct: 100, texto: 'o dobro do custo' },
	{ pct: 200, texto: '3× o custo' },
];

/** Campo vazio vira AUSENTE, não zero — o back tem padrão declarado para cada. */
function num(v: string): number | undefined {
	const n = Number(v.replace(',', '.'));
	return v.trim() !== '' && Number.isFinite(n) ? n : undefined;
}

export function PerfilCurtoForm({
	toolKey,
	onClose,
	onSaved,
}: {
	toolKey: string;
	onClose: () => void;
	onSaved: (entry: CollectionEntry) => void;
}) {
	const queryClient = useQueryClient();
	const catalogo = useQuery({
		queryKey: ['quote-machines'],
		queryFn: listQuoteMachines,
		staleTime: 10 * 60_000,
	});

	const padroes = catalogo.data?.padroes ?? {};
	const [classe, setClasse] = useState('');
	const [horas, setHoras] = useState('');
	const [ganho, setGanho] = useState('');
	const [markup, setMarkup] = useState<number | null>(null);
	const [regime, setRegime] = useState('');
	const [minimo, setMinimo] = useState('');
	const [nome, setNome] = useState('');
	const [overrides, setOverrides] = useState<Record<string, string | number>>(
		{},
	);
	const [derivado, setDerivado] = useState<PerfilDerivado | null>(null);

	const respostas = useMemo(
		() => ({
			tool: toolKey,
			...(classe ? { maquina_classe: classe } : {}),
			...(num(horas) !== undefined ? { horas_uteis_dia: num(horas) } : {}),
			...(num(ganho) !== undefined ? { ganho_mensal: num(ganho) } : {}),
			...(markup !== null ? { markup_pct: markup } : {}),
			...(regime ? { regime_fiscal: regime } : {}),
			...(num(minimo) !== undefined ? { pedido_minimo: num(minimo) } : {}),
		}),
		[toolKey, classe, horas, ganho, markup, regime, minimo],
	);

	const montar = useMutation({
		mutationFn: (over: Record<string, string | number>) =>
			buildQuoteProfile({
				...respostas,
				...(Object.keys(over).length > 0 ? { overrides: over } : {}),
			}),
		onSuccess: (d) => {
			setDerivado(d);
			if (!nome.trim()) setNome(`Minha oficina — ${d.maquina}`);
		},
		onError: (e: unknown) => toast.error(mensagem(e)),
	});

	const salvar = useMutation({
		mutationFn: async () => {
			if (!derivado) throw new Error('monte o perfil antes de salvar');
			return createCollectionEntry(toolKey, 'perfis', {
				title: nome.trim() || 'Minha oficina',
				// O registro COMPLETO, com os derivados dentro. Ver o cabeçalho.
				data: derivado.data,
				visibility: 'owner',
			});
		},
		onSuccess: (entry) => {
			queryClient.invalidateQueries({ queryKey: ['collection-options'] });
			toast.success('Perfil de custo salvo. Agora o preço é o da SUA oficina.');
			onSaved(entry);
			onClose();
		},
		onError: (e: unknown) => toast.error(mensagem(e)),
	});

	const aplicaOverride = useCallback(
		(campo: string, valor: string) => {
			const proximo = { ...overrides };
			if (valor.trim() === '') delete proximo[campo];
			else proximo[campo] = valor.trim();
			setOverrides(proximo);
			// Recalcula NO SERVIDOR: corrigir "consumo elétrico" muda a taxa-hora, e
			// a taxa-hora é dinheiro. Reaplicar a conta aqui criaria a segunda fonte
			// de verdade que esta ferramenta inteira existe para não ter.
			montar.mutate(proximo);
		},
		[overrides, montar],
	);

	const podeMontar = classe.length > 0;
	const maquinas = catalogo.data?.machines ?? [];
	const regimes = catalogo.data?.regimes ?? [];
	const outra = catalogo.data?.outra ?? 'outra';

	return (
		<ModalOverlay onClose={onClose} tone="tools" widthClassName="max-w-2xl">
			<div className="flex items-start justify-between gap-3 px-5 py-4 sm:px-6">
				<div>
					<h2 className="text-base font-semibold text-slate-900 dark:text-white">
						O custo da sua oficina
					</h2>
					<p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
						Seis perguntas que você responde de cabeça. O resto — consumo,
						consumíveis, depreciação, imposto — a ferramenta assume por você e
						mostra de onde tirou cada número.
					</p>
				</div>
				<button
					type="button"
					onClick={onClose}
					aria-label="Fechar"
					className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			{catalogo.isLoading ? (
				<p className="flex items-center gap-2 px-6 py-10 text-sm text-slate-500">
					<Loader2 className="h-4 w-4 animate-spin" />
					Carregando as máquinas de referência…
				</p>
			) : (
				<>
					<Pergunta
						numero={1}
						titulo="Que máquina você tem?"
						ajuda="Ela responde por potência, consumo, consumíveis, manutenção, valor e quanto tempo você fica junto dela."
					>
						<div className="grid gap-2 sm:grid-cols-2">
							{maquinas.map((m) => (
								<button
									key={m.id}
									type="button"
									onClick={() => setClasse(m.id)}
									className={`${chip} ${classe === m.id ? chipOn : chipOff}`}
									style={classe === m.id ? estiloOn : undefined}
								>
									{m.label}
								</button>
							))}
							<button
								type="button"
								onClick={() => setClasse(outra)}
								className={`${chip} ${classe === outra ? chipOn : chipOff}`}
								style={classe === outra ? estiloOn : undefined}
							>
								Outra máquina
							</button>
						</div>
						{classe === outra ? (
							<p className="mt-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/5 dark:text-amber-300">
								Sem uma classe conhecida, os custos de máquina saem do padrão do
								sistema. Salve assim mesmo e depois corrija os campos que você
								souber — ou escolha a classe mais parecida com a sua.
							</p>
						) : null}
					</Pergunta>

					<Pergunta
						numero={2}
						titulo="Quantas horas por dia você trabalha com ela?"
						ajuda="Define o prazo dos pedidos, em quanto tempo a máquina se paga e quanto vale a sua hora."
					>
						<div className="flex items-center gap-2">
							<input
								type="number"
								inputMode="decimal"
								min={0.5}
								max={24}
								step={0.5}
								value={horas}
								placeholder={String(padroes.horas_uteis_dia ?? 8)}
								onChange={(e) => setHoras(e.target.value)}
								className={`${campoNum} max-w-[7rem]`}
							/>
							<span className="text-sm text-slate-500 dark:text-slate-400">
								horas por dia
							</span>
						</div>
					</Pergunta>

					<Pergunta
						numero={3}
						titulo="Quanto você quer ganhar por mês?"
						ajuda="É daqui que sai o custo da sua hora — não do salário mínimo. Você é o operador."
					>
						<div className="flex items-center gap-2">
							<span className="text-sm text-slate-400">R$</span>
							<input
								type="number"
								inputMode="decimal"
								min={0}
								step={100}
								value={ganho}
								placeholder={String(padroes.ganho_mensal ?? 4400)}
								onChange={(e) => setGanho(e.target.value)}
								className={`${campoNum} max-w-[10rem]`}
							/>
							<span className="text-sm text-slate-500 dark:text-slate-400">
								por mês
							</span>
						</div>
					</Pergunta>

					<Pergunta
						numero={4}
						titulo="Quanto você quer lucrar em cima do custo?"
						ajuda="Confundir “3× o custo” com “35% de margem” é a origem clássica de quebrar preço. Aqui você responde uma vez e a ferramenta converte."
					>
						<div className="flex flex-wrap gap-2">
							{MARKUPS.map((m) => (
								<button
									key={m.pct}
									type="button"
									onClick={() => setMarkup(m.pct)}
									className={`${chip} ${markup === m.pct ? chipOn : chipOff}`}
									style={markup === m.pct ? estiloOn : undefined}
								>
									<span className="font-mono">{m.pct}%</span>
									<span className="ml-1.5 text-xs opacity-75">{m.texto}</span>
								</button>
							))}
						</div>
					</Pergunta>

					<Pergunta numero={5} titulo="Você emite nota?">
						<div className="grid gap-2 sm:grid-cols-2">
							{regimes.map((r) => (
								<button
									key={r.id}
									type="button"
									onClick={() => setRegime(r.id)}
									className={`${chip} ${regime === r.id ? chipOn : chipOff}`}
									style={regime === r.id ? estiloOn : undefined}
								>
									{r.label}
								</button>
							))}
						</div>
					</Pergunta>

					<Pergunta
						numero={6}
						titulo="Qual o menor valor que você aceita cobrar por um pedido?"
						ajuda="Esta é a pergunta que MAIS decide o preço do trabalho pequeno: gravar um logo num copo dá R$ 8,00 de cálculo e é o mínimo que vai na nota."
					>
						<div className="flex items-center gap-2">
							<span className="text-sm text-slate-400">R$</span>
							<input
								type="number"
								inputMode="decimal"
								min={0}
								step={5}
								value={minimo}
								placeholder={String(padroes.pedido_minimo ?? 50)}
								onChange={(e) => setMinimo(e.target.value)}
								className={`${campoNum} max-w-[8rem]`}
							/>
							<span className="text-sm text-slate-500 dark:text-slate-400">
								por pedido
							</span>
						</div>
					</Pergunta>

					{/* ── o que assumimos ─────────────────────────────────────── */}
					{derivado ? (
						<div className="border-t border-slate-200 px-5 py-5 sm:px-6 dark:border-white/10">
							<div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
								<h3 className="text-sm font-semibold text-slate-900 dark:text-white">
									O que assumimos pela sua {derivado.maquina}
								</h3>
								<p className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
									hora-máquina {reais(Math.round(derivado.taxa_hora * 100))} ·
									sua hora{' '}
									{reais(Math.round(derivado.custo_hora_operador * 100))}
								</p>
							</div>
							<p className="mb-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
								Estes números vão gravados no seu perfil — não ficam em branco,
								porque campo em branco vira o custo da máquina de outra pessoa.
								Discorde de qualquer um clicando no valor.
							</p>
							<Assumidos
								itens={derivado.assumidos}
								overrides={overrides}
								onOverride={aplicaOverride}
							/>

							<label
								htmlFor="perfil-nome"
								className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-300"
							>
								Como chamar este perfil
							</label>
							<input
								id="perfil-nome"
								type="text"
								value={nome}
								maxLength={80}
								onChange={(e) => setNome(e.target.value)}
								className={`${campoNum} mt-1.5`}
							/>
						</div>
					) : null}

					{/* ── barra de ação ───────────────────────────────────────── */}
					<div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/90 px-5 py-3.5 backdrop-blur sm:px-6 dark:border-white/10 dark:bg-[#16161a]/90">
						<p className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
							<ShieldCheck className="h-3.5 w-3.5" />
							Nenhum número aqui passa por inteligência artificial.
						</p>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
							>
								Cancelar
							</button>
							{derivado ? (
								<button
									type="button"
									onClick={() => salvar.mutate()}
									disabled={salvar.isPending || montar.isPending}
									className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
									style={estiloOn}
								>
									{salvar.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Check className="h-4 w-4" />
									)}
									Salvar o meu perfil
								</button>
							) : (
								<button
									type="button"
									onClick={() => montar.mutate(overrides)}
									disabled={!podeMontar || montar.isPending}
									className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
									style={estiloOn}
								>
									{montar.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : null}
									{podeMontar ? 'Ver o meu custo' : 'Escolha a sua máquina'}
								</button>
							)}
						</div>
					</div>
				</>
			)}
		</ModalOverlay>
	);
}

function mensagem(e: unknown): string {
	const m = (e as { response?: { data?: { message?: string } } })?.response
		?.data?.message;
	if (typeof m === 'string' && m.trim()) return m;
	return e instanceof Error ? e.message : 'Não consegui montar o perfil.';
}
