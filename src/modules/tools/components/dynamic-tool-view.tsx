'use client';

import { AlertCircle, Download, Loader2, Wand2 } from 'lucide-react';
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { useEntitlements } from '@/hooks/use-entitlements';
import { usePermissions } from '@/modules/access';
import { useToolBank } from '../hooks/use-tool-bank';
import { useToolBilling } from '../hooks/use-tool-billing';
import { useToolDefinition } from '../hooks/use-tool-definition';
import {
	downloadUrl,
	hasTextInput,
	maxImagesOf,
	modeOf,
	specsOf,
} from '../lib/prompt-bank';
import { accentForTool, resolveScreenUi } from '../lib/screen-ui';
import { resolveToolIcon } from '../lib/tool-icons';
import type { LicensedBrand } from '../services/licensed-brand.service';
import type { ToolBankEntry } from '../services/tool-bank.service';
import {
	type AiToolDefinition,
	type RunToolEngineImageSize,
	runToolEngine,
	type ToolRunResult,
} from '../services/tool-definitions.service';
import { ToolAtelieView } from './atelie';
import { ToolIntelView } from './intel/tool-intel-view';
import { TEMA_LICENCIADA } from './licenciada-ui';
import { LicensedToolHome } from './licensed-tool-home';
import { MyLicensedArtLibrary } from './my-licensed-art-library';
import { ToolOrcamentoView } from './orcamento';
import { PromptGallery } from './prompt-gallery';
import { PromptGenerateView } from './prompt-generate-view';
import { ScreenNotice } from './screen-notice';
import { type CanvasSpec, ToolCanvasView } from './tool-canvas-view';
import { type CatalogSpec, ToolCatalogView } from './tool-catalog-view';
import { ToolStudioView } from './tool-studio-view';
import { bindName, WidgetField } from './tool-widgets';
import { ToolVideoView } from './video';

