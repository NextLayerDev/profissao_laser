'use client';

import { Avatar } from '@/components/ui/avatar';
import { useMyProfile } from '@/hooks/use-profile';

interface HomeGreetingProps {
	name: string;
	email?: string | null;
	isAdmin?: boolean;
}

export function HomeGreeting({
	name,
	email,
	isAdmin = false,
}: HomeGreetingProps) {
	const firstName = name ? name.split(' ')[0] : '';
	const { data: profile } = useMyProfile(!isAdmin);
	// Prioriza o apelido do customer; senão o primeiro nome; senão genérico.
	const displayName = profile?.nickname?.trim() || firstName || 'bem-vindo';

	return (
		<header className="mb-6 flex items-center gap-4">
			<Avatar
				src={profile?.avatar}
				name={profile?.nickname || name}
				email={email}
				className="w-12 h-12 sm:w-14 sm:h-14 text-base shrink-0"
			/>
			<div className="min-w-0">
				<h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
					Olá,{' '}
					<span className="bg-gradient-to-r from-violet-600 to-violet-400 bg-clip-text text-transparent">
						{displayName}
					</span>
					! 👋
				</h1>
				<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
					Veja o que está rolando na comunidade hoje.
				</p>
			</div>
		</header>
	);
}
