'use client';

import { useEffect, useState } from 'react';
import { CourseSidebar } from '@/components/course/home/course-sidebar';
import { CourseTopHeader } from '@/components/course/home/course-top-header';
import { getToken } from '@/lib/auth';

const STORAGE_KEY = 'course-sidebar-collapsed';

export default function CourseShellLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		setIsAdmin(!!getToken('user'));
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored !== null) setSidebarCollapsed(stored === 'true');
	}, []);

	const handleToggle = () => {
		setSidebarCollapsed((c) => {
			const next = !c;
			localStorage.setItem(STORAGE_KEY, String(next));
			return next;
		});
	};

	return (
		<div className="relative min-h-screen bg-slate-100 dark:bg-[#080809] text-slate-900 dark:text-white font-sans flex">
			{/* Dark mode background orbs */}
			<div className="hidden dark:block absolute inset-0 pointer-events-none overflow-hidden">
				<div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-blue-900/15 rounded-full blur-3xl" />
				<div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-indigo-900/15 rounded-full blur-3xl" />
				<div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-blue-800/8 rounded-full blur-3xl" />
			</div>
			<CourseSidebar isCollapsed={sidebarCollapsed} onToggle={handleToggle} />
			<div
				className={`relative z-10 flex-1 flex flex-col min-h-screen transition-all duration-300 ${
					sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
				}`}
			>
				<CourseTopHeader
					isAdmin={isAdmin}
					sidebarCollapsed={sidebarCollapsed}
				/>
				<main className="flex-1 mt-16 overflow-x-hidden">{children}</main>
			</div>
		</div>
	);
}
