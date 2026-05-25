'use client';

import { Loader2, Store } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { signupSchema, useSignup } from '@/modules/auth';
import { getApiErrorMessage } from '@/shared/lib/api-error';

// Converte input livre ("(11) 99999-9999", "11999999999", "+5511999999999")
// para E.164 brasileiro. Se já vier com '+', usa como está.
function toE164(raw: string): string {
	const trimmed = raw.trim();
	if (trimmed.startsWith('+')) return trimmed;
	const digits = trimmed.replace(/\D/g, '');
	if (!digits) return '';
	// Assume DDI 55 (Brasil) se vier só com dígitos nacionais
	return digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
}

export default function Register() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [phone, setPhone] = useState('');

	const signupMutation = useSignup();

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		const payload = {
			name: name.trim() || undefined,
			email: email.trim(),
			password: password.trim(),
			phone: toE164(phone),
		};

		const parsed = signupSchema.safeParse(payload);
		if (!parsed.success) {
			const first = parsed.error.issues[0];
			toast.error(first?.message ?? 'Dados inválidos');
			return;
		}

		signupMutation.mutate(parsed.data, {
			onSuccess: () =>
				toast.success('Conta criada! Faça login para continuar.'),
			onError: (err) =>
				toast.error(getApiErrorMessage(err, 'Erro ao criar conta.')),
		});
	}

	return (
		<div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				<div className="flex items-center justify-center gap-2 mb-8">
					<Store className="w-7 h-7 text-violet-400" />
					<span className="text-xl font-bold text-white">Profissão Laser</span>
				</div>

				<div className="bg-[#1a1a1d] rounded-2xl border border-gray-800 p-8">
					<h1 className="text-2xl font-bold text-white mb-1">Criar conta</h1>
					<p className="text-gray-400 text-sm mb-6">
						Preencha os dados para se cadastrar
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
								minLength={8}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Mínimo 8 caracteres"
								className="w-full bg-[#0d0d0f] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors"
							/>
						</div>

						<button
							type="submit"
							disabled={signupMutation.isPending}
							className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 cursor-pointer mt-2"
						>
							{signupMutation.isPending ? (
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
