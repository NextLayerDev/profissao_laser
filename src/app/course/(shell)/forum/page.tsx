'use client';

import { MessagesSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ForumTab } from '@/components/duvidas/forum-tab';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser } from '@/lib/auth';

export default function ForumCoursePage() {
	const [customerId, setCustomerId] = useState('customer-1');

	useEffect(() => {
		const user = getCurrentUser();
		setCustomerId(user?.sub ?? 'customer-1');
	}, []);

	return (
		<div className="p-4 md:p-8">
			<PageHeader
				title="Forum"
				subtitle="Troque experiencias e tire duvidas com a comunidade."
				icon={MessagesSquare}
			/>
			<ForumTab currentUserId={customerId} />
		</div>
	);
}
