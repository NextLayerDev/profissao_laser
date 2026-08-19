/**
 * MOCK da Arte Licenciada — ligado por `NEXT_PUBLIC_MOCK_MARCAS=true`.
 *
 * Existe por um motivo temporário: a main-api e a upvox-api ainda estão na
 * branch, então TODA a superfície da ferramenta responde 404 e nenhuma tela
 * abre. Sem isto não dá para trabalhar o visual — e o visual é o que falta.
 *
 * Três regras que fazem este arquivo ser removível sem dor:
 *
 * 1. TUDO mora aqui. Nos serviços reais existe só um `if (MOCK) return …` de
 *    uma linha. Apagar o mock = apagar este arquivo e os ifs.
 * 2. É ESCOPADO por `tool_key`. Só `arte_licenciada` recebe dado falso; os
 *    Prompts Mágicos e as outras tools continuam batendo na API de verdade,
 *    mesmo com a flag ligada.
 * 3. O formato imita o CONTRATO que o front já espera — os mesmos schemas zod
 *    validam a resposta falsa. Se a main-api chegar divergindo, o zod quebra
 *    aqui primeiro, que é o lugar barato de descobrir.
 *
 * O que ele NÃO prova: concorrência, cobrança, permissão, emissão sob corrida,
 * nem persistência de verdade. Tela pronta com mock ligado não é feature pronta.
 */

import type { LicensedBrand } from '../services/licensed-brand.service';
import type { MyLicensedArt } from '../services/my-licensed-art.service';
import type { ToolBankEntry } from '../services/tool-bank.service';
import type {
	AiToolDefinition,
	ToolRunResult,
} from '../services/tool-definitions.service';

/** A chave única. Expressão estática inteira, para o Next inlinar no bundle. */
export const MOCK_LICENCIADA = process.env.NEXT_PUBLIC_MOCK_MARCAS === 'true';

/** Só esta tool recebe dado falso — regra 2 do cabeçalho. */
export const MOCK_TOOL_KEY = 'arte_licenciada';

export function isMockTool(toolKey: string): boolean {
	return MOCK_LICENCIADA && toolKey === MOCK_TOOL_KEY;
}

if (MOCK_LICENCIADA && typeof window !== 'undefined') {
	console.warn(
		'[arte-licenciada] MOCK LIGADO (NEXT_PUBLIC_MOCK_MARCAS=true). ' +
			'Marcas, modelos, peças e códigos são falsos e vivem no localStorage. ' +
			'`__resetMockLicenciada()` volta tudo à semente.',
	);
}

/** Latência fingida: sem ela nenhum estado de carregando aparece na tela. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ────────────────────────────── Códigos ────────────────────────────── */

/**
 * O alfabeto real do código: base32 de Crockford, que já exclui I, L, O e U —
 * as letras que se confundem com 1, 0 e V numa gravação fotografada de lado.
 * 20 símbolos × 5 bits = os ~100 bits do motor.
 *
 * Repetido aqui de propósito: um mock com código de outro comprimento
 * esconderia justamente o problema de layout que ele deveria mostrar (onde a
 * linha quebra, que largura a caixa precisa ter).
 */
const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function novoCodigo(): string {
	let s = '';
	for (let i = 0; i < 20; i++) {
		s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
	}
	return s;
}

/* ────────────────────────── Arte de mentira ────────────────────────── */

const svg = (corpo: string) =>
	`data:image/svg+xml;utf8,${encodeURIComponent(corpo)}`;

/**
 * Escudo genérico. Abstrato de propósito — ninguém confunde com o oficial, e
 * o layout continua sendo testado com o formato certo (alto, com margem larga).
 */
