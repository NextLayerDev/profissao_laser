import type {
	ToolControl,
	ToolDefinitionDoc,
	ToolInputSpec,
} from '../services/tool-definitions.service';

/**
 * DE `collections.<nome>.fields` PARA UM FORMULÁRIO — a parte pura.
 *
 * Espelha, do lado da tela, o que `src/lib/tool-collections.ts` faz na main API:
 * lê a MESMA declaração de campos e decide o que desenhar, o que é obrigatório e
 * o que nem existe (`showIf`). Nada aqui sabe o que é "perfil de custo" ou
 * "marca" — cadastrar um dataset novo continua sendo dado, não deploy.
 *
 * Fica separado do componente por dois motivos: é testável sem DOM e é o lugar
 * onde as regras do back estão espelhadas — quem mexer lá tem UM arquivo para
 * conferir aqui, em vez de caçar `if`s dentro do JSX.
 */

/* ─────────────────────────── a declaração ─────────────────────────── */

/** Os 8 tipos que `validateCollectionData` aceita. Fora disso é descartado. */
export type CollectionFieldType =
	| 'text'
	| 'textarea'
	| 'enum'
	| 'number'
	| 'int'
	| 'bool'
	| 'image'
	| 'url';

export interface CollectionFieldSpec {
	name: string;
	label?: string;
	type: CollectionFieldType;
	options?: (string | number)[];
	/**
	 * Rótulo humano de cada opção (`{ co2_100: 'CO2 100 W (1300×900)' }`). O
	 * valor gravado continua sendo o id — isto é só a tela. Ver `optionLabels`
	 * em `CollectionFieldSpec` na main API.
	 */
	optionLabels?: Record<string, string>;
	required?: boolean;
	/** Só exibição (mm, W, R$/h). O valor guardado é o número puro. */
	unit?: string;
	min?: number;
	max?: number;
	placeholder?: string;
	/** Linha de ajuda embaixo do campo. O back ignora — é enfeite de tela. */
	hint?: string;
	/** Seção do formulário. O back ignora; sem ele, tudo cai num bloco só. */
	group?: string;
	/**
	 * Aplicabilidade condicional: `{ operacao: 'corte' }` faz o campo só existir
	 * quando `data.operacao === 'corte'`. A validação do back já honra isto
	 * (`isFieldApplicable`) — a tela precisa honrar também, ou o aluno preenche
	 * um campo que vai ser jogado fora sem aviso.
	 */
	showIf?: Record<string, string | number | boolean | (string | number)[]>;
	facet?: boolean | 'range';
}

export interface CollectionSubmissions {
	who?: 'admin' | 'student';
	moderation?: 'none' | 'pending';
	ownerEditable?: boolean;
}

export interface CollectionConfig {
	label?: string;
	fields: CollectionFieldSpec[];
	submissions?: CollectionSubmissions;
	/**
	 * Visibilidade DECLARADA da coleção. Não é lida pelo back hoje (ver
	 * `visibilityOf`) — é a tela que precisa mandá-la no corpo do POST.
	 */
	visibility?: 'public' | 'owner' | 'staff';
	/** Rótulo do campo `title` (que é sempre obrigatório no registro). */
	titleLabel?: string;
	titlePlaceholder?: string;
}

const TIPOS: CollectionFieldType[] = [
	'text',
	'textarea',
	'enum',
	'number',
	'int',
	'bool',
	'image',
	'url',
];

/** Aceita só o que a declaração promete; o resto vira `text` (nunca quebra). */
function normalizeField(raw: unknown): CollectionFieldSpec | null {
	if (!raw || typeof raw !== 'object') return null;
	const f = raw as Record<string, unknown>;
	const name = typeof f.name === 'string' ? f.name : '';
	if (!name) return null;
	const type = TIPOS.includes(f.type as CollectionFieldType)
		? (f.type as CollectionFieldType)
		: 'text';
	return {
		name,
		type,
		label: typeof f.label === 'string' ? f.label : undefined,
		options: Array.isArray(f.options)
			? (f.options.filter(
					(o) => typeof o === 'string' || typeof o === 'number',
				) as (string | number)[])
			: undefined,
		optionLabels:
			f.optionLabels && typeof f.optionLabels === 'object'
				? (f.optionLabels as Record<string, string>)
				: undefined,
		required: f.required === true,
		unit: typeof f.unit === 'string' ? f.unit : undefined,
		min: typeof f.min === 'number' ? f.min : undefined,
		max: typeof f.max === 'number' ? f.max : undefined,
		placeholder: typeof f.placeholder === 'string' ? f.placeholder : undefined,
		hint: typeof f.hint === 'string' ? f.hint : undefined,
		group: typeof f.group === 'string' ? f.group : undefined,
		showIf:
			f.showIf && typeof f.showIf === 'object'
				? (f.showIf as CollectionFieldSpec['showIf'])
				: undefined,
	};
}

