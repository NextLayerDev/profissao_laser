'use client';

import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CourseSidebar } from '@/components/course/home/course-sidebar';
import { CourseTopHeader } from '@/components/course/home/course-top-header';
import { useIsAdmin } from '@/modules/me';

const STORAGE_KEY = 'course-sidebar-collapsed';

export default function CourseShellLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const isAdmin = useIsAdmin();

	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored !== null) setSidebarCollapsed(stored === 'true');
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: close mobile menu on route change
	useEffect(() => {
		setMobileOpen(false);
	}, [pathname]);

	const handleToggle = () => {
		setSidebarCollapsed((c) => {
			const next = !c;
			localStorage.setItem(STORAGE_KEY, String(next));
			return next;
		});
	};

	return (
		<div className="relative min-h-screen bg-slate-50 dark:bg-[#0d0d0f] text-slate-900 dark:text-slate-100 flex">
			<div className="hidden dark:block absolute inset-0 pointer-events-none overflow-hidden grain-texture" />
			<CourseSidebar isCollapsed={sidebarCollapsed} onToggle={handleToggle} />

			{/* Mobile sidebar overlay */}
			{mobileOpen && (
				<div className="fixed inset-0 z-50 md:hidden">
					{/* biome-ignore lint/a11y/useSemanticElements: backdrop overlay wraps modal content */}
					<div
						className="absolute inset-0 bg-black/50"
						onClick={() => setMobileOpen(false)}
						onKeyDown={(e) => e.key === 'Escape' && setMobileOpen(false)}
						role="button"
						tabIndex={0}
						aria-label="Fechar menu"
					/>
					<div className="relative w-60 h-full">
						<CourseSidebar
							isCollapsed={false}
							onToggle={() => setMobileOpen(false)}
							mobile
						/>
						<button
							type="button"
							onClick={() => setMobileOpen(false)}
							className="absolute top-4 right-[-44px] w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>
			)}

			<div
				className={`relative z-10 flex-1 flex flex-col min-h-screen transition-all duration-300 ${
					sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
				}`}
			>
				<CourseTopHeader
					isAdmin={isAdmin}
					sidebarCollapsed={sidebarCollapsed}
					onMobileMenuToggle={() => setMobileOpen(true)}
				/>
				<main className="flex-1 mt-16 overflow-x-hidden animate-[fade-in-up_0.4s_ease-out_both]">
					{children}
				</main>
			</div>
		</div>
	);
}
