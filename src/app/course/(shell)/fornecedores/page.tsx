'use client';

import { ExternalLink, Loader2, Store } from 'lucide-react';
import Image from 'next/image';
import { useChannelMessages } from '@/hooks/use-community';
import { formatMessageTime } from '@/utils/formatDate';

const FORNECEDORES_CHANNEL_ID = 'c24d2250-7ecc-4427-90c5-0cc0ba24f8e7';

export default function FornecedoresCoursePage() {
	const { data: messages, isLoading } = useChannelMessages(
		FORNECEDORES_CHANNEL_ID,
		{ limit: 50 },
	);

	return (
		<div className="p-4 md:p-8 max-w-[1400px] mx-auto">
			{/* Hero Banner */}
			<section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 p-6 md:p-10 mb-8">
				<div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
				<div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
				<div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
				<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
				<div className="relative z-10 flex items-center gap-4">
					<div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
						<Store className="w-7 h-7 text-white" />
					</div>
					<div>
						<h2 className="text-2xl md:text-3xl font-black text-white">
							Fornecedores
						</h2>
						<p className="mt-1 text-emerald-200 text-sm md:text-base">
							Fornecedores de insumos e máquinas indicados pela comunidade.
						</p>
					</div>
				</div>
			</section>

			{isLoading ? (
				<div className="flex justify-center py-24">
					<Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
				</div>
			) : !messages || messages.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800/50 rounded-2xl text-center">
					<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center mb-4">
						<Store className="w-8 h-8 text-green-500" />
					</div>
					<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
						Nenhum fornecedor ainda
					</h3>
					<p className="text-slate-500 dark:text-gray-500 text-sm max-w-xs">
						Os fornecedores indicados pela comunidade aparecerão aqui.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{[...messages].reverse().map((msg) => {
						const isImage =
							msg.fileUrl &&
							/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(msg.fileUrl);

						return (
							<div
								key={msg.id}
								className="bg-white dark:bg-[#1a1a1d] border border-slate-200 dark:border-gray-800/50 rounded-xl p-4 hover:scale-[1.01] hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
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
										<div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 text-white text-sm font-bold">
											{(msg.userName ?? msg.user).charAt(0).toUpperCase()}
										</div>
									)}

									<div className="flex-1 min-w-0">
										<div className="flex items-baseline gap-2 mb-1">
											<span className="text-sm font-semibold text-slate-800 dark:text-white">
												{msg.userName ?? msg.user}
											</span>
											<span className="text-xs text-slate-400 dark:text-gray-600">
												{formatMessageTime(msg.time)}
											</span>
										</div>

										{msg.content && (
											<p className="text-sm text-slate-700 dark:text-gray-300 whitespace-pre-wrap break-words">
												{msg.content
													.split(/(https?:\/\/[^\s]+)/g)
													.map((part) =>
														/^https?:\/\//.test(part) ? (
															<a
																key={part}
																href={part}
																target="_blank"
																rel="noopener noreferrer"
																className="text-green-600 dark:text-green-400 underline underline-offset-2 hover:text-green-500 inline-flex items-center gap-0.5"
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
													className="rounded-lg max-h-64 w-auto object-contain border border-slate-200 dark:border-gray-800/50"
												/>
											</a>
										)}

										{msg.fileUrl && !isImage && (
											<a
												href={msg.fileUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 hover:underline"
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
