'use client';

import { Calculator, Loader2, ShieldCheck } from 'lucide-react';
import { type CSSProperties, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useMarcaAtiva } from '../../hooks/use-marca';
import { useToolBilling } from '../../hooks/use-tool-billing';
import { accentForTool, resolveScreenUi } from '../../lib/screen-ui';
import { resolveToolIcon } from '../../lib/tool-icons';
import {
	type AiToolDefinition,
	runToolEngine,
} from '../../services/tool-definitions.service';
import { ScreenNotice } from '../screen-notice';
import { useMateriais } from './materiais';
import {
	Passo,
	PassoArquivo,
	PassoCusto,
	PassoPeca,
	resumoDaPeca,
	resumoDoCusto,
} from './passos';
import { ResultadoOrcamento } from './resultado';
import { lerOrcamento, type Orcamento, orcamentoUiDaDefinition } from './tipos';

/**
 * ORÇAMENTO — a tela do aluno (`ui.layout: 'orcamento'`).
 *
 * Recebe só `def` e `toolKey`, como os ramos `atelie` e `intel`: cuida do
 * próprio billing e do próprio run, e não tem formulário genérico nenhum. O
 * renderizador comum (`dynamic-tool-view`) não serve aqui por dois motivos
 * medidos, não estéticos:
 *
 *  1. o layout `studio` desenha o VIEWPORT DE IMAGEM enquanto não há resultado —
 *     meia tela de xadrez de transparência dizendo "envie uma foto para ver a
 *     prévia ao vivo", numa ferramenta que lê DXF;
 *  2. os controles genéricos transformam `espessura` e `quantidade` em SLIDERS
 *     (quantidade de 1 a 100.000 num arrastão) e escondem atrás de "Ajustes
 *     avançados" justamente o perfil de custo e o acabamento por peça — o campo
 *     que mais move o preço.
 *
 * A COBRANÇA CONTINUA SENDO A PADRÃO (`useToolBilling` → invoke/settle no
 * upvox). Nada aqui inventa preço de vox nem burla cota grátis.
 */

interface Props {
	def: AiToolDefinition;
	toolKey: string;
}

type Aberto = 1 | 2 | 3 | null;

