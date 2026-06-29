/**
 * Catálogo dos blocos do motor genérico (espelho do back). Descreve, por bloco,
 * os PARÂMETROS (ref a uma imagem/saída de outro nó vs. valor literal) e as
 * SAÍDAS (com tipo) — pra o builder geral montar editores e ligar saída→entrada
 * por tipo. Curado: expõe os params úteis; o resto fica no default (ou JSON).
 */

import { IMAGR_BLOCKS } from './imagr-block-catalog';

export type RefType = 'buffer' | 'string';
export type ValueType = 'enum' | 'number' | 'int' | 'bool' | 'string';
export type PortType = RefType | 'number';

export interface BlockParam {
	name: string;
	/** `ref` = ligado a uma fonte (input/nó); `literal` = valor fixo (mas pode virar ref na UI). */
	kind: 'ref' | 'literal';
	/** tipo da fonte quando ref (ou quando o literal puder virar ref). */
	refType?: RefType;
	valueType?: ValueType;
	label: string;
	hint?: string;
	default?: unknown;
	options?: (string | number)[];
	min?: number;
	max?: number;
	step?: number;
	required?: boolean;
	/** editor especial pro literal: textarea (texto longo) ou keyvalue (mapa). */
	widget?: 'textarea' | 'keyvalue';
}

export interface BlockOutput {
	name: string;
	type: PortType;
	label: string;
}

export interface BlockSpec {
	id: string;
	label: string;
	sub: string;
	icon: string;
	accent: string;
	category: 'image' | 'laser' | 'output' | 'util' | 'ai';
	params: BlockParam[];
	outputs: BlockOutput[];
}

const MATERIALS = [
	'wood',
	'black slate',
	'glass',
	'acrylic',
	'leather',
	'cork',
	'andonized aluminum',
	'stainless steel',
	'white tile',
	'white tile painted black',
];

