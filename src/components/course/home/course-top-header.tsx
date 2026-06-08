'use client';

import {
	Bell,
	CreditCard,
	Menu,
	MessageCircle,
	Search,
	Settings,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { UserBadge } from '@/components/store/user-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { useEntitlements } from '@/hooks/use-entitlements';
import { useIsTestUnlimited } from '@/hooks/use-is-test-unlimited';
import { formatVox } from '@/lib/format';
import { VoxSpendFx } from './vox-spend-fx';

interface CourseTopHeaderProps {
	isAdmin: boolean;
	sidebarCollapsed: boolean;
	userName?: string;
	onMobileMenuToggle?: () => void;
}

export function CourseTopHeader({
	isAdmin,
	sidebarCollapsed,
	userName,
	onMobileMenuToggle,
}: CourseTopHeaderProps) {
	const { voxBalance, isLoading: balanceLoading } = useEntitlements();
	const unlimited = useIsTestUnlimited();
	return (
		<header
			className={`fixed top-0 right-0 h-16 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)] z-30 bg-white/80 dark:bg-[#0d0d0f]/90 backdrop-blur-lg flex items-center justify-between px-4 md:px-6 lg:px-8 transition-all duration-300 ${
				sidebarCollapsed ? 'left-0 md:left-16' : 'left-0 md:left-60'
			}`}
		>
			<div className="flex items-center gap-3 flex-1">
				{onMobileMenuToggle && (
					<button
						type="button"
						onClick={onMobileMenuToggle}
						className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 md:hidden"
					>
						<Menu className="w-5 h-5" />
					</button>
				)}
				{userName && (
					<span className="hidden sm:block text-sm text-slate-600 dark:text-gray-400">
						Ola,{' '}
						<span className="font-display font-semibold text-slate-900 dark:text-slate-100">
							{userName}
						</span>
					</span>
				)}
				{unlimited && (
					<span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 whitespace-nowrap">
						Conta teste — tudo desbloqueado
					</span>
				)}
				<div className="flex-1 max-w-md">
					<div className="relative flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden transition-all focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/20">
						<Search className="absolute left-3 w-4 h-4 text-slate-400" />
						<input
							type="text"
							placeholder="Buscar na comunidade..."
							className="w-full bg-transparent border-none py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none"
						/>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-1.5 ml-4">
				<button
					type="button"
					onClick={() =>
						toast('Em breve', {
							description: 'Notificacoes estara disponivel em breve!',
						})
					}
					className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
				>
					<Bell className="w-[18px] h-[18px]" />
					<span className="absolute top-1 right-1 w-2 h-2 bg-violet-600 rounded-full border-[1.5px] border-white dark:border-[#0d0d0f]" />
				</button>
				<button
					type="button"
					onClick={() =>
						toast('Em breve', {
							description: 'Mensagens estara disponivel em breve!',
						})
					}
					className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
				>
					<MessageCircle className="w-[18px] h-[18px]" />
				</button>
				<ThemeToggle />
				<div className="relative">
					<VoxSpendFx />
					<Link
						href="/course/voxes"
						title="Meus voxxys"
						className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
					>
						<VoxxysIcon className="w-[18px] h-[18px]" />
						<span className="text-sm font-semibold tabular-nums">
							{unlimited ? '∞' : balanceLoading ? '—' : formatVox(voxBalance)}
						</span>
					</Link>
				</div>
				<Link
					href="/course/assinatura"
					title="Minha assinatura"
					className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
				>
					<CreditCard className="w-[18px] h-[18px]" />
				</Link>
				{isAdmin && (
					<Link
						href="/dashboard"
						className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
					>
						<Settings className="w-[18px] h-[18px]" />
					</Link>
				)}
				<UserBadge />
			</div>
		</header>
	);
}
