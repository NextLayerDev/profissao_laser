'use client';

import { ExternalLink, Store } from 'lucide-react';
import { SubscriptionGate } from '@/components/course/subscription-gate';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { useFornecedores } from '@/hooks/use-fornecedores';
import type { Fornecedor } from '@/types/fornecedor';
import { formatMessageTime } from '@/utils/formatDate';

/** Renderiza o conteúdo do fornecedor com os links clicáveis (markdown simples). */
function renderContent(content: string) {
	return content.split(/(https?:\/\/[^\s]+)/g).map((part) =>
		/^https?:\/\//.test(part) ? (
			<a
				key={part}
				href={part}
				target="_blank"
				rel="noopener noreferrer"
				className="text-violet-700 dark:text-violet-400 underline underline-offset-2 hover:text-violet-600 inline-flex items-center gap-0.5"
			>
				{part}
				<ExternalLink className="w-3 h-3 inline" />
			</a>
		) : (
			part
		),
	);
}

export default function FornecedoresCoursePage() {
	const { data, isLoading } = useFornecedores();
	const fornecedores = (data ?? []).filter((f) => f.isActive);

	return (
		<SubscriptionGate>
			<div className="p-4 md:p-8">
				<PageHeader
					title="Fornecedores"
					subtitle="Fornecedores de insumos e maquinas indicados pela comunidade."
					icon={Store}
				/>

				{isLoading ? (
					<div className="animate-pulse space-y-3">
						{Array.from({ length: 4 }).map((_, i) => (
							<div
								key={i}
								className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-4"
							>
								<div className="flex items-start gap-3">
									<div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/5 shrink-0" />
									<div className="flex-1 space-y-2">
										<div className="h-4 w-32 rounded bg-slate-200 dark:bg-white/5" />
										<div className="h-3 w-full rounded bg-slate-200 dark:bg-white/5" />
										<div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-white/5" />
									</div>
								</div>
							</div>
						))}
					</div>
				) : fornecedores.length === 0 ? (
					<EmptyState
						icon={Store}
						title="Nenhum fornecedor ainda"
						description="Os fornecedores indicados pela comunidade aparecerao aqui."
					/>
				) : (
					<div className="space-y-2">
						{fornecedores.map((f: Fornecedor) => {
							const isImage =
								f.imageUrl &&
								/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.imageUrl);

							return (
								<div
									key={f.id}
									className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-lg p-4 hover:border-violet-500/30 transition-colors"
								>
									<div className="flex items-start gap-3">
										<div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 text-violet-700 dark:text-violet-400">
											<Store className="w-4 h-4" />
										</div>

										<div className="flex-1 min-w-0">
											<div className="flex items-baseline gap-2 mb-1 flex-wrap">
												<span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
													{f.company}
												</span>
												{f.authorName && (
													<span className="font-mono text-xs text-slate-400 dark:text-gray-500">
														{formatMessageTime(f.createdAt)}
													</span>
												)}
											</div>

											{f.content && (
												<p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
													{renderContent(f.content)}
												</p>
											)}

											{f.imageUrl && isImage && (
												<a
													href={f.imageUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="mt-2 block"
												>
													{/* URL externa de host arbitrário (admin) — <img> evita o allowlist do next/image. */}
													<img
														src={f.imageUrl}
														alt={f.company}
														loading="lazy"
														className="rounded-lg max-h-64 w-auto object-contain border border-slate-200 dark:border-white/10"
													/>
												</a>
											)}

											{f.imageUrl && !isImage && (
												<a
													href={f.imageUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="mt-2 inline-flex items-center gap-1.5 text-xs text-violet-700 dark:text-violet-400 hover:underline"
												>
													<ExternalLink className="w-3.5 h-3.5" />
													Ver arquivo
												</a>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</SubscriptionGate>
	);
}