function ResultPanel({
	result,
	downloadKey,
	showMeta,
}: {
	result: ToolRunResult;
	downloadKey: string;
	showMeta: boolean;
}) {
	const output = result.output;
	const preview = (output.preview ?? output.primary) as string | undefined;
	// Se downloadFrom apontar uma chave ausente no output, cai em `primary`
	// (em vez de simplesmente sumir com o botão de baixar).
	const primary = (output[downloadKey] ?? output.primary) as string | undefined;
	const meta = output.meta as Record<string, unknown> | undefined;

	return (
		<div className="space-y-4">
			<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4">
				{preview ? (
					<div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-[#111] flex items-center justify-center">
						{/* <img> intencional: preview de data URL / CDN dinâmico */}
						<img
							src={preview}
							alt="Resultado"
							className="max-w-full max-h-full object-contain"
						/>
					</div>
				) : (
					<p className="text-sm text-slate-500 dark:text-gray-400">
						Pronto. Sem prévia visual.
					</p>
				)}

				{showMeta && meta && (
					<div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
						{Object.entries(meta).map(([k, v]) => (
							<span
								key={k}
								className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
							>
								{k}: {String(v)}
							</span>
						))}
					</div>
				)}
			</div>

			{primary && (
				<button
					type="button"
					onClick={() => downloadUrl(primary, 'resultado')}
					className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
				>
					<Download className="w-5 h-5" />
					Baixar resultado
				</button>
			)}
		</div>
	);
}

/* ───────── Banco do Admin (galeria + form por registro) ───────── */

interface DynamicToolViewProps {
	toolKey: string;
	/** Definition inline (preview de rascunho no builder admin). */
	definitionOverride?: AiToolDefinition;
}

export function DynamicToolView({
	toolKey,
	definitionOverride,
}: DynamicToolViewProps) {
	const query = useToolDefinition(toolKey, { enabled: !definitionOverride });
	const def = definitionOverride ?? query.data;
	const isDraft = !!definitionOverride;

	const { courses } = useEntitlements();
	// Moderar registro de coleção é capacidade de quem administra ferramentas.
	// O back reforça de qualquer jeito (403 no /review); isto só decide se o
	// botão aparece.
	const { can } = usePermissions();
	const canModerate = can('ferramentas.view');

	const courseSlug = courses[0]?.slug;

	const [values, setValues] = useState<Record<string, unknown>>({});
	const [result, setResult] = useState<ToolRunResult | null>(null);
	const [draftRunning, setDraftRunning] = useState(false);

	// Banco do Admin: galeria de registros → form por registro escolhido.
	const bank = def?.definition.bank;
	const bankEnabled = !!bank?.enabled;
	// Busca os registros tb no preview do builder (draft) — só pula a key
	// placeholder de uma tool ainda não salva — pra o preview do Cliente mostrar
	// a galeria EXATAMENTE como o cliente vê (não cair no form).
	const bankQuery = useToolBank(toolKey, {
		enabled: bankEnabled && toolKey !== 'preview',
	});
	/**
	 * Aba da galeria. A biblioteca só existe em tool licenciada — em tool comum
	 * não há licença para listar, e uma aba vazia seria ruído.
	 */
	const [abaGaleria, setAbaGaleria] = useState<'prompts' | 'minhas'>('prompts');
	const [selectedEntry, setSelectedEntry] = useState<ToolBankEntry | null>(
		null,
	);
	/**
	 * Arte Licenciada: a MARCA INTEIRA escolhida no balcão.
	 *
	 * Sobrevive ao ir e voltar da geração — sem isto, "voltar" jogaria o aluno na
	 * lista de escudos toda vez, e quem produz peça do mesmo clube faz esse
	 * caminho várias vezes seguidas.
	 *
	 * Guarda o objeto e não só a chave + a cor porque a tela de geração passou a
	 * mostrar o escudo e o nome. O `onSelect` do balcão já entrega a marca
	 * completa, então isto não custa nenhuma chamada — só deixa de jogar fora o
	 * que já estava em mãos.
	 */
	const [licensedMarca, setLicensedMarca] = useState<LicensedBrand | null>(
		null,
	);
	const [tema, setTema] = useState('');
	// Valores das "especificações" do registro (campos com nome aberto que o
	// staff define no lugar da caixa genérica de tema — ver `specsOf`). Chave =
	// `SpecDef.name`. Vazio quando o registro não tem especificações.
	const [specValues, setSpecValues] = useState<Record<string, string>>({});
	// Até 3 slots de imagem de referência; o registro escolhido define quantos
	// aparecem (`data.max_images`, clamp 1–3).
	const [referencias, setReferencias] = useState<(File | null)[]>([
		null,
		null,
		null,
	]);
	// Resolução de saída escolhida pelo cliente (opcional; null = default da tool).
	const [imageSize, setImageSize] = useState<RunToolEngineImageSize | null>(
		null,
	);
	// Passo 1/3 (Prompts Mágicos redesign): tipo de criação + variações. Vêm da
	// definition da tool; ausentes → o cliente não vê essas etapas (tool legada).
	const [creationId, setCreationId] = useState<string | null>(null);
	const [variationCount, setVariationCount] = useState<number | null>(null);
	/**
	 * TIRAGEM: quantas peças licenciadas esta rodada vai produzir. Uma por
	 * padrão — a ferramenta que não declara `print_run` nunca sai daí.
	 */
	const [printRun, setPrintRun] = useState(1);
	const creations = def?.definition.creations;
	const returnVariations = def?.definition.return_variations;
	const printRunOptions = def?.definition.print_run;
	// Billing scale por variação (vox_cost × N): precisa ser lido DEPOIS do estado
	// `variationCount`. Default 1 quando nenhuma selecionada (tool legada/sem passo 3).
	const billing = useToolBilling(
		toolKey,
		courseSlug,
		variationCount ?? 1,
		printRun,
	);

	const inputSpec = useMemo(() => def?.definition.input ?? {}, [def]);
	const ui = def?.definition.ui;
	const controls = ui?.controls ?? [];

	// Inicializa os valores com os defaults dos inputs quando a definition carrega.
	// biome-ignore lint/correctness/useExhaustiveDependencies: re-init on definition id/key
	useEffect(() => {
		const init: Record<string, unknown> = {};
		for (const [name, spec] of Object.entries(inputSpec)) {
			if (spec.type !== 'image' && spec.default !== undefined) {
				init[name] = spec.default;
			}
		}
		setValues(init);
		setResult(null);
		setSelectedEntry(null);
		setLicensedMarca(null);
		setTema('');
		setSpecValues({});
		setReferencias([null, null, null]);
		setImageSize(null);
		setCreationId(null);
		setPrintRun(1);
		// Default do Passo 3 = 1º elemento do allowlist (se houver).
		setVariationCount(
			def?.definition.return_variations?.length
				? def.definition.return_variations[0]
				: null,
		);
	}, [def?.id, def?.tool_key, def?.definition.return_variations]);

	const setValue = useCallback((name: string, v: unknown) => {
		setValues((prev) => ({ ...prev, [name]: v }));
	}, []);

	// Aplica vários valores de uma vez (presets / restaurar do estúdio).
	const setManyValues = useCallback((patch: Record<string, unknown>) => {
		setValues((prev) => ({ ...prev, ...patch }));
	}, []);

	const missingRequired = useMemo(
		() =>
			Object.entries(inputSpec).some(([name, spec]) => {
				const v = values[name];
				return spec.required && (v === undefined || v === null || v === '');
			}),
		[inputSpec, values],
	);

	const run = useCallback(async () => {
		if (missingRequired) {
			toast.error('Preencha os campos obrigatórios.');
			return;
		}
		// Preview de rascunho (staff): roda inline, sem billing.
		if (isDraft && def) {
			setDraftRunning(true);
			try {
				const r = await runToolEngine(toolKey, {
					values,
					inputSpec,
					draftDefinition: def.definition,
				});
				setResult(r);
			} catch {
				toast.error('Falha no preview.');
			} finally {
				setDraftRunning(false);
			}
			return;
		}
		// Fluxo normal: o hook decide cobrar (invoke→motor→settle) ou rodar livre.
		await billing.runEngine((invocationId) =>
			runToolEngine(toolKey, { values, inputSpec, invocationId }).then((r) => {
				setResult(r);
				return r;
			}),
		);
	}, [missingRequired, isDraft, def, toolKey, values, inputSpec, billing]);

	// Run de um registro do banco: manda bank_entry_id + tema + referências.
	// Cada slot vira um field próprio (`referencia`, `referencia2`, `referencia3`)
	// pro motor mapear cada input de imagem pelo nome.
	const runBank = useCallback(async () => {
		if (!selectedEntry) return;
		const mode = modeOf(selectedEntry);
		const specs = specsOf(selectedEntry);
		const max = maxImagesOf(selectedEntry);
		const chosen = referencias
			.slice(0, max)
			.filter((f): f is File => f instanceof File);
		const hasText = hasTextInput(specs, specValues, tema);
		// `texto_imagem`: texto (ou especificações) OU imagem — não exige os dois.
		// `texto`/`imagem` puros continuam exigindo seu único campo.
		if (mode === 'texto_imagem') {
			if (!hasText && chosen.length === 0) {
				toast.error('Escreva algo ou envie uma imagem.');
				return;
			}
		} else if (mode.includes('texto') && !hasText) {
			const missing = specs.find(
				(s) => s.required && !specValues[s.name]?.trim(),
			);
			toast.error(missing ? `Preencha "${missing.label}".` : 'Digite o tema.');
			return;
		} else if (mode === 'imagem' && chosen.length === 0) {
			toast.error('Envie ao menos 1 imagem de referência.');
			return;
		}
		const bankInputs: Record<string, unknown> = {};
		if (mode.includes('texto')) {
			if (specs.length > 0) {
				for (const s of specs) {
					const v = specValues[s.name]?.trim();
					if (v) bankInputs[s.name] = v;
				}
			} else {
				bankInputs.tema = tema.trim();
			}
		}
		if (mode.includes('imagem')) {
			const fieldNames = ['referencia', 'referencia2', 'referencia3'];
			chosen.forEach((file, i) => {
				bankInputs[fieldNames[i]] = file;
			});
		}
		// Passo 1/3: tipo de criação (resolução oculta) + variações.
		if (creationId) bankInputs.creation_id = creationId;
		if (variationCount) bankInputs.variation_count = String(variationCount);

		await billing.runEngine((invocationId) =>
			runToolEngine(toolKey, {
				values: {},
				inputSpec: {},
				invocationId,
				bankEntryId: selectedEntry.id,
				bankInputs,
				imageSize: imageSize ?? undefined,
			}).then((r) => {
				setResult(r);
				return r;
			}),
		);
		// `creationId`/`variationCount` PRECISAM estar aqui: são lidos dentro do
		// callback e definem a resolução e a quantidade cobrada. Sem eles, trocar o
		// Passo 1 ou o Passo 3 e clicar em gerar mandava a escolha ANTERIOR.
	}, [
		selectedEntry,
		tema,
		specValues,
		referencias,
		imageSize,
		toolKey,
		billing,
		creationId,
		variationCount,
	]);

	if (!definitionOverride && query.isLoading) {
		return (
			<div className="p-8 flex items-center justify-center">
				<Loader2 className="w-6 h-6 animate-spin text-violet-500" />
			</div>
		);
	}

	if (!def) {
		return (
			<div className="p-8">
				<div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5 p-6 flex items-start gap-3">
					<AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
					<div>
						<p className="font-medium text-slate-900 dark:text-white">
							Ferramenta não encontrada
						</p>
						<p className="text-sm text-slate-500 dark:text-gray-400">
							A ferramenta “{toolKey}” não está disponível.
						</p>
					</div>
				</div>
			</div>
		);
	}

	const pending = isDraft ? draftRunning : billing.pending;
	const actionLabel = ui?.action?.label ?? 'Executar';
	const showCostNotice = !isDraft && (ui?.action?.showCostNotice ?? true);
	const resultUi = ui?.result;
	const downloadKey = (resultUi?.downloadFrom ?? 'output.primary').replace(
		/^output\./,
		'',
	);

	// Aparência personalizada da tela do cliente (cor/tema/título/subtítulo/banner).
	const screenUi = resolveScreenUi(def, 'customer');

	const header = (
		<PageHeader
			title={screenUi.title ?? def.title}
			subtitle={screenUi.subtitle ?? def.description ?? undefined}
			icon={resolveToolIcon(
				(def.definition.ui as { icon?: string } | undefined)?.icon,
			)}
		/>
	);

	// Tema forçado (dark/light) ganha fundo próprio + respiro, igual às salas.
	const themedShell = screenUi.themeClass
		? `rounded-2xl p-4 sm:p-6 ${screenUi.themeClass === 'dark' ? 'bg-[#0d0d0f]' : 'bg-slate-50'}`
		: '';
	const screenStyle = {
		'--screen-accent': licensedMarca?.accent_color ?? screenUi.accent,
	} as CSSProperties;

	/* ── Estúdio (tools-mãe): controles agrupados + preview ao vivo ── */
	const studioUi = ui as
		| {
				layout?: string;
				livePreview?: boolean;
				presets?: { label: string; values: Record<string, unknown> }[];
				catalog?: CatalogSpec;
				canvas?: CanvasSpec;
		  }
		| undefined;

	/* ── Ateliê (Estúdio de Imagens): três passos → mesa de criação → arte ──
	   Vem ANTES do canvas, e a ordem é a correção de uma armadilha real: esta
	   MESMA tool (`estudio_imagens`) declarava `canvas` até a F2, e a tela do
	   canvas pergunta modo, máscara e fator de ampliação — inputs que o pipeline
	   do Ateliê não tem mais. Uma definition antiga em cache (ou um rollback do
	   seed) faria a ferramenta cair no ramo velho e mandar campos que ninguém lê,
	   sem mandar a foto do produto. Como os dois nunca coexistem numa definition,
	   testar o novo primeiro é o que garante que o velho não vença por acidente.

	   Como o ramo `intel`, recebe só `def` e `toolKey`: cuida do próprio billing
	   e do próprio stream (SSE), e não tem formulário genérico nenhum. */
	if (studioUi?.layout === 'atelie') {
		/*
		 * O PREVIEW DO BUILDER NÃO RODA AQUI, e é melhor dizer isso do que deixar
		 * o admin descobrir por um 404.
		 *
		 * `ToolAtelieView` cobra e abre o próprio stream (`POST
		 * /api/tool-run/:key/stream`), então ele precisa de uma tool SALVA: com a
		 * key placeholder de uma tool que ainda não existe, o POST volta 404 e o
		 * Ateliê desenha "A arte não saiu desta vez" — como se fosse falha do
		 * time. E mesmo com a tool salva o run usaria a definition do BANCO, não a
		 * que está sendo editada: o caminho não cobrado (`draftDefinition`) é do
		 * renderizador genérico e não passa por este ramo.
		 *
		 * (O ramo `intel` tem o mesmo furo e é anterior; ele fica registrado aqui
		 * porque o Ateliê copiou o contrato dele de propósito.)
		 */
		if (toolKey === 'preview') {
			return (
				<div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-sm leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
					O Ateliê só roda depois que a ferramenta é salva — ele cobra e abre o
					acompanhamento ao vivo pela chave dela. Salve o rascunho e abra a
					ferramenta para testar.
				</div>
			);
		}
		return <ToolAtelieView def={def} toolKey={toolKey} />;
	}

	/* ── Vídeo do Anúncio: arte pronta → movimento → vídeo gerado por IA ──
	   Fica junto do Ateliê e logo depois dele porque é a mesma família de tela:
	   cobra sozinha, abre o próprio stream (`POST /api/tool-run/:key/stream`) e
	   não tem formulário genérico nenhum. A definition NÃO declara `controls`,
	   então cair no renderizador comum abriria uma ferramenta PAGA sem nenhum
	   campo — daí este ramo vir antes de todos os outros que sobraram. */
	if (studioUi?.layout === 'video') {
		/*
		 * Mesmo portão do Ateliê, e pelo mesmo motivo: `ToolVideoView` COBRA (12
		 * voxxys) pela chave da tool. Com a key placeholder de um rascunho que
		 * ainda não existe, o `/invoke` volta 404 e a tela desenharia "não foi
		 * possível gerar" — como se o gerador tivesse falhado.
		 */
		if (toolKey === 'preview') {
			return (
				<div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-sm leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
					O Vídeo do Anúncio só roda depois que a ferramenta é salva — ele cobra
					e abre o acompanhamento ao vivo pela chave dela. Salve o rascunho e
					abra a ferramenta para testar.
				</div>
			);
		}
		return <ToolVideoView def={def} toolKey={toolKey} />;
	}

	/* ── Canvas (Estúdio de Imagens): composer + galeria pessoal ──
	   Vem ANTES do catálogo e do estúdio: esta tela tem formulário PRÓPRIO
	   (modos, lote, máscara) e histórico próprio, então nenhum dos outros
	   ramos serviria. */
	if (studioUi?.layout === 'canvas') {
		return (
			<div style={{ '--screen-accent': accentForTool(def) } as CSSProperties}>
				<ToolCanvasView
					def={def}
					toolKey={toolKey}
					spec={studioUi.canvas ?? {}}
					isStaff={canModerate}
					isDraft={isDraft}
					title={screenUi.title ?? def.title}
					subtitle={screenUi.subtitle ?? def.description ?? undefined}
					notice={screenUi.notice}
				/>
			</div>
		);
	}

	/* ── Intel (Central de Inteligência): entrada → sala de guerra → dossiê ──
	   Vem PRIMEIRO porque é a tela que menos se parece com as outras: não tem
	   coluna de controles, não tem card, e cada uma das três fases toma a tela
	   inteira. Nenhum dos outros ramos daria conta. */
	if (studioUi?.layout === 'intel') {
		return <ToolIntelView def={def} toolKey={toolKey} />;
	}

	/* ── Orçamento: desenho → material e quantidade → preço, sobra e curva ──
	   Mesma família do Ateliê e do Intel: recebe só `def` e `toolKey`, cobra
	   sozinho e não usa o formulário genérico.

	   Vem ANTES do ramo `studio`, e a ordem é a correção de um defeito medido:
	   esta MESMA tool declarava `layout:'studio'` até agora, e o estúdio abre
	   com o viewport de IMAGEM — meia tela de xadrez de transparência pedindo
	   "envie uma foto para ver a prévia ao vivo" numa ferramenta que lê DXF. Uma
	   definition antiga em cache (ou um rollback do seed) faria a ferramenta
	   cair no ramo velho; testar o novo primeiro é o que garante que o genérico
	   não vença por acidente. */
	if (studioUi?.layout === 'orcamento') {
		/*
		 * Mesmo portão do Ateliê e do Vídeo, e pelo mesmo motivo: `ToolOrcamentoView`
		 * COBRA pela chave da tool. Com a key placeholder de um rascunho que ainda
		 * não existe, o `/invoke` volta 404 e a tela desenharia uma falha de
		 * orçamento — como se a conta não tivesse fechado.
		 */
		if (toolKey === 'preview') {
			return (
				<div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-sm leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
					O Orçamento só roda depois que a ferramenta é salva — ele cobra pela
					chave dela e lê as coleções de materiais e perfis. Salve o rascunho e
					abra a ferramenta para testar.
				</div>
			);
		}
		return <ToolOrcamentoView def={def} toolKey={toolKey} />;
	}

	/* ── Catálogo: navegação de uma COLEÇÃO da tool (Metallic e afins) ──
	   Vem ANTES do estúdio e do banco: uma tool de catálogo não tem formulário
	   de run, então nenhum dos outros ramos faz sentido para ela. */
	if (studioUi?.layout === 'catalog') {
		return (
			<div style={{ '--screen-accent': accentForTool(def) } as CSSProperties}>
				<ToolCatalogView
					toolKey={toolKey}
					spec={studioUi.catalog ?? {}}
					isStaff={canModerate}
					title={screenUi.title ?? def?.title}
					subtitle={screenUi.subtitle ?? def?.description ?? undefined}
				/>
			</div>
		);
	}

	if (studioUi?.layout === 'studio') {
		// Acento de identidade por tool (laser=vermelho / editor=rosa / IA=violeta),
		// herdado por todos os componentes do estúdio via `--screen-accent`.
		const studioStyle = {
			'--screen-accent': accentForTool(def),
		} as CSSProperties;
		return (
			<div style={studioStyle}>
				<ToolStudioView
					def={def}
					toolKey={toolKey}
					isDraft={isDraft}
					header={header}
					values={values}
					setValue={setValue}
					setManyValues={setManyValues}
					controls={controls}
					inputSpec={inputSpec}
					presets={studioUi.presets ?? []}
					livePreview={studioUi.livePreview ?? false}
					onRun={run}
					pending={pending}
					result={result}
					downloadKey={downloadKey}
					showMeta={resultUi?.showMeta ?? true}
					actionLabel={actionLabel}
					insufficient={billing.insufficient}
					missingRequired={missingRequired}
					billingNotice={showCostNotice ? billing.notice : null}
				/>
			</div>
		);
	}

	/**
	 * Tool licenciada é a que tem algum registro com marca. Detectar pelo DADO e
	 * não por uma flag na definition mantém a aba aparecendo sozinha em qualquer
	 * tool que passe a usar prompts licenciados.
	 */
	const ehLicenciada = (bankQuery.data ?? []).some(
		(e) => typeof (e.data as Record<string, unknown>)?.feature_key === 'string',
	);

	/* ── Banco do Admin: galeria → detalhe + geração por registro ── */
	if (bankEnabled) {
		/*
		 * Arte Licenciada: a ABERTURA é outra, o resto é o mesmo.
		 *
		 * Quem abre esta ferramenta não escolhe um prompt — escolhe uma MARCA, e
		 * só depois o que vai produzir com ela. Por isso a tela inicial é própria
		 * (`ui.layout: 'licenciada'`), enquanto a geração continua sendo o
		 * `PromptGenerateView` de sempre: o passo a passo de gerar é idêntico ao
		 * dos Prompts Mágicos e duplicá-lo só criaria duas telas para divergir.
		 *
		 * A troca fica DENTRO deste ramo, e não num ramo próprio lá em cima, por
		 * um motivo prático: `runBank`, o billing e o estado do formulário vivem
		 * aqui. Um ramo separado teria de recriar tudo isso — inclusive a aba de
		 * "Minhas peças" — para desenhar a mesma coisa.
		 *
		 * A chave é o `layout`, nunca a presença de marca nos registros: os
		 * Prompts Mágicos não podem virar esta tela por acidente no dia em que
		 * alguém marcar um prompt de lá com uma marca.
		 */
		if (studioUi?.layout === 'licenciada' && !selectedEntry) {
			return (
				<LicensedToolHome
					title={screenUi.title ?? def.title}
					subtitle={screenUi.subtitle ?? def.description ?? undefined}
					notice={screenUi.notice}
					entries={bankQuery.data ?? []}
					loading={bankQuery.isLoading}
					entriesError={bankQuery.isError}
					initialBrandKey={licensedMarca?.feature_key ?? null}
					onSelect={(entry, marca) => {
						// A marca inteira, e não só a chave: o Igor precisa dela na tela
						// de geração, e ela já estava em mãos.
						setLicensedMarca(marca);
						// Trocar de modelo recomeça a tiragem no padrão.
						setPrintRun(1);
						setSelectedEntry(entry);
						setResult(null);
						setTema('');
						setSpecValues({});
						setReferencias([null, null, null]);
						setImageSize(null);
					}}
				/>
			);
		}

		// Sem registro escolhido → galeria premium (stats + busca + cards + sidebar).
		if (!selectedEntry) {
			return (
				<div
					className={`p-4 md:p-8 ${screenUi.themeClass}`}
					style={screenStyle}
				>
					<div className={themedShell}>
						{screenUi.notice && <ScreenNotice notice={screenUi.notice} />}
						{header}
						{ehLicenciada && (
							<div className="mb-6 flex gap-1 border-b border-slate-200 dark:border-white/10">
								<button
									type="button"
									onClick={() => setAbaGaleria('prompts')}
									aria-current={abaGaleria === 'prompts' ? 'page' : undefined}
									className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors ${
										abaGaleria === 'prompts'
											? 'border-violet-500 font-semibold text-violet-600 dark:text-violet-400'
											: 'border-transparent text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
									}`}
								>
									Criar
								</button>
								<button
									type="button"
									onClick={() => setAbaGaleria('minhas')}
									aria-current={abaGaleria === 'minhas' ? 'page' : undefined}
									className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors ${
										abaGaleria === 'minhas'
											? 'border-violet-500 font-semibold text-violet-600 dark:text-violet-400'
											: 'border-transparent text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
									}`}
								>
									Minhas artes licenciadas
								</button>
							</div>
						)}
						{abaGaleria === 'minhas' ? (
							/*
							 * A biblioteca é uma superfície ESCURA de paleta própria — a
							 * bancada da Arte Licenciada, que não segue o tema do aparelho.
							 * Aqui ela cai dentro da galeria genérica, que SEGUE: em tema
							 * claro os cartões escuros ficavam boiando sobre fundo branco.
							 *
							 * A moldura é do HOSPEDEIRO, e não da biblioteca: quem escolhe
							 * onde ela aparece é que sabe o que tem atrás. No balcão o chão
							 * já é este, e lá a moldura não muda nada.
							 */
							<div
								className={`${TEMA_LICENCIADA} rounded-xl bg-[var(--al-ground)] p-4 sm:p-6`}
							>
								<MyLicensedArtLibrary />
							</div>
						) : (
							<PromptGallery
								entries={bankQuery.data ?? []}
								loading={bankQuery.isLoading}
								onSelect={(entry) => {
									setSelectedEntry(entry);
									setResult(null);
									setTema('');
									setSpecValues({});
									setReferencias([null, null, null]);
									setImageSize(null);
								}}
							/>
						)}
					</div>
				</div>
			);
		}

		const mode = modeOf(selectedEntry);
		const needsTema = mode.includes('texto');
		const specs = specsOf(selectedEntry);
		const maxImages = maxImagesOf(selectedEntry);
		const chosenImages = referencias
			.slice(0, maxImages)
			.filter((f): f is File => f instanceof File);
		const hasText = hasTextInput(specs, specValues, tema);
		// `texto_imagem`: tema/especificações OU imagem — não exige os dois (o
		// aluno pode gerar só com uma referência, sem escrever nada, ou só com
		// texto, sem subir imagem). `texto`/`imagem` puros continuam exigindo seu
		// único campo. Passo 1 exige creationId (se a tool tem creations); Passo 3
		// exige variationCount (se a tool tem return_variations) — validação local
		// espelha a da API (que rejeita 400 antes de cobrar).
		const hasCreations = !!creations && creations.length > 0;
		const hasVariations = !!returnVariations && returnVariations.length > 0;
		const meetsInputRequirement =
			mode === 'texto_imagem'
				? hasText || chosenImages.length > 0
				: (!needsTema || hasText) &&
					(mode !== 'imagem' || chosenImages.length > 0);
		const canGenerate =
			meetsInputRequirement &&
			(!hasCreations || !!creationId) &&
			(!hasVariations || !!variationCount);

		return (
			<div className={`p-4 md:p-8 ${screenUi.themeClass}`} style={screenStyle}>
				<div className={themedShell}>
					{screenUi.notice && <ScreenNotice notice={screenUi.notice} />}
					{header}
					<PromptGenerateView
						entry={selectedEntry}
						tema={tema}
						onTemaChange={setTema}
						specs={specs}
						specValues={specValues}
						onSpecValueChange={(name, v) =>
							setSpecValues((prev) => ({ ...prev, [name]: v }))
						}
						referencias={referencias}
						onReferenciaChange={(index, file) =>
							setReferencias((prev) => {
								const next = [...prev];
								next[index] = file;
								return next;
							})
						}
						result={result}
						downloadKey={downloadKey}
						actionLabel={actionLabel}
						pending={pending}
						insufficient={billing.insufficient}
						canGenerate={canGenerate}
						imageSize={imageSize}
						onImageSizeChange={setImageSize}
						onGenerate={runBank}
						onResetResult={() => setResult(null)}
						onBack={() => {
							setSelectedEntry(null);
							setResult(null);
						}}
						backLabel={
							studioUi?.layout === 'licenciada'
								? 'Voltar aos modelos'
								: undefined
						}
						// A variante NUNCA sai do `layout`: um prompt dos Prompts Mágicos
						// marcado com marca por engano não pode virar esta tela.
						variante={
							studioUi?.layout === 'licenciada' ? 'licenciada' : undefined
						}
						marca={licensedMarca}
						billingNotice={showCostNotice ? billing.notice : null}
						creations={creations}
						creationId={creationId}
						onCreationIdChange={setCreationId}
						returnVariations={returnVariations}
						variationCount={variationCount}
						printRunOptions={printRunOptions}
						printRun={printRun}
						onPrintRunChange={(n) => {
							setPrintRun(n);
							// Tiragem > 1 volta as variações para 1: quem encomenda peças
							// já escolheu a arte, e 4 versões × 50 peças não é fluxo real.
							if (n > 1 && (variationCount ?? 1) > 1) setVariationCount(1);
						}}
						onVariationCountChange={setVariationCount}
					/>
				</div>
			</div>
		);
	}

	/* ── Tool normal (sem banco) ── */
	return (
		<div className="p-4 md:p-8">
			{header}

			<div className="grid lg:grid-cols-2 gap-6">
				{/* Controles */}
				<div className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{controls.map((control) => {
							const name = bindName(control.bind);
							return (
								<WidgetField
									key={control.bind}
									control={control}
									spec={inputSpec[name]}
									value={values[name]}
									onChange={(v) => setValue(name, v)}
								/>
							);
						})}
					</div>

					<button
						type="button"
						onClick={run}
						disabled={pending || billing.insufficient || missingRequired}
						className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
					>
						{pending ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								Processando...
							</>
						) : (
							<>
								<Wand2 className="w-5 h-5" />
								{actionLabel}
							</>
						)}
					</button>

					{showCostNotice && billing.notice}
				</div>

				{/* Resultado */}
				<div>
					{result ? (
						<ResultPanel
							result={result}
							downloadKey={downloadKey}
							showMeta={resultUi?.showMeta ?? true}
						/>
					) : (
						<div className="h-full min-h-[240px] rounded-2xl border border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center text-sm text-slate-400 dark:text-gray-500">
							O resultado aparece aqui.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
