'use client';

import type { PermissionModule } from '@/modules/access';

const ACTION_COLUMNS: { action: string; label: string }[] = [
	{ action: 'view', label: 'Ver' },
	{ action: 'edit', label: 'Editar' },
	{ action: 'delete', label: 'Excluir' },
	{ action: 'price', label: 'Preço' },
];

interface PermissionMatrixProps {
	catalog: PermissionModule[];
	value: string[];
	onChange: (keys: string[]) => void;
	disabled?: boolean;
}

/**
 * Grade módulo × ação (checkboxes). `value` é a lista de chaves concedidas
 * (`"<module>.<action>"`). Reutilizada para grants de cargo e para o conjunto
 * efetivo de um usuário (do qual o override é derivado por diff).
 */
export function PermissionMatrix({
	catalog,
	value,
	onChange,
	disabled = false,
}: PermissionMatrixProps) {
	const set = new Set(value);

	const toggle = (key: string) => {
		const next = new Set(set);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		onChange([...next]);
	};

	const toggleModuleRow = (mod: PermissionModule) => {
		const keys = mod.actions.map((a) => `${mod.module}.${a}`);
		const allOn = keys.every((k) => set.has(k));
		const next = new Set(set);
		for (const k of keys) {
			if (allOn) next.delete(k);
			else next.add(k);
		}
		onChange([...next]);
	};

	return (
		<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
			<table className="w-full text-sm">
				<thead>
					<tr className="bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400">
						<th className="px-3 py-2 text-left font-medium">Módulo</th>
						{ACTION_COLUMNS.map((c) => (
							<th
								key={c.action}
								className="px-3 py-2 font-medium w-16 text-center"
							>
								{c.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{catalog.map((mod) => (
						<tr
							key={mod.module}
							className="border-t border-slate-100 dark:border-white/5"
						>
							<td className="px-3 py-2">
								<button
									type="button"
									disabled={disabled}
									onClick={() => toggleModuleRow(mod)}
									className="text-left font-medium text-slate-800 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 disabled:cursor-not-allowed"
									title="Alternar todos deste módulo"
								>
									{mod.label}
								</button>
							</td>
							{ACTION_COLUMNS.map((c) => {
								const supported = mod.actions.includes(
									c.action as PermissionModule['actions'][number],
								);
								const key = `${mod.module}.${c.action}`;
								return (
									<td key={c.action} className="px-3 py-2 text-center">
										{supported ? (
											<input
												type="checkbox"
												checked={set.has(key)}
												disabled={disabled}
												onChange={() => toggle(key)}
												aria-label={key}
												className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500/40 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
											/>
										) : (
											<span className="text-slate-300 dark:text-gray-700">
												—
											</span>
										)}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