const escudo = (iniciais: string, fundo: string, tinta: string) =>
	svg(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120">
			<path d="M50 4 96 20v46c0 28-20 42-46 50C24 108 4 94 4 66V20z" fill="${fundo}" stroke="${tinta}" stroke-width="4"/>
			<text x="50" y="74" font-family="Georgia,serif" font-size="30" font-weight="bold" fill="${tinta}" text-anchor="middle">${iniciais}</text>
		</svg>`,
	);

/** Peça "gravada": 1-bit puro, preto sobre branco, como sai o arquivo do laser. */
const pecaGravada = (rotulo: string) =>
	svg(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
			<rect width="400" height="300" fill="#ffffff"/>
			<circle cx="200" cy="128" r="78" fill="none" stroke="#000000" stroke-width="6"/>
			<circle cx="200" cy="128" r="58" fill="none" stroke="#000000" stroke-width="2"/>
			<text x="200" y="140" font-family="Georgia,serif" font-size="34" font-weight="bold" fill="#000000" text-anchor="middle">${rotulo}</text>
			<path d="M120 210h160M140 226h120" stroke="#000000" stroke-width="4"/>
			<text x="200" y="266" font-family="monospace" font-size="14" fill="#000000" text-anchor="middle">ARTE DE MENTIRA</text>
		</svg>`,
	);

/* ─────────────────────────── Estado em memória ─────────────────────────── */

interface Estado {
	marcas: LicensedBrand[];
	modelos: ToolBankEntry[];
	pecas: MyLicensedArt[];
}

const AGORA = '2026-08-19T12:00:00.000Z';

function modelo(
	id: string,
	title: string,
	featureKey: string,
	licensorName: string,
	position: number,
	mode: 'texto' | 'imagem' | 'texto_imagem',
	description: string,
): ToolBankEntry {
	return {
		id,
		tool_key: MOCK_TOOL_KEY,
		title,
		description,
		category: null,
		position,
		active: true,
		data: {
			mode,
			max_images: 1,
			feature_key: featureKey,
			licensor_name: licensorName,
			prompt_script:
				'Gravação a laser 1-bit puro, sem meio-tom, espessura mínima de traço 0.3mm, sem ilhas soltas, contorno de corte fechado. {tema}',
		},
		example_before_url: null,
		// Sem exemplo cadastrado de propósito: é o estado real hoje (nenhum modelo
		// tem imagem) e é o caso que o card precisa saber desenhar — o escudo
		// apagado como marca d'água.
		example_after_url: null,
		created_at: AGORA,
		updated_at: AGORA,
	};
}

