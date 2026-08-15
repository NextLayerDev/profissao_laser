'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageOff, Link2, Loader2, Trash2, X } from 'lucide-react';
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { toast } from 'sonner';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useToolDefinition } from '../hooks/use-tool-definition';
import {
	applicableFields,
	type CollectionFieldSpec,
	controlFor,
	fieldLabel,
	groupFields,
	mensagemDoErro,
	payloadData,
	resolveCollectionConfig,
	validarRegistro,
	visibilityOf,
} from '../lib/collection-form';
import {
	type CollectionEntry,
	createCollectionEntry,
	deleteCollectionEntry,
	type UploadedImage,
	updateCollectionEntry,
	uploadCollectionImage,
} from '../services/collections.service';
import { WidgetField } from './tool-widgets';

/**
 * CADASTRO DE UM REGISTRO DE COLEÇÃO — o formulário genérico que faltava.
 *
 * `createCollectionEntry` existe no serviço desde o primeiro dia das Coleções e
 * NUNCA foi chamado por componente nenhum. O efeito prático estava em produção:
 * no Orçamento o aluno vê o seletor "Meu perfil de custo" e não tem, em lugar
 * nenhum do produto, como criar um perfil. O backend estava pronto; a tela não
 * existia.
 *
 * Nada aqui sabe o que é perfil de custo, marca ou receita: os campos, o que é
 * obrigatório, as faixas e as condições saem de `collections.<nome>.fields` na
 * definition da tool DONA da coleção. Coleção nova continua sendo dado.
 *
 * Os campos são desenhados pelo MESMO registry de widgets das telas de tool
 * (`WidgetField`) — o que este arquivo faz é traduzir a declaração do campo em
 * control + spec (ver `lib/collection-form.ts`). O único tipo tratado à parte é
 * `image`, porque guarda URL e nenhum widget existente sobe arquivo.
 *
 * QUANDO UMA COLEÇÃO MERECE MAIS CARINHO (a marca do aluno merece), a tela dela
 * não duplica este formulário: passa `renderField`, `renderBelowField`,
 * `renderAside` e `onImageUploaded` e desenha por cima. Validação, `showIf`,
 * payload, visibilidade, salvar e excluir continuam MORANDO AQUI, num lugar só
 * — ver `components/marca/marca-form.tsx`, que é o exemplo vivo.
 */

const botaoPrimario =
	'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 bg-[var(--screen-accent,#7c3aed)] hover:brightness-110';
const botaoNeutro =
	'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5';

/* ─────────────────────────── campo de imagem ─────────────────────────── */

/**
 * `type:'image'` guarda URL, não bytes. O aluno escolhe o arquivo, a gente sobe
 * e guarda o endereço devolvido.
 *
 * O endpoint de upload do aluno (`/c/:collection/upload-image`) é novo; até ele
 * existir a chamada volta 404. Em vez de travar o cadastro inteiro por causa de
 * um campo, o erro abre o caminho manual: colar o endereço de uma imagem que já
 * está na internet. É o mesmo dado no fim — uma URL.
 */
