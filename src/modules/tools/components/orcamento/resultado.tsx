'use client';

import {
	AlertTriangle,
	ChevronDown,
	Clock,
	Copy,
	FileWarning,
	Info,
	Scale,
	TrendingDown,
	TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	type LinhaDeCusto,
	mm,
	numero,
	type Orcamento,
	type PontoDaCurva,
	pct,
	reais,
	textoParaOCliente,
} from './tipos';

/**
 * A RESPOSTA — o que o dono da oficina abriu a ferramenta para ver.
 *
 * ┌─ A ORDEM DA TELA É A ORDEM DAS PERGUNTAS DELE ───────────────────────────┐
 * │ ① QUANTO COBRAR. Um número grande, com o total do pedido ao lado.         │
 * │ ② QUANTO SOBRA — em REAIS, não em percentual. "47,8% de margem" não paga  │
 * │    a chapa do mês; "sobram R$ 96,20 neste pedido" paga. Este bloco não    │
 * │    existia: `margemEfetivaComDescontoPct` era calculado, ficava no        │
 * │    breakdown e ninguém via.                                              │
 * │ ③ E SE EU FIZER 50? A quantidade muda o preço por dois motivos que o      │
 * │    profissional confunde — o setup é rateado e a faixa de desconto é      │
 * │    automática. Um número solto esconde os dois; a curva mostra.           │
 * │ ④ A CONTA ABERTA, fechada por padrão. É o melhor ativo da ferramenta e o  │
 * │    que deixa ele DISCUTIR o preço com o cliente — mas não é a resposta.   │
 * │ ⑤ MANDAR PARA O CLIENTE.                                                  │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * NADA AQUI RECALCULA NADA. Preço, custo, sobra, piso e curva chegam prontos de
 * `quote.price`. Uma segunda conta no navegador seria uma segunda fonte de
 * verdade para dinheiro — o tipo de divergência que ninguém descobre até um
 * cliente reclamar do valor.
 */

const card =
	'rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#16161a]';

/* ───────────────────────────── ① quanto cobrar ──────────────────────────── */

function Cabecalho({ orc, qtd }: { orc: Orcamento; qtd: number }) {
	const precos = (orc.breakdown.precos ?? {}) as Record<string, unknown>;
	const velocidade = (orc.breakdown.velocidade ?? {}) as Record<
		string,
		unknown
	>;
	const unit =
		numero(precos.precoUnitEfetivoCents) ?? numero(precos.precoUnitCents) ?? 0;
	const total = numero(precos.precoTotalCents) ?? 0;
	const prazo = numero(orc.breakdown.prazoDias);
	const minimo = precos.aplicouPedidoMinimo === true;
	const estimativa = velocidade.estimativa === true;

	return (
		<div
			className={`${card} overflow-hidden`}
			style={{
				borderColor:
					'color-mix(in srgb, var(--screen-accent, #7c3aed) 35%, transparent)',
			}}
		>
			<div
				className="px-5 py-5 sm:px-7 sm:py-6"
				style={{
					background:
						'color-mix(in srgb, var(--screen-accent, #7c3aed) 8%, transparent)',
				}}
			>
				<p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
					Cobre nesta peça
				</p>
				<div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<span className="font-mono text-4xl font-bold tabular-nums text-slate-900 sm:text-5xl dark:text-white">
						{reais(unit)}
					</span>
					<span className="text-sm font-medium text-slate-500 dark:text-slate-400">
						por peça
					</span>
				</div>
				<div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
					<span className="text-slate-700 dark:text-slate-200">
						<strong className="font-mono tabular-nums">{reais(total)}</strong>{' '}
						pelas {qtd} peça{qtd > 1 ? 's' : ''}
					</span>
					{prazo !== undefined ? (
						<span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
							<Clock className="h-3.5 w-3.5" />
							{prazo} dia{prazo === 1 ? '' : 's'} úteis
						</span>
					) : null}
				</div>
			</div>

			{/* O pedido mínimo mostrava DOIS números sem dizer qual manda: unitário
			    de tabela na tela e cobrança no piso. Aqui ele é dito em uma frase. */}
			{minimo ? (
				<p className="flex items-start gap-2 border-t border-slate-200 px-5 py-3 text-xs leading-relaxed text-slate-600 sm:px-7 dark:border-white/10 dark:text-slate-300">
					<Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
					<span>
						O cálculo deu menos que o seu <strong>pedido mínimo</strong>, então
						é o mínimo que vale — é este o valor a cobrar.
					</span>
				</p>
			) : null}

			{estimativa ? (
				<p className="flex items-start gap-2 border-t border-amber-200 bg-amber-50/70 px-5 py-3 text-xs leading-relaxed text-amber-800 sm:px-7 dark:border-amber-500/25 dark:bg-amber-500/5 dark:text-amber-300">
					<Scale className="mt-0.5 h-3.5 w-3.5 shrink-0" />
					<span>
						<strong>Preço estimado.</strong> A velocidade de corte saiu de um
						modelo, não de uma medição na sua máquina. Corte uma peça de teste
						antes de fechar.
					</span>
				</p>
			) : null}
		</div>
	);
}

