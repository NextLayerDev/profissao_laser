'use client';

import { useEffect, useState } from 'react';
import { BibliotecaVetoresView } from '@/components/biblioteca/biblioteca-vetores-view';
import { AccessGate } from '@/components/ui/access-gate';
import { CardGridSkeleton } from '@/components/ui/skeletons/card-grid-skeleton';
import { useCustomerFeatures } from '@/hooks/use-customer-features';
import { useCustomerPlans } from '@/hooks/use-customer-plans';
import {
	useVectorLibraryBreadcrumbs,
	useVectorLibraryContents,
} from '@/hooks/use-vector-library';
import { getCurrentUser, getToken } from '@/lib/auth';
import type { VectorLibraryFile } from '@/types/vector-library';
import { FULL_FEATURES } from '@/utils/constants/class-features';

export default function BibliotecaCoursePage() {
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
	const [email, setEmail] = useState<string | null | undefined>(undefined);
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const user = getCurrentUser();
		setEmail(user?.email ?? null);
		setIsAdmin(!!getToken('user') && user?.role != null);
	}, []);

	const { data: plans, isLoading } = useCustomerPlans(email ?? null);
	const activePlans =
		plans?.filter((p) => p.status === 'active' || p.status === 'ativo') ?? [];
	const customerFeatures = useCustomerFeatures(
		activePlans.length > 0 ? activePlans : undefined,
	);
	const features = isAdmin
		? FULL_FEATURES
		: (customerFeatures?.features ?? null);
	const upgradeTiers = isAdmin
		? null
		: (customerFeatures?.upgradeTiers ?? null);
	const hasAccess = features?.vetorizacao ?? false;

	const { data: contents, isLoading: contentsLoading } =
		useVectorLibraryContents(currentFolderId);
	const { data: breadcrumbs = [] } =
		useVectorLibraryBreadcrumbs(currentFolderId);

	const handleDownload = async (file: VectorLibraryFile) => {
		try {
			const res = await fetch(file.fileUrl);
			const blob = await res.blob();
			const filename = file.name.includes('.') ? file.name : `${file.name}.svg`;
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
		} catch {
			window.open(file.fileUrl, '_blank');
		}
	};

	if (email === undefined || isLoading) {
		return <CardGridSkeleton cols={6} />;
	}

	if (!hasAccess) {
		return (
			<AccessGate
				feature="Biblioteca de Vetores"
				upgradeTier={upgradeTiers?.vetorizacao}
			/>
		);
	}

	return (
		<BibliotecaVetoresView
			currentFolderId={currentFolderId}
			setCurrentFolderId={setCurrentFolderId}
			contents={contents}
			contentsLoading={contentsLoading}
			breadcrumbs={breadcrumbs}
			handleDownload={handleDownload}
		/>
	);
}