function CampoImagem({
	field,
	toolKey,
	collection,
	value,
	onChange,
	onUploaded,
}: {
	field: CollectionFieldSpec;
	toolKey: string;
	collection: string;
	value: unknown;
	onChange: (v: unknown) => void;
	/** A resposta INTEIRA do envio (traz dimensões e paleta). */
	onUploaded?: (imagem: UploadedImage) => void;
}) {
	const [enviando, setEnviando] = useState(false);
	const [erro, setErro] = useState<string | null>(null);
	const [colar, setColar] = useState(false);
	const url = typeof value === 'string' ? value : '';

	const enviar = async (escolhido: unknown) => {
		if (!(escolhido instanceof File)) return;
		setErro(null);
		setEnviando(true);
		try {
			const imagem = await uploadCollectionImage(
				toolKey,
				collection,
				escolhido,
			);
			onChange(imagem.url);
			onUploaded?.(imagem);
		} catch (e) {
			/**
			 * O 404 NÃO quer mais dizer "ainda não implementado".
			 *
			 * Enquanto a rota não existia, mapeávamos 404 para "envio indisponível,
			 * cole um endereço" — e isso passou a ser mentira quando ela nasceu.
			 * Hoje 404 aqui é `tool_not_found`: a tool não existe, ou está em
			 * rascunho e este usuário não está na allowlist de preview. Mandar o
			 * aluno colar link de fora esconde um problema de acesso.
			 */
			setErro(mensagemDoErro(e, 'Não consegui enviar a imagem agora.'));
			setColar(true);
		} finally {
			setEnviando(false);
		}
	};

	return (
		<div className="space-y-2 sm:col-span-2">
			{url ? (
				<div className="space-y-1.5">
					<span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
						{fieldLabel(field)}
					</span>
					<div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#1a1a1d]">
						{/* <img> intencional: a URL é de CDN e muda a cada envio. */}
						<img
							src={url}
							alt=""
							className="h-14 w-14 shrink-0 rounded-lg object-contain"
						/>
						<p className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
							{url}
						</p>
						<button
							type="button"
							onClick={() => onChange(undefined)}
							className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
							aria-label={`Remover ${field.label ?? field.name}`}
						>
							<ImageOff className="h-4 w-4" />
						</button>
					</div>
				</div>
			) : (
				<WidgetField
					control={{
						bind: `input.${field.name}`,
						widget: 'file-drop',
						label: fieldLabel(field),
					}}
					value={undefined}
					onChange={enviar}
				/>
			)}

			{enviando ? (
				<p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
					<Loader2 className="h-3.5 w-3.5 animate-spin" />
					Enviando a imagem…
				</p>
			) : null}

			{erro ? (
				<p
					role="alert"
					className="text-xs font-medium text-rose-600 dark:text-rose-400"
				>
					{erro}
				</p>
			) : null}

			{colar || url ? (
				<input
					type="url"
					value={url}
					placeholder="https://…"
					onChange={(e) => onChange(e.target.value)}
					className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--screen-accent,#7c3aed)_45%,transparent)] dark:border-white/10 dark:bg-[#111] dark:text-slate-300"
				/>
			) : (
				<button
					type="button"
					onClick={() => setColar(true)}
					className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
				>
					<Link2 className="h-3.5 w-3.5" />
					Ou cole o endereço de uma imagem
				</button>
			)}

			{field.hint ? (
				<p className="text-xs text-slate-500 dark:text-slate-400">
					{field.hint}
				</p>
			) : null}
		</div>
	);
}

/* ─────────────────────────── o formulário ─────────────────────────── */

/**
 * O estado VIVO do formulário, entregue a quem desenha as camadas extras.
 *
 * É o que permite uma tela caprichada (a prévia da marca, as cores sugeridas
 * pelo logo) sem duplicar formulário nenhum: o genérico continua dono da
 * validação, do `showIf`, do payload e do salvar; a tela de cima só DESENHA.
 */
export interface CollectionFormCtx {
	fields: CollectionFieldSpec[];
	data: Record<string, unknown>;
	setCampo: (name: string, v: unknown) => void;
	/** Título do registro (o `title`), como está digitado agora. */
	title: string;
	/**
	 * A última imagem enviada NESTE formulário, com o que o servidor devolveu
	 * junto (dimensões e paleta). É `null` ao abrir um registro já salvo: as
	 * cores do logo vêm do envio, e um registro antigo não tem envio nenhum.
	 */
	ultimaImagem: { field: string; imagem: UploadedImage } | null;
}

export interface CollectionFieldCtx extends CollectionFormCtx {
	field: CollectionFieldSpec;
	value: unknown;
	onChange: (v: unknown) => void;
}

export interface CollectionEntryFormProps {
	/** Tool DONA da coleção (a mesma do `control.tool` do widget). */
	toolKey: string;
	collection: string;
	/** Registro a editar. Ausente/`null` = criar um novo. */
	entry?: CollectionEntry | null;
	onClose: () => void;
	/** Recebe o registro salvo — quem chamou decide se seleciona, recarrega… */
	onSaved?: (entry: CollectionEntry) => void;
	/** Chamado depois de excluir (o registro já não existe mais). */
	onDeleted?: (id: string) => void;
	/**
	 * Desenha na PÁGINA em vez de num modal. Um cadastro que é o assunto da tela
	 * (a marca do aluno) dentro de um modal em cima de uma lista vira duas
	 * rolagens aninhadas no celular.
	 */
	inline?: boolean;
	/** SUBSTITUI o desenho de um campo. `null` = desenha o padrão. */
	renderField?: (ctx: CollectionFieldCtx) => ReactNode | null;
	/** ACRESCENTA algo logo abaixo de um campo (sugestões, avisos). */
	renderBelowField?: (ctx: CollectionFieldCtx) => ReactNode | null;
	/** Coluna ao lado dos campos (a prévia). No celular, vai para o topo. */
	renderAside?: (ctx: CollectionFormCtx) => ReactNode;
	/**
	 * Um envio de imagem DEU CERTO — com o que o servidor devolveu junto dela.
	 *
	 * É o gancho que deixa a tela reagir ao envio sem espiar o estado do
	 * formulário por fora: a marca usa para preencher as cores com a paleta do
	 * logo no mesmo instante em que o logo aparece.
	 */
	onImageUploaded?: (imagem: UploadedImage, ctx: CollectionFieldCtx) => void;
}

