'use client';

import {
	AlertTriangle,
	Check,
	ChevronDown,
	Clock,
	Copy,
	Scale,
} from 'lucide-react';
import { useState } from 'react';

/**
 * Viewport de ORÇAMENTO — o que aparece quando `ui.result.kind === 'quote'`.
 *
 * A razão de existir está escrita no topo do precificador (`lib/quote/pricing.ts`):
 * o profissional precisa conseguir DISCUTIR o preço com o cliente sem ligar para
 * o suporte. Por isso aqui não há caixa-preta: cada linha de custo aparece com a
 * conta que a gerou (`linha.detalhe`), na mesma ordem em que o motor calculou.
 *
 * Antes desta tela, `kind:'quote'` caía no preview de imagem e o aluno via
 * "Envie uma foto para ver a prévia ao vivo" depois de subir um DXF.
 *
 * Nada aqui recalcula nada: o número vem inteiro do back. Refazer a conta no
 * cliente criaria uma segunda fonte de verdade para preço, que é exatamente o
 * tipo de divergência que ninguém descobre até um cliente reclamar.
 */

/* ─────────────────────────── formatação ─────────────────────────── */

const BRL = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	currency: 'BRL',
});

/** Centavos → R$. Todo dinheiro no motor é inteiro em centavos, nunca float. */
function money(cents: unknown): string {
	const n = Number(cents);
	return Number.isFinite(n) ? BRL.format(n / 100) : '—';
}

/** Segundos → "1h 12min" / "12min" / "45s". Ninguém lê 4320 segundos. */
function dur(seconds: unknown): string {
	const s = Math.round(Number(seconds));
	if (!Number.isFinite(s) || s <= 0) return '—';
	if (s < 60) return `${s}s`;
	const m = Math.round(s / 60);
	if (m < 60) return `${m}min`;
	const h = Math.floor(m / 60);
	const r = m % 60;
	return r ? `${h}h ${r}min` : `${h}h`;
}

function num(v: unknown): number | undefined {
	const n = Number(v);
	return Number.isFinite(n) ? n : undefined;
}

/* ─────────────────────────── tipos frouxos ─────────────────────────── */

/**
 * O `breakdown` chega como JSON do motor. Tipar frouxo de propósito: a tela não
 * pode quebrar porque o back ganhou um campo novo, e um `zod.parse` aqui só
 * transformaria um campo extra em tela branca.
 */
interface Linha {
	id?: string;
	label?: string;
	cents?: number;
	detalhe?: string;
}

export interface QuoteBreakdownLike {
	qty?: number;
	tempos?: Record<string, unknown>;
	material?: Record<string, unknown>;
	velocidade?: Record<string, unknown>;
	maquina?: Record<string, unknown>;
	custos?: {
		linhas?: Linha[];
		diretoCents?: number;
		overheadCents?: number;
		totalCents?: number;
	};
	precos?: Record<string, unknown>;
	prazoDias?: number;
	avisos?: string[];
}

export interface QuoteViewportProps {
	breakdown: QuoteBreakdownLike;
	/** SVG (data-URL) da peça, quando o pipeline produziu preview. */
	preview?: string;
	/** Texto do orçamento do CLIENTE — já sem custo, markup, margem e imposto. */
	publico?: string;
}

/* ─────────────────────────── peças de UI ─────────────────────────── */

const card =
	'rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#16161a]';

function Stat({
	label,
	value,
	hint,
	forte,
}: {
	label: string;
	value: string;
	hint?: string;
	forte?: boolean;
}) {
	return (
		<div className={`${card} p-4`}>
			<p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
				{label}
			</p>
			<p
				className={`mt-1 font-mono tabular-nums ${
					forte
						? 'text-2xl font-bold text-slate-900 dark:text-slate-50'
						: 'text-lg font-semibold text-slate-700 dark:text-slate-200'
				}`}
			>
				{value}
			</p>
			{hint ? (
				<p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
					{hint}
				</p>
			) : null}
		</div>
	);
}

/**
 * Selo de confiança da velocidade de corte. A cascata (`cut-speed.ts`) devolve
 * `source` e `confidence`, e mostrar isso não é detalhe: um orçamento fechado
 * em cima de uma curva paramétrica não vale o mesmo que um em cima de receita
 * medida na máquina, e o profissional tem que saber a diferença ANTES de
 * mandar o preço para o cliente.
 */
