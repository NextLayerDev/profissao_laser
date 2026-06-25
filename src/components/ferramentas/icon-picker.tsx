'use client';

import { icons, type LucideIcon, Search, Wrench } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { ac } from './forge-theme';

/**
 * Picker de ícone COMPLETO e pesquisável (substitui o grid fixo de ~14): busca
 * sobre o mapa inteiro `icons` do lucide (~1671). É seguro importar `{ icons }`
 * AQUI porque o builder é rota admin, code-split — nunca entra no bundle do
 * cliente. (A nav do cliente usa `resolveToolIcon`, que carrega o mapa LAZY.)
 *
 * `onChange` devolve o NOME PascalCase do lucide (ex.: 'Wand2', 'Rocket',
 * 'PawPrint'). O ícone selecionado fica destacado. Mantém o visual "forge".
 */

const ICON_ENTRIES = Object.entries(icons) as [string, LucideIcon][];

/** Quando a busca está vazia: ícones populares primeiro (curadoria). */
const CURATED: string[] = [
	'Wand2',
	'Sparkles',
	'Wrench',
	'Flame',
	'Rocket',
	'Zap',
	'Star',
	'Heart',
	'Image',
	'Camera',
	'PenTool',
	'Brush',
	'Palette',
	'Scissors',
	'Stamp',
	'Layers',
	'Box',
	'Package',
	'Cpu',
	'Bot',
	'Brain',
	'Lightbulb',
	'Gauge',
	'SlidersHorizontal',
	'Settings',
	'Aperture',
	'Sun',
	'Moon',
	'Cloud',
	'Droplet',
	'Leaf',
	'TreePine',
	'PawPrint',
	'Dog',
	'Cat',
	'Bird',
	'Fish',
	'Coffee',
	'Pizza',
	'Cake',
	'Gift',
	'ShoppingBag',
	'ShoppingCart',
	'Tag',
	'Truck',
	'Plane',
	'Car',
	'Bike',
	'Map',
	'MapPin',
	'Compass',
	'Globe',
	'Flag',
	'Trophy',
	'Medal',
	'Crown',
	'Gem',
	'Diamond',
	'Key',
	'Lock',
	'Shield',
	'Eye',
	'Search',
	'Filter',
	'Bell',
	'Calendar',
	'Clock',
	'Mail',
	'MessageCircle',
	'Phone',
	'Users',
	'User',
	'Smile',
	'Music',
	'Video',
	'Film',
	'Mic',
	'Headphones',
	'BookOpen',
	'GraduationCap',
	'PenLine',
	'FileText',
	'Folder',
	'Database',
	'Server',
	'Code',
	'Terminal',
	'Bug',
	'Wifi',
	'Battery',
	'Plug',
	'Hammer',
	'Anvil',
	'Cog',
	'Magnet',
	'FlaskConical',
	'Atom',
	'Dna',
	'Microscope',
	'Telescope',
	'Rocket',
	'Target',
	'Crosshair',
	'Activity',
	'TrendingUp',
	'BarChart3',
	'PieChart',
	'DollarSign',
	'CreditCard',
	'Wallet',
	'Coins',
	'Banknote',
	'Briefcase',
	'Building2',
	'Factory',
	'Store',
	'Home',
	'Tent',
	'Mountain',
	'Waves',
	'Flame',
];

const MAX_RESULTS = 120;

export function IconPicker({
	value,
	onChange,
	accent = 'emerald',
}: {
	value: string;
	onChange: (name: string) => void;
	accent?: string;
}) {
	const a = ac(accent);
	const [search, setSearch] = useState('');
	const deferred = useDeferredValue(search);

	const { list, total } = useMemo(() => {
		const q = deferred.trim().toLowerCase();
		if (!q) {
			const seen = new Set<string>();
			const curated: [string, LucideIcon][] = [];
			for (const name of CURATED) {
				if (seen.has(name)) continue;
				const Icon = icons[name as keyof typeof icons];
				if (Icon) {
					curated.push([name, Icon]);
					seen.add(name);
				}
			}
			return { list: curated, total: curated.length };
		}
		const matches = ICON_ENTRIES.filter(([name]) =>
			name.toLowerCase().includes(q),
		);
		return { list: matches.slice(0, MAX_RESULTS), total: matches.length };
	}, [deferred]);

	const overflow = total > list.length;

	return (
		<div className="space-y-3">
			<div className="relative">
				<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Buscar ícone (ex.: foguete, coração, raio…)"
					aria-label="Buscar ícone"
					className="h-10 w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 transition-[border-color,box-shadow] focus-visible:border-emerald-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30"
				/>
			</div>

			<div className="max-h-56 overflow-y-auto rounded-xl border border-white/[0.07] bg-black/20 p-2">
				{list.length === 0 ? (
					<div className="flex h-24 items-center justify-center text-center text-[13px] text-slate-500">
						Nenhum ícone encontrado para “{deferred.trim()}”.
					</div>
				) : (
					<div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
						{list.map(([name, Icon]) => {
							const on = value === name;
							return (
								<button
									key={name}
									type="button"
									title={name}
									aria-label={`Ícone ${name}`}
									aria-pressed={on}
									onClick={() => onChange(name)}
									className={`flex aspect-square items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
										on
											? `${a.selBorder} ${a.ico}`
											: 'border-white/10 bg-black/20 text-slate-400 hover:border-white/20 hover:text-slate-200'
									}`}
								>
									<Icon className="h-[18px] w-[18px]" />
								</button>
							);
						})}
					</div>
				)}
			</div>

			<div className="flex items-center justify-between text-[11px] text-slate-500">
				<span className="inline-flex items-center gap-1.5">
					{(() => {
						const Selected =
							(value && icons[value as keyof typeof icons]) || Wrench;
						return <Selected className="h-3.5 w-3.5 text-slate-300" />;
					})()}
					<span className="font-mono text-slate-400">{value || 'wrench'}</span>
				</span>
				{overflow ? (
					<span>
						mostrando {list.length} de {total} — refine a busca
					</span>
				) : (
					<span>{total} ícones</span>
				)}
			</div>
		</div>
	);
}
