'use client';

import { ExternalLink, UploadCloud, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { getLesson, uploadLessonVideo } from '../services/lessons.service';
import type {
	CreateLessonPayload,
	Lesson,
	UpdateLessonPayload,
} from '../types/lessons';

interface Props {
	editing: Lesson | null;
	pending: boolean;
	onClose: () => void;
	onSubmit: (
		payload: CreateLessonPayload | UpdateLessonPayload,
	) => Promise<Lesson>;
	onVideoUploaded?: () => void;
}

export function LessonFormModal({
	editing,
	pending,
	onClose,
	onSubmit,
	onVideoUploaded,
}: Props) {
	const [title, setTitle] = useState(editing?.title ?? '');
	const [description, setDescription] = useState(editing?.description ?? '');
	const [bodyMd, setBodyMd] = useState(editing?.body_md ?? '');
	const [position, setPosition] = useState(
		editing?.position != null ? String(editing.position) : '',
	);
	const [isFree, setIsFree] = useState(editing?.is_free ?? false);

	const [videoFile, setVideoFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [playbackUrl, setPlaybackUrl] = useState<string | null>(
		editing?.video_playback_url ?? null,
	);
	const [currentVideoId, setCurrentVideoId] = useState<string | null>(
		editing?.video_id ?? null,
	);
	const videoInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!editing?.id) return;
		let cancelled = false;
		getLesson(editing.id)
			.then((fresh) => {
				if (cancelled) return;
				setPlaybackUrl(fresh.video_playback_url ?? null);
				setCurrentVideoId(fresh.video_id ?? null);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [editing?.id]);

	const busy = pending || uploading;
	const canSubmit = !busy && !!title.trim();

	async function handleSave() {
		try {
			const saved = await onSubmit({
				title: title.trim(),
				description: description?.trim() || undefined,
				body_md: bodyMd?.trim() || undefined,
				position: position ? Number(position) : undefined,
				is_free: isFree,
			});

			if (videoFile) {
				setUploading(true);
				setUploadProgress(0);
				try {
					const updated = await uploadLessonVideo(
						saved.id,
						videoFile,
						setUploadProgress,
					);
					setPlaybackUrl(updated.video_playback_url ?? null);
					setCurrentVideoId(updated.video_id ?? null);
					toast.success('Vídeo enviado!');
					onVideoUploaded?.();
				} catch (err) {
					console.error('[lesson video upload]', err);
					toast.error('Erro ao enviar o vídeo');
					return;
				} finally {
					setUploading(false);
					setUploadProgress(0);
				}
			}

			onClose();
		} catch {
			// erro já é exibido pela mutation
		}
	}

	return (
		<ModalOverlay onClose={onClose} tone="courses">
			<div className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{editing ? 'Editar lição' : 'Nova lição'}
				</h3>

				<Field label="Título">
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-gradient-to-br from-sky-50/60 via-white to-indigo-50/40 dark:from-sky-950/25 dark:via-white/[0.03] dark:to-indigo-950/20 text-slate-900 dark:text-white placeholder:text-slate-500 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-colors"
					/>
				</Field>

				<Field label="Descrição curta (opcional)">
					<input
						value={description ?? ''}
						onChange={(e) => setDescription(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-gradient-to-br from-sky-50/60 via-white to-indigo-50/40 dark:from-sky-950/25 dark:via-white/[0.03] dark:to-indigo-950/20 text-slate-900 dark:text-white placeholder:text-slate-500 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-colors"
					/>
				</Field>

				<Field label="Conteúdo (Markdown, opcional)">
					<textarea
						value={bodyMd ?? ''}
						onChange={(e) => setBodyMd(e.target.value)}
						rows={6}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-gradient-to-br from-sky-50/60 via-white to-indigo-50/40 dark:from-sky-950/25 dark:via-white/[0.03] dark:to-indigo-950/20 text-slate-900 dark:text-white placeholder:text-slate-500 px-3 py-2 text-sm font-mono focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-colors"
					/>
				</Field>

				<Field label="Vídeo da aula (opcional)">
					{currentVideoId && !videoFile && (
						<div className="mb-2 space-y-2">
							<div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
								<Video className="w-3.5 h-3.5" />
								Vídeo já enviado. Selecione outro arquivo para substituir.
							</div>
							{playbackUrl && (
								<a
									href={playbackUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:underline"
								>
									<ExternalLink className="w-3 h-3" />
									Ver vídeo
								</a>
							)}
						</div>
					)}
					<input
						ref={videoInputRef}
						type="file"
						accept="video/*"
						className="hidden"
						onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
					/>
					{videoFile ? (
						<div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-sm">
							<Video className="w-4 h-4 text-violet-500 shrink-0" />
							<span className="flex-1 truncate">{videoFile.name}</span>
							<button
								type="button"
								disabled={busy}
								onClick={() => {
									setVideoFile(null);
									if (videoInputRef.current) videoInputRef.current.value = '';
								}}
								className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						</div>
					) : (
						<button
							type="button"
							disabled={busy}
							onClick={() => videoInputRef.current?.click()}
							className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-white/15 px-3 py-3 text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50"
						>
							<UploadCloud className="w-4 h-4" />
							Selecionar vídeo
						</button>
					)}
					{uploading && (
						<div className="mt-2 space-y-1">
							<div className="h-1.5 w-full rounded bg-slate-200 dark:bg-white/10 overflow-hidden">
								<div
									className="h-full bg-violet-500 transition-all"
									style={{ width: `${uploadProgress}%` }}
								/>
							</div>
							<div className="text-xs text-slate-500">
								Enviando vídeo... {uploadProgress}%
							</div>
						</div>
					)}
				</Field>

				<Field label="Posição (opcional)">
					<input
						type="number"
						min={1}
						value={position}
						onChange={(e) => setPosition(e.target.value)}
						className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-gradient-to-br from-sky-50/60 via-white to-indigo-50/40 dark:from-sky-950/25 dark:via-white/[0.03] dark:to-indigo-950/20 text-slate-900 dark:text-white placeholder:text-slate-500 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-colors"
					/>
				</Field>

				<label className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-200 cursor-pointer select-none">
					<input
						type="checkbox"
						checked={isFree}
						onChange={(e) => setIsFree(e.target.checked)}
						className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-sky-600 focus:ring-sky-500 accent-sky-500"
					/>
					Lição gratuita (acesso anônimo permitido)
				</label>

				<div className="flex gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						disabled={busy}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-60"
					>
						Cancelar
					</button>
					<button
						type="button"
						disabled={!canSubmit}
						onClick={handleSave}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white disabled:opacity-60"
					>
						{uploading
							? `Enviando ${uploadProgress}%`
							: pending
								? 'Salvando...'
								: 'Salvar'}
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: label wraps children implicitly
		<label className="block">
			<span className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">
				{label}
			</span>
			{children}
		</label>
	);
}
