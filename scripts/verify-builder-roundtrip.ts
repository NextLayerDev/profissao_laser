/**
 * Verifica o round-trip do builder: `docToState` → `buildDoc` NÃO pode
 * rebaixar nem apagar configuração de uma tool publicada.
 *
 * Existe por causa de um bug real: `buildDoc` emitia `ui.layout:'image-tool'`
 * hardcoded e o save faz `{...openDef.ui, ...built.ui}` — abrir uma tool-mãe
 * (`estudio_laser`) no builder e clicar Salvar a rebaixava para o grid de
 * 2 colunas.
 *
 *   npx tsx --tsconfig tsconfig.json scripts/verify-builder-roundtrip.ts
 */
import {
	buildDoc,
	docToState,
} from '../src/components/ferramentas/builder-model';

/** A definition publicada, como o builder a recebe. */
type Def = Parameters<typeof docToState>[0];
const asDef = (o: unknown) => o as Def;

let failures = 0;
const check = (name: string, ok: boolean, detail?: unknown) => {
	console.log(`  ${ok ? 'ok   ' : 'FALHA'} ${name}`);
	if (!ok) {
		failures++;
		if (detail !== undefined) console.log('        →', JSON.stringify(detail));
	}
};

/** Uma tool-mãe publicada, no formato real do estúdio. */
const estudio = asDef({
	id: 'def-1',
	tool_key: 'estudio_laser',
	title: 'Estúdio Laser',
	description: 'Tool-mãe',
	engine_runtime: 'blocks_v1',
	status: 'published',
	version: 3,
	definition: {
		schemaVersion: 1,
		input: {
			foto: { type: 'image', required: true },
			material: { type: 'enum', options: ['mdf', 'aco'], default: 'mdf' },
		},
		pipeline: [
			{
				id: 'prep',
				block: 'laser.photoengrave',
				params: { image: 'input.foto' },
			},
			{
				id: 'store',
				block: 'output.upload_png',
				params: { from: 'prep.png', folder: 'x' },
			},
		],
		output: { primary: 'store.url', preview: 'prep.pngBase64', savable: true },
		ui: {
			layout: 'studio',
			livePreview: true,
			icon: 'wand',
			presets: [{ label: 'Ardósia', values: { material: 'mdf' } }],
			controls: [
				{ bind: 'input.foto', widget: 'file-drop', label: 'Foto' },
				{
					bind: 'input.material',
					widget: 'select',
					label: 'Material',
					group: 'Material',
				},
			],
			action: { label: 'Gerar', showCostNotice: true },
			result: { kind: 'vector', downloadFrom: 'output.dxf', showMeta: true },
		},
		billing: { vox_cost: 2, free_quota: {} },
	},
});

console.log('Round-trip de uma tool-mãe publicada (estudio_laser):');
const state = docToState(estudio);
const rebuilt = buildDoc(state) as {
	ui: Record<string, unknown>;
	input: Record<string, { type: string }>;
};
const ui = rebuilt.ui;

check(
	"preserva ui.layout='studio' (o bug B2)",
	ui.layout === 'studio',
	ui.layout,
);
check('preserva ui.livePreview', ui.livePreview === true, ui.livePreview);
check(
	'preserva ui.presets',
	Array.isArray(ui.presets) && (ui.presets as unknown[]).length === 1,
	ui.presets,
);
check(
	'preserva ui.result (kind vector, não volta pra image)',
	(ui.result as { kind?: string })?.kind === 'vector',
	ui.result,
);
check(
	'emite control.group (B3)',
	(ui.controls as { group?: string }[])?.some((c) => c.group === 'Material'),
	ui.controls,
);

console.log('\nIdempotência (salvar duas vezes não muda mais nada):');
const twice = buildDoc(
	docToState(asDef({ ...estudio, definition: rebuilt })),
) as {
	ui: Record<string, unknown>;
};
check(
	'buildDoc(docToState(x)) === buildDoc(docToState(buildDoc(docToState(x))))',
	JSON.stringify(twice.ui) === JSON.stringify(ui),
	{ primeiro: ui, segundo: twice.ui },
);

console.log('\nTool comum (sem layout) continua caindo em image-tool:');
const simples = asDef({
	...estudio,
	tool_key: 'simples',
	definition: { ...estudio.definition, ui: { icon: 'wrench', controls: [] } },
});
const simplesUi = (
	buildDoc(docToState(simples)) as { ui: Record<string, unknown> }
).ui;
check(
	"layout padrão continua 'image-tool'",
	simplesUi.layout === 'image-tool',
	simplesUi.layout,
);

console.log('\nInput type:"file" sobrevive ao round-trip:');
const comArquivo = asDef({
	...estudio,
	tool_key: 'orcamento',
	definition: {
		...estudio.definition,
		input: { arquivo: { type: 'file', required: true, accept: ['dxf'] } },
		ui: {
			layout: 'studio',
			controls: [
				{
					bind: 'input.arquivo',
					widget: 'file',
					label: 'DXF',
					accept: ['dxf'],
				},
			],
		},
	},
});
const rebuiltFile = buildDoc(docToState(comArquivo)) as {
	input: Record<string, { type: string; accept?: string[] }>;
	ui: { controls: { widget: string; accept?: string[] }[] };
};
check(
	"input.type continua 'file'",
	rebuiltFile.input.arquivo?.type === 'file',
	rebuiltFile.input,
);
check(
	"widget continua 'file'",
	rebuiltFile.ui.controls?.[0]?.widget === 'file',
	rebuiltFile.ui.controls,
);

console.log(failures === 0 ? '\nTUDO OK' : `\n${failures} FALHA(S)`);
process.exit(failures === 0 ? 0 : 1);
