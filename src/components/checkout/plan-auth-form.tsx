'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { saveRefreshToken, saveToken } from '@/lib/auth';
import { loginCourses, signupCourses } from '@/services/courses-auth';

type Tab = 'register' | 'login';

function serverMessage(err: unknown, fallback: string): string {
	if (
		typeof err === 'object' &&
		err !== null &&
		'response' in err &&
		typeof (err as { response?: { data?: { message?: string } } }).response
			?.data?.message === 'string'
	) {
		return (err as { response: { data: { message: string } } }).response.data
			.message;
	}
	return err instanceof Error ? err.message : fallback;
}

const inputClass =
	'w-full bg-ink-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/60 transition-colors';
const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5';

/** Form de criar conta / login na upvox. Ao concluir, salva o token e chama onAuthenticated. */
export function PlanAuthForm({
	onAuthenticated,
}: {
	onAuthenticated: () => void;
}) {
	const [tab, setTab] = useState<Tab>('register');
	const [isLoading, setIsLoading] = useState(false);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [phone, setPhone] = useState('');

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim() || !email.trim() || !password.trim() || !phone.trim())
			return;
		setIsLoading(true);
		try {
			const { accessToken, refreshToken } = await signupCourses({
				name: name.trim(),
				email: email.trim(),
				password: password.trim(),
				phone: phone.trim(),
			});
			saveToken('customer', accessToken);
			if (refreshToken) saveRefreshToken(refreshToken);
			toast.success('Conta criada com sucesso!');
			onAuthenticated();
		} catch (err) {
			toast.error(serverMessage(err, 'Erro ao criar conta'));
		} finally {
			setIsLoading(false);
		}
	}

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault();
		if (!email.trim() || !password.trim()) return;
		setIsLoading(true);
		try {
			const { accessToken, refreshToken } = await loginCourses({
				email: email.trim(),
				password: password.trim(),
			});
			saveToken('customer', accessToken);
			if (refreshToken) saveRefreshToken(refreshToken);
			toast.success('Login realizado!');
			onAuthenticated();
		} catch (err) {
			toast.error(serverMessage(err, 'Email ou senha inválidos'));
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="card-dark rounded-2xl border border-white/10 p-6">
			<h3 className="font-display text-lg font-bold text-white mb-1">
				{tab === 'register' ? 'Crie sua conta' : 'Acesse sua conta'}
			</h3>
			<p className="text-sm text-gray-400 mb-5">
				{tab === 'register'
					? 'É rápido — e já liberamos seu acesso após o pagamento.'
					: 'Entre para continuar com a assinatura.'}
			</p>

			<div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6">
				<button
					type="button"
					onClick={() => setTab('register')}
					className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
						tab === 'register'
							? 'bg-violet-600 text-white shadow-brand'
							: 'text-gray-400 hover:text-white'
					}`}
				>
					Criar conta
				</button>
				<button
					type="button"
					onClick={() => setTab('login')}
					className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
						tab === 'login'
							? 'bg-violet-600 text-white shadow-brand'
							: 'text-gray-400 hover:text-white'
					}`}
				>
					Já tenho conta
				</button>
			</div>

			{tab === 'register' ? (
				<form onSubmit={handleRegister} className="space-y-4">
					<div>
						<label htmlFor="pa-name" className={labelClass}>
							Nome completo
						</label>
						<input
							id="pa-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							minLength={2}
							placeholder="Seu nome"
							className={inputClass}
						/>
					</div>
					<div>
						<label htmlFor="pa-email" className={labelClass}>
							Email
						</label>
						<input
							id="pa-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							placeholder="seu@email.com"
							className={inputClass}
						/>
					</div>
					<div>
						<label htmlFor="pa-phone" className={labelClass}>
							Telefone (WhatsApp)
						</label>
						<input
							id="pa-phone"
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							required
							minLength={10}
							placeholder="(11) 99999-9999"
							className={inputClass}
						/>
					</div>
					<div>
						<label htmlFor="pa-password" className={labelClass}>
							Senha
						</label>
						<input
							id="pa-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={6}
							placeholder="Mínimo 6 caracteres"
							className={inputClass}
						/>
					</div>
					<button
						type="submit"
						disabled={isLoading}
						className="btn-accent w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl shadow-brand disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
					>
						{isLoading ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								Processando...
							</>
						) : (
							'Criar conta e ir para o pagamento'
						)}
					</button>
				</form>
			) : (
				<form onSubmit={handleLogin} className="space-y-4">
					<div>
						<label htmlFor="pa-login-email" className={labelClass}>
							Email
						</label>
						<input
							id="pa-login-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							placeholder="seu@email.com"
							className={inputClass}
						/>
					</div>
					<div>
						<label htmlFor="pa-login-password" className={labelClass}>
							Senha
						</label>
						<input
							id="pa-login-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={6}
							placeholder="Sua senha"
							className={inputClass}
						/>
					</div>
					<button
						type="submit"
						disabled={isLoading}
						className="btn-accent w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl shadow-brand disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
					>
						{isLoading ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								Entrando...
							</>
						) : (
							'Entrar e ir para o pagamento'
						)}
					</button>
				</form>
			)}
		</div>
	);
}
