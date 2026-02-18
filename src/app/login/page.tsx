'use client';

import { Loader2, Lock, Store, User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLoginCustomer, useLoginUser } from '@/hooks/use-auth';

type Tab = 'customer' | 'user';

export default function Login() {
	const [tab, setTab] = useState<Tab>('customer');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const loginCustomer = useLoginCustomer();
	const loginUser = useLoginUser();

	const isPending =
		tab === 'customer' ? loginCustomer.isPending : loginUser.isPending;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const payload = { email, password };

		if (tab === 'customer') {
			loginCustomer.mutate(payload, {
				onError: () => toast.error('Email ou senha inválidos'),
			});
		} else {
			loginUser.mutate(payload, {
				onError: () => toast.error('Email ou senha inválidos'),
			});
		}
	}

	return (
		<div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				{/* Logo */}
				<div className="flex items-center justify-center gap-2 mb-8">
					<Store className="w-7 h-7 text-violet-400" />
					<span className="text-xl font-bold text-white">Profissão Laser</span>
				</div>

				<div className="bg-[#1a1a1d] rounded-2xl border border-gray-800 p-8">
					<h1 className="text-2xl font-bold text-white mb-1">Entrar</h1>
					<p className="text-gray-400 text-sm mb-6">
						Acesse sua conta para continuar
					</p>

					{/* Tabs */}
					<div className="flex bg-[#0d0d0f] rounded-xl p-1 mb-6 gap-1">
						<button
							type="button"
							onClick={() => setTab('customer')}
							className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
								tab === 'customer'
									? 'bg-violet-600 text-white'
									: 'text-gray-400 hover:text-white'
							}`}
						>
							<User className="w-4 h-4" />
							Aluno
						</button>
						<button
							type="button"
							onClick={() => setTab('user')}
							className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
								tab === 'user'
									? 'bg-violet-600 text-white'
									: 'text-gray-400 hover:text-white'
							}`}
						>
							<Lock className="w-4 h-4" />
							Administrador
						</button>
					</div>

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

						<div>
							<label
								htmlFor="password"
								className="block text-sm text-gray-400 mb-1.5"
							>
								Senha
							</label>
							<input
								id="password"
								type="password"
								required
								minLength={6}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								className="w-full bg-[#0d0d0f] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
							/>
						</div>

						<button
							type="submit"
							disabled={isPending}
							className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 cursor-pointer mt-2"
						>
							{isPending ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Entrando...
								</>
							) : (
								'Entrar'
							)}
						</button>
					</form>

					{tab === 'customer' && (
						<p className="text-center text-sm text-gray-500 mt-5">
							Não tem conta?{' '}
							<Link
								href="/register"
								className="text-violet-400 hover:text-violet-300 font-medium"
							>
								Cadastre-se
							</Link>
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
