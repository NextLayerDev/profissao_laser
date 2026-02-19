'use client';

import { LogIn, ShoppingCart, UserPlus, X } from 'lucide-react';
import Link from 'next/link';

interface LoginRequiredModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function LoginRequiredModal({
	isOpen,
	onClose,
}: LoginRequiredModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			>
				<span className="sr-only">Fechar</span>
			</button>

			<div className="relative bg-[#1a1a1d] border border-gray-800 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl">
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-[#252528]"
				>
					<X className="w-4 h-4" />
				</button>

				{/* Ícone */}
				<div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600/15 border border-violet-500/20 mb-5 mx-auto">
					<ShoppingCart className="w-7 h-7 text-violet-400" />
				</div>

				{/* Texto */}
				<div className="text-center mb-6">
					<h2 className="text-lg font-bold text-white mb-2">
						Faça login para continuar
					</h2>
					<p className="text-sm text-gray-400 leading-relaxed">
						Para realizar uma compra é necessário ter uma conta e estar logado
						na plataforma.
					</p>
				</div>

				{/* Ações */}
				<div className="flex flex-col gap-3">
					<Link
						href="/login"
						onClick={onClose}
						className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-colors duration-200 text-sm"
					>
						<LogIn className="w-4 h-4" />
						Entrar na minha conta
					</Link>

					<Link
						href="/register"
						onClick={onClose}
						className="flex items-center justify-center gap-2 w-full bg-[#252528] hover:bg-[#2a2a2d] border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-medium py-3 rounded-xl transition-colors duration-200 text-sm"
					>
						<UserPlus className="w-4 h-4" />
						Criar uma conta grátis
					</Link>
				</div>

				<p className="text-center text-xs text-gray-600 mt-4">
					É rápido, gratuito e sem compromisso.
				</p>
			</div>
		</div>
	);
}
