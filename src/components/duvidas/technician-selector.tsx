'use client';

import { Shuffle, User } from 'lucide-react';
import type { Technician } from '@/types/doubt-chat';

export interface TechnicianSelectorProps {
	technicians: Technician[];
	selectedId: string | null;
	onSelect: (technicianId: string | null) => void;
}

export function TechnicianSelector({
	technicians,
	selectedId,
	onSelect,
}: TechnicianSelectorProps) {
	return (
		<fieldset
			className="space-y-3 border-0 p-0 m-0"
			aria-labelledby="technician-heading"
		>
			<legend
				id="technician-heading"
				className="text-sm font-medium text-slate-700 dark:text-gray-300"
			>
				Escolha o técnico ou atribua aleatoriamente
			</legend>
			<div className="space-y-2">
				<button
					type="button"
					onClick={() => onSelect(null)}
					className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
						selectedId === null
							? 'border-violet-500 bg-violet-500/10 dark:bg-violet-500/20'
							: 'border-slate-200 dark:border-white/10 hover:border-violet-500/40'
					}`}
				>
					<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
						<Shuffle className="w-5 h-5 text-white" />
					</div>
					<div className="text-left">
						<p className="font-medium text-slate-900 dark:text-white">
							Atribuir aleatoriamente
						</p>
						<p className="text-xs text-slate-500 dark:text-slate-400">
							Será atribuído um técnico disponível
						</p>
					</div>
				</button>
				{technicians.map((tech) => (
					<button
						key={tech.id}
						type="button"
						onClick={() => onSelect(tech.id)}
						className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
							selectedId === tech.id
								? 'border-violet-500 bg-violet-500/10 dark:bg-violet-500/20'
								: 'border-slate-200 dark:border-white/10 hover:border-violet-500/40'
						}`}
					>
						<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
							<User className="w-5 h-5 text-white" />
						</div>
						<div className="text-left">
							<p className="font-medium text-slate-900 dark:text-white">
								{tech.name}
							</p>
							{tech.email && (
								<p className="text-xs text-slate-500 dark:text-slate-400">
									{tech.email}
								</p>
							)}
						</div>
					</button>
				))}
			</div>
		</fieldset>
	);
}
