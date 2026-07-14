'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EventsView } from '@/components/community/events-view';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { CardGridSkeleton } from '@/components/ui/skeletons/card-grid-skeleton';
import { getCurrentUser, getToken } from '@/lib/auth';

export default function EventosShellPage() {
	const router = useRouter();
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setIsAdmin(!!getToken('user') && user?.role != null);
	}, []);

	if (email === undefined) {
		return <CardGridSkeleton count={6} cols={3} />;
	}

	if (email === null) {
		router.replace('/login');
		return null;
	}

	return (
		<SubscriptionGate toolKey="eventos">
			<EventsView isAdmin={isAdmin} />
		</SubscriptionGate>
	);
}