function ConfiancaVelocidade({ v }: { v: Record<string, unknown> }) {
	const conf = num(v.confidence) ?? 0;
	const estimativa = v.estimativa === true;
	const tone = estimativa
		? conf >= 0.7
			? 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/25'
			: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-500/10 dark:border-rose-500/25'
		: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/25';

	const rotulo = estimativa
		? conf >= 0.7
			? 'Velocidade estimada'
			: 'Velocidade com baixa confiança'
		: 'Velocidade medida';

	return (
		<div className={`rounded-xl border px-3 py-2 text-xs ${tone}`}>
			<div className="flex items-center gap-1.5 font-semibold">
				<Scale className="h-3.5 w-3.5" />
				{rotulo}
				<span className="font-mono tabular-nums opacity-70">
					{Math.round(conf * 100)}%
				</span>
			</div>
			{typeof v.detalhe === 'string' && v.detalhe ? (
				<p className="mt-1 leading-snug opacity-90">{v.detalhe}</p>
			) : null}
			{estimativa ? (
				<p className="mt-1 font-medium leading-snug">
					Confirme numa peça de teste antes de fechar o preço.
				</p>
			) : null}
		</div>
	);
}

/* ─────────────────────────── o viewport ─────────────────────────── */

export function QuoteViewport({
	breakdown,
	preview,
	publico,
}: QuoteViewportProps) {
	const [abertas, setAbertas] = useState(false);
	const [copiado, setCopiado] = useState(false);

	const precos = (breakdown.precos ?? {}) as Record<string, unknown>;
	const custos = breakdown.custos ?? {};
	const tempos = (breakdown.tempos ?? {}) as Record<string, unknown>;
	const material = (breakdown.material ?? {}) as Record<string, unknown>;
	const velocidade = (breakdown.velocidade ?? {}) as Record<string, unknown>;
	const linhas = custos.linhas ?? [];
	const qty = num(breakdown.qty) ?? 1;
	const avisos = breakdown.avisos ?? [];

	const copiar = async () => {
		if (!publico) return;
		try {
			await navigator.clipboard.writeText(publico);
			setCopiado(true);
			setTimeout(() => setCopiado(false), 2000);
		} catch {
			// Área de transferência bloqueada (http, permissão negada): não vale
			// derrubar a tela por um botão de conveniência.
		}
	};

	return (
		<div className="space-y-4">
			{/* Os quatro números que decidem: total, unitário, prazo, custo. */}
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<Stat
					label={qty > 1 ? `Total · ${qty} peças` : 'Total'}
					value={money(precos.precoTotalCents)}
					forte
				/>
				<Stat
					label="Por peça"
					value={money(precos.precoUnitEfetivoCents ?? precos.precoUnitCents)}
					hint={
						num(precos.descontoPct)
							? `com ${Math.round((num(precos.descontoPct) ?? 0) * 100)}% de desconto`
							: undefined
					}
				/>
				<Stat
					label="Seu custo por peça"
					value={money(custos.totalCents)}
					hint={
						num(precos.margemEfetivaComDescontoPct) !== undefined
							? `margem ${Math.round((num(precos.margemEfetivaComDescontoPct) ?? 0) * 100)}%`
							: undefined
					}
				/>
				<Stat
					label="Prazo"
					value={
						breakdown.prazoDias
							? `${breakdown.prazoDias} ${breakdown.prazoDias === 1 ? 'dia' : 'dias'}`
							: '—'
					}
					hint={
						tempos.ocupacaoS || tempos.loteS
							? `${dur(tempos.ocupacaoS ?? tempos.loteS)} de trabalho`
							: undefined
					}
				/>
			</div>

			{precos.aplicouPedidoMinimo === true ? (
				<p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300">
					O pedido ficou abaixo do seu mínimo — o total foi ajustado para{' '}
					{money(precos.pedidoMinimoCents)}.
				</p>
			) : null}

			<div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,320px)]">
				{/* ── A tabela auditável: cada linha com a conta que a gerou ── */}
				<div className={`${card} overflow-hidden`}>
					<div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/5">
						<h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
							De onde vem o preço
						</h3>
						<button
							type="button"
							onClick={() => setAbertas((v) => !v)}
							className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
						>
							{abertas ? 'Esconder contas' : 'Ver as contas'}
							<ChevronDown
								className={`h-3.5 w-3.5 transition-transform ${abertas ? 'rotate-180' : ''}`}
							/>
						</button>
					</div>

					<table className="w-full text-sm">
						<tbody className="divide-y divide-slate-100 dark:divide-white/5">
							{linhas.map((l, i) => (
								<tr key={l.id ?? `linha-${i}`} className="align-top">
									<td className="px-4 py-2.5">
										<span className="text-slate-700 dark:text-slate-300">
											{l.label ?? l.id}
										</span>
										{abertas && l.detalhe ? (
											<p className="mt-0.5 font-mono text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
												{l.detalhe}
											</p>
										) : null}
									</td>
									<td className="whitespace-nowrap px-4 py-2.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
										{money(l.cents)}
									</td>
								</tr>
							))}

							<tr className="bg-slate-50/60 dark:bg-white/[0.02]">
								<td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
									Custo direto
								</td>
								<td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
									{money(custos.diretoCents)}
								</td>
							</tr>
							<tr className="bg-slate-50/60 dark:bg-white/[0.02]">
								<td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
									Overhead
								</td>
								<td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
									{money(custos.overheadCents)}
								</td>
							</tr>
							<tr className="border-t-2 border-slate-200 font-semibold dark:border-white/10">
								<td className="px-4 py-3 text-slate-900 dark:text-slate-100">
									Custo por peça
								</td>
								<td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
									{money(custos.totalCents)}
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				{/* ── Coluna de contexto: peça, material, tempo, confiança ── */}
				<div className="space-y-3">
					{preview ? (
						<div
							className={`${card} grid place-items-center overflow-hidden p-3`}
						>
							{/* biome-ignore lint/performance/noImgElement: data-URL de SVG gerado no run, não passa pelo otimizador */}
							<img
								src={preview}
								alt="Prévia da peça"
								className="max-h-48 w-full object-contain"
							/>
						</div>
					) : null}

					<div className={`${card} space-y-2 p-4 text-xs`}>
						<div className="flex justify-between gap-3">
							<span className="text-slate-500 dark:text-slate-400">
								Material
							</span>
							<span className="text-right font-medium text-slate-700 dark:text-slate-300">
								{String(material.nome ?? '—')}
								{material.espessuraMm ? ` · ${material.espessuraMm} mm` : ''}
							</span>
						</div>
						{material.pesoKg ? (
							<div className="flex justify-between gap-3">
								<span className="text-slate-500 dark:text-slate-400">Peso</span>
								<span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
									{(num(material.pesoKg) ?? 0).toFixed(3)} kg
								</span>
							</div>
						) : null}
						{material.pecasPorChapa ? (
							<div className="flex justify-between gap-3">
								<span className="text-slate-500 dark:text-slate-400">
									Cabem por chapa
								</span>
								<span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
									{String(material.pecasPorChapa)}
								</span>
							</div>
						) : null}
						<div className="flex justify-between gap-3 border-t border-slate-100 pt-2 dark:border-white/5">
							<span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
								<Clock className="h-3 w-3" /> Máquina por peça
							</span>
							<span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
								{dur(tempos.unitarioS)}
							</span>
						</div>
						<div className="flex justify-between gap-3">
							<span className="text-slate-500 dark:text-slate-400">
								Hora-máquina
							</span>
							<span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
								{money((breakdown.maquina ?? {}).taxaHoraCents)}/h
							</span>
						</div>
					</div>

					<ConfiancaVelocidade v={velocidade} />

					{publico ? (
						<button
							type="button"
							onClick={copiar}
							className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
						>
							{copiado ? (
								<>
									<Check className="h-4 w-4 text-emerald-500" /> Copiado
								</>
							) : (
								<>
									<Copy className="h-4 w-4" /> Copiar orçamento do cliente
								</>
							)}
						</button>
					) : null}
					{publico ? (
						<p className="text-[11px] leading-snug text-slate-400 dark:text-slate-500">
							O texto copiado leva só preço, prazo e medidas — nunca seu custo,
							sua margem ou sua hora-máquina.
						</p>
					) : null}
				</div>
			</div>

			{avisos.length > 0 ? (
				<div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/25 dark:bg-amber-500/10">
					<p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
						<AlertTriangle className="h-3.5 w-3.5" />
						Vale conferir
					</p>
					<ul className="mt-1.5 space-y-1">
						{avisos.map((a) => (
							<li
								key={a}
								className="text-xs leading-snug text-amber-800/90 dark:text-amber-300/90"
							>
								• {a}
							</li>
						))}
					</ul>
				</div>
			) : null}
		</div>
	);
}
