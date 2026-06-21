'use client';

import { ArrowLeft, Calendar, Clock, Lock, Video } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useCommunityEvents } from '@/hooks/use-community';
import { useEntitlements } from '@/hooks/use-entitlements';
import { usePlans } from '@/modules/plans/hooks/use-plans';
import type { Event } from '@/types/community';
import {
	formatEventDateParts,
	formatEventDateShort,
	formatMonthYear,
	getEventDay,
	getEventMonthYear,
	parseEventDate,
} from '@/utils/formatDate';

function getEventTypeBadge(event: Event): { label: string; className: string } {
	switch (event.type) {
		case 'live':
			return { label: 'AO VIVO', className: 'bg-red-500/20 text-red-400' };
		case 'workshop':
			return { label: 'WORKSHOP', className: 'bg-blue-500/20 text-blue-400' };
		case 'qa':
			return { label: 'Q&A', className: 'bg-violet-500/20 text-violet-400' };
		default:
			return { label: 'EVENTO', className: 'bg-violet-500/20 text-violet-400' };
	}
}

interface EventsViewProps {
	isAdmin?: boolean;
}

export function EventsView({ isAdmin: _isAdmin = false }: EventsViewProps) {
	const [showCalendarModal, setShowCalendarModal] = useState(false);
	const [calendarView, setCalendarView] = useState(() => {
		const now = new Date();
		return { month: now.getMonth(), year: now.getFullYear() };
	});

	const { data: events = [] } = useCommunityEvents();
	const { entitlements, isTestUnlimited } = useEntitlements();
	const { data: plans = [] } = usePlans();
	const userPlanKey = entitlements?.subscription?.plan?.key ?? null;

	// Evento bloqueado p/ este usuário? allowedPlanKeys vazio = aberto a todos;
	// conta-teste-ilimitada sempre passa. Senão exige plano ativo na lista.
	const isLocked = (event: Event): boolean => {
		const keys = event.allowedPlanKeys ?? [];
		if (keys.length === 0 || isTestUnlimited) return false;
		return !userPlanKey || !keys.includes(userPlanKey);
	};
	const planLabels = (keys: string[]): string =>
		keys.map((k) => plans.find((p) => p.key === k)?.name ?? k).join(', ');

	return (
		<>
			{/* Calendar Modal */}
			{showCalendarModal && (
				<ModalOverlay onClose={() => setShowCalendarModal(false)}>
					<div className="p-6">
						<h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
							<Calendar className="h-6 w-6 text-violet-600" />
							Calendario de Eventos
						</h3>
						<p className="text-violet-400 mb-6">
							Workshops, lives e eventos sobre personalizacao a laser
						</p>
						<div className="p-6 bg-violet-500/10 rounded-2xl border border-slate-200 dark:border-white/10 mb-6">
							<div className="flex items-center justify-between mb-4">
								<h4 className="font-bold text-lg text-slate-900 dark:text-white">
									{formatMonthYear(calendarView.month, calendarView.year)}
								</h4>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() =>
											setCalendarView((prev) => {
												const d = new Date(prev.year, prev.month - 1, 1);
												return {
													month: d.getMonth(),
													year: d.getFullYear(),
												};
											})
										}
										className="p-2 text-violet-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
									>
										<ArrowLeft className="h-4 w-4" />
									</button>
									<button
										type="button"
										onClick={() =>
											setCalendarView((prev) => {
												const d = new Date(prev.year, prev.month + 1, 1);
												return {
													month: d.getMonth(),
													year: d.getFullYear(),
												};
											})
										}
										className="p-2 text-violet-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
									>
										<ArrowLeft className="h-4 w-4 rotate-180" />
									</button>
								</div>
							</div>
							<div className="grid grid-cols-7 gap-2 text-center mb-2">
								{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((d) => (
									<div
										key={d}
										className="text-xs font-medium text-violet-400 py-2"
									>
										{d}
									</div>
								))}
							</div>
							<div className="grid grid-cols-7 gap-2">
								{(() => {
									const firstDay = new Date(
										calendarView.year,
										calendarView.month,
										1,
									);
									const lastDay = new Date(
										calendarView.year,
										calendarView.month + 1,
										0,
									);
									const startOffset = firstDay.getDay();
									const daysInMonth = lastDay.getDate();
									const daysWithEvents = new Set(
										events
											.filter((e) => {
												const my = getEventMonthYear(e.date);
												return (
													my &&
													my.month === calendarView.month &&
													my.year === calendarView.year
												);
											})
											.map((e) => getEventDay(e.date))
											.filter((d): d is number => d != null),
									);
									const totalCells =
										Math.ceil((startOffset + daysInMonth) / 7) * 7;
									return Array.from({ length: totalCells }, (_, i) => {
										const dayNum = i - startOffset + 1;
										const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
										const displayDay = isCurrentMonth ? dayNum : '';
										const hasEvent =
											isCurrentMonth && daysWithEvents.has(dayNum);
										return (
											<button
												key={`${calendarView.year}-${calendarView.month}-${i}`}
												type="button"
												className={`aspect-square p-2 rounded-lg text-sm font-medium ${
													!isCurrentMonth
														? 'text-slate-500 dark:text-slate-600'
														: 'text-slate-900 dark:text-white'
												} ${hasEvent ? 'bg-violet-600 text-white' : 'hover:bg-white/10'}`}
											>
												{displayDay}
											</button>
										);
									});
								})()}
							</div>
						</div>
						<div className="space-y-3">
							<h4 className="font-bold text-slate-900 dark:text-white">
								Proximos Eventos
							</h4>
							{(() => {
								const monthEvents = events
									.filter((event) => {
										const my = getEventMonthYear(event.date);
										return (
											my &&
											my.month === calendarView.month &&
											my.year === calendarView.year
										);
									})
									.sort((a, b) => {
										const da = parseEventDate(a.date)?.getTime() ?? 0;
										const db = parseEventDate(b.date)?.getTime() ?? 0;
										return da - db;
									})
									.slice(0, 10);
								if (events.length === 0) {
									return (
										<p className="text-sm text-slate-500 dark:text-gray-400 py-4">
											Nenhum evento agendado
										</p>
									);
								}
								if (monthEvents.length === 0) {
									return (
										<p className="text-sm text-slate-500 dark:text-gray-400 py-4">
											Nenhum evento neste mes
										</p>
									);
								}
								return monthEvents.map((event) => {
									const { day, month } = formatEventDateParts(event.date);
									return (
										<div
											key={event.id}
											className="p-4 bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl hover:border-violet-500/40 transition-colors"
										>
											<div className="flex gap-3">
												<div className="w-14 h-14 rounded-xl bg-violet-600 flex flex-col items-center justify-center text-white shrink-0">
													<span className="text-xs">{month}</span>
													<span className="text-lg font-bold">{day}</span>
												</div>
												<div className="flex-1 min-w-0">
													<h5 className="font-semibold text-slate-900 dark:text-white text-sm">
														{event.title}
													</h5>
													<p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
														{event.description ?? ''}
													</p>
													<div className="flex items-center gap-2 text-xs text-violet-400 mt-2">
														<Clock className="h-3 w-3" />
														{event.time ?? formatEventDateShort(event.date)}
													</div>
												</div>
											</div>
										</div>
									);
								});
							})()}
						</div>
					</div>
				</ModalOverlay>
			)}

			{/* Main content */}
			<div className="relative w-full p-6 space-y-6">
				<div className="flex justify-between items-center">
					<div>
						<h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-3">
							<div className="p-2 rounded-xl bg-violet-600">
								<Calendar className="h-6 w-6 text-white" />
							</div>
							Agenda de Eventos
						</h2>
						<p className="text-slate-600 dark:text-gray-400 mt-1">
							Lives, workshops e treinamentos exclusivos
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowCalendarModal(true)}
						className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-600 text-white font-medium rounded-full"
					>
						<Calendar className="h-4 w-4" /> Ver Calendario
					</button>
				</div>

				<div className="space-y-6">
					{events.length === 0 ? (
						<div className="text-center py-16 bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl">
							<Calendar className="h-16 w-16 text-slate-400 dark:text-gray-500 mx-auto mb-4" />
							<p className="text-slate-600 dark:text-gray-400 font-medium">
								Nenhum evento agendado
							</p>
							<p className="text-sm text-slate-500 dark:text-gray-500 mt-1">
								Volte em breve para ver lives e workshops
							</p>
						</div>
					) : (
						events.map((event) => {
							const badge = getEventTypeBadge(event);
							const locked = isLocked(event);
							const lockNames = planLabels(event.allowedPlanKeys ?? []);
							return (
								<div
									key={event.id}
									className="bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden border-l-4 border-l-cyan-500 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300"
								>
									<div className="md:flex">
										<div className="md:w-64 p-8 bg-violet-500/10 flex flex-col items-center justify-center text-center">
											<span className="text-sm font-bold text-violet-400 uppercase">
												{formatEventDateShort(event.date)}
											</span>
											<span className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
												{event.time ?? '\u2014'}
											</span>
											<span
												className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}
											>
												{badge.label}
											</span>
											{locked && (
												<span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-medium">
													<Lock className="h-3 w-3" /> Bloqueado
												</span>
											)}
										</div>
										<div className="p-8 flex-1">
											<h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
												{event.title}
											</h3>
											<p className="text-slate-600 dark:text-gray-400 mb-4">
												{event.description ?? ''}
											</p>
											{locked ? (
												<div className="space-y-3">
													<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-sm font-medium">
														<Lock className="h-4 w-4" />
														{lockNames
															? `Exclusivo do plano ${lockNames}`
															: 'Exclusivo de planos superiores'}
													</div>
													<div>
														<Link
															href="/course/store"
															className="inline-flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-white font-medium rounded-full"
														>
															<Lock className="h-4 w-4" /> Seu plano não dá
															acesso — fazer upgrade
														</Link>
													</div>
												</div>
											) : (
												<Link
													href={`/course/eventos/${event.id}/sala-de-espera`}
													className="inline-flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-full"
												>
													<Video className="h-4 w-4" /> Entrar na Sala de Espera
												</Link>
											)}
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>
			</div>
		</>
	);
}
