'use client';

import {
	CheckCircle2,
	Download,
	Loader2,
	PenLine,
	Save,
	X,
	XCircle,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { CreditConfirmModal } from '@/components/credits/credit-confirm-modal';
import { FreeTierQuotaBanner } from '@/components/credits/free-tier-quota-banner';
import { useSaveVector, useVectorizeImage } from '@/hooks/use-vectors';
import type { VectorizeResult } from '@/services/vectorize';

interface AxiosLikeError {
	response?: { status?: number; data?: Record<string, unknown> };
}

interface FreeTierModalState {
	limit: number;
	used: number;
	period: 'daily' | 'weekly';
	resetsAt: string;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type FileStatus = 'pending' | 'uploading' | 'success' | 'error';

interface FileWithStatus {
	id: string;
	file: File;
	status: FileStatus;
	result?: VectorizeResult;
	error?: string;
}

function downloadSvg(svgContent: string, originalName: string) {
	const baseName = originalName.replace(/\.[^.]+$/, '') || 'vector';
	const fileName = `${baseName}.svg`;
	const blob = new Blob([svgContent], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	a.click();
	URL.revokeObjectURL(url);
}

function svgToDataUrl(svgContent: string): string {
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
}

export function VectorizationUpload({ onSuccess }: { onSuccess?: () => void }) {
	const [isDragging, setIsDragging] = useState(false);
	const [files, setFiles] = useState<FileWithStatus[]>([]);
	const [freeTierModal, setFreeTierModal] = useState<FreeTierModalState | null>(
		null,
	);
	const vectorizeMutation = useVectorizeImage();
	const saveMutation = useSaveVector();

	const validateFile = useCallback((file: File): string | null => {
		if (!ACCEPTED_TYPES.includes(file.type)) {
			return 'Formato não suportado. Use PNG, JPG ou WEBP.';
		}
		if (file.size > MAX_FILE_SIZE) {
			return 'Ficheiro demasiado grande (máx. 10MB).';
		}
		return null;
	}, []);

	const processFiles = useCallback(
		async (fileList: FileList | File[]) => {
			const toProcess = Array.from(fileList).filter((f) => {
				const err = validateFile(f);
				if (err) {
					setFiles((prev) => [
						...prev,
						{
							id: crypto.randomUUID(),
							file: f,
							status: 'error',
							error: err,
						},
					]);
					return false;
				}
				return true;
			});

			for (const file of toProcess) {
				const id = crypto.randomUUID();
				setFiles((prev) => [
					...prev.filter((f) => f.file !== file),
					{ id, file, status: 'uploading' },
				]);

				try {
					const result = await vectorizeMutation.mutateAsync({
						file,
						useCredits: true,
					});
					setFiles((prev) =>
						prev.map((f) =>
							f.id === id ? { ...f, status: 'success' as const, result } : f,
						),
					);
				} catch (err) {
					const ax = err as AxiosLikeError;
					const status = ax?.response?.status;
					const data = ax?.response?.data ?? {};
					if (status === 429 && data.code === 'FREE_TIER_LIMIT_REACHED') {
						setFreeTierModal({
							limit: (data.limit as number) ?? 5,
							used: (data.used as number) ?? 0,
							period:
								(data.period as 'daily' | 'weekly' | undefined) ?? 'daily',
							resetsAt: (data.resetsAt as string) ?? '',
						});
						setFiles((prev) =>
							prev.map((f) =>
								f.id === id
									? {
											...f,
											status: 'error' as const,
											error: 'Limite gratuito atingido',
										}
									: f,
							),
						);
					} else {
						setFiles((prev) =>
							prev.map((f) =>
								f.id === id
									? {
											...f,
											status: 'error' as const,
											error: 'Erro ao vetorizar',
										}
									: f,
							),
						);
					}
				}
			}
		},
		[vectorizeMutation, validateFile],
	);

	const handleSave = useCallback(
		async (id: string) => {
			const item = files.find((f) => f.id === id);
			if (!item?.result) return;
			try {
				await saveMutation.mutateAsync({
					svgContent: item.result.svgContent,
					originalName: item.result.originalName,
				});
				setFiles((prev) => prev.filter((f) => f.id !== id));
				onSuccess?.();
			} catch {
				// toast handled by mutation
			}
		},
		[files, saveMutation, onSuccess],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			if (e.dataTransfer.files.length) {
				processFiles(e.dataTransfer.files);
			}
		},
		[processFiles],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const selected = e.target.files;
			if (selected?.length) {
				processFiles(selected);
			}
			e.target.value = '';
		},
		[processFiles],
	);

	const removeFile = useCallback((id: string) => {
		setFiles((prev) => prev.filter((f) => f.id !== id));
	}, []);

	return (
		<div className="space-y-6">
			<FreeTierQuotaBanner feature="vectorize" unitLabel="vetorizações" />
			{freeTierModal && (
				<CreditConfirmModal
					variant="free-tier-exhausted"
					cost={1}
					balance={0}
					freeTier={freeTierModal}
					onConfirm={() => setFreeTierModal(null)}
					onClose={() => setFreeTierModal(null)}
				/>
			)}
			<section
				aria-label="Arraste imagens ou clique para selecionar"
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-12 transition-colors ${
					isDragging
						? 'border-violet-600 bg-violet-500/10 dark:bg-violet-500/20'
						: 'border-slate-200 dark:border-white/10 hover:border-violet-500/50 dark:hover:border-white/20'
				}`}
			>
				<input
					type="file"
					accept={ACCEPTED_TYPES.join(',')}
					onChange={handleFileSelect}
					className="absolute inset-0 cursor-pointer opacity-0"
					multiple
				/>
				<div className="rounded-xl bg-linear-to-br from-violet-600 to-fuchsia-600 p-4 text-white mb-4">
					<PenLine className="w-10 h-10" />
				</div>
				<p className="text-slate-600 dark:text-gray-400 text-center font-medium mb-1">
					Arraste imagens ou clique para selecionar
				</p>
				<p className="text-slate-500 dark:text-gray-500 text-sm">
					PNG, JPG, WEBP (máx. 10MB)
				</p>
			</section>

			{files.length > 0 && (
				<div className="space-y-3">
					<h3 className="font-semibold text-slate-900 dark:text-white">
						Resultados
					</h3>
					<div className="space-y-4">
						{files.map((item) => (
							<div
								key={item.id}
								className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-4"
							>
								<div className="flex gap-4">
									{item.status === 'success' && item.result && (
										<div className="w-20 h-20 shrink-0 rounded-lg bg-slate-100 dark:bg-[#1a1a1d] overflow-hidden flex items-center justify-center">
											<img
												src={svgToDataUrl(item.result.svgContent)}
												alt={item.result.originalName}
												className="max-w-full max-h-full object-contain"
											/>
										</div>
									)}
									<div className="flex-1 min-w-0">
										<p className="font-medium text-slate-900 dark:text-white truncate">
											{item.file.name}
										</p>
										{item.status === 'success' && item.result && (
											<span
												className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
													item.result.isColor
														? 'bg-violet-500/20 text-violet-600 dark:text-violet-400'
														: 'bg-slate-500/20 text-slate-600 dark:text-gray-400'
												}`}
											>
												{item.result.isColor ? 'Colorida' : 'P&B'}
											</span>
										)}
										{item.status === 'error' && (
											<p className="text-sm text-red-500 mt-0.5">
												{item.error}
											</p>
										)}
									</div>
									<div className="flex items-center gap-2 shrink-0">
										{item.status === 'uploading' && (
											<Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
										)}
										{item.status === 'success' && item.result && (
											<>
												<button
													type="button"
													onClick={() => {
														if (item.result) {
															downloadSvg(
																item.result.svgContent,
																item.result.originalName,
															);
														}
													}}
													className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-600 text-white text-sm font-medium transition-colors"
												>
													<Download className="w-4 h-4" />
													Descarregar
												</button>
												<button
													type="button"
													onClick={() => handleSave(item.id)}
													disabled={saveMutation.isPending}
													className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors disabled:opacity-50"
												>
													{saveMutation.isPending ? (
														<Loader2 className="w-4 h-4 animate-spin" />
													) : (
														<Save className="w-4 h-4" />
													)}
													Guardar
												</button>
											</>
										)}
										{item.status === 'success' && (
											<CheckCircle2 className="w-5 h-5 text-emerald-500" />
										)}
										{item.status === 'error' && (
											<XCircle className="w-5 h-5 text-red-500" />
										)}
										<button
											type="button"
											onClick={() => removeFile(item.id)}
											className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
											aria-label="Remover"
										>
											<X className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