export function ToolOrcamentoView({ def, toolKey }: Props) {
	const { courses } = useEntitlements();
	const courseSlug = courses[0]?.slug;
	const billing = useToolBilling(toolKey, courseSlug);
	const ui = useMemo(() => orcamentoUiDaDefinition(def), [def]);
	const screenUi = resolveScreenUi(def, 'customer');
	const {
		materiais,
		isLoading: carregandoBase,
		indisponivel,
	} = useMateriais(toolKey);
	// A marca só entra no TEXTO que vai para o cliente (assinatura da proposta).
	// Sem marca cadastrada nada muda: o texto sai sem cabeçalho, e continua
	// correto. Marca é o que melhora a entrega, não o que destrava a ferramenta.
	const { marca } = useMarcaAtiva();

	/* ── o que o aluno respondeu ─────────────────────────────────────────── */
	const [arquivo, setArquivo] = useState<File | null>(null);
	const [material, setMaterial] = useState('');
	const [espessura, setEspessura] = useState<number | undefined>();
	const [qtd, setQtd] = useState(1);
	const [perfilId, setPerfilId] = useState('');
	const [acabamento, setAcabamento] = useState<number | undefined>();
	const [tempoManual, setTempoManual] = useState<number | undefined>();
	const [descontoPct, setDescontoPct] = useState<number | undefined>();

	const [aberto, setAberto] = useState<Aberto>(1);
	const [orc, setOrc] = useState<Orcamento | null>(null);

	/**
	 * O MATERIAL É ESCOLHA DELE, NUNCA CHUTE NOSSO.
	 *
	 * Esta tela pré-selecionava `materiais.find((m) => m.cortaALaser)` — o
	 * PRIMEIRO da coleção, que em ordem alfabética é AÇO CARBONO — e ainda
	 * marcava o passo 2 com o check verde de "respondido". Medido no motor, com o
	 * mesmo DXF de uma caixa de MDF e sem perfil:
	 *
	 *     MDF 3 mm, 10 peças ......... R$ 128,25   (assume CO2 100 W)
	 *     Aço carbono 0,9 mm, 10 un .. R$ 337,25   (assume FIBRA 1500 W)
	 *
	 * 2,6× de diferença, num campo que ninguém tinha tocado, num passo que a
	 * tela dizia estar pronto. Um passo obrigatório vazio é chato; um passo
	 * obrigatório PREENCHIDO ERRADO e marcado como certo é caro.
	 *
	 * O único padrão aceito agora é o que o ADMIN declarou na definition
	 * (`input.material_id.default`, hoje `mdf`) — decisão de quem conhece o
	 * público, não consequência da ordem alfabética. Sem ele, o passo abre vazio
	 * e o botão de orçar só acende depois da escolha.
	 */
	const materialPadrao = useMemo(() => {
		const bruto = (
			def.definition.input as Record<string, { default?: unknown }> | undefined
		)?.material_id?.default;
		const id = typeof bruto === 'string' ? bruto.trim().toLowerCase() : '';
		if (!id) return '';
		return (
			materiais.find((m) => m.familia === id && m.cortaALaser)?.familia ?? ''
		);
	}, [def, materiais]);

	const materialEfetivo = material || materialPadrao;
	const espessuraEfetiva = useMemo(() => {
		if (espessura !== undefined) return espessura;
		return materiais.find((m) => m.familia === materialEfetivo)?.espessuras[0];
	}, [espessura, materiais, materialEfetivo]);

	const temPeca = materialEfetivo.length > 0 && espessuraEfetiva !== undefined;
	const podeOrcar = !!arquivo && temPeca && qtd >= 1;

	/* ── o run ───────────────────────────────────────────────────────────── */

	const orcar = useCallback(async () => {
		if (!arquivo) {
			toast.error('Envie o arquivo da peça.');
			setAberto(1);
			return;
		}
		if (!temPeca) {
			toast.error('Escolha o material e a espessura.');
			setAberto(2);
			return;
		}

		/**
		 * O `inputSpec` é montado à mão (e não lido de `definition.input`) porque
		 * esta tela manda um subconjunto DELIBERADO: unidade, preço do material,
		 * medidas da chapa e velocidade de corte ficam de fora para o back
		 * resolvê-los — é o que faz a tela ter 3 perguntas em vez de 12.
		 *
		 * `curva_qtds` é a lista da curva de escala. Ela NÃO é uma segunda
		 * cobrança: `computeQuote` é pura e os pontos extras custam microssegundos
		 * de CPU sobre dados já carregados (ver `montaCurva` na main API).
		 */
		const inputSpec = {
			arquivo: { type: 'file' as const },
			material_id: { type: 'string' as const },
			espessura_mm: { type: 'number' as const },
			qtd: { type: 'int' as const },
			perfil_id: { type: 'string' as const },
			acabamento: { type: 'number' as const },
			tempo_manual_min: { type: 'number' as const },
			desconto_pct: { type: 'number' as const },
			curva_qtds: { type: 'string' as const },
		};
		const values: Record<string, unknown> = {
			arquivo,
			material_id: materialEfetivo,
			espessura_mm: espessuraEfetiva,
			qtd,
			perfil_id: perfilId,
			curva_qtds: ui.curva.join('|'),
		};
		// Campo em branco tem que ir AUSENTE, não como 0: `desconto_pct: 0`
		// explícito MATA a faixa por quantidade do perfil (o precificador trata
		// `undefined` como "usa a faixa" e `0` como "sem desconto nenhum").
		if (acabamento !== undefined) values.acabamento = acabamento;
		if (tempoManual !== undefined) values.tempo_manual_min = tempoManual;
		if (descontoPct !== undefined) values.desconto_pct = descontoPct;

		await billing.runEngine(async (invocationId) => {
			const r = await runToolEngine(toolKey, {
				values,
				inputSpec,
				invocationId,
			});
			const lido = lerOrcamento(r.output);
			if (!lido) {
				// O run VOLTOU e já foi cobrado; não dá para fingir que não houve
				// resultado. Dizer o que aconteceu é o mínimo.
				toast.error('O orçamento voltou sem a conta. Tente de novo.');
				return r;
			}
			setOrc(lido);
			setAberto(null);
			return r;
		});
	}, [
		arquivo,
		temPeca,
		materialEfetivo,
		espessuraEfetiva,
		qtd,
		perfilId,
		acabamento,
		tempoManual,
		descontoPct,
		ui.curva,
		billing,
		toolKey,
	]);

	/* ── a tela ──────────────────────────────────────────────────────────── */

	const style = { '--screen-accent': accentForTool(def) } as CSSProperties;

	return (
		<div style={style} className="space-y-5">
			<PageHeader
				title={screenUi.title ?? def.title}
				subtitle={
					screenUi.subtitle ??
					'Suba o desenho da peça e descubra quanto cobrar — e quanto sobra para você.'
				}
				icon={resolveToolIcon(
					(def.definition.ui as { icon?: string } | undefined)?.icon,
				)}
			/>

			{screenUi.notice ? <ScreenNotice notice={screenUi.notice} /> : null}

			{/*
			 * ┌─ AS PERGUNTAS EM CIMA, A RESPOSTA EMBAIXO ──────────────────────┐
			 * │ Era lado a lado (coluna de 380 px grudada à esquerda, resultado  │
			 * │ à direita) e o dono pediu empilhado. Ganhamos com a troca: a     │
			 * │ resposta é o produto desta ferramenta e ela tem uma TABELA — a   │
			 * │ curva de 1/10/25/50/100 com seis colunas — que sufocava em 1fr   │
			 * │ menos 380 px. Agora ela tem a largura inteira.                   │
			 * │                                                                  │
			 * │ Os três passos viram uma FILA de cartões porque, fechados, cada  │
			 * │ um é uma linha só (`Passo` só desenha o corpo quando `aberto`).  │
			 * │ Empilhá-los em largura total daria três faixas quase vazias      │
			 * │ empurrando o preço para fora da primeira tela.                   │
			 * └──────────────────────────────────────────────────────────────────┘
			 */}
			<div className="grid gap-3 lg:grid-cols-3 lg:items-start">
				<Passo
					numero={1}
					titulo="O desenho da peça"
					pergunta="O mesmo arquivo que você manda para a máquina."
					resumo={arquivo?.name}
					aberto={aberto === 1}
					pronto={!!arquivo}
					onAbrir={() => setAberto(aberto === 1 ? null : 1)}
				>
					<PassoArquivo
						arquivo={arquivo}
						onChange={(f) => {
							setArquivo(f);
							// Trocar o arquivo invalida o preço na tela: deixar o número
							// antigo ao lado de um desenho novo é mentir com valor exato.
							setOrc(null);
							if (f) setAberto(2);
						}}
					/>
				</Passo>

				<Passo
					numero={2}
					titulo="Em que material e quantas"
					pergunta="É isto que define o peso e o tempo de máquina."
					resumo={resumoDaPeca(
						materiais,
						materialEfetivo,
						espessuraEfetiva,
						qtd,
						!material,
					)}
					aberto={aberto === 2}
					// O check verde é "você respondeu", não "há um valor no campo".
					// Com o padrão do admin ainda por confirmar, o passo continua
					// numerado — e o resumo diz que é sugestão.
					pronto={!!material && espessuraEfetiva !== undefined}
					onAbrir={() => setAberto(aberto === 2 ? null : 2)}
				>
					{carregandoBase ? (
						<p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
							<Loader2 className="h-4 w-4 animate-spin" />
							Carregando a base de materiais…
						</p>
					) : (
						<PassoPeca
							materiais={materiais}
							baseIndisponivel={indisponivel}
							material={materialEfetivo}
							espessura={espessuraEfetiva}
							qtd={qtd}
							atalhosQtd={ui.atalhosQtd}
							onMaterial={(f) => {
								setMaterial(f);
								setOrc(null);
							}}
							onEspessura={(e) => {
								setEspessura(e);
								setOrc(null);
							}}
							onQtd={(q) => {
								setQtd(q);
								setOrc(null);
							}}
						/>
					)}
				</Passo>

				<Passo
					numero={3}
					titulo="O seu custo"
					pergunta="Sem isto, o preço é o da máquina de outra pessoa."
					resumo={resumoDoCusto(perfilId, acabamento, descontoPct)}
					aberto={aberto === 3}
					pronto={!!perfilId}
					onAbrir={() => setAberto(aberto === 3 ? null : 3)}
				>
					<PassoCusto
						toolKey={toolKey}
						perfilId={perfilId}
						acabamento={acabamento}
						tempoManual={tempoManual}
						descontoPct={descontoPct}
						onPerfil={(v) => {
							setPerfilId(v);
							setOrc(null);
						}}
						onAcabamento={(v) => {
							setAcabamento(v);
							setOrc(null);
						}}
						onTempoManual={(v) => {
							setTempoManual(v);
							setOrc(null);
						}}
						onDesconto={(v) => {
							setDescontoPct(v);
							setOrc(null);
						}}
					/>
				</Passo>
			</div>

			{/*
			 * O BOTÃO SEPARADO DA FILA, e centrado num bloco estreito.
			 * Um botão de largura inteira numa tela de 1900 px vira uma barra de
			 * ponta a ponta — e ele não é a coisa mais importante da página; o
			 * preço é. O `max-w` o mantém do tamanho de um botão.
			 */}
			<div className="mx-auto w-full max-w-md space-y-2">
				<button
					type="button"
					onClick={orcar}
					disabled={!podeOrcar || billing.pending || billing.insufficient}
					className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
					style={{ background: 'var(--screen-accent, #7c3aed)' }}
				>
					{billing.pending ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							Medindo a peça e fechando a conta…
						</>
					) : (
						<>
							<Calculator className="h-4 w-4" />
							{orc ? 'Refazer o orçamento' : 'Quanto devo cobrar?'}
						</>
					)}
				</button>
				{billing.notice}
			</div>

			{/* ── a resposta, com a largura inteira ────────────────────────── */}
			<div className="min-w-0">
				{orc ? (
					<ResultadoOrcamento
						orc={orc}
						qtd={qtd}
						empresa={marca?.nome || undefined}
					/>
				) : (
					<Vazio />
				)}
			</div>
		</div>
	);
}

/**
 * O estado vazio — o lugar onde o layout genérico desenhava um xadrez de
 * transparência pedindo uma FOTO. Aqui ele diz o que a ferramenta responde,
 * porque é a primeira coisa que o aluno lê ao abrir.
 */
function Vazio() {
	return (
		<div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center dark:border-white/10">
			<span
				className="mb-4 rounded-2xl p-3.5"
				style={{
					background:
						'color-mix(in srgb, var(--screen-accent, #7c3aed) 12%, transparent)',
					color: 'var(--screen-accent, #7c3aed)',
				}}
			>
				<Calculator className="h-7 w-7" />
			</span>
			<p className="text-base font-semibold text-slate-900 dark:text-white">
				Quanto cobrar nesta peça?
			</p>
			<p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
				Suba o desenho, diga o material e a quantidade. Você recebe o preço, o
				quanto sobra para você e o que muda se o pedido for de 10, 50 ou 100 —
				com a conta aberta linha a linha.
			</p>
			<p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
				<ShieldCheck className="h-3.5 w-3.5" />
				Nenhum número passa por inteligência artificial.
			</p>
		</div>
	);
}
