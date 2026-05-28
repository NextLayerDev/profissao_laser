'use client';

import {
	Camera,
	Check,
	KeyRound,
	Loader2,
	Save,
	Trash2,
	User,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import { PageHeader } from '@/components/ui/page-header';
import {
	useChangeMyPassword,
	useMyProfile,
	useRemoveMyAvatar,
	useUpdateMyProfile,
	useUploadMyAvatar,
} from '@/hooks/use-profile';

export default function PerfilPage() {
	const { data: profile, isLoading } = useMyProfile();
	const updateProfile = useUpdateMyProfile();
	const uploadAvatar = useUploadMyAvatar();
	const removeAvatar = useRemoveMyAvatar();
	const changePassword = useChangeMyPassword();
	const fileRef = useRef<HTMLInputElement>(null);

	const [name, setName] = useState('');
	const [nickname, setNickname] = useState('');
	const [bio, setBio] = useState('');

	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	useEffect(() => {
		if (profile) {
			setName(profile.name ?? '');
			setNickname(profile.nickname ?? '');
			setBio(profile.bio ?? '');
		}
	}, [profile]);

	function handleAvatarSelected(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		uploadAvatar.mutate(file, {
			onSuccess: () => toast.success('Foto atualizada!'),
			onError: () => toast.error('Erro ao enviar a foto. Tente novamente.'),
		});
	}

	function handleRemoveAvatar() {
		if (!profile?.avatar) return;
		removeAvatar.mutate(undefined, {
			onSuccess: () => toast.success('Foto removida.'),
			onError: () => toast.error('Erro ao remover a foto. Tente novamente.'),
		});
	}

	function handleSave(e: React.FormEvent) {
		e.preventDefault();
		if (name.trim().length < 2) {
			toast.error('O nome deve ter pelo menos 2 caracteres.');
			return;
		}
		updateProfile.mutate(
			{
				name: name.trim(),
				nickname: nickname.trim() || null,
				bio: bio.trim() || null,
			},
			{
				onSuccess: () => toast.success('Perfil atualizado!'),
				onError: () => toast.error('Erro ao salvar o perfil. Tente novamente.'),
			},
		);
	}

	function handleChangePassword(e: React.FormEvent) {
		e.preventDefault();
		if (newPassword.length < 6) {
			toast.error('A nova senha deve ter pelo menos 6 caracteres.');
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error('A confirmação não confere com a nova senha.');
			return;
		}
		changePassword.mutate(
			{ currentPassword, newPassword },
			{
				onSuccess: () => {
					toast.success('Senha alterada com sucesso!');
					setCurrentPassword('');
					setNewPassword('');
					setConfirmPassword('');
				},
				onError: (err) => {
					const msg =
						err instanceof Error &&
						'response' in err &&
						typeof (err as { response?: { data?: { message?: string } } })
							.response?.data?.message === 'string'
							? (err as { response: { data: { message: string } } }).response
									.data.message
							: 'Erro ao trocar a senha.';
					toast.error(msg);
				},
			},
		);
	}

	const inputClass =
		'w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-violet-500 transition-colors';
	const labelClass =
		'block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5';
	const cardClass =
		'bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-2xl p-6';

	const avatarBusy = uploadAvatar.isPending || removeAvatar.isPending;

	return (
		<div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
			<PageHeader
				title="Meu Perfil"
				subtitle="Gerencie sua foto, apelido e dados da conta."
				icon={User}
			/>

			{isLoading ? (
				<div className="flex justify-center py-20">
					<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
				</div>
			) : (
				<div className="space-y-6">
					{/* Hero / banner com avatar */}
					<div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d]">
						<div className="h-28 sm:h-36 bg-gradient-to-r from-violet-600 via-violet-500 to-fuchsia-500" />
						<div className="px-6 pb-6">
							<div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 sm:-mt-16">
								<div className="relative shrink-0">
									<Avatar
										src={profile?.avatar}
										name={profile?.name}
										email={profile?.email}
										className="w-28 h-28 text-4xl border-4 border-white dark:border-[#1a1a1d] shadow-lg"
									/>
									{avatarBusy && (
										<div className="absolute inset-0 rounded-full bg-black/40 grid place-items-center border-4 border-white dark:border-[#1a1a1d]">
											<Loader2 className="w-6 h-6 text-white animate-spin" />
										</div>
									)}
									<button
										type="button"
										onClick={() => fileRef.current?.click()}
										disabled={avatarBusy}
										title="Alterar foto"
										className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-violet-600 hover:bg-violet-500 text-white grid place-items-center border-2 border-white dark:border-[#1a1a1d] transition-colors disabled:opacity-60"
									>
										<Camera className="w-4 h-4" />
									</button>
									{profile?.avatar && (
										<button
											type="button"
											onClick={handleRemoveAvatar}
											disabled={avatarBusy}
											title="Remover foto"
											className="absolute top-1 right-1 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white grid place-items-center border-2 border-white dark:border-[#1a1a1d] transition-colors disabled:opacity-60"
										>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									)}
									<input
										ref={fileRef}
										type="file"
										accept="image/png,image/jpeg,image/webp,image/gif"
										className="hidden"
										onChange={handleAvatarSelected}
									/>
								</div>

								<div className="flex-1 min-w-0 sm:pb-2">
									<h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white break-words">
										{profile?.name || 'Seu nome'}
									</h2>
									<div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
										{profile?.nickname && (
											<span className="text-sm font-medium text-violet-600 dark:text-violet-400">
												@{profile.nickname}
											</span>
										)}
										{profile?.email && (
											<span className="text-xs text-slate-500 dark:text-gray-400 break-all">
												{profile.email}
											</span>
										)}
									</div>
									<p className="text-[11px] text-slate-400 dark:text-gray-500 mt-2">
										Câmera para enviar, lixeira para voltar ao padrão. JPG, PNG,
										WEBP ou GIF (máx. 5MB).
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Informações */}
					<form onSubmit={handleSave} className={cardClass}>
						<h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-4">
							Informações
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label htmlFor="pf-name" className={labelClass}>
									Nome
								</label>
								<input
									id="pf-name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Seu nome completo"
									className={inputClass}
								/>
							</div>
							<div>
								<label htmlFor="pf-nickname" className={labelClass}>
									Apelido
								</label>
								<input
									id="pf-nickname"
									type="text"
									value={nickname}
									onChange={(e) => setNickname(e.target.value)}
									maxLength={40}
									placeholder="Como quer ser chamado"
									className={inputClass}
								/>
							</div>
							<div className="sm:col-span-2">
								<label htmlFor="pf-email" className={labelClass}>
									Email
								</label>
								<input
									id="pf-email"
									type="email"
									value={profile?.email ?? ''}
									disabled
									className={`${inputClass} opacity-60 cursor-not-allowed`}
								/>
							</div>
							<div className="sm:col-span-2">
								<label htmlFor="pf-bio" className={labelClass}>
									Bio
								</label>
								<textarea
									id="pf-bio"
									value={bio}
									onChange={(e) => setBio(e.target.value)}
									maxLength={500}
									rows={4}
									placeholder="Fale um pouco sobre você..."
									className={`${inputClass} resize-none`}
								/>
								<p className="text-right text-xs text-slate-400 mt-1">
									{bio.length}/500
								</p>
							</div>
						</div>
						<div className="flex justify-end mt-5">
							<button
								type="submit"
								disabled={updateProfile.isPending}
								className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
							>
								{updateProfile.isPending ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Save className="w-4 h-4" />
								)}
								Salvar perfil
							</button>
						</div>
					</form>

					{/* Trocar senha */}
					<form onSubmit={handleChangePassword} className={cardClass}>
						<h3 className="flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white mb-1">
							<KeyRound className="w-4 h-4 text-violet-500" />
							Trocar senha
						</h3>
						<p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
							Informe a senha atual e a nova senha.
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div>
								<label htmlFor="pf-curpass" className={labelClass}>
									Senha atual
								</label>
								<input
									id="pf-curpass"
									type="password"
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									placeholder="••••••"
									className={inputClass}
								/>
							</div>
							<div>
								<label htmlFor="pf-newpass" className={labelClass}>
									Nova senha
								</label>
								<input
									id="pf-newpass"
									type="password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									minLength={6}
									placeholder="Mínimo 6 caracteres"
									className={inputClass}
								/>
							</div>
							<div>
								<label htmlFor="pf-confpass" className={labelClass}>
									Confirmar
								</label>
								<input
									id="pf-confpass"
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									minLength={6}
									placeholder="Repita a nova senha"
									className={inputClass}
								/>
							</div>
						</div>
						<div className="flex justify-end mt-5">
							<button
								type="submit"
								disabled={
									changePassword.isPending ||
									!currentPassword ||
									!newPassword ||
									!confirmPassword
								}
								className="inline-flex items-center gap-2 px-5 py-2.5 border border-violet-300 dark:border-violet-500/40 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 font-semibold rounded-xl transition-colors hover:bg-violet-100 dark:hover:bg-violet-500/20 disabled:opacity-60"
							>
								{changePassword.isPending ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Check className="w-4 h-4" />
								)}
								Alterar senha
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}
