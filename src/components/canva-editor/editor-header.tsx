'use client';

import {
	ChevronLeft,
	Download,
	Loader2,
	Redo2,
	Save,
	Undo2,
} from 'lucide-react';
import Link from 'next/link';

interface EditorHeaderProps {
	name: string;
	onNameChange: (name: string) => void;
	hasUnsavedChanges: boolean;
	isSaving: boolean;
	onSave: () => void;
	onExport: () => void;
	onUndo: () => void;
	onRedo: () => void;
	canUndo: boolean;
	canRedo: boolean;
}

export function EditorHeader({
	name,
	onNameChange,
	hasUnsavedChanges,
	isSaving,
	onSave,
	onExport,
	onUndo,
	onRedo,
	canUndo,
	canRedo,
}: EditorHeaderProps) {
	return (
		<header className="h-14 shrink-0 px-4 flex items-center gap-3 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d]">
			<Link
				href="/course/canva"
				className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 dark:text-gray-400"
				aria-label="Voltar"
			>
				<ChevronLeft className="w-5 h-5" />
			</Link>

			<input
				type="text"
				value={name}
				onChange={(e) => onNameChange(e.target.value)}
				placeholder="Nome do design"
				className="flex-1 max-w-sm text-sm font-semibold text-slate-900 dark:text-white bg-transparent border-0 outline-none focus:bg-slate-50 dark:focus:bg-white/5 px-2 py-1 rounded"
			/>

			{hasUnsavedChanges && (
				<span className="text-xs text-amber-600 dark:text-amber-400">
					Alterações não salvas
				</span>
			)}

			<div className="ml-auto flex items-center gap-1">
				<button
					type="button"
					title="Desfazer"
					onClick={onUndo}
					disabled={!canUndo}
					className="p-2 rounded-lg text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
				>
					<Undo2 className="w-4 h-4" />
				</button>
				<button
					type="button"
					title="Refazer"
					onClick={onRedo}
					disabled={!canRedo}
					className="p-2 rounded-lg text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
				>
					<Redo2 className="w-4 h-4" />
				</button>
				<div className="mx-1 h-6 w-px bg-slate-200 dark:bg-white/10" />
				<button
					type="button"
					onClick={onExport}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
				>
					<Download className="w-4 h-4" />
					Exportar
				</button>
				<button
					type="button"
					onClick={onSave}
					disabled={isSaving}
					className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60"
				>
					{isSaving ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Save className="w-4 h-4" />
					)}
					Salvar
				</button>
			</div>
		</header>
	);
}
