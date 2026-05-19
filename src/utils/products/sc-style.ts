// Paleta de bordas por nome de system class (nome → [borda-normal, borda-hover, cor-badge])
const SC_NAMED: Record<string, [string, string, string]> = {
	prata: [
		'dark:border-slate-400/50',
		'dark:hover:border-slate-300',
		'dark:text-slate-300 border-slate-400/40 bg-slate-400/10',
	],
	ouro: [
		'dark:border-amber-400/50',
		'dark:hover:border-amber-300',
		'dark:text-amber-300 border-amber-400/40 bg-amber-400/10',
	],
	platina: [
		'dark:border-purple-400/50',
		'dark:hover:border-purple-300',
		'dark:text-purple-300 border-purple-400/40 bg-purple-400/10',
	],
	bronze: [
		'dark:border-orange-400/50',
		'dark:hover:border-orange-300',
		'dark:text-orange-300 border-orange-400/40 bg-orange-400/10',
	],
	diamante: [
		'dark:border-cyan-400/50',
		'dark:hover:border-cyan-300',
		'dark:text-cyan-300 border-cyan-400/40 bg-cyan-400/10',
	],
};

const SC_PALETTE: Array<[string, string, string]> = [
	[
		'dark:border-violet-400/50',
		'dark:hover:border-violet-300',
		'dark:text-violet-300 border-violet-400/40 bg-violet-400/10',
	],
	[
		'dark:border-emerald-400/50',
		'dark:hover:border-emerald-300',
		'dark:text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
	],
	[
		'dark:border-rose-400/50',
		'dark:hover:border-rose-300',
		'dark:text-rose-300 border-rose-400/40 bg-rose-400/10',
	],
	[
		'dark:border-teal-400/50',
		'dark:hover:border-teal-300',
		'dark:text-teal-300 border-teal-400/40 bg-teal-400/10',
	],
	[
		'dark:border-fuchsia-400/50',
		'dark:hover:border-fuchsia-300',
		'dark:text-fuchsia-300 border-fuchsia-400/40 bg-fuchsia-400/10',
	],
	[
		'dark:border-sky-400/50',
		'dark:hover:border-sky-300',
		'dark:text-sky-300 border-sky-400/40 bg-sky-400/10',
	],
];

export function resolveScStyle(name: string): [string, string, string] {
	const key = name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
	for (const [k, v] of Object.entries(SC_NAMED)) {
		if (key.includes(k)) return v;
	}
	let hash = 0;
	for (let i = 0; i < name.length; i++)
		hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
	return SC_PALETTE[hash % SC_PALETTE.length];
}
