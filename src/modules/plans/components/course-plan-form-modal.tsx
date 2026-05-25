'use client';

import { useState } from 'react';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useAdminCourses } from '@/modules/courses';
import type { PlanDetailsCourse } from '../types/plan-details';

interface Props {
	editing: PlanDetailsCourse | null;
	/** Slugs já vinculados (escondidos do dropdown ao criar). */
	excludeSlugs: string[];
	pending: boolean;
	onClose: () => void;
	onSubmit: (args: {
		slug: string;
		price_monthly_cents: number | null;
		price_yearly_cents: number | null;
		published: boolean;
	}) => void;
}

export function CoursePlanFormModal({
	editing,
	excludeSlugs,
	pending,
	onClose,
	onSubmit,
}: Props) {
	const courses = useAdminCourses();

	const [slug, setSlug] = useState(editing?.course.slug ?? '');
	const [monthly, setMonthly] = useState(
		centsToReais(editing?.course_plan.price_monthly_cents ?? null),
	);
	const [yearly, setYearly] = useState(
		centsToReais(editing?.course_plan.price_yearly_cents ?? null),
	);
	const [published, setPublished] = useState(
		editing?.course_plan.published ?? true,
	);

	const availableCourses = (courses.data ?? []).filter(
		(c) => !excludeSlugs.includes(c.slug),
	);

	const canSubmit = !pending && !!slug && (monthly.trim() || yearly.trim());

	return (
		<ModalOverlay onClose={onClose} tone="plans">
			<div className="p-6 space-y-4">
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">
					{editing ? 'Editar preços do curso' : 'Vincular curso'}
				</h3>

				{editing ? (
					<div>
						<p className="text-sm font-medium text-slate-900 dark:text-white">
							{editing.course.title}
						</p>
						<p className="text-xs text-slate-500 font-mono">
							/{editing.course.slug}
						</p>
					</div>
				) : (
					<Field label="Curso">
						<select
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] px-3 py-2 text-sm"
						>
							<option value="">Selecione...</option>
							{availableCourses.map((c) => (
								<option key={c.id} value={c.slug}>
									{c.title} (/{c.slug})
								</option>
							))}
						</select>
						{availableCourses.length === 0 && !courses.isLoading && (
							<p className="text-xs text-amber-500 mt-1">
								Todos os cursos já estão vinculados a este plano.
							</p>
						)}
					</Field>
				)}

				<div className="grid grid-cols-2 gap-3">
					<Field label="Preço mensal (R$)">
						<input
							type="number"
							min={0}
							step="0.01"
							value={monthly}
							onChange={(e) => setMonthly(e.target.value)}
							placeholder="opcional"
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
						/>
					</Field>
					<Field label="Preço anual (R$)">
						<input
							type="number"
							min={0}
							step="0.01"
							value={yearly}
							onChange={(e) => setYearly(e.target.value)}
							placeholder="opcional"
							className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
						/>
					</Field>
				</div>
				<p className="text-xs text-slate-500">
					Pelo menos um dos preços precisa ser informado. Stripe Product/Prices
					são criados automaticamente pelo backend.
				</p>

				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={published}
						onChange={(e) => setPublished(e.target.checked)}
					/>
					Publicado (visível no catálogo)
				</label>

				<div className="flex gap-3 pt-2">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-white/10"
					>
						Cancelar
					</button>
					<button
						type="button"
						disabled={!canSubmit}
						onClick={() =>
							onSubmit({
								slug,
								price_monthly_cents: reaisToCents(monthly),
								price_yearly_cents: reaisToCents(yearly),
								published,
							})
						}
						className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white disabled:opacity-60"
					>
						{pending ? 'Salvando...' : 'Salvar'}
					</button>
				</div>
			</div>
		</ModalOverlay>
	);
}

function centsToReais(cents: number | null): string {
	if (cents == null) return '';
	return (cents / 100).toFixed(2);
}

function reaisToCents(raw: string): number | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const n = Number(trimmed);
	if (!Number.isFinite(n) || n < 0) return null;
	return Math.round(n * 100);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: label wraps children implicitly
		<label className="block">
			<span className="block text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5">
				{label}
			</span>
			{children}
		</label>
	);
}
