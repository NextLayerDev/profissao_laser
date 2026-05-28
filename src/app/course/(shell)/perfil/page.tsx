'use client';

import { Camera, Check, KeyRound, Loader2, Save, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import {
	useChangeMyPassword,
	useMyProfile,
	useUpdateMyProfile,
	useUploadMyAvatar,
} from '@/hooks/use-profile';

function initialsOf(name: string | null, email: string | null): string {
	const base = name || email || '?';
	return base
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}

export default function PerfilPage() {
	const { data: profile, isLoading } = useMyProfile();
	const updateProfile = useUpdateMyProfile();
	const uploadAvatar = useUploadMyAvatar();
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

	return (
		<div className="px-6 py-8 max-w-6xl">
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
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
					{/* Coluna esquerda — identidade / foto */}
					<div
						className={`${cardClass} lg:col-span-1 flex flex-col items-center text-center`}
					>
						<div className="relative">
							<div className="w-28 h-28 rounded-full overflow-hidden bg-violet-600 grid place-items-center text-white text-3xl font-bold border border-white/10">
								{profile?.avatar ? (
									<img
										src={profile.avatar}
										alt="Foto de perfil"
										className="w-full h-full object-cover"
									/>
								) : (
									initialsOf(profile?.name ?? null, profile?.email ?? null)
								)}
							</div>
							<button
								type="button"
								onClick={() => fileRef.current?.click()}
								disabled={uploadAvatar.isPending}
								title="Alterar foto"
								className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-violet-600 hover:bg-violet-500 text-white grid place-items-center border-2 border-white dark:border-[#1a1a1d] transition-colors disabled:opacity-60"
							>
								{uploadAvatar.isPending ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Camera className="w-4 h-4" />
								)}
							</button>
							<input
								ref={fileRef}
								type="file"
								accept="image/png,image/jpeg,image/webp,image/gif"
								className="hidden"
								onChange={handleAvatarSelected}
							/>
						</div>

						<p className="font-display text-lg font-bold text-slate-900 dark:text-white mt-4 break-words max-w-full">
							{profile?.name || 'Seu nome'}
						</p>
						{profile?.nickname && (
							<p className="text-sm text-violet-600 dark:text-violet-400">
								@{profile.nickname}
							</p>
						)}
						{profile?.email && (
							<p className="text-xs text-slate-500 dark:text-gray-400 mt-1 break-all">
								{profile.email}
							</p>
						)}
						<p className="text-[11px] text-slate-400 dark:text-gray-500 mt-4">
							Clique no ícone da câmera para trocar a foto.
							<br />
							JPG, PNG, WEBP ou GIF (máx. 5MB).
						</p>
					</div>

					{/* Coluna direita — formulário + senha */}
					<div className="lg:col-span-2 space-y-6">
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
				</div>
			)}
		</div>
	);
}