/* ───────────────────────────── ② quanto sobra ──────────────────────────── */

function Sobra({ orc, qtd }: { orc: Orcamento; qtd: number }) {
	const lucro = orc.lucro;
	const custoPeca = numero(orc.breakdown.custos?.totalCents);
	const precos = (orc.breakdown.precos ?? {}) as Record<string, unknown>;
	// Sem `lucro` no output (definition antiga, ou allow-list sem a chave) o
	// bloco inteiro some — em vez de desenhar "—" onde deveria estar dinheiro.
	if (!lucro) return null;

	/**
	 * O PISO NA MESMA BASE DA MANCHETE.
	 *
	 * A manchete desta tela é `precoUnitEfetivoCents` — o que o cliente paga por
	 * peça, DEPOIS do desconto. O piso que estava aqui era o de TABELA, ANTES do
	 * desconto. Os dois estão certos e não podem aparecer juntos: com 40% na
	 * mesa a tela dizia "cobre R$ 7,80", "sobram R$ 144,20" e "abaixo de
	 * R$ 10,45 dá prejuízo", tudo no mesmo cartão.
	 *
	 * `?? pisoUnitCents` é rede para definition antiga: sem desconto as duas
	 * bases coincidem, então o fallback só erra onde antes já errava.
	 */
	const piso = lucro.pisoUnitEfetivoCents ?? lucro.pisoUnitCents;
	const descontoPct = numero(precos.descontoPct) ?? 0;
	const prejuizo = lucro.abaixoDoCusto === true || lucro.doPedidoCents < 0;
	const tom = prejuizo
		? 'border-rose-300 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/5'
		: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-500/5';

	return (
		<div className={`rounded-2xl border p-5 ${tom}`}>
			<div className="flex items-center gap-2">
				{prejuizo ? (
					<TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
				) : (
					<TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
				)}
				<p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
					{prejuizo ? 'Você está no prejuízo' : 'Quanto sobra para você'}
				</p>
			</div>

			<div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div>
					<p className="text-[11px] text-slate-500 dark:text-slate-400">
						No pedido inteiro
					</p>
					<p
						className={`font-mono text-2xl font-bold tabular-nums ${
							prejuizo
								? 'text-rose-700 dark:text-rose-300'
								: 'text-emerald-700 dark:text-emerald-300'
						}`}
					>
						{reais(lucro.doPedidoCents)}
					</p>
				</div>
				<div>
					<p className="text-[11px] text-slate-500 dark:text-slate-400">
						Por peça
					</p>
					<p className="font-mono text-lg font-semibold tabular-nums text-slate-700 dark:text-slate-200">
						{reais(lucro.porPecaCents)}
					</p>
				</div>
				<div>
					<p className="text-[11px] text-slate-500 dark:text-slate-400">
						Margem real
					</p>
					<p className="font-mono text-lg font-semibold tabular-nums text-slate-700 dark:text-slate-200">
						{pct((lucro.margemPct ?? 0) * 100)}
					</p>
				</div>
				<div>
					<p className="text-[11px] text-slate-500 dark:text-slate-400">
						Seu custo por peça
					</p>
					<p className="font-mono text-lg font-semibold tabular-nums text-slate-700 dark:text-slate-200">
						{reais(custoPeca)}
					</p>
				</div>
			</div>

			{/* O PISO responde "qual o menor preço que não me faz perder dinheiro?".
			    O número já existia no motor (custo + imposto por cima) e nunca era
			    apresentado COMO piso — só como custo, que é outra coisa. */}
			<p className="mt-4 border-t border-slate-900/5 pt-3 text-xs leading-relaxed text-slate-600 dark:border-white/10 dark:text-slate-300">
				{prejuizo ? (
					<>
						<strong>
							Este preço está {reais(Math.abs(lucro.doPedidoCents))} abaixo do
							seu custo.
						</strong>{' '}
						Cobrando menos de{' '}
						<strong className="font-mono">{reais(piso)}</strong> por peça você
						paga para trabalhar. Revise o desconto ou o markup do seu perfil.
					</>
				) : (
					<>
						Seu piso é <strong className="font-mono">{reais(piso)}</strong> por
						peça: abaixo disso, este pedido de {qtd} peça
						{qtd > 1 ? 's' : ''} passa a dar prejuízo (já contando o imposto).
						{descontoPct > 0 ? (
							<>
								{' '}
								Como você está dando {pct(descontoPct * 100, 0)} de desconto,
								isso é{' '}
								<strong className="font-mono">
									{reais(lucro.pisoUnitCents)}
								</strong>{' '}
								na sua tabela.
							</>
						) : null}
					</>
				)}
			</p>
		</div>
	);
}

