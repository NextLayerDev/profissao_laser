'use client';

import { ArrowRight, Check, GraduationCap, Sparkles, Zap } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { CourseDetail, CourseDetailPlan } from '@/modules/courses';
import { formatCurrency } from '@/utils/format-currency';

function PlanColumn({
	coursePlan,
	featured,
	currentPlanKey,
}: {
	coursePlan: CourseDetailPlan;
	featured: boolean;
	currentPlanKey: string | null;
}) {
	const router = useRouter();
	const { plan, tools } = coursePlan;
	const isOwned = currentPlanKey === plan.key;

	const price =
		plan.price_monthly_cents != null
			? formatCurrency(plan.price_monthly_cents / 100, 'BRL')
			: 'Gratuito';

	return (
		<div
			className={`flex flex-col flex-1 sm:min-w-[165px] rounded-lg border p-4 transition-all duration-200 ${
				featured
					? 'border-violet-500/50 bg-violet-600/[0.05] dark:bg-violet-600/[0.08] shadow-lg shadow-violet-500/10'
					: 'border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.03]'
			}`}
		>
			{/* Plan header */}
			<div className="mb-3">
				{featured && (
					<div className="flex items-center gap-1 mb-2">
						<Sparkles className="w-3 h-3 text-violet-600 dark:text-violet-400" />
						<span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
							Mais popular
						</span>
					</div>
				)}
				<p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
					{plan.name}
				</p>
			</div>

			{/* Tools list */}
			<div className="flex-1 space-y-2 mb-4">
				{tools.map((t) => (
					<div key={t.tool.key} className="flex items-start gap-2">
						<div className="w-4 h-4 rounded-md bg-emerald-500/10 flex items-center justify-center mt-0.5 shrink-0">
							<Check className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
						</div>
						<div className="min-w-0">
							<p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-tight">
								{t.tool.name}
							</p>
							<p className="text-[10px] text-slate-400 dark:text-gray-500 leading-snug mt-0.5">
								{t.free_quota != null ? `${t.free_quota} grátis` : 'Ilimitado'}
								{' · '}
								<Zap className="w-2.5 h-2.5 inline-block text-yellow-500 -mt-0.5" />
								{t.tool.vox_cost} VOX/uso
							</p>
						</div>
					</div>
				))}
			</div>

			{/* Price + CTA */}
			<div
				className={`border-t pt-4 mt-auto ${
					featured
						? 'border-violet-500/20'
						: 'border-slate-200 dark:border-white/10'
				}`}
			>
				<p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1">
					Investimento
				</p>
				<p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
					{price}
				</p>
				{plan.price_monthly_cents != null && (
					<p className="text-[10px] text-slate-400 dark:text-gray-500 mb-3">
						/mês
					</p>
				)}
				<button
					type="button"
					onClick={
						isOwned
							? undefined
							: () => router.push(`/checkout/plano/${plan.key}`)
					}
					disabled={isOwned}
					className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm transition-all duration-300 ${
						isOwned
							? 'bg-emerald-500/10 dark:bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default'
							: featured
								? 'bg-violet-600 hover:bg-violet-400 text-white shadow-lg shadow-violet-500/20 cursor-pointer'
								: 'bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-white cursor-pointer'
					}`}
				>
					{isOwned ? (
						<>
							<Check className="w-4 h-4" />
							Seu plano atual
						</>
					) : (
						<>
							Começar agora
							<ArrowRight className="w-4 h-4" />
						</>
					)}
				</button>
			</div>
		</div>
	);
}

export function StoreCourseCard({
	course,
	currentPlanKey,
}: {
	course: CourseDetail;
	currentPlanKey: string | null;
}) {
	const [imgError, setImgError] = useState(false);

	const publishedPlans = course.plans.filter((p) => p.published);
	const featuredIdx =
		publishedPlans.length > 1 ? publishedPlans.length - 1 : -1;

	return (
		<div className="group relative bg-white dark:bg-[#16161a] rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 hover:border-violet-500/40 dark:hover:border-white/10 transition-all duration-500 shadow-sm dark:shadow-none">
			{/* Image header */}
			<div className="relative h-52 overflow-hidden">
				{course.image_url && !imgError ? (
					<>
						<Image
							src={course.image_url}
							alt={course.title}
							fill
							className="object-cover transition-transform duration-700 group-hover:scale-105"
							onError={() => setImgError(true)}
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#16161a] via-white/40 dark:via-[#16161a]/40 to-transparent" />
					</>
				) : (
					<div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-violet-700 to-orange-500">
						<div className="absolute inset-0 flex items-center justify-center">
							<GraduationCap className="w-16 h-16 text-white/10" />
						</div>
					</div>
				)}
				<div className="absolute bottom-0 left-0 right-0 p-5 z-10">
					<h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight drop-shadow-lg">
						{course.title}
					</h3>
				</div>
			</div>

			{/* Description */}
			<div className="px-5 pt-3 pb-2">
				{course.description && (
					<p className="text-[13px] text-slate-500 dark:text-gray-400 leading-relaxed line-clamp-2">
						{course.description}
					</p>
				)}
			</div>

			{/* Plan columns */}
			{publishedPlans.length > 0 && (
				<div className="flex flex-col sm:flex-row gap-3 px-5 pb-5 pt-3">
					{publishedPlans.map((cp, i) => (
						<PlanColumn
							key={cp.plan.key}
							coursePlan={cp}
							featured={i === featuredIdx}
							currentPlanKey={currentPlanKey}
						/>
					))}
				</div>
			)}
		</div>
	);
}