export const BLOCK_CATALOG: BlockSpec[] = [
	{
		id: 'image.input',
		label: 'Imagem de entrada',
		sub: 'recebe a foto do cliente',
		icon: 'image',
		accent: 'sky',
		category: 'image',
		params: [
			{
				name: 'from',
				kind: 'ref',
				refType: 'buffer',
				label: 'Imagem',
				hint: 'Qual campo de imagem do formulário entra aqui.',
				required: true,
			},
		],
		outputs: [{ name: 'buffer', type: 'buffer', label: 'imagem' }],
	},
	{
		id: 'laser.photoengrave',
		label: 'Gravação a laser',
		sub: 'tom por material + dithering',
		icon: 'flame',
		accent: 'orange',
		category: 'laser',
		params: [
			{
				name: 'image',
				kind: 'ref',
				refType: 'buffer',
				label: 'Imagem',
				required: true,
			},
			{
				name: 'material',
				kind: 'literal',
				valueType: 'enum',
				label: 'Material',
				options: MATERIALS,
				default: 'wood',
			},
			{
				name: 'width_mm',
				kind: 'literal',
				valueType: 'number',
				label: 'Largura (mm)',
				default: 150,
				min: 1,
				max: 2000,
			},
			{
				name: 'dpi',
				kind: 'literal',
				valueType: 'int',
				label: 'DPI',
				options: [203, 254, 300, 600],
				default: 254,
			},
			{
				name: 'noDither',
				kind: 'literal',
				valueType: 'bool',
				label: 'Sem dithering',
				default: false,
			},
			{
				name: 'cleanBackground',
				kind: 'literal',
				valueType: 'bool',
				label: 'Limpar fundo',
				default: false,
			},
		],
		outputs: [
			{ name: 'png', type: 'buffer', label: 'PNG' },
			{ name: 'pngBase64', type: 'string', label: 'PNG inline' },
			{ name: 'width_mm', type: 'number', label: 'largura mm' },
			{ name: 'height_mm', type: 'number', label: 'altura mm' },
			{ name: 'dpi', type: 'number', label: 'dpi' },
			{ name: 'px_w', type: 'number', label: 'px largura' },
			{ name: 'px_h', type: 'number', label: 'px altura' },
		],
	},
	{
		id: 'image.vectorize',
		label: 'Vetorizar',
		sub: 'imagem → traço (SVG)',
		icon: 'pen',
		accent: 'emerald',
		category: 'image',
		params: [
			{
				name: 'image',
				kind: 'ref',
				refType: 'buffer',
				label: 'Imagem',
				required: true,
			},
			{
				name: 'threshold',
				kind: 'literal',
				valueType: 'int',
				label: 'Limiar (P/B)',
				default: 128,
				min: 0,
				max: 255,
				step: 1,
			},
			{
				name: 'invert',
				kind: 'literal',
				valueType: 'bool',
				label: 'Inverter',
				default: false,
			},
			{
				name: 'drawingStyle',
				kind: 'literal',
				valueType: 'enum',
				label: 'Estilo',
				options: ['fill', 'stroke', 'outline'],
				default: 'fill',
			},
			{
				name: 'color',
				kind: 'literal',
				valueType: 'string',
				label: 'Cor',
				default: '#000000',
			},
			{
				name: 'mode',
				kind: 'literal',
				valueType: 'enum',
				label: 'Modo',
				options: ['trace', 'posterize'],
				default: 'trace',
			},
			{
				name: 'posterizeLevels',
				kind: 'literal',
				valueType: 'int',
				label: 'Níveis (posterize)',
				default: 4,
				min: 2,
				max: 10,
			},
		],
		outputs: [{ name: 'svg', type: 'string', label: 'SVG' }],
	},
	{
		id: 'ai.generate_image',
		label: 'Gerar imagem (IA)',
		sub: 'prompt → imagem por IA',
		icon: 'wand',
		accent: 'fuchsia',
		category: 'ai',
		params: [
			{
				name: 'prompt',
				kind: 'ref',
				refType: 'string',
				label: 'Prompt',
				hint: 'O texto que descreve a imagem a gerar.',
				required: true,
			},
			{
				name: 'image',
				kind: 'ref',
				refType: 'buffer',
				label: 'Referência (opcional)',
				hint: 'Imagem de base/referência pra guiar a geração.',
			},
		],
		outputs: [
			{ name: 'png', type: 'buffer', label: 'PNG' },
			{ name: 'pngBase64', type: 'string', label: 'PNG inline' },
		],
	},
	{
		id: 'output.upload_png',
		label: 'Entregar PNG',
		sub: 'salva e devolve o link',
		icon: 'box',
		accent: 'violet',
		category: 'output',
		params: [
			{
				name: 'from',
				kind: 'ref',
				refType: 'buffer',
				label: 'PNG',
				required: true,
			},
			{
				name: 'folder',
				kind: 'literal',
				valueType: 'string',
				label: 'Pasta',
				default: 'tool-output',
			},
		],
		outputs: [{ name: 'url', type: 'string', label: 'link' }],
	},
	{
		id: 'output.upload_svg',
		label: 'Entregar SVG',
		sub: 'salva e devolve o link',
		icon: 'box',
		accent: 'violet',
		category: 'output',
		params: [
			{
				name: 'from',
				kind: 'ref',
				refType: 'string',
				label: 'SVG',
				required: true,
			},
			{
				name: 'folder',
				kind: 'literal',
				valueType: 'string',
				label: 'Pasta',
				default: 'tool-output',
			},
		],
		outputs: [{ name: 'url', type: 'string', label: 'link' }],
	},
	{
		id: 'output.return_base64',
		label: 'Devolver imagem',
		sub: 'sem salvar no servidor',
		icon: 'image',
		accent: 'violet',
		category: 'output',
		params: [
			{
				name: 'from',
				kind: 'ref',
				refType: 'buffer',
				label: 'Conteúdo',
				required: true,
			},
			{
				name: 'mime',
				kind: 'literal',
				valueType: 'string',
				label: 'Tipo (MIME)',
				default: 'image/png',
			},
		],
		outputs: [{ name: 'dataUrl', type: 'string', label: 'data URL' }],
	},

	/* ── blocos genéricos (compor qualquer coisa) ── */
	{
		id: 'util.text_template',
		label: 'Texto / Template',
		sub: 'monta um texto com {{a}}..{{d}}',
		icon: 'pen',
		accent: 'cyan',
		category: 'util',
		params: [
			{
				name: 'template',
				kind: 'literal',
				valueType: 'string',
				widget: 'textarea',
				label: 'Template',
				hint: 'Use {{a}}, {{b}}, {{c}}, {{d}} pras entradas.',
				default: '',
			},
			{
				name: 'a',
				kind: 'literal',
				valueType: 'string',
				label: 'A',
				default: '',
			},
			{
				name: 'b',
				kind: 'literal',
				valueType: 'string',
				label: 'B',
				default: '',
			},
			{
				name: 'c',
				kind: 'literal',
				valueType: 'string',
				label: 'C',
				default: '',
			},
			{
				name: 'd',
				kind: 'literal',
				valueType: 'string',
				label: 'D',
				default: '',
			},
		],
		outputs: [{ name: 'text', type: 'string', label: 'texto' }],
	},
	{
		id: 'util.math',
		label: 'Cálculo',
		sub: 'a (operação) b',
		icon: 'cpu',
		accent: 'amber',
		category: 'util',
		params: [
			{
				name: 'a',
				kind: 'literal',
				valueType: 'number',
				label: 'A',
				default: 0,
			},
			{
				name: 'b',
				kind: 'literal',
				valueType: 'number',
				label: 'B',
				default: 0,
			},
			{
				name: 'op',
				kind: 'literal',
				valueType: 'enum',
				label: 'Operação',
				options: ['+', '-', '*', '/', '%'],
				default: '+',
			},
		],
		outputs: [{ name: 'value', type: 'number', label: 'resultado' }],
	},
	{
		id: 'util.condition',
		label: 'Condição',
		sub: 'escolhe por sim / não',
		icon: 'layers',
		accent: 'violet',
		category: 'util',
		params: [
			{
				name: 'test',
				kind: 'literal',
				valueType: 'bool',
				label: 'Condição',
				default: false,
			},
			{
				name: 'ifTrue',
				kind: 'literal',
				valueType: 'string',
				label: 'Se sim',
				default: '',
			},
			{
				name: 'ifFalse',
				kind: 'literal',
				valueType: 'string',
				label: 'Se não',
				default: '',
			},
		],
		outputs: [{ name: 'result', type: 'string', label: 'resultado' }],
	},
	{
		id: 'util.http_request',
		label: 'Requisição HTTP',
		sub: 'chama uma API externa',
		icon: 'zap',
		accent: 'sky',
		category: 'util',
		params: [
			{
				name: 'url',
				kind: 'literal',
				valueType: 'string',
				label: 'URL',
				hint: 'https://… (precisa de liberação de segurança)',
				default: '',
			},
			{
				name: 'method',
				kind: 'literal',
				valueType: 'enum',
				label: 'Método',
				options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
				default: 'GET',
			},
			{
				name: 'headers',
				kind: 'literal',
				valueType: 'string',
				widget: 'keyvalue',
				label: 'Headers',
				default: {},
			},
			{
				name: 'body',
				kind: 'literal',
				valueType: 'string',
				widget: 'textarea',
				label: 'Corpo',
				default: '',
			},
		],
		outputs: [
			{ name: 'status', type: 'number', label: 'status' },
			{ name: 'body', type: 'string', label: 'corpo' },
			{ name: 'json', type: 'string', label: 'json' },
		],
	},
	// Biblioteca ImagR (97 blocos de imagem/laser/IA) — gerada do registry do back.
	...IMAGR_BLOCKS,
];

export function blockSpec(id: string): BlockSpec | undefined {
	return BLOCK_CATALOG.find((b) => b.id === id);
}

export function blockParam(
	blockId: string,
	paramName: string,
): BlockParam | undefined {
	return blockSpec(blockId)?.params.find((p) => p.name === paramName);
}
