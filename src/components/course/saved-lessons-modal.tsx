'use client';

import { Bookmark, Loader2, LogIn, Play, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
	useRemoveSavedLesson,
	useSavedLessons,
} from '@/hooks/use-saved-lessons';
import { getToken } from '@/lib/auth';
import type { SavedLesson } from '@/types/saved-lessons';

interface SavedLessonsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

function SavedLessonItem({
	item,
	onClose,
}: {
	item: SavedLesson;
	onClose: () => void;
}) {
	const removeMutation = useRemoveSavedLesson();

	const handleRemove = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		removeMutation.mutate(item.lessonId, {
			onSuccess: () => toast.success('Aula removida das salvas'),
			onError: () => toast.error('Erro ao remover aula'),
		});
	};

	return (
		<div className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group">
			<div className="flex-1 min-w-0">
				<p className="font-medium text-white truncate">{item.lesson.title}</p>
				<p className="text-slate-400 text-sm truncate">{item.courseName}</p>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<Link
					href={`/course/${item.courseSlug}?lesson=${item.lessonId}`}
					onClick={onClose}
					className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
				>
					<Play className="w-4 h-4" />
					Assistir
				</Link>
				<button
					type="button"
					onClick={handleRemove}
					disabled={removeMutation.isPending}
					className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
					title="Remover"
				>
					{removeMutation.isPending ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Trash2 className="w-4 h-4" />
					)}
				</button>
			</div>
		</div>
	);
}

export function SavedLessonsModal({ isOpen, onClose }: SavedLessonsModalProps) {
	const isLoggedIn = !!getToken('customer') || !!getToken('user');
	const { data: savedLessons = [], isLoading } = useSavedLessons();

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			>
				<span className="sr-only">Fechar</span>
			</button>

			<div className="relative bg-[#1a1a1d] border border-gray-800 rounded-2xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col shadow-2xl">
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-[#252528] z-10"
				>
					<X className="w-4 h-4" />
				</button>

				<div className="p-6 pb-4 shrink-0">
					<div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 mb-5 mx-auto">
						<Bookmark className="w-7 h-7 text-white" />
					</div>
					<h2 className="text-lg font-bold text-white text-center mb-1">
						Minhas Aulas Salvas
					</h2>
				</div>

				<div className="flex-1 overflow-y-auto px-6 pb-6">
					{!isLoggedIn ? (
						<div className="text-center py-8">
							<p className="text-sm text-gray-400 mb-6">
								Faça login para ver suas aulas salvas.
							</p>
							<Link
								href="/login"
								onClick={onClose}
								className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
							>
								<LogIn className="w-4 h-4" />
								Entrar na minha conta
							</Link>
						</div>
					) : isLoading ? (
						<div className="flex flex-col items-center justify-center py-12">
							<Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-3" />
							<p className="text-sm text-slate-400">A carregar...</p>
						</div>
					) : savedLessons.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-slate-500">
							<Bookmark className="w-12 h-12 mb-3 opacity-50" />
							<p className="text-sm font-medium">Nenhuma aula salva</p>
							<p className="text-xs mt-1">
								Salve aulas para aceder rapidamente mais tarde.
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{savedLessons.map((item) => (
								<SavedLessonItem key={item.id} item={item} onClose={onClose} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
