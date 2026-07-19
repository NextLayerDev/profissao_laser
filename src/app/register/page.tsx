'use client';

import { isAxiosError } from 'axios';
import { Loader2, Store } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRegisterCustomer } from '@/hooks/use-auth';

/** Traduz o erro do backend (upvox) numa mensagem clara pro usuário. */
function registerErrorMessage(err: unknown): string {
	if (isAxiosError(err)) {
		const code = err.response?.data?.message as string | undefined;
		if (err.response?.status === 409) {
			if (code === 'email_taken')
				return 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.';
			if (code === 'phone_taken')
				return 'Este telefone já está cadastrado. Use outro número.';
			return 'Você já tem uma conta. Tente fazer login.';
		}
	}
	return 'Erro ao criar conta. Tente novamente.';
}

export default function Register() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [phone, setPhone] = useState('');

	const registerCustomer = useRegisterCustomer();

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		registerCustomer.mutate(
			{
				name: name.trim(),
				email: email.trim(),
				password: password.trim(),
				phone: phone.trim().replace(/\D/g, ''), // Send only digits
			},
			{
				onSuccess: () => toast.success('Conta criada com sucesso!'),
				onError: (err) => toast.error(registerErrorMessage(err)),
			},
		);
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
						Crie sua conta grátis e comece agora
					</p>

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
								htmlFor="phone"
								className="block text-sm text-gray-400 mb-1.5"
							>
								Telefone
							</label>
							<input
								id="phone"
								type="tel"
								required
								minLength={8}
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="(11) 99999-9999"
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

						<button
							type="submit"
							disabled={registerCustomer.isPending}
							className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 cursor-pointer mt-2"
						>
							{registerCustomer.isPending ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Criando conta...
								</>
							) : (
								'Criar conta grátis'
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
