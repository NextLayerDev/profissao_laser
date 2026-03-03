'use client';

import type React from 'react';

interface ContentProtectionProps {
	children: React.ReactNode;
	className?: string;
}

export function ContentProtection({
	children,
	className,
}: ContentProtectionProps) {
	return (
		<div
			className={className}
			role="application"
			aria-label="Conteúdo protegido"
			onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
			onCopy={(e: React.ClipboardEvent) => e.preventDefault()}
			onCut={(e: React.ClipboardEvent) => e.preventDefault()}
			style={{ userSelect: 'none' }}
		>
			{children}
		</div>
	);
}