export function CollectionEntryForm({
	toolKey,
	collection,
	entry,
	onClose,
	onSaved,
	onDeleted,
	inline,
	renderField,
	renderBelowField,
	renderAside,
	onImageUploaded,
}: CollectionEntryFormProps) {
	const qc = useQueryClient();
	const def = useToolDefinition(toolKey);
	const config = useMemo(
		() => resolveCollectionConfig(def.data?.definition, collection),
		[def.data?.definition, collection],
	);

	const [title, setTitle] = useState(entry?.title ?? '');
	const [data, setData] = useState<Record<string, unknown>>(() => ({
		...(entry?.data ?? {}),
	}));
	const [erros, setErros] = useState<string[]>([]);
	const [erroServidor, setErroServidor] = useState<string | null>(null);
	const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
	const [ultimaImagem, setUltimaImagem] = useState<{
		field: string;
		imagem: UploadedImage;
	} | null>(null);

	/**
	 * O aviso de erro precisa ser TRAZIDO até os olhos.
	 *
	 * O rodapé é fixo e a lista de campos é longa (o perfil de custo tem 31): o
	 * aluno clica em "Salvar" com a tela no começo do formulário e o aviso nasce
	 * lá embaixo, fora da área visível. Sem este empurrão, clicar em salvar não
	 * fazia NADA visível — o modo de falha mais frustrante que existe.
	 *
	 * Vai num efeito, e não junto do `setErros`: o rolar tem de acontecer depois
	 * de o aviso EXISTIR na tela. Rolando antes, o alvo ainda tem altura zero e o
	 * navegador anda uns poucos pixels.
	 *
	 * E é rolagem INSTANTÂNEA: com `behavior:'smooth'` a animação era abortada
	 * no meio (o conteúdo cresce quando o aviso aparece) e parava a ~200 px de
	 * 1500 — ou seja, o aviso continuava fora da tela. Medido, não suposto.
	 */
	const avisoRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (!erros.length && !erroServidor) return;
		avisoRef.current?.scrollIntoView({ block: 'center' });
	}, [erros, erroServidor]);

	const setCampo = useCallback((name: string, v: unknown) => {
		setData((prev) => ({ ...prev, [name]: v }));
	}, []);

	/**
	 * Os dados MAIS RECENTES, para quem só vai ler depois.
	 *
	 * O envio de imagem é assíncrono e demora segundos: o `onUploaded` que dispara
	 * no fim nasceu no render em que o aluno soltou o arquivo, e carrega o `data`
	 * daquele instante. Quem reage ao envio (a marca preenche as cores "só se
	 * estiverem vazias") precisa olhar o estado de AGORA — senão sobrescreve uma
	 * cor que o aluno digitou enquanto a imagem subia.
	 */
	const dadosRef = useRef(data);
	useEffect(() => {
		dadosRef.current = data;
	}, [data]);

	/** Toda lista/dropdown desta coleção fica velha depois de salvar. */
	const invalidar = useCallback(() => {
		qc.invalidateQueries({ queryKey: ['collection', toolKey, collection] });
		qc.invalidateQueries({
			queryKey: ['collection-facets', toolKey, collection],
		});
		qc.invalidateQueries({
			queryKey: ['collection-options', toolKey, collection],
		});
	}, [qc, toolKey, collection]);

	const salvar = useMutation({
		mutationFn: async () => {
			if (!config) throw new Error('sem configuração');
			const corpo = {
				title: title.trim(),
				data: payloadData(config.fields, data),
			};
			if (entry) {
				return updateCollectionEntry(toolKey, collection, entry.id, corpo);
			}
			return createCollectionEntry(toolKey, collection, {
				...corpo,
				/**
				 * A visibilidade viaja aqui como SEGUNDA defesa.
				 *
				 * A primeira agora é do back, que impõe o que a coleção declara. Mas
				 * ele só impõe onde há declaração — e coleção sem `visibility` (a
				 * `galeria` do Estúdio, por exemplo) continua caindo no padrão
				 * `public`. Ver `visibilityOf`, que escolhe o valor.
				 */
				visibility: visibilityOf(config),
			});
		},
		onSuccess: (salvo) => {
			invalidar();
			/**
			 * Coleção COM moderação devolve o registro como `pending` — e editar um
			 * registro já aprovado o manda de volta para a fila (é o back que decide,
			 * em `updateCollectionEntryController`). Fechar o modal em silêncio
			 * nesses casos faria o aluno achar que a alteração já valeu.
			 */
			if (salvo.status === 'pending') {
				toast.info('Salvo. A equipe vai revisar antes de publicar.');
			}
			onSaved?.(salvo);
			onClose();
		},
		onError: (e) =>
			setErroServidor(
				mensagemDoErro(e, 'Não consegui salvar agora. Tente de novo.'),
			),
	});

	const excluir = useMutation({
		mutationFn: async () => {
			if (!entry) return;
			await deleteCollectionEntry(toolKey, collection, entry.id);
		},
		onSuccess: () => {
			invalidar();
			if (entry) onDeleted?.(entry.id);
			onClose();
		},
		onError: (e) =>
			setErroServidor(
				mensagemDoErro(e, 'Não consegui excluir agora. Tente de novo.'),
			),
	});

	const tituloDoCampoNome = config?.titleLabel ?? 'Nome';

	const enviar = () => {
		if (!config) return;
		setErroServidor(null);
		const issues = validarRegistro(
			config.fields,
			data,
			title,
			tituloDoCampoNome,
		);
		// Sem repetidas: a lista usa a própria frase como `key`, e uma coleção que
		// rotule um campo igual ao título produziria duas linhas com a mesma chave.
		setErros([...new Set(issues)]);
		if (issues.length) return;
		salvar.mutate();
	};

	const pendente = salvar.isPending || excluir.isPending;
	const editando = !!entry;
	const nomeColecao = config?.label ?? 'registro';

	const ctx: CollectionFormCtx = {
		fields: config?.fields ?? [],
		data,
		setCampo,
		title,
		ultimaImagem,
	};
	const ctxDoCampo = (field: CollectionFieldSpec): CollectionFieldCtx => ({
		...ctx,
		field,
		value: data[field.name],
		onChange: (v) => setCampo(field.name, v),
	});

	const corpo = (
		<form
			// `noValidate`: a validação é a nossa, em português e com as regras da
			// coleção. A do navegador barraria um decimal por causa do `step` e
			// mostraria a mensagem no idioma do sistema operacional.
			noValidate
			onSubmit={(e) => {
				e.preventDefault();
				enviar();
			}}
			className="flex flex-col"
		>
			<header className="flex items-start justify-between gap-3 p-5 pb-3 sm:p-6 sm:pb-4">
				<div className="min-w-0">
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						{editando ? `Editar ${nomeColecao}` : `Novo: ${nomeColecao}`}
					</h3>
					<p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
						Estes dados são seus. Você pode alterá-los quando quiser.
					</p>
				</div>
				<button
					type="button"
					onClick={onClose}
					aria-label="Fechar"
					className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
				>
					<X className="h-5 w-5" />
				</button>
			</header>

			<div className="space-y-5 px-5 pb-4 sm:px-6">
				{def.isLoading ? (
					<div className="flex items-center justify-center py-10">
						<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
					</div>
				) : !config ? (
					<p className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-300">
						Não consegui carregar o formulário desta ferramenta agora. Tente de
						novo em instantes.
					</p>
				) : (
					<div
						className={
							renderAside
								? 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start'
								: undefined
						}
					>
						<div className="space-y-5">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<WidgetField
									control={{
										bind: 'input.__titulo',
										widget: 'text',
										label: `${tituloDoCampoNome} *`,
										placeholder:
											config.titlePlaceholder ?? 'Ex.: meu cadastro principal',
									}}
									value={title}
									onChange={(v) => setTitle(String(v ?? ''))}
								/>
							</div>

							{groupFields(applicableFields(config.fields, data)).map(
								(bloco) => (
									<fieldset key={bloco.group || 'geral'} className="space-y-3">
										{bloco.group ? (
											<legend className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
												{bloco.group}
											</legend>
										) : null}
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											{bloco.fields.map((field) => {
												const abaixo = renderBelowField?.(ctxDoCampo(field));
												const proprio = renderField?.(ctxDoCampo(field));

												if (proprio) {
													return (
														<div key={field.name} className="sm:col-span-2">
															{proprio}
															{abaixo}
														</div>
													);
												}

												if (field.type === 'image') {
													return (
														<div key={field.name} className="sm:col-span-2">
															<CampoImagem
																field={field}
																toolKey={toolKey}
																collection={collection}
																value={data[field.name]}
																onChange={(v) => setCampo(field.name, v)}
																onUploaded={(imagem) => {
																	setUltimaImagem({
																		field: field.name,
																		imagem,
																	});
																	onImageUploaded?.(imagem, {
																		...ctxDoCampo(field),
																		data: dadosRef.current,
																	});
																}}
															/>
															{abaixo}
														</div>
													);
												}
												const { control, spec } = controlFor(field);
												return (
													<div
														key={field.name}
														className={
															control.widget === 'text' ||
															control.widget === 'textarea' ||
															control.widget === 'toggle'
																? 'sm:col-span-2'
																: undefined
														}
													>
														<WidgetField
															control={control}
															spec={spec}
															value={data[field.name]}
															onChange={(v) => setCampo(field.name, v)}
														/>
														{field.hint ? (
															<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
																{field.hint}
															</p>
														) : null}
														{abaixo}
													</div>
												);
											})}
										</div>
									</fieldset>
								),
							)}

							<p className="text-xs text-slate-400 dark:text-slate-500">
								* preenchimento obrigatório
							</p>
						</div>

						{/*
						 * No celular a prévia vai para o TOPO (`order-first`): embaixo de
						 * dez campos, ninguém a veria antes de salvar.
						 *
						 * E NÃO é `sticky`, por mais que uma coluna de prévia peça: o
						 * `<main>` do shell do aluno tem `overflow-x:hidden`, o que faz
						 * dele um scrollport (o `overflow-y` computa `auto`) que NUNCA
						 * rola — quem rola é o documento. Sticky ancorado nele fica
						 * inerte. Medido nesta tela, não suposto: `lg:sticky lg:top-24`
						 * esteve aqui e não grudou em nada.
						 */}
						{renderAside ? (
							<aside className="order-first lg:order-last">
								{renderAside(ctx)}
							</aside>
						) : null}
					</div>
				)}

				<div ref={avisoRef} className="scroll-mt-4 space-y-3 empty:hidden">
					{erros.length ? (
						// `role="alert"` na LISTA, não em cada item: o leitor de tela
						// anuncia os erros de uma vez, em vez de um por linha.
						<ul
							role="alert"
							className="space-y-1 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/5 dark:text-rose-300"
						>
							{erros.map((e) => (
								<li key={e}>{e}</li>
							))}
						</ul>
					) : null}

					{erroServidor ? (
						<p
							role="alert"
							className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/5 dark:text-rose-300"
						>
							{erroServidor}
						</p>
					) : null}
				</div>
			</div>

			<footer className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-slate-200 bg-white/90 p-4 backdrop-blur sm:px-6 dark:border-white/10 dark:bg-[#1a1a1d]/90">
				{editando && entry?.is_mine ? (
					<button
						type="button"
						disabled={pendente}
						onClick={() => {
							if (confirmandoExclusao) excluir.mutate();
							else setConfirmandoExclusao(true);
						}}
						className={`${botaoNeutro} w-full border-rose-200 text-rose-600 hover:bg-rose-50 sm:w-auto dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10`}
					>
						<Trash2 className="h-4 w-4" />
						{confirmandoExclusao ? 'Confirmar exclusão' : 'Excluir'}
					</button>
				) : null}

				{/* No celular os três botões não cabem numa linha: "Excluir" toma a
					    linha inteira e Cancelar/Salvar dividem a de baixo. O empurrão
					    que separa destrutivo de confirmação só existe do `sm` para cima,
					    onde há largura para ele. */}
				<div className="hidden flex-1 sm:block" />

				<button
					type="button"
					onClick={onClose}
					className={`${botaoNeutro} flex-1 sm:flex-none`}
				>
					Cancelar
				</button>
				<button
					type="submit"
					disabled={pendente || def.isLoading || !config}
					className={`${botaoPrimario} flex-1 sm:flex-none`}
				>
					{salvar.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : null}
					{editando ? 'Salvar alterações' : 'Salvar'}
				</button>
			</footer>
		</form>
	);

	if (inline) {
		return (
			<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1a1a1d]">
				{corpo}
			</div>
		);
	}

	return (
		<ModalOverlay onClose={onClose} tone="tools" widthClassName="max-w-3xl">
			{corpo}
		</ModalOverlay>
	);
}
