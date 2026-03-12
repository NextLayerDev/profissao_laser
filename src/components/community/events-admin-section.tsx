'use client';

import {
	Calendar,
	Loader2,
	Mic,
	Pencil,
	Plus,
	Trash2,
	Video,
} from 'lucide-react';
import { useState } from 'react';
import {
	useCommunityEvents,
	useCreateEvent,
	useDeleteEvent,
	useUpdateEvent,
} from '@/hooks/use-community';
import type { Event } from '@/types/community';
import { formatEventDateShort } from '@/utils/formatDate';

const EVENT_TYPE_LABELS: Record<Event['type'], string> = {
	live: 'AO VIVO',
	workshop: 'WORKSHOP',
	qa: 'Q&A',
};

function getEventTypeIcon(type: Event['type']) {
	switch (type) {
		case 'live':
			return Mic;
		case 'workshop':
			return Video;
		case 'qa':
			return Video;
		default:
			return Calendar;
	}
}

function getEventTypeBadgeClass(type: Event['type']): string {
	switch (type) {
		case 'live':
			return 'bg-red-500/20 text-red-400';
		case 'workshop':
			return 'bg-blue-500/20 text-blue-400';
		case 'qa':
			return 'bg-amber-500/20 text-amber-400';
		default:
			return 'bg-violet-500/20 text-violet-400';
	}
}

interface EventFormData {
	title: string;
	description: string;
	date: string;
	time: string;
	type: Event['type'];
}

const emptyForm: EventFormData = {
	title: '',
	description: '',
	date: '',
	time: '',
	type: 'workshop',
};