function semear(): Estado {
	const marcas: LicensedBrand[] = [
		{
			id: 'mk-brand-1',
			feature_key: 'clube:corinthians',
			display_name: 'Corinthians',
			crest_url: escudo('SC', '#000000', '#ffffff'),
			mascot_url: null,
			accent_color: '#000000',
			active: true,
			notes: 'Contrato até 12/2026.',
			created_at: AGORA,
			updated_at: AGORA,
		},
		{
			// A SEGUNDA marca existe para provar o que o handoff diz que falta
			// provar: cor e escudo bem diferentes no mesmo layout.
			id: 'mk-brand-2',
			feature_key: 'clube:palmeiras',
			display_name: 'Palmeiras',
			crest_url: escudo('SE', '#006437', '#ffffff'),
			mascot_url: null,
			accent_color: '#006437',
			active: true,
			notes: 'Contrato em negociação.',
			created_at: AGORA,
			updated_at: AGORA,
		},
	];

	const modelos: ToolBankEntry[] = [
		modelo(
			'mk-entry-1',
			'Caneca 360°',
			'clube:corinthians',
			'Corinthians',
			1,
			'texto_imagem',
			'Arte que dá a volta na caneca, com a foto do torcedor.',
		),
		modelo(
			'mk-entry-2',
			'Chaveiro com corte e furo',
			'clube:corinthians',
			'Corinthians',
			2,
			'imagem',
			'Contorno de corte fechado e furo de argola.',
		),
		modelo(
			'mk-entry-3',
			'Porta-copos redondo',
			'clube:corinthians',
			'Corinthians',
			3,
			'texto',
			'Disco de 90 mm, gravação 1-bit.',
		),
		modelo(
			'mk-entry-4',
			'Luminária litofania',
			'clube:corinthians',
			'Corinthians',
			4,
			'imagem',
			'Cinza invertido para litofania retroiluminada.',
		),
		modelo(
			'mk-entry-5',
			'Quadro alto contraste',
			'clube:palmeiras',
			'Palmeiras',
			5,
			'imagem',
			'A foto do torcedor em preto e branco puro.',
		),
	];

	const pecas: MyLicensedArt[] = [
		{
			id: 'mk-art-1',
			code: 'K7QM3XVD9RTPB5NWH2SG',
			featureKey: 'clube:corinthians',
			licensorName: 'Corinthians',
			previewUrl: pecaGravada('SC'),
			promptTitle: 'Caneca 360°',
			revoked: false,
			archived: false,
			// Um LOTE de 3 na semente: é o estado que a tela agrupa por lote, e o
			// que abre o botão de ampliar tiragem.
			batchId: 'mk-lote-1',
			pieceIndex: 1,
			batchSize: 3,
			canGrow: true,
			issuedAt: '2026-08-18T14:20:00.000Z',
		},
		{
			id: 'mk-art-2',
			code: 'T4WZ8NDK2QFXR6VYM3BH',
			featureKey: 'clube:corinthians',
			licensorName: 'Corinthians',
			previewUrl: pecaGravada('SC'),
			promptTitle: 'Chaveiro com corte e furo',
			// Uma peça REVOGADA na semente: é o estado que ninguém lembra de abrir,
			// e é o que troca o painel inteiro por um aviso vermelho.
			revoked: true,
			archived: false,
			batchId: 'mk-lote-2',
			pieceIndex: 1,
			batchSize: 1,
			// Lote antigo, sem arte-mãe guardada: não pode crescer.
			canGrow: false,
			issuedAt: '2026-08-17T09:05:00.000Z',
		},
		{
			id: 'mk-art-3',
			code: 'B9HJ5SVT7XKN2PQRW4ZM',
			featureKey: 'clube:palmeiras',
			licensorName: 'Palmeiras',
			previewUrl: pecaGravada('SE'),
			promptTitle: 'Quadro alto contraste',
			revoked: false,
			// E uma ARQUIVADA, para a aba "Arquivadas" não nascer vazia.
			archived: true,
			batchId: 'mk-lote-3',
			pieceIndex: 1,
			batchSize: 1,
			canGrow: false,
			issuedAt: '2026-08-15T18:40:00.000Z',
		},
	];

	return { marcas, modelos, pecas };
}

/* ───────────────────── Persistência (localStorage) ───────────────────── */

/**
 * O que você cadastrar sobrevive ao F5. Sem isto, cada recarga apagaria a marca
 * que você acabou de subir e o mock viraria estorvo em vez de ajuda.
 */
const CHAVE = 'mock:arte-licenciada:v1';
let estado: Estado | null = null;

function db(): Estado {
	if (estado) return estado;
	if (typeof window !== 'undefined') {
		try {
			const cru = window.localStorage.getItem(CHAVE);
			if (cru) {
				estado = JSON.parse(cru) as Estado;
				return estado;
			}
		} catch {
			// localStorage corrompido ou indisponível: cai na semente, não quebra.
		}
	}
	estado = semear();
	return estado;
}

function salvar() {
	if (typeof window === 'undefined' || !estado) return;
	try {
		window.localStorage.setItem(CHAVE, JSON.stringify(estado));
	} catch {
		// Cota estourada (escudo em base64 é gordo). Segue só em memória.
	}
}

/** Volta tudo à semente. No console do navegador: `__resetMockLicenciada()`. */
export function resetMockLicenciada() {
	estado = semear();
	salvar();
	if (typeof window !== 'undefined') window.location.reload();
}

if (MOCK_LICENCIADA && typeof window !== 'undefined') {
	(window as unknown as Record<string, unknown>).__resetMockLicenciada =
		resetMockLicenciada;
}

