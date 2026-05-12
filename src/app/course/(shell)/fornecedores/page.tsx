'use client';

import { ExternalLink, Store } from 'lucide-react';
import Image from 'next/image';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { useChannelMessages } from '@/hooks/use-community';
import { formatMessageTime } from '@/utils/formatDate';

const FORNECEDORES_CHANNEL_ID = 'c24d2250-7ecc-4427-90c5-0cc0ba24f8e7';

export default function FornecedoresCoursePage() {
	const { data: messages, isLoading } = useChannelMessages(
		FORNECEDORES_CHANNEL_ID,
		{ limit: 50 },
	);

	return (
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
			) : !messages || messages.length === 0 ? (
				<EmptyState
					icon={Store}
					title="Nenhum fornecedor ainda"
					description="Os fornecedores indicados pela comunidade aparecerao aqui."
				/>
			) : (
				<div className="space-y-2">
					{[...messages].reverse().map((msg) => {
						const isImage =
							msg.fileUrl &&
							/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(msg.fileUrl);

						return (
							<div
								key={msg.id}
								className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-white/10 rounded-lg p-4 hover:border-violet-500/30 transition-colors"
							>
								<div className="flex items-start gap-3">
									{msg.avatar ? (
										<Image
											src={msg.avatar}
											alt={msg.userName ?? msg.user}
											width={36}
											height={36}
											className="w-9 h-9 rounded-full object-cover shrink-0"
										/>
									) : (
										<div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 text-violet-700 dark:text-violet-400 text-sm font-bold">
											{(msg.userName ?? msg.user).charAt(0).toUpperCase()}
										</div>
									)}

									<div className="flex-1 min-w-0">
										<div className="flex items-baseline gap-2 mb-1">
											<span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
												{msg.userName ?? msg.user}
											</span>
											<span className="font-mono text-xs text-slate-400 dark:text-gray-500">
												{formatMessageTime(msg.time)}
											</span>
										</div>

										{msg.content && (
											<p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
												{msg.content
													.split(/(https?:\/\/[^\s]+)/g)
													.map((part) =>
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
													)}
											</p>
										)}

										{msg.fileUrl && isImage && (
											<a
												href={msg.fileUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="mt-2 block"
											>
												<Image
													src={msg.fileUrl}
													alt="Imagem do fornecedor"
													width={400}
													height={300}
													className="rounded-lg max-h-64 w-auto object-contain border border-slate-200 dark:border-white/10"
												/>
											</a>
										)}

										{msg.fileUrl && !isImage && (
											<a
												href={msg.fileUrl}
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
	);
}
