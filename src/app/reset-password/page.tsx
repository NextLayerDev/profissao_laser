'use client';

import { Loader2, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { resetPassword } from '@/services/auth';

function ResetPasswordForm() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = searchParams.get('token') ?? '';

	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			toast.error('As senhas nao coincidem');
			return;
		}
		if (!token) {
			toast.error('Token invalido');
			return;
		}
		setLoading(true);
		try {
			const message = await resetPassword(token, newPassword);
			toast.success(message || 'Senha redefinida com sucesso!');
			router.push('/login');
		} catch {
			toast.error('Erro ao redefinir senha. O token pode ter expirado.');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="bg-[#1a1a1d] rounded-2xl border border-gray-800 p-8">
			<h1 className="text-2xl font-bold text-white mb-1">Nova senha</h1>
			<p className="text-gray-400 text-sm mb-6">
				Defina sua nova senha de acesso
			</p>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="newPassword"
						className="block text-sm text-gray-400 mb-1.5"
					>
						Nova senha
					</label>
					<input
						id="newPassword"
						type="password"
						required
						minLength={6}
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						placeholder="••••••••"
						className="w-full bg-[#0d0d0f] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
					/>
				</div>

				<div>
					<label
						htmlFor="confirmPassword"
						className="block text-sm text-gray-400 mb-1.5"
					>
						Confirmar senha
					</label>
					<input
						id="confirmPassword"
						type="password"
						required
						minLength={6}
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder="••••••••"
						className="w-full bg-[#0d0d0f] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 cursor-pointer mt-2"
				>
					{loading ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							Redefinindo...
						</>
					) : (
						'Redefinir senha'
					)}
				</button>
			</form>

			<p className="text-center text-sm text-gray-500 mt-5">
				<Link
					href="/login"
					className="text-violet-400 hover:text-violet-300 font-medium"
				>
					Voltar para o login
				</Link>
			</p>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				<div className="flex items-center justify-center gap-2 mb-8">
					<Store className="w-7 h-7 text-violet-400" />
					<span className="text-xl font-bold text-white">Profissao Laser</span>
				</div>

				<Suspense
					fallback={
						<div className="bg-[#1a1a1d] rounded-2xl border border-gray-800 p-8 flex items-center justify-center">
							<Loader2 className="w-6 h-6 animate-spin text-violet-400" />
						</div>
					}
				>
					<ResetPasswordForm />
				</Suspense>
			</div>
		</div>
	);
}
