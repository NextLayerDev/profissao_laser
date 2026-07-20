'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShowcaseView } from '@/components/community/showcase-view';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { CardGridSkeleton } from '@/components/ui/skeletons/card-grid-skeleton';
import { getCurrentUser, getToken } from '@/lib/auth';

export default function VitrineCoursePage() {
	const router = useRouter();
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [name, setName] = useState('');
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setName(user?.name ?? '');
		setIsAdmin(!!getToken('user') && user?.role != null);
	}, []);

	if (email === undefined) {
		return <CardGridSkeleton count={6} cols={3} />;
	}

	if (email === null) {
		router.replace('/login');
		return null;
	}

	const userInitials = name
		? name
				.trim()
				.split(' ')
				.slice(0, 2)
				.map((w) => w[0])
				.join('')
				.toUpperCase() || (email ?? 'U').substring(0, 2).toUpperCase()
		: (email ?? 'U').substring(0, 2).toUpperCase();

	return (
		<SubscriptionGate toolKey="vitrine">
			<ShowcaseView
				userName={name || email?.split('@')[0] || 'Voce'}
				userInitials={userInitials}
				isAdmin={isAdmin}
			/>
		</SubscriptionGate>
	);
}
