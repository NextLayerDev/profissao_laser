'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { saveToken } from '@/lib/auth';
import { loginCustomer, registerCustomer } from '@/services/auth';

interface CheckoutAuthFormProps {
	onAuthenticated: () => void;
}

type Tab = 'register' | 'login';

export function CheckoutAuthForm({ onAuthenticated }: CheckoutAuthFormProps) {
	const [tab, setTab] = useState<Tab>('register');
	const [isLoading, setIsLoading] = useState(false);

	// Form fields
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim() || !email.trim() || !password.trim()) return;

		setIsLoading(true);
		try {
			// 1. Registrar conta
			await registerCustomer({ name, email, password });

			// 2. Login para pegar token
			const { token } = await loginCustomer({ email, password });
			saveToken('customer', token);

			toast.success('Conta criada com sucesso!');
			onAuthenticated();
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Erro ao criar conta';
			const isAxiosError =
				typeof err === 'object' &&
				err !== null &&
				'response' in err &&
				typeof (err as { response?: { data?: { message?: string } } }).response
					?.data?.message === 'string';
			const serverMessage = isAxiosError
				? (err as { response: { data: { message: string } } }).response.data
						.message
				: message;
			toast.error(serverMessage);
		} finally {
			setIsLoading(false);
		}
	}

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault();
		if (!email.trim() || !password.trim()) return;

		setIsLoading(true);
		try {
			const { token } = await loginCustomer({ email, password });
			saveToken('customer', token);

			toast.success('Login realizado!');
			onAuthenticated();
		} catch {
			toast.error('Email ou senha invalidos');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="bg-white dark:bg-[#1a1a1d] rounded-2xl border border-slate-200 dark:border-gray-800 p-6">
			<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
				Finalize sua compra
			</h3>
			<p className="text-sm text-slate-500 dark:text-gray-400 mb-5">
				Crie uma conta ou faca login para continuar
			</p>

			{/* Tabs */}
			<div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 mb-6">
				<button
					type="button"
					onClick={() => setTab('register')}
					className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
						tab === 'register'
							? 'bg-white dark:bg-[#2a2a2d] text-slate-900 dark:text-white shadow-sm'
							: 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
					}`}
				>
					Criar conta
				</button>
				<button
					type="button"
					onClick={() => setTab('login')}
					className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
						tab === 'login'
							? 'bg-white dark:bg-[#2a2a2d] text-slate-900 dark:text-white shadow-sm'
							: 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
					}`}
				>
					Ja tenho conta
				</button>
			</div>

			{tab === 'register' ? (
				<form onSubmit={handleRegister} className="space-y-4">
					<div>
						<label
							htmlFor="checkout-name"
							className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1"
						>
							Nome completo
						</label>
						<input
							id="checkout-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							minLength={2}
							placeholder="Seu nome"
							className="w-full bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
						/>
					</div>
					<div>
						<label
							htmlFor="checkout-email"
							className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1"
						>
							Email
						</label>
						<input
							id="checkout-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							placeholder="seu@email.com"
							className="w-full bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
						/>
					</div>
					<div>
						<label
							htmlFor="checkout-password"
							className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1"
						>
							Senha
						</label>
						<input
							id="checkout-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={6}
							placeholder="Minimo 6 caracteres"
							className="w-full bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer"
					>
						{isLoading ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								Processando...
							</>
						) : (
							'Criar conta e comprar'
						)}
					</button>
				</form>
			) : (
				<form onSubmit={handleLogin} className="space-y-4">
					<div>
						<label
							htmlFor="checkout-login-email"
							className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1"
						>
							Email
						</label>
						<input
							id="checkout-login-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							placeholder="seu@email.com"
							className="w-full bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
						/>
					</div>
					<div>
						<label
							htmlFor="checkout-login-password"
							className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1"
						>
							Senha
						</label>
						<input
							id="checkout-login-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={6}
							placeholder="Sua senha"
							className="w-full bg-white dark:bg-[#0d0d0f] border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer"
					>
						{isLoading ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								Entrando...
							</>
						) : (
							'Entrar e comprar'
						)}
					</button>
				</form>
			)}
		</div>
	);
}
