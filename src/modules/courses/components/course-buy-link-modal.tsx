'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { formatCurrency } from '@/utils/format-currency';
import type { CourseDetail } from '../types/courses';

/** Com plano vai direto ao checkout; sem plano, à página do curso. */
export function buyLink(slug: string, planKey?: string): string {
	const origin = typeof window === 'undefined' ? '' : window.location.origin;
	return planKey
		? `${origin}/checkout/plano/${planKey}`
		: `${origin}/comprar/${slug}`;
}

export function CourseBuyLinkModal({
	course,
	onClose,
}: {
	course: CourseDetail;
	onClose: () => void;
}) {
	const publishedPlans = course.plans.filter((p) => p.published);
	const [copied, setCopied] = useState<string | null>(null);

	async function copy(planKey: string | undefined, id: string) {
		const url = buyLink(course.slug, planKey);
		await navigator.clipboard.writeText(url);
		setCopied(id);
		toast.success('Link copiado', { description: url });
	}

	return (
		<ModalOverlay onClose={onClose} tone="courses">
			<div className="p-6 space-y-4">
				<div>
					<h3 className="text-lg font-bold text-slate-900 dark:text-white">
						Link de compra
					</h3>
					<p className="text-sm text-slate-500 dark:text-gray-400">
						{course.title}
					</p>
				</div>

				<div className="space-y-2">
					<LinkRow
						title="Curso completo"
						subtitle="Página do curso com todos os planos publicados"
						url={buyLink(course.slug)}
						copied={copied === 'all'}
						onCopy={() => copy(undefined, 'all')}
					/>

					{publishedPlans.length === 0 ? (
						<p className="text-xs text-slate-400 dark:text-gray-600 italic pt-2">
							Nenhum plano publicado para gerar link específico.
						</p>
					) : (
						publishedPlans.map(({ plan }) => (
							<LinkRow
								key={plan.id}
								title={plan.name}
								subtitle={
									plan.price_monthly_cents != null
										? `${formatCurrency(plan.price_monthly_cents / 100, 'BRL')}/mês`
										: plan.key
								}
								url={buyLink(course.slug, plan.key)}
								copied={copied === plan.key}
								onCopy={() => copy(plan.key, plan.key)}
							/>
						))
					)}
				</div>

				<div className="flex justify-end pt-2">
					<button
						type="button"
						onClick={onClose}
						className="text-sm px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
					>
						Fechar
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}

function LinkRow({
	title,
	subtitle,
	url,
	copied,
	onCopy,
}: {
	title: string;
	subtitle: string;
	url: string;
	copied: boolean;
	onCopy: () => void;
}) {
	return (
		<div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] px-3 py-2.5">
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
					{title}
				</p>
				<p className="text-xs text-slate-500 dark:text-gray-500">{subtitle}</p>
				<p className="text-[11px] font-mono text-slate-400 dark:text-gray-600 truncate mt-0.5">
					{url}
				</p>
			</div>
			<button
				type="button"
				onClick={onCopy}
				className="shrink-0 flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-violet-500/30 bg-violet-600/10 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-medium hover:bg-violet-600/20 dark:hover:bg-violet-500/25 transition-colors"
			>
				{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
				{copied ? 'Copiado' : 'Copiar'}
			</button>
		</div>
	);
}
