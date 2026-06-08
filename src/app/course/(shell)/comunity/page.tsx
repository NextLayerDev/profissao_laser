'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChannelsView } from '@/components/community/channels-view';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { ChatSkeleton } from '@/components/ui/skeletons/chat-skeleton';
import { getCurrentUser, getToken } from '@/lib/auth';

export default function ComunityShellPage() {
	const router = useRouter();
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [name, setName] = useState<string>('');
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setName(user?.name ?? '');
		setIsAdmin(!!getToken('user') && user?.role != null);
	}, []);

	if (email === undefined) {
		return <ChatSkeleton />;
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
		<SubscriptionGate>
			<ChannelsView
				userName={name || email?.split('@')[0] || 'Voce'}
				userEmail={email}
				userInitials={userInitials}
				isAdmin={isAdmin}
			/>
		</SubscriptionGate>
	);
}