/**
 * Acha a coleção pedida na definition — inclusive a ponte com o `bank` legado,
 * exatamente como `resolveCollection` faz no back: `default` é o Banco do Admin,
 * cujos `fields` têm a mesma forma. Sem esta ponte, apontar um widget para
 * `collection:'default'` devolveria "coleção não declarada" numa tool que
 * funciona.
 */
export function resolveCollectionConfig(
	def: ToolDefinitionDoc | undefined,
	name: string,
): CollectionConfig | null {
	if (!def) return null;

	const declared = (def.collections as Record<string, unknown> | undefined)?.[
		name
	];
	if (declared && typeof declared === 'object') {
		const c = declared as Record<string, unknown>;
		const fields = Array.isArray(c.fields)
			? c.fields
					.map(normalizeField)
					.filter((f): f is CollectionFieldSpec => f !== null)
			: [];
		const vis = c.visibility;
		return {
			fields,
			label: typeof c.label === 'string' ? c.label : undefined,
			submissions:
				c.submissions && typeof c.submissions === 'object'
					? (c.submissions as CollectionSubmissions)
					: undefined,
			visibility:
				vis === 'public' || vis === 'owner' || vis === 'staff'
					? vis
					: undefined,
			titleLabel: typeof c.titleLabel === 'string' ? c.titleLabel : undefined,
			titlePlaceholder:
				typeof c.titlePlaceholder === 'string' ? c.titlePlaceholder : undefined,
		};
	}

	if (name === 'default' && def.bank?.enabled) {
		return {
			label: 'Banco',
			fields: (def.bank.fields ?? [])
				.map(normalizeField)
				.filter((f): f is CollectionFieldSpec => f !== null),
			submissions: { who: 'admin', moderation: 'none' },
		};
	}

	return null;
}

/* ─────────────────────────── aplicabilidade ─────────────────────────── */

/**
 * Cópia fiel de `isFieldApplicable` (main API). A comparação é por
 * REPRESENTAÇÃO TEXTUAL de propósito: o valor de um `select` chega como string
 * mesmo quando a opção declarada é número, e `1 !== '1'` esconderia o campo.
 */
export function isFieldApplicable(
	field: CollectionFieldSpec,
	data: Record<string, unknown>,
): boolean {
	if (!field.showIf) return true;
	return Object.entries(field.showIf).every(([key, expected]) => {
		const actual = data[key];
		if (Array.isArray(expected)) {
			return expected.some((e) => String(e) === String(actual));
		}
		return String(expected) === String(actual);
	});
}

/** Os campos que existem PARA ESTE registro, na ordem declarada. */
export function applicableFields(
	fields: CollectionFieldSpec[],
	data: Record<string, unknown>,
): CollectionFieldSpec[] {
	return fields.filter((f) => isFieldApplicable(f, data));
}

/** Agrupa preservando a ordem de aparição. Sem `group`, um bloco só (''). */
export function groupFields(
	fields: CollectionFieldSpec[],
): { group: string; fields: CollectionFieldSpec[] }[] {
	const out: { group: string; fields: CollectionFieldSpec[] }[] = [];
	for (const f of fields) {
		const g = f.group ?? '';
		const bucket = out.find((b) => b.group === g);
		if (bucket) bucket.fields.push(f);
		else out.push({ group: g, fields: [f] });
	}
	return out;
}

/* ─────────────────────────── campo → widget ─────────────────────────── */

/**
 * Rótulo com a unidade colada.
 *
 * Nenhum widget do registry desenha unidade (só o `dimension`, que converte
 * tudo para milímetro e por isso não serve para W, R$/h ou %). Colar a unidade
 * no rótulo é o jeito de "Preço do kWh" não virar um número sem grandeza — que
 * num perfil de custo é a diferença entre R$ 0,95 e 95 centavos.
 */