/* ─────────────────────────── ③ e se eu fizer 50? ────────────────────────── */

function Curva({ curva }: { curva: PontoDaCurva[] }) {
	// Um ponto só (curva desligada na definition) não é curva: não desenha nada
	// em vez de desenhar uma tabela de uma linha, que não compara com nada.
	if (curva.length < 2) return null;
	// Só fala em desconto quando existe algum na tabela. O texto fixo prometia
	// "o desconto por quantidade do seu perfil entra junto" apontando para uma
	// coluna de traços — quem cadastrou o perfil curto (que não pergunta faixas)
	// lia uma promessa que a própria tabela desmentia logo abaixo.
	const temDesconto = curva.some((p) => p.descontoPct > 0);

	return (
		<div className={card}>
			<div className="border-b border-slate-200 px-5 py-3.5 dark:border-white/10">
				<p className="text-sm font-semibold text-slate-900 dark:text-white">
					E se você fizer mais?
				</p>
				<p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
					A preparação da máquina é a mesma para 1 ou para 100 peças — quanto
					mais peças, menos cada uma paga desse tempo.{' '}
					{temDesconto
						? 'O desconto por quantidade do seu perfil entra junto.'
						: 'Você não tem desconto por quantidade cadastrado: se quiser dar, é no seu perfil de custo.'}
				</p>
			</div>

			{/* Rolagem própria: a tabela não pode empurrar a página no celular. E
			    DESCONTO e PRAZO somem no celular em vez de empurrarem SOBRA para
			    fora da tela — a pergunta do card é "quanto sobra se eu fizer mais",
			    e a resposta não pode ser a coluna cortada. */}
			<div className="overflow-x-auto">
				<table className="w-full min-w-[340px] text-sm sm:min-w-[560px]">
					<thead>
						<tr className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
							<th className="px-5 py-2 text-left font-semibold">Peças</th>
							<th className="px-3 py-2 text-right font-semibold">Por peça</th>
							<th className="px-3 py-2 text-right font-semibold">Total</th>
							<th className="hidden px-3 py-2 text-right font-semibold sm:table-cell">
								Desconto
							</th>
							<th className="px-3 py-2 text-right font-semibold">Sobra</th>
							<th className="hidden px-5 py-2 text-right font-semibold sm:table-cell">
								Prazo
							</th>
						</tr>
					</thead>
					<tbody>
						{curva.map((p) => {
							const negativo = p.lucroTotalCents < 0;
							return (
								<tr
									key={p.qtd}
									className={
										p.atual
											? 'border-t border-slate-200 font-semibold dark:border-white/10'
											: 'border-t border-slate-100 dark:border-white/5'
									}
									style={
										p.atual
											? {
													background:
														'color-mix(in srgb, var(--screen-accent, #7c3aed) 8%, transparent)',
												}
											: undefined
									}
								>
									<td className="px-5 py-2.5 text-left text-slate-800 dark:text-slate-100">
										<span className="font-mono tabular-nums">{p.qtd}</span>
										{p.atual ? (
											<span className="ml-2 rounded-full bg-slate-900/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-300">
												seu pedido
											</span>
										) : null}
										{/* Sem esta marca, "1 peça = R$ 50,00" ao lado de "10 peças =
										    R$ 12,83 cada" parece erro de conta. É o pedido mínimo da
										    oficina entrando, e a linha tem que dizer isso. */}
										{p.aplicouPedidoMinimo ? (
											<span className="ml-2 rounded-full bg-slate-900/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-white/10 dark:text-slate-400">
												mínimo
											</span>
										) : null}
									</td>
									<td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-100">
										{reais(p.precoUnitEfetivoCents)}
									</td>
									<td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-100">
										{reais(p.totalCents)}
									</td>
									<td className="hidden px-3 py-2.5 text-right font-mono tabular-nums text-slate-500 sm:table-cell dark:text-slate-400">
										{p.descontoPct > 0 ? pct(p.descontoPct, 0) : '—'}
									</td>
									<td
										className={`px-3 py-2.5 text-right font-mono tabular-nums ${
											negativo
												? 'text-rose-600 dark:text-rose-400'
												: 'text-emerald-700 dark:text-emerald-400'
										}`}
									>
										{reais(p.lucroTotalCents)}
									</td>
									<td className="hidden px-5 py-2.5 text-right font-mono tabular-nums text-slate-500 sm:table-cell dark:text-slate-400">
										{p.prazoDias}d
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}

/* ───────────────────────────── ④ a conta aberta ─────────────────────────── */

function ContaAberta({ orc }: { orc: Orcamento }) {
	const [aberta, setAberta] = useState(false);
	const custos = orc.breakdown.custos ?? {};
	const linhas: LinhaDeCusto[] = custos.linhas ?? [];
	const direto = numero(custos.diretoCents) ?? 0;
	const overhead = numero(custos.overheadCents);
	const material = (orc.breakdown.material ?? {}) as Record<string, unknown>;
	const velocidade = (orc.breakdown.velocidade ?? {}) as Record<
		string,
		unknown
	>;
	const tempos = (orc.breakdown.tempos ?? {}) as Record<string, unknown>;
	const unitarioMin = (numero(tempos.unitarioS) ?? 0) / 60;

	return (
		<div className={card}>
			<button
				type="button"
				onClick={() => setAberta((v) => !v)}
				className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
			>
				<div>
					<p className="text-sm font-semibold text-slate-900 dark:text-white">
						Onde vai o seu dinheiro
					</p>
					<p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
						A conta linha a linha — é o que você mostra quando o cliente
						pechincha.
					</p>
				</div>
				<ChevronDown
					className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${aberta ? 'rotate-180' : ''}`}
				/>
			</button>

			{aberta ? (
				<div className="border-t border-slate-200 px-5 py-4 dark:border-white/10">
					<ul className="space-y-3">
						{linhas.map((l, i) => {
							const cents = numero(l.cents) ?? 0;
							// A FATIA de cada linha no custo direto responde "onde meu
							// dinheiro está indo" sem o aluno precisar dividir na mão.
							const fatia = direto > 0 ? (cents / direto) * 100 : 0;
							return (
								<li key={l.id ?? `${l.label}-${i}`}>
									<div className="flex items-baseline justify-between gap-3">
										<span className="text-sm font-medium text-slate-800 dark:text-slate-100">
											{l.label ?? l.id}
										</span>
										<span className="shrink-0 font-mono text-sm tabular-nums text-slate-900 dark:text-white">
											{reais(cents)}
										</span>
									</div>
									<div className="mt-1 flex items-center gap-2">
										<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
											<div
												className="h-full rounded-full"
												style={{
													width: `${Math.min(100, Math.max(0, fatia))}%`,
													background: 'var(--screen-accent, #7c3aed)',
												}}
											/>
										</div>
										<span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-slate-400">
											{Math.round(fatia)}%
										</span>
									</div>
									{l.detalhe ? (
										<p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
											{l.detalhe}
										</p>
									) : null}
								</li>
							);
						})}
					</ul>

					<dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs dark:border-white/5">
						<div className="flex justify-between gap-3">
							<dt className="text-slate-500 dark:text-slate-400">
								Custo direto
							</dt>
							<dd className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
								{reais(direto)}
							</dd>
						</div>
						{overhead !== undefined ? (
							<div className="flex justify-between gap-3">
								<dt className="text-slate-500 dark:text-slate-400">
									Aluguel, luz e administração
								</dt>
								<dd className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
									{reais(overhead)}
								</dd>
							</div>
						) : null}
						<div className="flex justify-between gap-3 font-semibold">
							<dt className="text-slate-700 dark:text-slate-200">
								Custo por peça
							</dt>
							<dd className="font-mono tabular-nums text-slate-900 dark:text-white">
								{reais(custos.totalCents)}
							</dd>
						</div>
					</dl>

					<div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-white/5 dark:text-slate-400">
						<span>
							Máquina ocupada:{' '}
							<strong className="font-mono">
								{unitarioMin.toFixed(1).replace('.', ',')} min
							</strong>{' '}
							por peça
						</span>
						{numero(velocidade.speedMmS) !== undefined ? (
							<span>
								Velocidade:{' '}
								<strong className="font-mono">
									{Math.round(Number(velocidade.speedMmS))} mm/s
								</strong>
							</span>
						) : null}
						{numero(material.pesoKg) !== undefined ? (
							<span>
								Material:{' '}
								<strong className="font-mono">
									{Number(material.pesoKg).toFixed(3).replace('.', ',')} kg
								</strong>{' '}
								por peça
							</span>
						) : null}
					</div>
				</div>
			) : null}
		</div>
	);
}

/* ───────────────────────────────── avisos ──────────────────────────────── */

/**
 * A cor de cada severidade. `erro` é o que IMPEDE o trabalho ou faz ele dar
 * prejuízo ("este pedido dá prejuízo", "a peça não cabe na chapa"); `aviso` é o
 * que ele precisa conferir; `info` é contexto.
 *
 * Antes tudo era uma lista de strings sem peso, e "este pedido dá prejuízo"
 * aparecia com a mesma cor de "confirme a velocidade".
 */
const TOM_ALERTA: Record<string, string> = {
	erro: 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/5 dark:text-rose-200',
	aviso:
		'border-amber-200 bg-amber-50/60 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/5 dark:text-amber-200',
	info: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
};

function Avisos({ orc }: { orc: Orcamento }) {
	const doNegocio = orc.alertas;
	const doArquivo = orc.avisosDoArquivo;
	if (doNegocio.length === 0 && doArquivo.length === 0) return null;

	// Erro em cima, sempre: a ordem de leitura tem que ser a ordem da dor.
	const peso: Record<string, number> = { erro: 0, aviso: 1, info: 2 };
	const ordenados = [...doNegocio].sort(
		(a, b) => (peso[a.severidade] ?? 1) - (peso[b.severidade] ?? 1),
	);

	return (
		<div className="space-y-3">
			{/* Os dois grupos ficam SEPARADOS de propósito: um fala do desenho que
			    ele precisa corrigir no CAD, o outro do negócio dele. Misturados,
			    "sem perfil de custo" some no meio de "furo pequeno". */}
			{doArquivo.length > 0 ? (
				<div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/25 dark:bg-amber-500/5">
					<p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
						<FileWarning className="h-3.5 w-3.5" />O arquivo
					</p>
					<ul className="mt-2 space-y-1.5">
						{doArquivo.map((a) => (
							<li
								key={a}
								className="text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90"
							>
								{a}
							</li>
						))}
					</ul>
				</div>
			) : null}

			{ordenados.length > 0 ? (
				<div className="space-y-2">
					<p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
						<AlertTriangle className="h-3.5 w-3.5" />
						Sobre o preço
					</p>
					{ordenados.map((a) => (
						<div
							key={`${a.codigo}-${a.mensagem}`}
							className={`rounded-xl border p-3.5 ${TOM_ALERTA[a.severidade] ?? TOM_ALERTA.info}`}
						>
							{a.titulo ? (
								<p className="text-xs font-semibold">
									{a.severidade === 'erro' ? '⚠ ' : ''}
									{a.titulo}
								</p>
							) : null}
							<p
								className={`text-xs leading-relaxed ${a.titulo ? 'mt-1 opacity-90' : ''}`}
							>
								{a.mensagem}
							</p>
						</div>
					))}
				</div>
			) : null}
		</div>
	);
}

/* ──────────────────────── ⑤ mandar para o cliente ───────────────────────── */

function ParaOCliente({ orc, empresa }: { orc: Orcamento; empresa?: string }) {
	const [copiado, setCopiado] = useState(false);
	const texto = textoParaOCliente(orc.publico, empresa);
	if (!texto) return null;

	const copiar = async () => {
		try {
			await navigator.clipboard.writeText(texto);
			setCopiado(true);
			setTimeout(() => setCopiado(false), 2000);
		} catch {
			toast.error('Não consegui copiar. Selecione o texto e copie à mão.');
		}
	};

	return (
		<div className={card}>
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-white/10">
				<div>
					<p className="text-sm font-semibold text-slate-900 dark:text-white">
						Mandar para o cliente
					</p>
					<p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
						Sem o seu custo, sem markup, sem margem, sem imposto.
					</p>
				</div>
				<button
					type="button"
					onClick={copiar}
					className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
				>
					<Copy className="h-3.5 w-3.5" />
					{copiado ? 'Copiado' : 'Copiar'}
				</button>
			</div>
			<pre className="overflow-x-auto whitespace-pre-wrap px-5 py-4 font-sans text-xs leading-relaxed text-slate-600 dark:text-slate-300">
				{texto}
			</pre>
		</div>
	);
}

/* ───────────────────────────── o desenho lido ──────────────────────────── */

function Desenho({ orc }: { orc: Orcamento }) {
	if (!orc.preview) return null;
	const largura = orc.meta.width_mm;
	const altura = orc.meta.height_mm;
	const pecas = numero(orc.meta.pieces);

	return (
		<div className={`${card} p-4`}>
			<div className="flex items-center justify-between gap-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
					O que eu li no seu arquivo
				</p>
				<p className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
					{mm(largura)} × {mm(altura)} mm
				</p>
			</div>
			{/* Fundo claro fixo: o SVG do `cad.preview_svg` desenha em cores de
			    camada pensadas para papel branco, e no tema escuro o contorno preto
			    sumia num retângulo preto — a peça parecia não ter sido lida. */}
			<div className="mt-3 flex items-center justify-center rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10">
				<img
					src={orc.preview}
					alt="Contorno lido do arquivo enviado"
					className="max-h-56 w-auto max-w-full object-contain"
				/>
			</div>
			{pecas !== undefined && pecas > 1 ? (
				<p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
					O desenho tem {pecas} peças separadas. A quantidade que você pediu
					multiplica o conjunto inteiro.
				</p>
			) : null}
		</div>
	);
}

/* ─────────────────────────────── o resultado ───────────────────────────── */

export function ResultadoOrcamento({
	orc,
	qtd,
	empresa,
}: {
	orc: Orcamento;
	qtd: number;
	empresa?: string;
}) {
	return (
		<div className="space-y-4">
			<Cabecalho orc={orc} qtd={qtd} />
			<Sobra orc={orc} qtd={qtd} />
			<Curva curva={orc.curva} />
			<Avisos orc={orc} />
			<ContaAberta orc={orc} />
			<ParaOCliente orc={orc} empresa={empresa} />
			<Desenho orc={orc} />
		</div>
	);
}
