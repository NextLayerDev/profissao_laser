'use client';

import { ArrowRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

const links = [
	{ href: '#inicio', label: 'Início' },
	{ href: '#ferramentas', label: 'Ferramentas' },
	{ href: '#depoimentos', label: 'Depoimentos' },
	{ href: '#planos', label: 'Planos' },
	{ href: '#perguntas', label: 'Perguntas' },
];

export function Header() {
	const [open, setOpen] = useState(false);
	return (
		<motion.header
			initial={{ y: -20, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.6 }}
			className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border"
		>
			<div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
				<a href="#inicio" className="flex items-center gap-2.5">
					<span className="relative grid place-items-center w-9 h-9 rounded-full bg-gradient-primary shadow-glow animate-pulse-glow">
						<Zap className="w-4 h-4 text-primary-foreground" />
					</span>
					<span className="font-display font-bold text-sm leading-tight">
						COMUNIDADE
						<br />
						<span className="text-gradient">PROFISSÃO LASER</span>
					</span>
				</a>
				<nav className="hidden lg:flex items-center gap-8 text-sm">
					{links.map((l) => (
						<a
							key={l.href}
							href={l.href}
							className="text-muted-foreground hover:text-foreground transition-colors story-link"
						>
							{l.label}
						</a>
					))}
				</nav>
				<a
					href="#planos"
					className="hidden sm:inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full shadow-glow hover:scale-105 transition-transform"
				>
					Quero fazer parte <ArrowRight className="w-3.5 h-3.5" />
				</a>
				<button
					type="button"
					aria-label="menu"
					className="lg:hidden text-foreground"
					onClick={() => setOpen(!open)}
				>
					<div className="space-y-1.5">
						<span className="block w-6 h-0.5 bg-foreground" />
						<span className="block w-6 h-0.5 bg-foreground" />
					</div>
				</button>
			</div>
			{open && (
				<div className="lg:hidden border-t border-border bg-background/95 px-5 py-4 space-y-3">
					{links.map((l) => (
						<a
							key={l.href}
							href={l.href}
							onClick={() => setOpen(false)}
							className="block text-sm text-muted-foreground"
						>
							{l.label}
						</a>
					))}
				</div>
			)}
		</motion.header>
	);
}
