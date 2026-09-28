// "Comparar com a versão anterior" do builder de Formulários: campos novos,
// removidos e alterados entre duas versões. O campo é casado pela `key` (é
// ela que amarra respostas e métricas entre versões); mudar só a ordem não
// conta como alteração.
import type {
	FormBlock,
	FormDiffChange,
	FormDiffField,
	FormField,
	FormSchemaDiff,
} from './types';

type Located = { field: FormField; block: FormBlock };

function index(blocks: FormBlock[]): Map<string, Located> {
	const map = new Map<string, Located>();
	for (const block of blocks) {
		for (const field of block.fields) map.set(field.key, { field, block });
	}
	return map;
}

const same = (a: unknown, b: unknown) =>
	JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function fieldChanges(before: Located, after: Located): string[] {
	const a = before.field;
	const b = after.field;
	const out: string[] = [];
	if (a.label !== b.label) out.push('rótulo');
	if (a.type !== b.type) out.push('tipo');
	if (Boolean(a.required) !== Boolean(b.required)) out.push('obrigatório');
	if (!same(a.options, b.options)) out.push('opções');
	if (Boolean(a.allow_unknown) !== Boolean(b.allow_unknown)) {
		out.push('"a levantar"');
	}
	if ((a.metric_key ?? null) !== (b.metric_key ?? null)) out.push('métrica');
	if (before.block.key !== after.block.key) out.push('bloco');
	return out;
}

const describe = ({ field, block }: Located): FormDiffField => ({
	key: field.key,
	label: field.label,
	block: block.title,
});

export function diffFormSchemas(
	before: FormBlock[],
	after: FormBlock[],
): FormSchemaDiff {
	const a = index(before);
	const b = index(after);
	const added: FormDiffField[] = [];
	const removed: FormDiffField[] = [];
	const changed: FormDiffChange[] = [];
	for (const [key, loc] of b) {
		const prev = a.get(key);
		if (!prev) {
			added.push(describe(loc));
			continue;
		}
		const changes = fieldChanges(prev, loc);
		if (changes.length) changed.push({ ...describe(loc), changes });
	}
	for (const [key, loc] of a) {
		if (!b.has(key)) removed.push(describe(loc));
	}
	return { added, removed, changed };
}
