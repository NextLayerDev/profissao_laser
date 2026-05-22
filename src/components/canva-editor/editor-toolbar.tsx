'use client';

import type { LucideIcon } from 'lucide-react';
import {
	Circle,
	MousePointer2,
	Pencil,
	Sparkles,
	Square,
	SquareDashedMousePointer,
	Triangle,
	Type,
} from 'lucide-react';

export type EditorTool =
	| 'select'
	| 'text'
	| 'rect'
	| 'circle'
	| 'triangle'
	| 'brush'
	| 'region'
	| 'ai';

interface ToolBtn {
	tool: EditorTool;
	label: string;
	icon: LucideIcon;
}

const TOOLS: ToolBtn[] = [
	{ tool: 'select', label: 'Selecionar', icon: MousePointer2 },
	{ tool: 'text', label: 'Texto', icon: Type },
	{ tool: 'rect', label: 'Retângulo', icon: Square },
	{ tool: 'circle', label: 'Círculo', icon: Circle },
	{ tool: 'triangle', label: 'Triângulo', icon: Triangle },
	{ tool: 'brush', label: 'Pincel', icon: Pencil },
	{ tool: 'region', label: 'Região (IA)', icon: SquareDashedMousePointer },
	{ tool: 'ai', label: 'IA global', icon: Sparkles },
];

interface EditorToolbarProps {
	active: EditorTool;
	onChange: (tool: EditorTool) => void;
}

export function EditorToolbar({ active, onChange }: EditorToolbarProps) {
	return (
		<div className="w-14 shrink-0 border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] flex flex-col items-center py-3 gap-1">
			{TOOLS.map(({ tool, label, icon: Icon }) => {
				const isAi = tool === 'ai' || tool === 'region';
				return (
					<button
						key={tool}
						type="button"
						title={label}
						onClick={() => onChange(tool)}
						className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
							active === tool
								? isAi
									? 'bg-linear-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/30'
									: 'bg-violet-600 text-white'
								: 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5'
						}`}
					>
						<Icon className="w-5 h-5" />
					</button>
				);
			})}
		</div>
	);
}
