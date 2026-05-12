interface LoadingStateProps {
	size?: 'sm' | 'md' | 'lg';
	text?: string;
}

export function LoadingState({ size = 'md', text }: LoadingStateProps) {
	const dotSize = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-2.5 h-2.5' }[size];
	const gap = { sm: 'gap-1.5', md: 'gap-2', lg: 'gap-2.5' }[size];
	const py = { sm: 'py-8', md: 'py-16', lg: 'py-24' }[size];

	return (
		<div className={`flex flex-col items-center justify-center ${py}`}>
			<div className={`flex ${gap}`}>
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						className={`${dotSize} rounded-full bg-violet-600`}
						style={{
							animation: 'pulse-laser 1.2s ease-in-out infinite',
							animationDelay: `${i * 0.2}s`,
						}}
					/>
				))}
			</div>
			{text && (
				<p className="text-slate-500 dark:text-gray-400 text-sm mt-4">{text}</p>
			)}
		</div>
	);
}