export function EventsAdminSection() {
	const [showModal, setShowModal] = useState(false);
	const [editingEvent, setEditingEvent] = useState<Event | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<Event | null>(null);
	const [form, setForm] = useState<EventFormData>(emptyForm);

	const { data: events = [], isLoading } = useCommunityEvents();
	const createMutation = useCreateEvent();
	const updateMutation = useUpdateEvent();
	const deleteMutation = useDeleteEvent();

	const handleOpenCreate = () => {
		setEditingEvent(null);
		setForm(emptyForm);
		setShowModal(true);
	};

	const handleOpenEdit = (event: Event) => {
		setEditingEvent(event);
		let dateStr = '';
		if (/^\d{4}-\d{2}-\d{2}/.test(event.date)) {
			dateStr = event.date.slice(0, 10);
		} else {
			try {
				const d = new Date(event.date);
				if (!Number.isNaN(d.getTime())) {
					dateStr = d.toISOString().slice(0, 10);
				}
			} catch {
				// fallback
			}
		}
		setForm({
			title: event.title,
			description: event.description ?? '',
			date: dateStr,
			time: event.time ?? '',
			type: event.type,
		});
		setShowModal(true);
	};

	const handleCloseModal = () => {
		setShowModal(false);
		setEditingEvent(null);
		setForm(emptyForm);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.title.trim() || !form.date.trim()) return;

		const payload = {
			title: form.title.trim(),
			description: form.description.trim() || undefined,
			date: form.date,
			time: form.time.trim() || undefined,
			type: form.type,
		};

		if (editingEvent) {
			updateMutation.mutate(
				{ id: editingEvent.id, data: payload },
				{
					onSuccess: () => {
						handleCloseModal();
					},
				},
			);
		} else {
			createMutation.mutate(payload, {
				onSuccess: () => {
					handleCloseModal();
				},
			});
		}
	};

	const handleDelete = (event: Event) => {
		deleteMutation.mutate(event.id, {
			onSuccess: () => {
				setDeleteConfirm(null);
			},
		});
	};

	return (
		<div className="flex flex-col h-[calc(100vh-200px)] min-h-[400px]">
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-semibold text-slate-900 dark:text-white">
					Eventos e Lives
				</h3>
				<button
					type="button"
					onClick={handleOpenCreate}
					className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl"
				>
					<Plus className="h-4 w-4" />
					Novo Evento
				</button>
			</div>

			<div className="flex-1 overflow-y-auto bg-white dark:bg-[#1a1a1d] rounded-xl border border-slate-200 dark:border-gray-800">
				{isLoading ? (
					<div className="flex justify-center py-16">
						<Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
					</div>
				) : events.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-gray-400">
						<Calendar className="h-16 w-16 mb-4 opacity-50" />
						<p className="font-medium">Nenhum evento ainda</p>
						<p className="text-sm mt-1">
							Crie o primeiro evento ou live para a comunidade
						</p>
						<button
							type="button"
							onClick={handleOpenCreate}
							className="mt-4 flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl"
						>
							<Plus className="h-4 w-4" />
							Criar Evento
						</button>
					</div>
				) : (
					<div className="p-4 space-y-3">
						{events.map((event) => {
							const Icon = getEventTypeIcon(event.type);
							return (
								<div
									key={event.id}
									className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#252528] rounded-xl border border-slate-200 dark:border-gray-700"
								>
									<div className="flex items-center gap-4 min-w-0">
										<div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
											<Icon className="h-6 w-6 text-violet-500" />
										</div>
										<div className="min-w-0">
											<h4 className="font-semibold text-slate-900 dark:text-white truncate">
												{event.title}
											</h4>
											<div className="flex items-center gap-2 mt-1 flex-wrap">
												<span
													className={`text-xs px-2 py-0.5 rounded ${getEventTypeBadgeClass(event.type)}`}
												>
													{EVENT_TYPE_LABELS[event.type]}
												</span>
												<span className="text-xs text-slate-500 dark:text-gray-400">
													{formatEventDateShort(event.date)}
													{event.time ? ` • ${event.time}` : ''}
												</span>
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<button
											type="button"
											onClick={() => handleOpenEdit(event)}
											className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-[#1a1a1d] dark:text-gray-400 dark:hover:text-violet-400"
											title="Editar"
										>
											<Pencil className="h-4 w-4" />
										</button>
										<button
											type="button"
											onClick={() => setDeleteConfirm(event)}
											className="p-2 rounded-lg text-slate-500 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400"
											title="Remover"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Modal Criar/Editar */}
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
					<button
						type="button"
						aria-label="Fechar modal"
						className="absolute inset-0 cursor-default"
						onClick={handleCloseModal}
						onKeyDown={(e) => e.key === 'Escape' && handleCloseModal()}
					/>
					<form
						onSubmit={handleSubmit}
						className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
					>
						<div className="mx-auto w-14 h-14 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
							<Calendar className="h-7 w-7 text-violet-500" />
						</div>
						<h3 className="text-xl font-bold text-slate-900 dark:text-white text-center">
							{editingEvent ? 'Editar Evento' : 'Novo Evento'}
						</h3>
						<p className="text-slate-500 dark:text-gray-400 text-center mt-1 text-sm">
							{editingEvent
								? 'Atualize os dados do evento'
								: 'Crie um workshop, live ou Q&A'}
						</p>

						<div className="mt-6 space-y-4">
							<div>
								<label
									htmlFor="event-title"
									className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1"
								>
									Título *
								</label>
								<input
									id="event-title"
									type="text"
									required
									value={form.title}
									onChange={(e) =>
										setForm((f) => ({ ...f, title: e.target.value }))
									}
									placeholder="Ex: Live Personalização UV"
									className="w-full h-12 rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 px-4"
								/>
							</div>
							<div>
								<label
									htmlFor="event-description"
									className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1"
								>
									Descrição
								</label>
								<textarea
									id="event-description"
									value={form.description}
									onChange={(e) =>
										setForm((f) => ({ ...f, description: e.target.value }))
									}
									placeholder="Breve descrição do evento"
									rows={3}
									className="w-full rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 px-4 py-3 resize-none"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="event-date"
										className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1"
									>
										Data *
									</label>
									<input
										id="event-date"
										type="date"
										required
										value={form.date}
										onChange={(e) =>
											setForm((f) => ({ ...f, date: e.target.value }))
										}
										className="w-full h-12 rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 px-4"
									/>
								</div>
								<div>
									<label
										htmlFor="event-time"
										className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1"
									>
										Hora
									</label>
									<input
										id="event-time"
										type="time"
										value={form.time}
										onChange={(e) =>
											setForm((f) => ({ ...f, time: e.target.value }))
										}
										className="w-full h-12 rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 px-4"
									/>
								</div>
							</div>
							<div>
								<label
									htmlFor="event-type"
									className="text-sm font-medium text-slate-700 dark:text-gray-300 block mb-1"
								>
									Tipo
								</label>
								<select
									id="event-type"
									value={form.type}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											type: e.target.value as Event['type'],
										}))
									}
									className="w-full h-12 rounded-xl bg-slate-50 dark:bg-[#252528] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 px-4"
								>
									<option value="workshop">Workshop</option>
									<option value="live">Live</option>
									<option value="qa">Q&A</option>
								</select>
							</div>
						</div>

						<div className="mt-6 flex gap-3">
							<button
								type="button"
								onClick={handleCloseModal}
								className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#252528] font-medium"
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={
									!form.title.trim() ||
									!form.date.trim() ||
									createMutation.isPending ||
									updateMutation.isPending
								}
								className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2"
							>
								{(createMutation.isPending || updateMutation.isPending) && (
									<Loader2 className="h-4 w-4 animate-spin" />
								)}
								{editingEvent ? 'Guardar' : 'Criar'}
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Modal Confirmar Remoção */}
			{deleteConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm">
					<button
						type="button"
						aria-label="Fechar"
						className="absolute inset-0 cursor-default"
						onClick={() => setDeleteConfirm(null)}
					/>
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="delete-event-title"
						className="relative bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
					>
						<h3
							id="delete-event-title"
							className="text-lg font-bold text-slate-900 dark:text-white"
						>
							Remover evento?
						</h3>
						<p className="text-slate-600 dark:text-gray-400 mt-2 text-sm">
							&quot;{deleteConfirm.title}&quot; será removido permanentemente.
						</p>
						<div className="mt-6 flex gap-3">
							<button
								type="button"
								onClick={() => setDeleteConfirm(null)}
								className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#252528] font-medium"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={() => handleDelete(deleteConfirm)}
								disabled={deleteMutation.isPending}
								className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2"
							>
								{deleteMutation.isPending && (
									<Loader2 className="h-4 w-4 animate-spin" />
								)}
								Remover
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
