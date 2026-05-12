'use client';

import { Loader2, Store } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { forgotPassword } from '@/services/auth';

export default function ForgotPassword() {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		try {
			await forgotPassword(email);
			setSent(true);
		} catch {
			toast.error('Erro ao enviar email de recuperacao');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				<div className="flex items-center justify-center gap-2 mb-8">
					<Store className="w-7 h-7 text-violet-400" />
					<span className="text-xl font-bold text-white">Profissao Laser</span>
				</div>

				<div className="bg-[#1a1a1d] rounded-2xl border border-gray-800 p-8">
					<h1 className="text-2xl font-bold text-white mb-1">
						Recuperar senha
					</h1>
					<p className="text-gray-400 text-sm mb-6">
						Informe seu email para receber o link de recuperacao
					</p>

					{sent ? (
						<div className="text-center space-y-4">
							<p className="text-sm text-emerald-400">
								Verifique seu email! Enviamos um link para redefinir sua senha.
							</p>
							<Link
								href="/login"
								className="inline-block text-sm text-violet-400 hover:text-violet-300 font-medium"
							>
								Voltar para o login
							</Link>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label
									htmlFor="email"
									className="block text-sm text-gray-400 mb-1.5"
								>
									Email
								</label>
								<input
									id="email"
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="seu@email.com"
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
										Enviando...
									</>
								) : (
									'Enviar link de recuperacao'
								)}
							</button>
						</form>
					)}

					<p className="text-center text-sm text-gray-500 mt-5">
						<Link
							href="/login"
							className="text-violet-400 hover:text-violet-300 font-medium"
						>
							Voltar para o login
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