/** O `File` do upload vira data URL — `blob:` morreria no primeiro reload. */
function arquivoParaDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const fr = new FileReader();
		fr.onload = () => resolve(String(fr.result));
		fr.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
		fr.readAsDataURL(file);
	});
}

/** Erro com `response.status`, no formato que os `catch` do front já leem. */
function erroHttp(status: number, message: string) {
	return Object.assign(new Error(message), {
		isAxiosError: true,
		response: { status, data: { message } },
	});
}

/* ────────────────────────────── Marcas ────────────────────────────── */

export async function mockListBrands(): Promise<LicensedBrand[]> {
	await sleep(280);
	return [...db().marcas];
}

interface EntradaMarca {
	feature_key: string;
	display_name: string;
	active: boolean;
	accent_color?: string;
	notes?: string;
	crest?: File | null;
	mascot?: File | null;
	removeMascot?: boolean;
}

export async function mockCreateBrand(
	input: EntradaMarca,
): Promise<LicensedBrand> {
	await sleep(400);
	const chave = input.feature_key.trim().toLowerCase();
	if (db().marcas.some((m) => m.feature_key === chave)) {
		throw erroHttp(409, 'Já existe uma marca com essa chave.');
	}
	const nova: LicensedBrand = {
		id: `mk-brand-${Date.now()}`,
		feature_key: chave,
		display_name: input.display_name.trim(),
		crest_url: input.crest ? await arquivoParaDataUrl(input.crest) : null,
		mascot_url: input.mascot ? await arquivoParaDataUrl(input.mascot) : null,
		accent_color: input.accent_color || null,
		active: input.active,
		notes: input.notes || null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};
	db().marcas.push(nova);
	salvar();
	return nova;
}

export async function mockUpdateBrand(
	id: string,
	input: EntradaMarca,
): Promise<LicensedBrand> {
	await sleep(400);
	const m = db().marcas.find((x) => x.id === id);
	if (!m) throw erroHttp(404, 'Marca não encontrada.');
	m.feature_key = input.feature_key.trim().toLowerCase();
	m.display_name = input.display_name.trim();
	m.active = input.active;
	m.accent_color = input.accent_color || null;
	m.notes = input.notes || null;
	// Arquivo só troca quando veio um novo — mesmo contrato do backend real:
	// salvar para mudar o nome não pode apagar o escudo.
	if (input.crest) m.crest_url = await arquivoParaDataUrl(input.crest);
	if (input.mascot) m.mascot_url = await arquivoParaDataUrl(input.mascot);
	if (input.removeMascot) m.mascot_url = null;
	m.updated_at = new Date().toISOString();
	salvar();
	return m;
}

export async function mockDeleteBrand(id: string): Promise<void> {
	await sleep(300);
	const i = db().marcas.findIndex((x) => x.id === id);
	if (i >= 0) db().marcas.splice(i, 1);
	salvar();
}

/* ──────────────────── Definition + banco (os modelos) ──────────────────── */

/**
 * A definition que a migration do upvox-api registraria. O que importa aqui é
 * `ui.layout: 'licenciada'` — é ele que troca a galeria de prompts pelo balcão
 * — e o campo `feature_key` do tipo `brand` no banco.
 */
