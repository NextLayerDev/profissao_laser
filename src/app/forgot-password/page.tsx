'use client';

import { isAxiosError } from 'axios';
import { ArrowLeft, Loader2, MailCheck, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	forgotPasswordCourses,
	resetPasswordCourses,
	verifyResetCodeCourses,
} from '@/services/courses-auth';

type Step = 'email' | 'code' | 'password';

const INPUT_CLASS =
	'w-full bg-[#0d0d0f] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors';
const BUTTON_CLASS =
	'w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 cursor-pointer mt-2';

export default function ForgotPassword() {
	const router = useRouter();
	const [step, setStep] = useState<Step>('email');
	const [loading, setLoading] = useState(false);

	const [email, setEmail] = useState('');
	const [code, setCode] = useState('');
	/** access_token de recuperação, obtido ao validar o código. */
	const [resetToken, setResetToken] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	/** Passo 1 — pede o código. 204 sempre (não revela se o e-mail existe). */
	async function handleSendCode(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		try {
			await forgotPasswordCourses(email.trim());
			setStep('code');
			toast.success('Código enviado! Confira seu e-mail.');
		} catch {
			toast.error('Não foi possível enviar o código. Tente novamente.');
		} finally {
			setLoading(false);
		}
	}

	/** Passo 2 — valida o código e guarda o token de recuperação. */
	async function handleVerifyCode(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		try {
			const token = await verifyResetCodeCourses(email.trim(), code.trim());
			setResetToken(token);
			setStep('password');
		} catch (err) {
			toast.error(
				isAxiosError(err) && err.response?.status === 401
					? 'Código inválido ou expirado. Peça um novo.'
					: 'Não foi possível validar o código. Tente novamente.',
			);
		} finally {
			setLoading(false);
		}
	}

	/** Passo 3 — grava a nova senha usando o token do passo 2. */
	async function handleResetPassword(e: React.FormEvent) {
		e.preventDefault();
		if (newPassword !== confirmPassword) {
			toast.error('As senhas não coincidem.');
			return;
		}
		setLoading(true);
		try {
			await resetPasswordCourses(resetToken, newPassword);
			toast.success('Senha alterada! Faça login para continuar.');
			router.push('/login');
		} catch {
			toast.error('Não foi possível alterar a senha. Peça um novo código.');
		} finally {
			setLoading(false);
		}
	}

	async function handleResend() {
		setLoading(true);
		try {
			await forgotPasswordCourses(email.trim());
			toast.success('Enviamos um novo código.');
		} catch {
			toast.error('Não foi possível reenviar o código.');
		} finally {
			setLoading(false);
		}
	}

	const titles: Record<Step, { title: string; subtitle: string }> = {
		email: {
			title: 'Recuperar senha',
			subtitle: 'Informe seu e-mail para receber um código de verificação',
		},
		code: {
			title: 'Digite o código',
			subtitle: `Enviamos um código de 6 dígitos para ${email}`,
		},
		password: {
			title: 'Nova senha',
			subtitle: 'Escolha uma senha nova para sua conta',
		},
	};

	return (
		<div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center px-4">
			<div className="w-full max-w-md">
				<div className="flex items-center justify-center gap-2 mb-8">
					<Store className="w-7 h-7 text-violet-400" />
					<span className="text-xl font-bold text-white">Profissão Laser</span>
				</div>

				<div className="bg-[#1a1a1d] rounded-2xl border border-gray-800 p-8">
					<h1 className="text-2xl font-bold text-white mb-1">
						{titles[step].title}
					</h1>
					<p className="text-gray-400 text-sm mb-6">{titles[step].subtitle}</p>

					{step === 'email' && (
						<form onSubmit={handleSendCode} className="space-y-4">
							<div>
								<label
									htmlFor="email"
									className="block text-sm text-gray-400 mb-1.5"
								>
									E-mail
								</label>
								<input
									id="email"
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="seu@email.com"
									className={INPUT_CLASS}
								/>
							</div>
							<button type="submit" disabled={loading} className={BUTTON_CLASS}>
								{loading ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										Enviando...
									</>
								) : (
									'Enviar código'
								)}
							</button>
						</form>
					)}

					{step === 'code' && (
						<form onSubmit={handleVerifyCode} className="space-y-4">
							<div className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2.5 text-xs text-violet-300">
								<MailCheck className="w-4 h-4 shrink-0" />
								Confira também a caixa de spam.
							</div>
							<div>
								<label
									htmlFor="code"
									className="block text-sm text-gray-400 mb-1.5"
								>
									Código de verificação
								</label>
								<input
									id="code"
									type="text"
									inputMode="numeric"
									autoComplete="one-time-code"
									required
									value={code}
									onChange={(e) =>
										setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
									}
									placeholder="000000"
									className={`${INPUT_CLASS} text-center text-2xl tracking-[0.5em] font-mono`}
								/>
							</div>
							<button
								type="submit"
								disabled={loading || code.length < 6}
								className={BUTTON_CLASS}
							>
								{loading ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										Validando...
									</>
								) : (
									'Validar código'
								)}
							</button>
							<div className="flex items-center justify-between pt-1">
								<button
									type="button"
									onClick={() => setStep('email')}
									className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
								>
									<ArrowLeft className="w-3.5 h-3.5" /> Trocar e-mail
								</button>
								<button
									type="button"
									onClick={handleResend}
									disabled={loading}
									className="text-xs text-violet-400 hover:text-violet-300 font-medium disabled:opacity-60 cursor-pointer"
								>
									Reenviar código
								</button>
							</div>
						</form>
					)}

					{step === 'password' && (
						<form onSubmit={handleResetPassword} className="space-y-4">
							<div>
								<label
									htmlFor="new-password"
									className="block text-sm text-gray-400 mb-1.5"
								>
									Nova senha
								</label>
								<input
									id="new-password"
									type="password"
									required
									minLength={6}
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									placeholder="Mínimo 6 caracteres"
									className={INPUT_CLASS}
								/>
							</div>
							<div>
								<label
									htmlFor="confirm-password"
									className="block text-sm text-gray-400 mb-1.5"
								>
									Confirmar senha
								</label>
								<input
									id="confirm-password"
									type="password"
									required
									minLength={6}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="Repita a senha"
									className={INPUT_CLASS}
								/>
							</div>
							<button type="submit" disabled={loading} className={BUTTON_CLASS}>
								{loading ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										Salvando...
									</>
								) : (
									'Alterar senha'
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
