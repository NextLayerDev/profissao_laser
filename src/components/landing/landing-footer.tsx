'use client';

import { Logo } from './top-bar';

export function LandingFooter() {
	return (
		<footer className="border-t border-violet-500/10 mt-8">
			<div className="max-w-7xl mx-auto px-5 md:px-8 py-10 grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-8">
				<div>
					<Logo size={26} />
					<p className="text-slate-400 text-sm mt-4 max-w-xs leading-relaxed">
						A comunidade definitiva para profissionais e empreendedores do
						mercado de gravação a laser no Brasil.
					</p>
				</div>
				<div>
					<div className="font-display text-white font-bold text-sm mb-3">
						Comunidade
					</div>
					<ul className="space-y-2 text-sm text-slate-400">
						<li>
							<a href="#recursos" className="hover:text-violet-300">
								Recursos
							</a>
						</li>
						<li>
							<a href="#depoimentos" className="hover:text-violet-300">
								Depoimentos
							</a>
						</li>
						<li>
							<a href="#planos" className="hover:text-violet-300">
								Planos
							</a>
						</li>
						<li>
							<a href="#faq" className="hover:text-violet-300">
								FAQ
							</a>
						</li>
					</ul>
				</div>
				<div>
					<div className="font-display text-white font-bold text-sm mb-3">
						Recursos
					</div>
					<ul className="space-y-2 text-sm text-slate-400">
						<li>
							<a href="#" className="hover:text-violet-300">
								Aulas
							</a>
						</li>
						<li>
							<a href="#" className="hover:text-violet-300">
								Biblioteca de vetores
							</a>
						</li>
						<li>
							<a href="#" className="hover:text-violet-300">
								Parâmetros
							</a>
						</li>
						<li>
							<a href="#" className="hover:text-violet-300">
								Fornecedores
							</a>
						</li>
					</ul>
				</div>
				<div>
					<div className="font-display text-white font-bold text-sm mb-3">
						Suporte
					</div>
					<ul className="space-y-2 text-sm text-slate-400">
						<li>
							<a href="#" className="hover:text-violet-300">
								Central de ajuda
							</a>
						</li>
						<li>
							<a href="#" className="hover:text-violet-300">
								Contato
							</a>
						</li>
						<li>
							<a href="#" className="hover:text-violet-300">
								Termos
							</a>
						</li>
						<li>
							<a href="#" className="hover:text-violet-300">
								Privacidade
							</a>
						</li>
					</ul>
				</div>
			</div>
			<div className="border-t border-violet-500/10 px-5 md:px-8 py-5 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
				<div className="text-slate-500 text-xs font-mono">
					© 2026 Profissão Laser · Todos os direitos reservados
				</div>
				<div className="text-slate-500 text-xs font-mono">
					Operado por UPVOX
				</div>
			</div>
		</footer>
	);
}