export function mockToolDefinition(): AiToolDefinition {
	return {
		id: 'mk-tool-arte-licenciada',
		tool_key: MOCK_TOOL_KEY,
		version: 1,
		status: 'published',
		title: 'Arte Licenciada',
		description:
			'Gere arte oficial de marcas licenciadas, com código de autenticidade por peça.',
		engine_runtime: 'pipeline_v1',
		definition: {
			schemaVersion: 1,
			input: {},
			pipeline: [],
			output: {},
			ui: {
				layout: 'licenciada',
				controls: [],
				action: { label: 'Gerar a peça', showCostNotice: true },
				result: { kind: 'image', downloadFrom: 'primary', showMeta: false },
				customer: {
					title: 'Arte Licenciada',
					subtitle:
						'Escolha a marca, gere a peça e grave o código de autenticidade.',
					notice: null,
				},
				admin: { title: 'Arte Licenciada · modelos', notice: null },
				audience: 'both',
			},
			billing: { vox_cost: 1, free_quota: {} },
			bank: {
				enabled: true,
				fields: [
					{
						name: 'feature_key',
						label: 'Marca licenciada',
						type: 'brand',
						required: true,
					},
					{
						name: 'licensor_name',
						label: 'Nome do licenciante',
						type: 'text',
					},
					{
						name: 'mode',
						label: 'Modo',
						type: 'enum',
						options: ['texto', 'imagem', 'texto_imagem'],
					},
					{ name: 'prompt_script', label: 'Prompt', type: 'textarea' },
				],
				card: { title: 'title', subtitle: 'description' },
				inject: { tema: { from: 'tema', substitute: true } },
			},
			return_variations: [1],
		},
	};
}

export async function mockListBank(): Promise<ToolBankEntry[]> {
	await sleep(300);
	return [...db().modelos].sort((a, b) => a.position - b.position);
}

/** Lê o `FormData` que o `ToolBankManager` monta e devolve os campos soltos. */
function lerFormData(body: FormData) {
	const texto = (k: string) => {
		const v = body.get(k);
		return typeof v === 'string' ? v : undefined;
	};
	let data: Record<string, unknown> | undefined;
	const cru = texto('data');
	if (cru) {
		try {
			data = JSON.parse(cru) as Record<string, unknown>;
		} catch {
			data = undefined;
		}
	}
	return {
		title: texto('title'),
		description: texto('description'),
		category: texto('category'),
		active: texto('active'),
		data,
		exampleAfter: body.get('example_after'),
	};
}

export async function mockCreateBankEntry(
	body: FormData,
): Promise<ToolBankEntry> {
	await sleep(400);
	const f = lerFormData(body);
	const novo: ToolBankEntry = {
		id: `mk-entry-${Date.now()}`,
		tool_key: MOCK_TOOL_KEY,
		title: f.title ?? 'Sem título',
		description: f.description || null,
		category: f.category || null,
		position: db().modelos.length + 1,
		active: f.active !== 'false',
		data: f.data ?? {},
		example_before_url: null,
		example_after_url:
			f.exampleAfter instanceof File
				? await arquivoParaDataUrl(f.exampleAfter)
				: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};
	db().modelos.push(novo);
	salvar();
	return novo;
}

export async function mockUpdateBankEntry(
	id: string,
	body: FormData,
): Promise<ToolBankEntry> {
	await sleep(400);
	const e = db().modelos.find((x) => x.id === id);
	if (!e) throw erroHttp(404, 'Registro não encontrado.');
	const f = lerFormData(body);
	// PATCH parcial: só sobrescreve o que veio. O toggle de ativo manda só ele.
	if (f.title !== undefined) e.title = f.title;
	if (f.description !== undefined) e.description = f.description || null;
	if (f.category !== undefined) e.category = f.category || null;
	if (f.active !== undefined) e.active = f.active !== 'false';
	if (f.data) e.data = f.data;
	if (f.exampleAfter instanceof File) {
		e.example_after_url = await arquivoParaDataUrl(f.exampleAfter);
	}
	e.updated_at = new Date().toISOString();
	salvar();
	return e;
}

export async function mockDeleteBankEntry(id: string): Promise<void> {
	await sleep(300);
	const i = db().modelos.findIndex((x) => x.id === id);
	if (i >= 0) db().modelos.splice(i, 1);
	salvar();
}

export async function mockReorderBank(ids: string[]): Promise<void> {
	await sleep(200);
	ids.forEach((id, i) => {
		const e = db().modelos.find((x) => x.id === id);
		if (e) e.position = i + 1;
	});
	salvar();
}

/* ─────────────────────────── Peças do aluno ─────────────────────────── */

