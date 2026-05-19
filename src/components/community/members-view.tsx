'use client';

import { Eye, MessageSquare, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useCommunityMembers } from '@/hooks/use-community';

interface MembersViewProps {
	isAdmin?: boolean;
}

export function MembersView({ isAdmin: _isAdmin = false }: MembersViewProps) {
	const [memberSearch, setMemberSearch] = useState('');
	const [memberFilter, setMemberFilter] = useState('all');
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [selectedProfile, setSelectedProfile] = useState<{
		name: string;
		avatar: string;
		specialty: string;
		image?: string;
	} | null>(null);

	const { data: members = [] } = useCommunityMembers(
		memberSearch || undefined,
		memberFilter === 'all' ? undefined : memberFilter,
	);

	const handleViewProfile = (
		name: string,
		avatar: string,
		specialty: string,
		image?: string,
	) => {
		setSelectedProfile({ name, avatar, specialty, image });
		setShowProfileModal(true);
	};

	return (
		<>
			{/* Profile Modal */}
			{showProfileModal && selectedProfile && (
				<ModalOverlay onClose={() => setShowProfileModal(false)}>
					<div className="p-6">
						<div className="h-32 -m-6 mb-0 rounded-t-2xl bg-violet-600" />
						<div className="flex flex-col items-center -mt-16">
							<div className="w-28 h-28 rounded-full bg-violet-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-white dark:border-[#1a1a1d]">
								{selectedProfile.avatar}
							</div>
							<h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">
								{selectedProfile.name}
							</h3>
							<p className="text-violet-400 font-medium">
								{selectedProfile.specialty}
							</p>
						</div>
						<div className="flex justify-center gap-6 py-6 border-y border-slate-200 dark:border-white/10">
							<div className="text-center">
								<p className="text-2xl font-bold text-slate-900 dark:text-white">
									127
								</p>
								<p className="text-xs text-slate-600 dark:text-gray-500">
									Projetos
								</p>
							</div>
							<div className="w-px h-12 bg-slate-200 dark:bg-white/10" />
							<div className="text-center">
								<p className="text-2xl font-bold text-slate-900 dark:text-white">
									2.4k
								</p>
								<p className="text-xs text-slate-600 dark:text-gray-500">
									Seguidores
								</p>
							</div>
							<div className="w-px h-12 bg-slate-200 dark:bg-white/10" />
							<div className="text-center">
								<p className="text-2xl font-bold text-slate-900 dark:text-white">
									89
								</p>
								<p className="text-xs text-slate-600 dark:text-gray-500">
									Seguindo
								</p>
							</div>
						</div>
						<div className="flex gap-2 justify-center flex-wrap py-4">
							<span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-sm">
								Laser UV
							</span>
							<span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-sm">
								Fiber
							</span>
							<span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-sm">
								Personalizacao
							</span>
						</div>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setShowProfileModal(false)}
								className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-white/10 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
							>
								<MessageSquare className="h-4 w-4" /> Mensagem
							</button>
							<button
								type="button"
								className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-600 text-white font-medium rounded-full"
							>
								<Users className="h-4 w-4" /> Seguir
							</button>
						</div>
					</div>
				</ModalOverlay>
			)}

			{/* Main content */}
			<div className="relative w-full p-6 space-y-6">
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
					{members.length > 0 ? (
						members.map((member, index) => (
							<div
								key={`${member.name}-${member.specialty}-${index}`}
								className="bg-slate-100 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300"
							>
								<div className="flex flex-col items-center">
									<div className="w-24 h-24 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold text-white mb-4 overflow-hidden">
										{member.image ? (
											<img
												src={member.image}
												alt=""
												className="w-full h-full object-cover"
											/>
										) : (
											member.name[0]
										)}
									</div>
									<h3 className="font-bold text-lg text-slate-900 dark:text-white">
										{member.name}
									</h3>
									<p className="text-sm text-slate-600 dark:text-gray-400 mb-3 text-center">
										{member.specialty ?? 'Membro da comunidade'}
									</p>
									<div className="flex justify-center gap-2 mb-4 flex-wrap">
										{member.badges.map((badge) => (
											<span
												key={badge}
												className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-xs"
											>
												{badge}
											</span>
										))}
									</div>
								</div>
								<button
									type="button"
									onClick={() =>
										handleViewProfile(
											member.name,
											member.name[0],
											member.specialty ?? 'Membro da comunidade',
											member.image ?? undefined,
										)
									}
									className="w-full flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-600 text-white font-medium rounded-full"
								>
									<Eye className="h-4 w-4" /> Ver Perfil
								</button>
							</div>
						))
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
