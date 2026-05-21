'use client';

interface HomeGreetingProps {
	name: string;
}

export function HomeGreeting({ name }: HomeGreetingProps) {
	const firstName = name ? name.split(' ')[0] : 'bem-vindo';

	return (
		<header className="mb-6">
			<h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
				Olá,{' '}
				<span className="bg-gradient-to-r from-violet-600 to-violet-400 bg-clip-text text-transparent">
					{firstName}
				</span>
				! 👋
			</h1>
			<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
				Veja o que está rolando na comunidade hoje.
			</p>
		</header>
	);
}
