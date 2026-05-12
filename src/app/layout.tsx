import type { Metadata } from 'next';
import { JetBrains_Mono, Outfit, Syne } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const syne = Syne({ subsets: ['latin'], variable: '--font-display' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-body' });
const jetbrainsMono = JetBrains_Mono({
	subsets: ['latin'],
	variable: '--font-mono',
});

export const metadata: Metadata = {
	title: 'Profissao Laser',
	description: 'Controle completo do seu negocio digital',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="pt-BR">
			<body
				className={`${syne.variable} ${outfit.variable} ${jetbrainsMono.variable} font-body`}
			>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
