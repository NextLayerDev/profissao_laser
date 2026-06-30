'use client';

import { Check, ImageUp, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Dropzone "herói" do Estúdio: área grande accent-dashed quando vazia; ao subir
 * a foto, vira um card compacto com MINIATURA + nome/tamanho + trocar. Acento
 * via `--screen-accent` (color-mix). Reaproveita o padrão do `FileDropWidget` +
 * `ReferenceDrop`.
 */
export function StudioDropzone({
	label,
	file,
	onChange,
}: {
	label: string;
	file: File | null;
	onChange: (f: File) => void;
}) {
	const [dragging, setDragging] = useState(false);
	const [thumb, setThumb] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!file) {
			setThumb(null);
			return;
		}
		const url = URL.createObjectURL(file);
		setThumb(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	const pick = (f: File | undefined) => {
		if (f) onChange(f);
	};

	return (
		<div className="space-y-3">
			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					pick(e.dataTransfer.files[0]);
				}}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={(e) => {
					e.preventDefault();
					setDragging(false);
				}}
				style={
					dragging
						? {
								borderColor: 'var(--screen-accent)',
								backgroundColor:
									'color-mix(in srgb, var(--screen-accent) 10%, transparent)',
							}
						: undefined
				}
				className={`group relative flex w-full items-center gap-4 rounded-2xl border-2 border-dashed p-4 text-left transition-colors ${
					file
						? 'border-slate-200 dark:border-white/10'
						: 'border-slate-300 px-6 py-9 dark:border-white/15'
				} ${dragging ? '' : 'hover:border-slate-400 dark:hover:border-white/25'}`}
			>
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					onChange={(e) => {
						pick(e.target.files?.[0]);
						e.target.value = '';
					}}
					className="hidden"
				/>

				{file && thumb ? (
					<>
						{/* <img> intencional: miniatura de blob local */}
						<img
							src={thumb}
							alt="Miniatura"
							className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 object-cover dark:border-white/10"
						/>
						<div className="min-w-0 flex-1">
							<p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
								<Check className="h-4 w-4 shrink-0 text-emerald-500" />
								{file.name}
							</p>
							<p className="text-xs text-slate-500 dark:text-gray-400">
								{formatBytes(file.size)}
							</p>
						</div>
						<span className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors group-hover:text-slate-700 dark:border-white/10 dark:text-gray-400 dark:group-hover:text-slate-200">
							<RefreshCw className="h-3.5 w-3.5" />
							Trocar
						</span>
					</>
				) : (
					<div className="flex w-full flex-col items-center text-center">
						<span
							className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-white"
							style={{ backgroundColor: 'var(--screen-accent)' }}
						>
							<ImageUp className="h-6 w-6" />
						</span>
						<p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
							{label}
						</p>
						<p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">
							Arraste aqui ou clique para enviar
						</p>
					</div>
				)}
			</button>
		</div>
	);
}
