'use client';

import {
	ChevronDown,
	ChevronUp,
	Loader2,
	MessageSquare,
	Plus,
	Search,
	Send,
	Tag,
	Trash2,
	X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	useCreateForumCategory,
	useCreateForumReply,
	useDeleteForumCategory,
	useDeleteForumPost,
	useForumCategories,
	useForumPost,
	useForumPosts,
	useUpdateForumPost,
} from '@/hooks/use-forum';
import { isAdmin } from '@/lib/auth';
import type { ForumSort } from '@/services/forum';
import type { ForumPost } from '@/types/forum';

const SORT_OPTIONS: { value: ForumSort; label: string }[] = [
	{ value: 'recent', label: 'Mais recentes' },
	{ value: 'top', label: 'Mais votados' },
	{ value: 'unanswered', label: 'Sem resposta' },
];

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return 'agora';
	if (mins < 60) return `${mins}min atrás`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h atrás`;
	const days = Math.floor(hours / 24);
	return `${days}d atrás`;
}

function PostReplyPanel({ postId }: { postId: string }) {
	const { data: post, isLoading } = useForumPost(postId);
	const [replyContent, setReplyContent] = useState('');
	const createReply = useCreateForumReply(postId);

	function handleReply(e: React.FormEvent) {
		e.preventDefault();
		if (!replyContent.trim()) return;
		createReply.mutate(replyContent.trim(), {
			onSuccess: () => {
				setReplyContent('');
				toast.success('Resposta enviada!');
			},
			onError: () => toast.error('Erro ao enviar resposta'),
		});
	}

	if (isLoading || !post) {
		return (
			<div className="flex justify-center py-4">
				<Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
			</div>
		);
	}

	return (
		<div className="mt-3 space-y-3">
			{/* Conteúdo da pergunta */}
			<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
				{post.content}
			</p>

			{/* Respostas existentes */}
			{post.replies && post.replies.length > 0 && (
				<div className="space-y-2">
					<p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide">
						{post.replies.length}{' '}
						{post.replies.length === 1 ? 'resposta' : 'respostas'}
					</p>
					{post.replies.map((reply) => (
						<div
							key={reply.id}
							className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"
						>
							<div className="flex items-center justify-between mb-1">
								<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
									{reply.author}
									{reply.isInstructor && (
										<span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 rounded-full font-medium">
											Instrutor
										</span>
									)}
								</span>
								<span className="text-xs text-slate-400 dark:text-slate-500">
									{timeAgo(reply.createdAt)}
								</span>
							</div>
							<p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
								{reply.content}
							</p>
						</div>
					))}
				</div>
			)}

			{/* Form de resposta */}
			<form onSubmit={handleReply} className="space-y-2">
				<textarea
					value={replyContent}
					onChange={(e) => setReplyContent(e.target.value)}
					placeholder="Escreva sua resposta..."
					rows={3}
					className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
				/>
				<div className="flex justify-end">
					<button
						type="submit"
						disabled={createReply.isPending || !replyContent.trim()}
						className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-xl transition-colors"
					>
						{createReply.isPending ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Send className="w-3.5 h-3.5" />
						)}
						Responder
					</button>
				</div>
			</form>
		</div>
	);
}

function PostItem({ post }: { post: ForumPost }) {
	const [expanded, setExpanded] = useState(false);
	const [admin, setAdmin] = useState(false);
	useEffect(() => setAdmin(isAdmin()), []);
	const deletePost = useDeleteForumPost();
	const updatePost = useUpdateForumPost();
	const { data: categories = [] } = useForumCategories(admin);

	function handleDelete() {
		if (!confirm('Excluir esta dúvida e todas as respostas?')) return;
		deletePost.mutate(post.id, {
			onSuccess: () => toast.success('Dúvida removida'),
			onError: () => toast.error('Erro ao remover'),
		});
	}

	function handleChangeCategory(categoryId: string) {
		if (!categoryId) return;
		updatePost.mutate(
			{ id: post.id, categoryId },
			{
				onSuccess: () => toast.success('Tema atualizado'),
				onError: () => toast.error('Erro ao mudar o tema'),
			},
		);
	}

	return (
		<div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
			<div className="flex items-stretch bg-white dark:bg-white/5">
				<button
					type="button"
					onClick={() => setExpanded((v) => !v)}
					className="flex-1 min-w-0 flex items-start gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
				>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap mb-1">
							{post.categoryName ? (
								<span
									className="px-2 py-0.5 text-[11px] font-semibold rounded-full shrink-0"
									style={{
										backgroundColor: `${post.categoryColor ?? '#7c3aed'}20`,
										color: post.categoryColor ?? '#7c3aed',
									}}
								>
									{post.categoryName}
								</span>
							) : (
								<span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400 shrink-0">
									Sem tema
								</span>
							)}
							{post.repliesCount === 0 && (
								<span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 shrink-0">
									Sem resposta
								</span>
							)}
						</div>
						<p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug truncate">
							{post.title}
						</p>
						<div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500">
							<span>{post.author}</span>
							<span>•</span>
							<span>{timeAgo(post.createdAt)}</span>
							<span>•</span>
							<span className="flex items-center gap-1">
								<MessageSquare className="w-3 h-3" />
								{post.repliesCount}
							</span>
						</div>
					</div>
					{expanded ? (
						<ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
					) : (
						<ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
					)}
				</button>
				{admin && (
					<button
						type="button"
						onClick={handleDelete}
						disabled={deletePost.isPending}
						title="Excluir dúvida (admin)"
						className="shrink-0 px-3 flex items-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-l border-slate-100 dark:border-white/5"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				)}
			</div>

			{expanded && (
				<div className="px-3 pb-3 bg-white dark:bg-white/5 border-t border-slate-100 dark:border-white/5">
					{admin && categories.length > 0 && (
						<div className="flex items-center gap-2 mt-3">
							<Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
							<select
								value={post.categoryId ?? ''}
								onChange={(e) => handleChangeCategory(e.target.value)}
								disabled={updatePost.isPending}
								title="Mudar tema (admin)"
								className="px-2 py-1 text-xs bg-slate-50 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
							>
								<option value="" disabled>
									{post.categoryName
										? `Tema: ${post.categoryName} — mudar…`
										: 'Definir tema…'}
								</option>
								{categories.map((cat) => (
									<option key={cat.id} value={cat.id}>
										{cat.name}
									</option>
								))}
							</select>
						</div>
					)}
					<PostReplyPanel postId={post.id} />
				</div>
			)}
		</div>
	);
}

/** Gestão de temas do fórum (criar/excluir) — admin. */
function ThemesManager() {
	const { data: categories = [] } = useForumCategories();
	const createCategory = useCreateForumCategory();
	const deleteCategory = useDeleteForumCategory();
	const [showForm, setShowForm] = useState(false);
	const [name, setName] = useState('');
	const [color, setColor] = useState('#7c3aed');

	function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) return;
		createCategory.mutate(
			{ name: name.trim(), color },
			{
				onSuccess: () => {
					toast.success('Tema criado!');
					setName('');
					setShowForm(false);
				},
				onError: () => toast.error('Erro ao criar tema'),
			},
		);
	}

	function handleDelete(id: string, catName: string) {
		if (
			!confirm(
				`Excluir o tema "${catName}"? Os posts dele ficam "Sem tema" (dá pra reatribuir depois).`,
			)
		)
			return;
		deleteCategory.mutate(id, {
			onSuccess: () => toast.success('Tema excluído'),
			onError: () => toast.error('Erro ao excluir tema'),
		});
	}

	return (
		<div className="mb-4 p-4 rounded-2xl border border-slate-200 dark:border-white/8 bg-white/60 dark:bg-white/[0.03]">
			<div className="flex items-center justify-between gap-3 mb-3">
				<h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
					<Tag className="w-3.5 h-3.5" />
					Temas do fórum
				</h3>
				<button
					type="button"
					onClick={() => setShowForm((s) => !s)}
					className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
				>
					<Plus className="w-3.5 h-3.5" />
					Novo tema
				</button>
			</div>

			{showForm && (
				<form onSubmit={handleCreate} className="flex items-center gap-2 mb-3">
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Nome do tema (ex: Gravação em metal)"
						maxLength={60}
						className="flex-1 px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
					/>
					<input
						type="color"
						value={color}
						onChange={(e) => setColor(e.target.value)}
						title="Cor do tema"
						className="w-9 h-9 rounded-lg border border-slate-200 dark:border-white/10 bg-transparent cursor-pointer"
					/>
					<button
						type="submit"
						disabled={createCategory.isPending || !name.trim()}
						className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-lg transition-colors"
					>
						{createCategory.isPending ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							'Criar'
						)}
					</button>
				</form>
			)}

			{categories.length === 0 ? (
				<p className="text-xs text-slate-500 dark:text-gray-400">
					Nenhum tema ainda — crie o primeiro pra organizar o fórum.
				</p>
			) : (
				<div className="flex gap-2 flex-wrap">
					{categories.map((cat) => (
						<span
							key={cat.id}
							className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 text-xs font-semibold rounded-full"
							style={{
								backgroundColor: `${cat.color ?? '#7c3aed'}20`,
								color: cat.color ?? '#7c3aed',
							}}
						>
							{cat.name}
							<span className="opacity-70 font-normal">{cat.postsCount}</span>
							<button
								type="button"
								onClick={() => handleDelete(cat.id, cat.name)}
								title={`Excluir tema ${cat.name}`}
								className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
							>
								<X className="w-3 h-3" />
							</button>
						</span>
					))}
				</div>
			)}
		</div>
	);
}

export function ForumSection() {
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [categoryId, setCategoryId] = useState('');
	const [sort, setSort] = useState<ForumSort>('recent');
	const [admin, setAdmin] = useState(false);
	useEffect(() => setAdmin(isAdmin()), []);

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
		return () => clearTimeout(t);
	}, [search]);

	const { data: categories = [] } = useForumCategories();
	const { data, isLoading } = useForumPosts({
		limit: 30,
		search: debouncedSearch || undefined,
		categoryId: categoryId || undefined,
		sort: sort === 'recent' ? undefined : sort,
	});
	const posts = data?.posts ?? [];
	const hasFilters = !!debouncedSearch || !!categoryId || sort !== 'recent';

	return (
		<div className="lg:col-span-3">
			{admin && <ThemesManager />}

			<h3 className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-4">
				Dúvidas do Fórum
			</h3>

			{/* Filtros */}
			<div className="flex flex-col sm:flex-row gap-2 mb-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Buscar dúvidas..."
						className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
					/>
				</div>
				<select
					value={sort}
					onChange={(e) => setSort(e.target.value as ForumSort)}
					className="px-3 py-2 text-sm bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
				>
					{SORT_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</select>
				<select
					value={categoryId}
					onChange={(e) => setCategoryId(e.target.value)}
					className="px-3 py-2 text-sm bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
				>
					<option value="">Todos os temas</option>
					<option value="none">Sem tema</option>
					{categories.map((cat) => (
						<option key={cat.id} value={cat.id}>
							{cat.name}
						</option>
					))}
				</select>
			</div>

			<div className="bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-white/8 shadow-sm dark:shadow-none overflow-hidden">
				{isLoading ? (
					<div className="flex justify-center py-10">
						<Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
					</div>
				) : posts.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-600">
						<MessageSquare className="w-8 h-8 mb-2" />
						<p className="text-sm">
							{hasFilters
								? 'Nenhuma dúvida com esses filtros'
								: 'Nenhuma dúvida no fórum'}
						</p>
					</div>
				) : (
					<div className="divide-y divide-slate-100 dark:divide-white/5">
						{posts.map((post) => (
							<div key={post.id} className="p-3">
								<PostItem post={post} />
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
