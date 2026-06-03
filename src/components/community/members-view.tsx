'use client';

import { Crown, Eye, Search, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { MemberCardsSkeleton } from '@/components/ui/skeletons/community-grid-skeleton';
import { useCommunityMembers } from '@/hooks/use-community';
import type { Member } from '@/types/community';

interface MembersViewProps {
	isAdmin?: boolean;
}

/** "visto há…" amigável a partir do lastSeenAt (best-effort, sem libs). */
function lastSeenLabel(lastSeenAt?: string | null): string {
	if (!lastSeenAt) return 'Offline';
	const then = new Date(lastSeenAt).getTime();
	if (Number.isNaN(then)) return 'Offline';
	const diffMs = Date.now() - then;
	if (diffMs < 0) return 'Offline';
	const min = Math.floor(diffMs / 60000);
	if (min < 1) return 'Visto agora há pouco';
	if (min < 60) return `Visto há ${min} min`;
	const hours = Math.floor(min / 60);
	if (hours < 24) return `Visto há ${hours} h`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `Visto há ${days} d`;
	return 'Visto há um tempo';
}

/** featured → online → ordem alfabética por nome. */
function sortMembers(members: Member[]): Member[] {
	return [...members].sort((a, b) => {
		const featDiff = Number(!!b.featured) - Number(!!a.featured);
		if (featDiff !== 0) return featDiff;
		const onlineDiff = Number(!!b.isOnline) - Number(!!a.isOnline);
		if (onlineDiff !== 0) return onlineDiff;
		return (a.name || '').localeCompare(b.name || '', 'pt-BR', {
			sensitivity: 'base',
		});
	});
}

export function MembersView({ isAdmin: _isAdmin = false }: MembersViewProps) {
	const [memberSearch, setMemberSearch] = useState('');
	const [memberFilter, setMemberFilter] = useState('all');
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [selectedProfile, setSelectedProfile] = useState<Member | null>(null);

	const { data: members = [], isLoading } = useCommunityMembers(
		memberSearch || undefined,
		memberFilter === 'all' ? undefined : memberFilter,
	);

	const sorted = useMemo(() => sortMembers(members), [members]);
	const onlineCount = useMemo(
		() => members.filter((m) => m.isOnline).length,
		[members],
	);

	const handleViewProfile = (member: Member) => {
		setSelectedProfile(member);
		setShowProfileModal(true);
	};

	return (
		<>
			{/* Profile Modal — dados reais do membro, sem números fabricados. */}
			{showProfileModal && selectedProfile && (
				<ModalOverlay onClose={() => setShowProfileModal(false)} tone="plans">
					<div className="relative">
						<button
							type="button"
							onClick={() => setShowProfileModal(false)}
							aria-label="Fechar"
							className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
						>
							<X className="h-4 w-4" />
						</button>

						{/* Banner */}
						<div
							className={`h-28 ${
								selectedProfile.featured
									? 'bg-gradient-to-r from-amber-500 via-orange-500 to-violet-600'
									: 'bg-gradient-to-r from-violet-600 to-fuchsia-600'
							}`}
						/>

						<div className="px-6 pb-6">
							{/* Avatar retangular sobreposto + dot de online */}
							<div className="flex flex-col items-center -mt-16">
								<div className="relative">
									<Avatar
										src={selectedProfile.image}
										name={selectedProfile.name}
										rounded="rounded-2xl"
										className="w-28 h-28 text-3xl shadow-[0_0_30px_-2px_rgba(167,139,250,0.6)]"
									/>
									{selectedProfile.isOnline && (
										<span className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#1a1a1d]" />
									)}
								</div>

								<h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-4 text-center">
									{selectedProfile.name}
								</h3>
								{selectedProfile.nickname ? (
									<span className="text-sm font-medium text-violet-500 dark:text-violet-400">
										@{selectedProfile.nickname}
									</span>
								) : null}
								<p className="text-slate-600 dark:text-gray-400 mt-1 text-center">
									{selectedProfile.specialty ?? 'Membro da comunidade'}
								</p>

								{/* Destaque + presença */}
								<div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
									{selectedProfile.featured && (
										<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 text-xs font-medium">
											<Crown className="h-3.5 w-3.5" />
											{selectedProfile.featuredRole || 'Destaque'}
										</span>
									)}
									{selectedProfile.isOnline ? (
										<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
											<span className="w-2 h-2 rounded-full bg-emerald-500" />
											Online
										</span>
									) : (
										<span className="px-3 py-1 rounded-full bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-gray-400 text-xs font-medium">
											{lastSeenLabel(selectedProfile.lastSeenAt)}
										</span>
									)}
									{selectedProfile.category ? (
										<span className="px-3 py-1 rounded-full bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-gray-300 text-xs font-medium capitalize">
											{selectedProfile.category}
										</span>
									) : null}
								</div>
							</div>

							{/* Badges reais */}
							{selectedProfile.badges.length > 0 && (
								<div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-500 mb-3">
										Conquistas
									</p>
									<div className="flex gap-2 flex-wrap">
										{selectedProfile.badges.map((badge) => (
											<span
												key={badge}
												className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 text-sm font-medium"
											>
												{badge}
											</span>
										))}
									</div>
								</div>
							)}

							<button
								type="button"
								onClick={() => setShowProfileModal(false)}
								className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-full transition-colors"
							>
								Fechar
							</button>
						</div>
					</div>
				</ModalOverlay>
			)}

			{/* Main content */}
			<div className="relative w-full p-6 space-y-6">
				{/* Cabeçalho */}
				<div>
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
						Membros
					</h2>
					<p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
						<span className="font-semibold text-slate-900 dark:text-white">
							{members.length}
						</span>{' '}
						{members.length === 1 ? 'membro' : 'membros'}
						<span className="mx-1.5 text-slate-400 dark:text-gray-600">·</span>
						<span className="inline-flex items-center gap-1.5">
							<span className="w-2 h-2 rounded-full bg-emerald-500" />
							<span className="font-semibold text-emerald-600 dark:text-emerald-400">
								{onlineCount}
							</span>{' '}
							online
						</span>
					</p>
				</div>

				{/* Controles */}
				<div className="flex gap-4 flex-wrap">
					<div className="relative flex-1 min-w-[200px]">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
						<input
							type="text"
							placeholder="Buscar membro por nome ou especialidade..."
							value={memberSearch}
							onChange={(e) => setMemberSearch(e.target.value)}
							className="w-full pl-12 h-12 rounded-full bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
						/>
					</div>
					<select
						value={memberFilter}
						onChange={(e) => setMemberFilter(e.target.value)}
						className="h-12 px-4 rounded-full bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500/50"
					>
						<option value="all">Todos</option>
						<option value="fiber">Fiber</option>
						<option value="uv">UV</option>
						<option value="design">Design</option>
						<option value="brindes">Brindes</option>
						<option value="negocios">Negocios</option>
						<option value="tecnico">Tecnico</option>
					</select>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{isLoading && members.length === 0 ? (
						<MemberCardsSkeleton />
					) : sorted.length > 0 ? (
						sorted.map((member, index) => {
							const extraBadges = Math.max(0, member.badges.length - 3);
							return (
								<div
									key={`${member.id}-${index}`}
									className="group relative bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300"
								>
									{/* Banner */}
									<div
										className={`relative h-20 ${
											member.featured
												? 'bg-gradient-to-r from-amber-500 via-orange-500 to-violet-600'
												: 'bg-gradient-to-r from-violet-600 to-fuchsia-600'
										}`}
									>
										{member.featured && (
											<span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-sm text-white text-[11px] font-semibold">
												<Crown className="h-3 w-3" />
												{member.featuredRole || 'Destaque'}
											</span>
										)}
									</div>

									<div className="px-5 pb-5 flex flex-col items-center">
										{/* Avatar sobreposto + dot online */}
										<div className="relative -mt-10">
											<Avatar
												src={member.image}
												name={member.name}
												rounded="rounded-2xl"
												className="w-20 h-20 text-2xl shadow-[0_0_26px_-2px_rgba(167,139,250,0.6)]"
											/>
											{member.isOnline && (
												<span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-slate-100 dark:ring-[#1a1a1d]" />
											)}
										</div>

										<h3 className="font-bold text-lg text-slate-900 dark:text-white mt-3 text-center">
											{member.name}
										</h3>
										{member.nickname ? (
											<span className="text-xs font-medium text-violet-500 dark:text-violet-400">
												@{member.nickname}
											</span>
										) : null}

										{/* Especialidade ou cargo de destaque */}
										{member.featured && member.featuredRole ? (
											<span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
												<Crown className="h-3 w-3" />
												{member.featuredRole}
											</span>
										) : (
											<p className="text-sm text-slate-600 dark:text-gray-400 text-center mt-0.5">
												{member.specialty ?? 'Membro da comunidade'}
											</p>
										)}

										{/* Badges (até 3 + N) */}
										{member.badges.length > 0 && (
											<div className="flex justify-center gap-1.5 mt-3 flex-wrap">
												{member.badges.slice(0, 3).map((badge) => (
													<span
														key={badge}
														className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs"
													>
														{badge}
													</span>
												))}
												{extraBadges > 0 && (
													<span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 dark:text-violet-400 text-xs font-medium">
														+{extraBadges}
													</span>
												)}
											</div>
										)}

										{/* Linha de presença */}
										<div className="mt-3 text-xs">
											{member.isOnline ? (
												<span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
													<span className="w-2 h-2 rounded-full bg-emerald-500" />
													Online
												</span>
											) : (
												<span className="text-slate-500 dark:text-gray-500">
													{lastSeenLabel(member.lastSeenAt)}
												</span>
											)}
										</div>

										{/* Footer */}
										<button
											type="button"
											onClick={() => handleViewProfile(member)}
											className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-full transition-colors"
										>
											<Eye className="h-4 w-4" /> Ver Perfil
										</button>
									</div>
								</div>
							);
						})
					) : (
						<div className="col-span-full text-center py-12">
							<Users className="h-16 w-16 text-slate-500 dark:text-gray-500 mx-auto mb-4" />
							<p className="text-slate-600 dark:text-gray-400">
								Nenhum membro encontrado com esses filtros.
							</p>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
