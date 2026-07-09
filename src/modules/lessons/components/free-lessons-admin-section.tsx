'use client';

import {
	BookOpen,
	ChevronDown,
	Gift,
	Loader2,
	Lock,
	Search,
	Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/stat-card';
import {
	type FreeLessonAdminEntry,
	useAdminFreeLessons,
	useToggleLessonFree,
} from '../hooks/use-admin-free-lessons';

function LessonToggle({
	lesson,
	onToggle,
	disabled,
}: {
	lesson: FreeLessonAdminEntry;
	onToggle: () => void;
	disabled: boolean;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={lesson.is_free}
			aria-label={
				lesson.is_free
					? `Tornar "${lesson.title}" paga`
					: `Tornar "${lesson.title}" grátis`
			}
			disabled={disabled}
			onClick={onToggle}
			className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait ${
				lesson.is_free ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'
			}`}
		>
			<span
				className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
					lesson.is_free ? 'translate-x-5' : 'translate-x-0'
				}`}
			/>
		</button>
	);
}

function CourseGroupCard({
	group,
	search,
}: {
	group: ReturnType<typeof useAdminFreeLessons>['groups'][number];
	search: string;
}) {
	const [open, setOpen] = useState(search.length > 0);
	const toggleMut = useToggleLessonFree();
	const [pendingId, setPendingId] = useState<string | null>(null);

	useEffect(() => {
		if (search.length > 0) setOpen(true);
	}, [search]);

	const lessons = useMemo(() => {
		if (!search) return group.lessons;
		const q = search.toLowerCase();
		if (group.course.title.toLowerCase().includes(q)) return group.lessons;
		return group.lessons.filter(
			(l) =>
				l.title.toLowerCase().includes(q) ||
				l.module.title.toLowerCase().includes(q),
		);
	}, [group.lessons, search, group.course.title]);

	if (search && lessons.length === 0) return null;

	let lastModuleId: string | null = null;

	return (
		<div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
			>
				<BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
				<span className="flex-1 min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white">
					{group.course.title}
				</span>
				<span
					className={`text-xs px-2 py-1 rounded-md font-medium tabular-nums shrink-0 ${
						group.freeCount > 0
							? 'bg-emerald-500/15 text-emerald-600'
							: 'bg-slate-500/10 text-slate-500'
					}`}
				>
					{group.freeCount} grátis · {group.lessons.length} aulas
				</span>
				<ChevronDown
					className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
				/>
			</button>

			{open && (
				<ul className="border-t border-slate-100 dark:border-white/5 divide-y divide-slate-100 dark:divide-white/5">
					{lessons.map((lesson) => {
						const showModuleHeader = lesson.module.id !== lastModuleId;
						lastModuleId = lesson.module.id;
						return (
							<li key={lesson.id}>
								{showModuleHeader && (
									<div className="px-4 pt-3 pb-1 text-xs font-medium text-slate-400 dark:text-gray-500 uppercase tracking-wide">
										{lesson.module.title}
									</div>
								)}
								<div className="flex items-center gap-3 px-4 py-2.5">
									{lesson.is_free ? (
										<Gift className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
									) : (
										<Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
									)}
									<span className="flex-1 min-w-0 truncate text-sm text-slate-700 dark:text-gray-200">
										{lesson.title}
									</span>
									<LessonToggle
										lesson={lesson}
										disabled={toggleMut.isPending && pendingId === lesson.id}
										onToggle={() => {
											setPendingId(lesson.id);
											toggleMut.mutate(
												{ id: lesson.id, is_free: !lesson.is_free },
												{ onSettled: () => setPendingId(null) },
											);
										}}
									/>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

export function FreeLessonsAdminSection() {
	const [search, setSearch] = useState('');
	const { groups, totalLessons, totalFree, isLoading, isError } =
		useAdminFreeLessons();

	return (
		<div>
			<p className="text-slate-600 dark:text-gray-400 mb-6">
				Escolha quais aulas ficam abertas para quem ainda não assinou.
			</p>

			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
				<StatCard
					value={totalLessons}
					label="Aulas no catálogo"
					icon={BookOpen}
				/>
				<StatCard
					value={totalFree}
					label="Liberadas como grátis"
					icon={Gift}
					color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
				/>
				<StatCard
					value={groups.filter((g) => g.freeCount > 0).length}
					label="Cursos com prévia"
					icon={Sparkles}
					color="bg-sky-500/10 text-sky-600 dark:text-sky-400"
				/>
			</div>

			<div className="relative mb-4">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Buscar aula, módulo ou curso..."
					className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-colors"
				/>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-20">
					<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
				</div>
			) : isError ? (
				<EmptyState
					icon={Gift}
					title="Não foi possível carregar as aulas"
					description="Tente novamente em instantes."
				/>
			) : groups.length === 0 ? (
				<EmptyState
					icon={Gift}
					title="Nenhum curso encontrado"
					description="Crie um curso com módulos e aulas para liberar prévias grátis."
				/>
			) : (
				<div className="space-y-3">
					{groups.map((group) => (
						<CourseGroupCard
							key={group.course.id}
							group={group}
							search={search.trim()}
						/>
					))}
				</div>
			)}
		</div>
	);
}