export async function mockListMyArt(
	archived: boolean,
): Promise<MyLicensedArt[]> {
	await sleep(320);
	return db()
		.pecas.filter((p) => p.archived === archived)
		.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export async function mockArchiveMyArt(
	id: string,
	archived: boolean,
): Promise<MyLicensedArt> {
	await sleep(300);
	const p = db().pecas.find((x) => x.id === id);
	if (!p) throw erroHttp(404, 'Peça não encontrada.');
	p.archived = archived;
	salvar();
	return p;
}

/* ─────────────────── Verificação pública (a página do QR) ─────────────────── */

export interface MockVerificacao {
	code: string;
	valid: boolean;
	status: 'active' | 'revoked';
	content: string;
	featureKey: string;
	licensorName: string | null;
	brandName: string | null;
	crestUrl: string | null;
	accentColor: string | null;
	previewUrl: string | null;
	issuedAt: string;
	checkedAt: string;
}

/**
 * ARQUIVADA CONTINUA RESPONDENDO — o mock repete a regra de propósito. O QR de
 * uma peça arquivada já pode estar gravado num chaveiro que saiu da oficina, e
 * um 404 aqui seria lido como falsificação por quem escaneia.
 */
export async function mockVerify(code: string): Promise<MockVerificacao> {
	await sleep(450);
	const peca = db().pecas.find(
		(p) => p.code.toUpperCase() === code.trim().toUpperCase(),
	);
	if (!peca) throw erroHttp(404, 'Código não encontrado.');
	const marca = db().marcas.find((m) => m.feature_key === peca.featureKey);
	return {
		code: peca.code,
		valid: !peca.revoked,
		status: peca.revoked ? 'revoked' : 'active',
		content: peca.promptTitle ?? 'Arte licenciada',
		featureKey: peca.featureKey,
		licensorName: peca.licensorName,
		brandName: marca?.display_name ?? null,
		crestUrl: marca?.crest_url ?? null,
		accentColor: marca?.accent_color ?? null,
		previewUrl: peca.previewUrl,
		issuedAt: peca.issuedAt,
		checkedAt: new Date().toISOString(),
	};
}

/* ────────────────────────────── A geração ────────────────────────────── */

/**
 * O run falso. Devolve arte de mentira + licença e GRAVA a peça na biblioteca —
 * é o que fecha o fluxo: gerar, ver o painel, reencontrar em "Minhas peças" e
 * escanear o QR na página pública, tudo sem backend.
 *
 * Demora 1,6 s de propósito: a entrada do painel é justamente o que precisa de
 * animação, e ela não aparece num mock instantâneo.
 */
export async function mockRun(bankEntryId?: string): Promise<ToolRunResult> {
	await sleep(1600);
	const entry = db().modelos.find((e) => e.id === bankEntryId);
	const bruta = (entry?.data as Record<string, unknown> | undefined)
		?.feature_key;
	const chave = typeof bruta === 'string' ? bruta : 'clube:corinthians';
	const marca = db().marcas.find((m) => m.feature_key === chave);
	const code = novoCodigo();
	const issuedAt = new Date().toISOString();
	const arte = pecaGravada(
		marca?.display_name.slice(0, 2).toUpperCase() ?? '??',
	);

	db().pecas.unshift({
		id: `mk-art-${Date.now()}`,
		code,
		featureKey: chave,
		licensorName: marca?.display_name ?? null,
		previewUrl: arte,
		promptTitle: entry?.title ?? null,
		revoked: false,
		archived: false,
		batchId: `mk-lote-${Date.now()}`,
		pieceIndex: 1,
		batchSize: 1,
		canGrow: true,
		issuedAt,
	});
	salvar();

	return {
		id: `mk-run-${Date.now()}`,
		output: { primary: arte, preview: arte, images: [{ pngBase64: arte }] },
		license: {
			code,
			featureKey: chave,
			licensorName: marca?.display_name ?? null,
			issuedAt,
		},
	};
}