export function fieldLabel(field: CollectionFieldSpec): string {
	const base = field.label ?? field.name;
	const comUnidade = field.unit ? `${base} (${field.unit})` : base;
	return field.required ? `${comUnidade} *` : comUnidade;
}

/** Marcador de opção vazia num `select` opcional (ver `controlFor`). */
export const OPCAO_VAZIA = '';

/**
 * Traduz um campo declarado no control + spec que os widgets JÁ existentes
 * consomem. É o ponto que evita reescrever input: `WidgetField` desenha, e este
 * arquivo só diz qual widget e com quais parâmetros.
 *
 * `image` não aparece aqui porque não existe widget que suba arquivo e guarde
 * URL — o formulário trata esse tipo à parte.
 */
export function controlFor(field: CollectionFieldSpec): {
	control: ToolControl;
	spec: ToolInputSpec;
} {
	const bind = `input.${field.name}`;
	const label = fieldLabel(field);
	const base = { bind, label } as ToolControl;

	switch (field.type) {
		case 'textarea':
			return {
				control: {
					...base,
					widget: 'textarea',
					placeholder: field.placeholder,
					rows: 4,
					maxLength: 20_000,
				},
				spec: { type: 'string' },
			};

		case 'enum': {
			const opcoes = (field.options ?? []) as (string | number)[];
			/**
			 * TODO enum ganha uma opção VAZIA na frente, obrigatório inclusive.
			 *
			 * Sem ela o `select` desenha a primeira opção como se estivesse
			 * escolhida enquanto o valor guardado é vazio: a tela dizia "fibra" e o
			 * salvar respondia "'Tipo de laser' é obrigatório" — visto acontecendo,
			 * não imaginado. Um campo que MENTE sobre o próprio valor é pior do que
			 * um campo em branco.
			 *
			 * O rótulo da opção vazia é escrito aqui e NÃO sai de `field.placeholder`:
			 * em coleção de enum o `placeholder` costuma ser o valor sugerido
			 * ('fibra', 'markup'), e usá-lo como rótulo do vazio nomearia "não
			 * escolhi nada" de "fibra".
			 */
			return {
				control: {
					...base,
					widget: 'select',
					options: [OPCAO_VAZIA, ...opcoes],
					...(field.optionLabels ? { optionLabels: field.optionLabels } : {}),
					placeholder: field.required ? '— selecione —' : '— não definir —',
				},
				spec: { type: 'enum', options: opcoes },
			};
		}

		case 'number':
		case 'int':
			return {
				control: {
					...base,
					widget: 'number',
					min: field.min,
					max: field.max,
					// Decimal precisa de passo decimal: com o passo 1 implícito do
					// HTML, as setinhas de "Preço do kWh" pulariam de 0,95 para 1,95.
					// O formulário roda com `noValidate`, então digitar mais casas do
					// que o passo continua valendo — quem julga é `validarRegistro`.
					step: field.type === 'int' ? 1 : 0.01,
				},
				spec: {
					type: field.type === 'int' ? 'int' : 'number',
					min: field.min,
					max: field.max,
				},
			};

		case 'bool':
			return {
				control: { ...base, widget: 'toggle' },
				spec: { type: 'bool' },
			};

		case 'url':
			return {
				control: {
					...base,
					widget: 'text',
					placeholder: field.placeholder ?? 'https://…',
					maxLength: 2000,
				},
				spec: { type: 'string' },
			};

		default:
			return {
				control: {
					...base,
					widget: 'text',
					placeholder: field.placeholder,
					maxLength: 2000,
				},
				spec: { type: 'string' },
			};
	}
}

/* ─────────────────────────── validação ─────────────────────────── */

const URL_OK = /^https?:\/\/\S+$/i;

function vazio(v: unknown): boolean {
	return v === undefined || v === null || v === '';
}

/**
 * Confere o registro ANTES de mandar.
 *
 * O back valida de novo (ele é a autoridade), mas as mensagens dele para faixa
 * numérica saem do zod, em inglês ("Too small: expected number to be >=1"). O
 * aluno não pode ver isso. Aqui as três regras que produziriam essas mensagens
 * — obrigatório, mínimo/máximo e URL — são checadas em português; qualquer
 * outra coisa que escape continua chegando do servidor, que já responde em
 * português no resto.
 */
