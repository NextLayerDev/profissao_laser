'use client';

import {
	ArrowLeft,
	Clock,
	Headphones,
	Loader2,
	MessageSquarePlus,
	Paperclip,
	Plus,
	X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ModalPortal } from '@/components/ui/modal-portal';
import { VectorSupportChat } from '@/components/vetorizacao-admin/vector-support-chat';
import {
	useCreateVectorSupportTicket,
	useSendVectorSupportMessage,
	useVectorSupportTicket,
	useVectorSupportTickets,
} from '@/hooks/use-vector-support';

const DEFAULT_SUBJECT = 'Ajuda com vetorização';
const POLL_MS = 8000;

type PanelView = 'list' | 'new' | 'chat';

interface VectorSupportPanelProps {
	open: boolean;
	onClose: () => void;
	/** Imagens pré-anexadas (ex.: a original enviada a partir do resultado). */
	initialFiles?: File[];
}

function StatusBadge({ status }: { status: string }) {
	if (status === 'closed') {
		return (
			<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
				Fechado
			</span>
		);
	}
	return (
		<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
			Aberto
		</span>
	);
}

function formatDate(iso: string) {
	try {
		return new Date(iso).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return iso;
	}
}

export function VectorSupportPanel({
	open,
	onClose,
	initialFiles,
}: VectorSupportPanelProps) {
	const [view, setView] = useState<PanelView>('list');
	const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
	const [subject, setSubject] = useState(DEFAULT_SUBJECT);
	const [message, setMessage] = useState('');
	const [newFiles, setNewFiles] = useState<File[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const wasOpen = useRef(false);

	const { data: tickets = [], isLoading: ticketsLoading } =
		useVectorSupportTickets(undefined, open, open ? POLL_MS : undefined);
	const { data: selectedTicket, isLoading: ticketLoading } =
		useVectorSupportTicket(
			selectedTicketId,
			open && !!selectedTicketId,
			POLL_MS,
		);
	const createMutation = useCreateVectorSupportTicket();
	const sendMutation = useSendVectorSupportMessage();

	// Decide a view inicial só na transição "fechado → aberto" (não reseta a
	// navegação interna quando initialFiles muda de referência).
	useEffect(() => {
		if (open && !wasOpen.current) {
			if (initialFiles && initialFiles.length > 0) {
				setView('new');
				setNewFiles(initialFiles);
				setSubject(DEFAULT_SUBJECT);
				setMessage('');
				setSelectedTicketId(null);
			} else {
				setView('list');
			}
		}
		wasOpen.current = open;
	}, [open, initialFiles]);

	// ESC fecha + trava o scroll do body enquanto aberto.
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = prevOverflow;
		};
	}, [open, onClose]);

	function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files;
		if (files) {
			setNewFiles((prev) => [...prev, ...Array.from(files)]);
		}
		e.target.value = '';
	}

	function removeFile(index: number) {
		setNewFiles((prev) => prev.filter((_, i) => i !== index));
	}

	function openNewTicket() {
		setSubject(DEFAULT_SUBJECT);
		setMessage('');
		setNewFiles([]);
		setView('new');
	}

	function openTicket(id: string) {
		setSelectedTicketId(id);
		setView('chat');
	}

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		const subjectTrim = subject.trim() || DEFAULT_SUBJECT;
		const msgTrim = message.trim();
		if (!msgTrim && newFiles.length === 0) return;
		try {
			const ticket = await createMutation.mutateAsync({
				subject: subjectTrim,
				initialMessage:
					msgTrim || 'Olá! Preciso de ajuda com a vetorização desta imagem.',
				files: newFiles.length > 0 ? newFiles : undefined,
			});
			setNewFiles([]);
			setMessage('');
			setSubject(DEFAULT_SUBJECT);
			openTicket(ticket.id);
		} catch {
			toast.error('Erro ao abrir chamado. Tente novamente.');
		}
	}

	function handleSend(content: string, files?: File[]) {
		if (!selectedTicketId) return;
		sendMutation.mutate(
			{ ticketId: selectedTicketId, content, files },
			{ onError: () => toast.error('Erro ao enviar mensagem') },
		);
	}

	if (!open) return null;

	const headerTitle =
		view === 'list'
			? 'Suporte de Vetor'
			: view === 'new'
				? 'Novo chamado'
				: (selectedTicket?.subject ?? 'Chamado');

	return (
		<ModalPortal>
			<div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
				{/* Overlay */}
				<button
					type="button"
					aria-label="Fechar suporte de vetor"
					onClick={onClose}
					className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				/>

				{/* Painel */}
				<div
					role="dialog"
					aria-modal="true"
					aria-label="Suporte de Vetor"
					className="relative z-10 flex w-full sm:max-w-lg h-[88vh] sm:h-[600px] sm:max-h-[90vh] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] shadow-2xl shadow-black/40"
				>
					{/* Header */}
					<div className="shrink-0 flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5">
						{view === 'list' ? (
							<span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 text-white shrink-0">
								<Headphones className="w-5 h-5" />
							</span>
						) : (
							<button
								type="button"
								onClick={() => {
									setSelectedTicketId(null);
									setView('list');
								}}
								className="grid place-items-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors shrink-0"
								aria-label="Voltar"
							>
								<ArrowLeft className="w-5 h-5" />
							</button>
						)}
						<div className="min-w-0 flex-1">
							<p className="font-display text-sm font-bold text-slate-900 dark:text-white truncate">
								{headerTitle}
							</p>
							{view === 'chat' && selectedTicket && (
								<div className="flex items-center gap-2 mt-0.5">
									<StatusBadge status={selectedTicket.status} />
								</div>
							)}
							{view === 'list' && (
								<p className="text-xs text-slate-500 dark:text-gray-400">
									Fale com a equipe de vetorização
								</p>
							)}
						</div>
						<button
							type="button"
							onClick={onClose}
							className="grid place-items-center w-9 h-9 rounded-xl text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
							aria-label="Fechar"
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Body */}
					{view === 'list' && (
						<div className="flex-1 min-h-0 flex flex-col">
							<div className="shrink-0 p-4 pb-3">
								<button
									type="button"
									onClick={openNewTicket}
									className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
								>
									<Plus className="w-4 h-4" />
									Novo chamado
								</button>
							</div>
							<div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-2">
								{ticketsLoading ? (
									<div className="flex justify-center py-12">
										<Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
									</div>
								) : tickets.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-12 text-center px-6">
										<span className="grid place-items-center w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 mb-3">
											<MessageSquarePlus className="w-6 h-6" />
										</span>
										<p className="text-sm font-semibold text-slate-900 dark:text-white">
											Nenhum chamado ainda
										</p>
										<p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
											Abra um chamado e envie sua imagem para a equipe de
											vetorização te ajudar.
										</p>
									</div>
								) : (
									tickets.map((ticket) => (
										<button
											key={ticket.id}
											type="button"
											onClick={() => openTicket(ticket.id)}
											className="w-full text-left rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-violet-400/60 dark:hover:border-violet-500/40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors p-3.5"
										>
											<div className="flex items-center justify-between gap-2">
												<p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
													{ticket.subject}
												</p>
												<StatusBadge status={ticket.status} />
											</div>
											<span className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-400 dark:text-gray-500">
												<Clock className="w-3 h-3" />
												{formatDate(ticket.updatedAt || ticket.createdAt)}
											</span>
										</button>
									))
								)}
							</div>
						</div>
					)}

					{view === 'new' && (
						<form
							onSubmit={handleCreate}
							className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
						>
							<div>
								<label
									htmlFor="vs-subject"
									className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
								>
									Assunto
								</label>
								<input
									id="vs-subject"
									type="text"
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
									placeholder="Ex.: Ajuda com vetorização"
									className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
								/>
							</div>

							<div>
								<label
									htmlFor="vs-message"
									className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
								>
									Mensagem
								</label>
								<textarea
									id="vs-message"
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									placeholder="Descreva o que você precisa e anexe a imagem..."
									rows={4}
									className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none resize-none"
								/>
							</div>

							<div>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									multiple
									className="hidden"
									onChange={handleFilesSelected}
								/>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors"
								>
									<Paperclip className="w-4 h-4" />
									Anexar imagem
								</button>
								{newFiles.length > 0 && (
									<div className="flex flex-wrap gap-1.5 mt-2.5">
										{newFiles.map((file, i) => (
											<div
												key={`${file.name}-${i}`}
												className="flex items-center gap-1.5 px-2 py-1 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 rounded-lg"
											>
												<Paperclip className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
												<span className="text-xs text-violet-700 dark:text-violet-400 truncate max-w-[150px]">
													{file.name}
												</span>
												<button
													type="button"
													onClick={() => removeFile(i)}
													className="ml-0.5 text-violet-600 hover:text-violet-700 dark:hover:text-violet-200 shrink-0"
													aria-label={`Remover ${file.name}`}
												>
													<X className="w-3.5 h-3.5" />
												</button>
											</div>
										))}
									</div>
								)}
							</div>

							<button
								type="submit"
								disabled={
									createMutation.isPending ||
									(!message.trim() && newFiles.length === 0)
								}
								className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{createMutation.isPending ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										Abrindo...
									</>
								) : (
									'Abrir chamado'
								)}
							</button>
						</form>
					)}

					{view === 'chat' && (
						<div className="flex-1 min-h-0 flex flex-col p-4">
							{ticketLoading && !selectedTicket ? (
								<div className="flex-1 flex justify-center items-center">
									<Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
								</div>
							) : selectedTicket ? (
								<VectorSupportChat
									ticket={selectedTicket}
									onSendMessage={handleSend}
									isAdmin={false}
								/>
							) : (
								<div className="flex-1 flex justify-center items-center text-sm text-slate-500 dark:text-gray-400">
									Chamado não encontrado.
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</ModalPortal>
	);
}
