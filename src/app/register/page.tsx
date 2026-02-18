'use client';

import { Loader2, Lock, Store, User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRegisterCustomer, useRegisterUser } from '@/hooks/use-auth';

type Tab = 'customer' | 'user';

export default function Register() {
	const [tab, setTab] = useState<Tab>('customer');
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	// user-only
	const [role, setRole] = useState('');

	const registerCustomer = useRegisterCustomer();
	const registerUser = useRegisterUser();

	const isPending =
		tab === 'customer' ? registerCustomer.isPending : registerUser.isPending;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (tab === 'customer') {
			registerCustomer.mutate(
				{ name, email, password },
				{
					onSuccess: () =>
						toast.success('Conta criada! Faça login para continuar.'),
					onError: () => toast.error('Erro ao criar conta. Tente novamente.'),
				},
			);
		} else {
			registerUser.mutate(
				{ name, email, password, role, Permissions: null },
				{
					onSuccess: () =>
						toast.success('Conta criada! Faça login para continuar.'),
					onError: () => toast.error('Erro ao criar conta. Tente novamente.'),
				},
			);
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
					<h1 className="text-2xl font-bold text-white mb-1">Criar conta</h1>
					<p className="text-gray-400 text-sm mb-6">
						Preencha os dados para se cadastrar
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
								htmlFor="name"
								className="block text-sm text-gray-400 mb-1.5"
							>
								Nome
							</label>
							<input
								id="name"
								type="text"
								required
								minLength={2}
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Seu nome completo"
								className="w-full bg-[#0d0d0f] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
							/>
						</div>

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
								placeholder="Mínimo 6 caracteres"
								className="w-full bg-[#0d0d0f] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
							/>
						</div>

						{tab === 'user' && (
							<div>
								<label
									htmlFor="role"
									className="block text-sm text-gray-400 mb-1.5"
								>
									Cargo / Função
								</label>
								<input
									id="role"
									type="text"
									required
									value={role}
									onChange={(e) => setRole(e.target.value)}
									placeholder="Ex: admin, manager..."
									className="w-full bg-[#0d0d0f] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
								/>
							</div>
						)}

						<button
							type="submit"
							disabled={isPending}
							className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 cursor-pointer mt-2"
						>
							{isPending ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Criando conta...
								</>
							) : (
								'Criar conta'
							)}
						</button>
					</form>

					<p className="text-center text-sm text-gray-500 mt-5">
						Já tem conta?{' '}
						<Link
							href="/login"
							className="text-violet-400 hover:text-violet-300 font-medium"
						>
							Entrar
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