export function validarRegistro(
	fields: CollectionFieldSpec[],
	data: Record<string, unknown>,
	title: string,
	titleLabel = 'Nome',
): string[] {
	const issues: string[] = [];
	if (!title.trim()) issues.push(`"${titleLabel}" é obrigatório.`);

	for (const field of applicableFields(fields, data)) {
		const nome = field.label ?? field.name;
		const valor = data[field.name];

		if (vazio(valor)) {
			if (field.required) issues.push(`"${nome}" é obrigatório.`);
			continue;
		}

		if (field.type === 'number' || field.type === 'int') {
			const n = Number(valor);
			if (!Number.isFinite(n)) {
				issues.push(`"${nome}" precisa ser um número.`);
				continue;
			}
			if (field.type === 'int' && !Number.isInteger(n)) {
				issues.push(`"${nome}" precisa ser um número inteiro.`);
				continue;
			}
			if (typeof field.min === 'number' && n < field.min) {
				issues.push(`"${nome}" não pode ser menor que ${field.min}.`);
			}
			if (typeof field.max === 'number' && n > field.max) {
				issues.push(`"${nome}" não pode ser maior que ${field.max}.`);
			}
			continue;
		}

		if (field.type === 'url' || field.type === 'image') {
			if (!URL_OK.test(String(valor))) {
				issues.push(
					field.type === 'image'
						? `"${nome}": envie a imagem ou cole um endereço começando com https://`
						: `"${nome}": endereço inválido (comece com https://).`,
				);
			}
		}
	}

	return issues;
}

/**
 * O que vai em `data` no corpo da requisição: só campos APLICÁVEIS e não
 * vazios. Mandar `''` num campo numérico opcional faria o back tentar coagir
 * string vazia para número; mandar campo inaplicável seria descartado em
 * silêncio de qualquer jeito.
 */
export function payloadData(
	fields: CollectionFieldSpec[],
	data: Record<string, unknown>,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const field of applicableFields(fields, data)) {
		const v = data[field.name];
		if (vazio(v)) continue;
		out[field.name] = v;
	}
	return out;
}

/* ─────────────────────────── permissões ─────────────────────────── */

/** A coleção aceita registro criado pelo aluno? (`creationPolicy`, no back.) */
export function aceitaAluno(config: CollectionConfig | null): boolean {
	return config?.submissions?.who === 'student';
}

/** O autor pode editar o próprio registro depois? (`ownerEditable`, no back.) */
export function permiteEdicaoDoDono(config: CollectionConfig | null): boolean {
	return config?.submissions?.ownerEditable === true;
}

/**
 * A visibilidade que VAI NO CORPO DO POST — e é ela que impede o registro do
 * aluno nascer público.
 *
 * O BACK PASSA A IMPOR o que a coleção declara — `resolveVisibility(pedido,
 * isStaff, declarada)` fica com a opção MAIS FECHADA entre as duas, e um POST
 * de aluno sem o campo numa coleção `owner` nasce `owner`. Provado ao vivo:
 * pedindo `public` explicitamente, a linha também saiu `owner`.
 *
 * Então por que continuar mandando? Porque a imposição do back só existe para
 * coleção que DECLARA `visibility` — e nem todas declaram (`galeria` do Estúdio
 * é uma). Nessas, quem decide continua sendo quem escreve, e o padrão do back é
 * `public`. Mandar `'owner'` daqui é a diferença entre defesa em profundidade e
 * uma defesa só: errar para o lado privado esconde um registro de quem queria
 * compartilhar; errar para o outro entrega salário, margem e imposto do aluno.
 */
export function visibilityOf(
	config: CollectionConfig | null,
): 'public' | 'owner' | 'staff' {
	return config?.visibility ?? 'owner';
}

/* ─────────────────────────── erro do servidor ─────────────────────────── */

/** O servidor já responde em português; só o fallback é nosso. */
export function mensagemDoErro(e: unknown, padrao: string): string {
	const m = (e as { response?: { data?: { message?: unknown } } })?.response
		?.data?.message;
	return typeof m === 'string' && m.trim() ? m : padrao;
}
