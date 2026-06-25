'use client';

import {
	Download,
	ImageIcon,
	Loader2,
	Send,
	Upload,
	Wand2,
	X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	useAdvancedVectorize,
	useSendVectorSupportMessage,
} from '@/hooks/use-vector-support';
import type {
	VectorSupportFile,
	VectorSupportTicket,
} from '@/types/vector-support';

const IMG_RE = /\.(png|jpe?g|webp|gif)$/i;

function svgToDataUrl(svg: string) {
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function downloadSvg(svg: string, name: string) {
	const blob = new Blob([svg], { type: 'image/svg+xml' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Última imagem anexada pelo CLIENTE no chamado, p/ vetorizar direto. */
function lastCustomerImage(
	ticket: VectorSupportTicket,
): VectorSupportFile | null {
	const msgs = ticket.messages ?? [];
	for (let i = msgs.length - 1; i >= 0; i--) {
		const m = msgs[i];
		if (m.isTechnician) continue;
		const img = m.files.find(
			(f) => IMG_RE.test(f.fileUrl) || (f.fileType ?? '').startsWith('image/'),
		);
		if (img) return img;
	}
	return null;
}

export function AdvancedVectorizePanel({
	ticket,
	onClose,
}: {
	ticket: VectorSupportTicket;
	onClose: () => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [result, setResult] = useState<{ svgContent: string } | null>(null);
	const [loadingCustomerImg, setLoadingCustomerImg] = useState(false);

	const vectorize = useAdvancedVectorize();
	const send = useSendVectorSupportMessage();

	const previewUrl = useMemo(
		() => (file ? URL.createObjectURL(file) : null),
		[file],
	);
	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	const customerImg = useMemo(() => lastCustomerImage(ticket), [ticket]);

	async function loadCustomerImage() {
		if (!customerImg) return;
		setLoadingCustomerImg(true);
		try {
			const res = await fetch(customerImg.fileUrl);
			const blob = await res.blob();
			setFile(
				new File([blob], customerImg.fileName || 'imagem', {
					type: blob.type || 'image/png',
				}),
			);
			setResult(null);
		} catch {
			toast.error('Não consegui carregar a imagem do cliente. Faça upload.');
		} finally {
			setLoadingCustomerImg(false);
		}
	}

	async function run() {
		if (!file) return;
		try {
			const r = await vectorize.mutateAsync(file);
			setResult(r);
		} catch {
			toast.error('Falha ao vetorizar. Tente novamente.');
		}
	}

	async function sendToChat() {
		if (!result) return;
		const svgFile = new File([result.svgContent], 'vetor-avancado.svg', {
			type: 'image/svg+xml',
		});
		try {
			await send.mutateAsync({
				ticketId: ticket.id,
				content: 'Resultado da vetorização (modelo avançado):',
				files: [svgFile],
			});
			toast.success('Enviado no chat!');
			onClose();
		} catch {
			toast.error('Erro ao enviar no chat.');
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Fechar"
				onClick={onClose}
				className="fixed inset-0 cursor-default bg-black/60 backdrop-blur-sm"
			/>
			<div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#15151a]">
				{/* header */}
				<div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5 dark:border-white/10">
					<div className="flex items-center gap-3">
						<div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
							<Wand2 className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-base font-bold text-slate-900 dark:text-white">
								Vetorização avançada
							</h3>
							<span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
								Modelo mais poderoso · ainda em teste
							</span>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Fechar"
						className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="space-y-4 p-5">
					{!result ? (
						<>
							<input
								ref={inputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(e) => {
									setFile(e.target.files?.[0] ?? null);
									setResult(null);
									e.target.value = '';
								}}
							/>
							<button
								type="button"
								onClick={() => inputRef.current?.click()}
								className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-8 transition-colors hover:border-violet-400 dark:border-white/10"
							>
								<div className="rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 p-3 text-white">
									<Upload className="h-6 w-6" />
								</div>
								<span className="text-sm font-medium text-slate-600 dark:text-slate-300">
									Clique para enviar uma imagem
								</span>
							</button>

							{customerImg && (
								<button
									type="button"
									onClick={() => void loadCustomerImage()}
									disabled={loadingCustomerImg}
									className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-60 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300"
								>
									{loadingCustomerImg ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<ImageIcon className="h-4 w-4" />
									)}
									Usar imagem anexada pelo cliente
								</button>
							)}

							{file && (
								<div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-white/10">
									<div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/5">
										{previewUrl && (
											// preview local do arquivo escolhido
											<img
												src={previewUrl}
												alt={file.name}
												className="h-full w-full object-cover"
											/>
										)}
									</div>
									<span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
										{file.name}
									</span>
									<button
										type="button"
										onClick={() => setFile(null)}
										className="text-xs text-slate-400 hover:text-rose-500"
									>
										remover
									</button>
								</div>
							)}

							<button
								type="button"
								onClick={() => void run()}
								disabled={!file || vectorize.isPending}
								className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-60"
							>
								{vectorize.isPending ? (
									<>
										<Loader2 className="h-5 w-5 animate-spin" /> Vetorizando…
									</>
								) : (
									<>
										<Wand2 className="h-5 w-5" /> Vetorizar
									</>
								)}
							</button>
						</>
					) : (
						<div className="space-y-4">
							<div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-[#0e0e10]">
								<img
									src={svgToDataUrl(result.svgContent)}
									alt="Resultado da vetorização"
									className="mx-auto max-h-72 w-auto object-contain"
								/>
							</div>
							<div className="flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() =>
										downloadSvg(result.svgContent, 'vetor-avancado.svg')
									}
									className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
								>
									<Download className="h-4 w-4" /> Baixar SVG
								</button>
								<button
									type="button"
									onClick={() => void sendToChat()}
									disabled={send.isPending}
									className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300"
								>
									{send.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Send className="h-4 w-4" />
									)}
									Enviar no chat
								</button>
							</div>
							<button
								type="button"
								onClick={() => {
									setResult(null);
									setFile(null);
								}}
								className="w-full text-center text-xs text-slate-500 hover:text-violet-600"
							>
								Vetorizar outra imagem
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
