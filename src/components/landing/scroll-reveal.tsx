'use client';

import { type HTMLMotionProps, motion } from 'motion/react';

interface ScrollRevealProps extends HTMLMotionProps<'div'> {
	children: React.ReactNode;
	delay?: number;
	className?: string;
}

export function ScrollReveal({
	children,
	delay = 0,
	className,
	...rest
}: ScrollRevealProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: '-60px' }}
			transition={{ duration: 0.5, delay, ease: 'easeOut' }}
			className={className}
			{...rest}
		>
			{children}
		</motion.div>
	);
}

export function StaggerReveal({
	children,
	delay = 0,
	className,
	...rest
}: ScrollRevealProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: '-40px' }}
			transition={{ duration: 0.4, delay, ease: 'easeOut' }}
			className={className}
			{...rest}
		>
			{children}
		</motion.div>
	);
}
