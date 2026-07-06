'use client';

import { History, Loader2, Package } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import {
	VoxesHistorySkeleton,
	VoxesPackagesSkeleton,
} from '@/components/ui/skeletons/voxes-skeleton';
import { VoxxysIcon } from '@/components/ui/voxxys-icon';
import { useIsTestUnlimited } from '@/hooks/use-is-test-unlimited';
import {
	useMyVoxes,
	useVoxPackages,
	VOX_LEDGER_REASON_LABELS,
	type VoxLedgerReason,
	type VoxPackage,
} from '@/modules/voxes';
import { VoxPurchaseModal } from './vox-purchase-modal';

const REASON_CLASS: Record<VoxLedgerReason, string> = {
	purchase: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
	spend: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
	refund: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
	adjustment: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

export function CreditsView() {
	const searchParams = useSearchParams();
	const hasSession = !!searchParams.get('session_id');

	const { data: voxes, isLoading: voxesLoading, refetch } = useMyVoxes();
	const { data: packages, isLoading: pkgLoading } = useVoxPackages();
	const unlimited = useIsTestUnlimited();
	const [buyingPkg, setBuyingPkg] = useState<VoxPackage | null>(null);

	const balance = voxes?.balance ?? null;
	const ledger = voxes?.ledger ?? [];

	// Polling pós-Stripe: revalida saldo até ~6x quando volta com session_id
	const [processing, setProcessing] = useState(hasSession);
	const baselineRef = useRef<number | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — polling effect only re-runs when session_id appears
	useEffect(() => {
		if (!hasSession) return;
		baselineRef.current = voxes?.balance ?? 0;
		let attempts = 0;
		const id = setInterval(async () => {
			attempts += 1;
			const res = await refetch();
			const current = res.data?.balance ?? 0;
			if (baselineRef.current !== null && current > baselineRef.current) {
				setProcessing(false);
				clearInterval(id);
			} else if (attempts >= 6) {
				setProcessing(false);
				clearInterval(id);
			}
		}, 4000);
		return () => clearInterval(id);
	}, [hasSession]);

	return (
		<div className="px-4 md:px-8 py-6 space-y-8">
			<PageHeader title="Voxxys" subtitle="Seu saldo, pacotes e histórico" />

			{processing && (
				<div className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/20 p-4 flex items-center gap-3">
					<Loader2 className="w-4 h-4 text-violet-600 animate-spin" />
					<p className="text-sm text-slate-700 dark:text-slate-200">
						Pagamento em processamento — o saldo aparece em instantes.
					</p>
				</div>
			)}

			{/* Saldo */}
			<div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d]">
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/15 via-transparent to-fuchsia-500/10" />
				<div className="relative p-6 flex items-center gap-5">
					<div className="relative shrink-0">
						<div
							aria-hidden
							className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-violet-500/30 blur-2xl"
						/>
						<img
							src="/img/voxxys-3d.png"
							alt="Voxxys"
							className="relative h-24 w-auto sm:h-28 object-contain drop-shadow-[0_10px_28px_rgba(124,58,237,0.45)]"
						/>
					</div>
					<div>
						<p className="text-sm text-slate-500 dark:text-gray-400">
							Saldo atual
						</p>
						<p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
							{unlimited ? (
								<>
									Ilimitado{' '}
									<span className="text-base font-medium text-slate-500">
										(conta teste)
									</span>
								</>
							) : (
								<>
									{balance ?? '—'}{' '}
									<span className="text-base font-medium text-slate-500">
										voxxys
									</span>
								</>
							)}
						</p>
						<p className="text-xs text-violet-600/80 dark:text-violet-400/80 font-medium mt-0.5">
							A moeda da plataforma
						</p>
					</div>
				</div>
			</div>

			{/* O que são Voxxys? */}
			<div className="rounded-2xl border border-violet-200/70 dark:border-violet-500/20 bg-violet-50/60 dark:bg-violet-500/[0.06] p-5 flex gap-4">
				<div className="w-11 h-11 rounded-xl bg-violet-500/15 grid place-items-center shrink-0">
					<VoxxysIcon className="w-6 h-6" />
				</div>
				<div>
					<h3 className="font-semibold text-slate-900 dark:text-white">
						O que são Voxxys?
					</h3>
					<p className="text-sm text-slate-600 dark:text-gray-300 mt-1 leading-relaxed">
						Voxxys são a moeda da plataforma. Você usa voxxys para acessar as
						ferramentas (como a vetorização de imagens): cada uso consome uma
						quantidade de voxxys. Compre um pacote e gaste conforme o uso.
					</p>
				</div>
			</div>

			{/* Pacotes */}
			<section>
				<h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-4">
					<Package className="w-4 h-4" /> Comprar voxxys
				</h3>
				{pkgLoading ? (
					<VoxesPackagesSkeleton />
				) : (packages ?? []).length === 0 ? (
					<p className="text-center text-sm text-slate-500 dark:text-gray-400 py-12">
						Nenhum pacote disponível no momento.
					</p>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{(packages ?? []).map((p) => (
							<div
								key={p.id}
								className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] p-5 flex flex-col"
							>
								<p className="font-bold text-slate-900 dark:text-white">
									{p.name}
								</p>
								<p className="mt-4 flex items-center gap-1.5 text-2xl font-bold text-violet-600">
									<VoxxysIcon className="w-5 h-5" />
									{p.vox_amount}{' '}
									<span className="text-sm font-medium text-slate-500">
										voxxys
									</span>
								</p>
								<p className="text-sm text-slate-500 dark:text-gray-400">
									R$ {(p.price_cents / 100).toFixed(2)}
								</p>
								{!p.stripe_price_id && (
									<p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
										Pacote indisponível para compra no momento.
									</p>
								)}
								<button
									type="button"
									onClick={() => setBuyingPkg(p)}
									disabled={!p.stripe_price_id}
									className="mt-4 w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
								>
									Comprar
								</button>
							</div>
						))}
					</div>
				)}
			</section>

			{/* Extrato */}
			<section>
				<h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-4">
					<History className="w-4 h-4" /> Extrato
				</h3>
				<div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1d] overflow-hidden">
					{voxesLoading ? (
						<VoxesHistorySkeleton />
					) : ledger.length === 0 ? (
						<p className="text-center text-sm text-slate-500 dark:text-gray-400 py-12">
							Nenhuma movimentação ainda.
						</p>
					) : (
						<ul className="divide-y divide-slate-100 dark:divide-white/5">
							{ledger.map((entry) => (
								<li
									key={entry.id}
									className="flex items-center justify-between px-5 py-3.5"
								>
									<div className="flex items-center gap-3">
										<span
											className={`text-xs font-semibold px-2 py-1 rounded-md ${REASON_CLASS[entry.reason]}`}
										>
											{VOX_LEDGER_REASON_LABELS[entry.reason]}
										</span>
									</div>
									<div className="text-right">
										<p
											className={`text-sm font-semibold tabular-nums ${entry.delta >= 0 ? 'text-emerald-600' : 'text-slate-700 dark:text-gray-200'}`}
										>
											{entry.delta >= 0 ? '+' : ''}
											{entry.delta}
										</p>
										<p className="text-xs text-slate-400">
											{new Date(entry.created_at).toLocaleDateString('pt-BR')}
										</p>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>

			{buyingPkg && (
				<VoxPurchaseModal pkg={buyingPkg} onClose={() => setBuyingPkg(null)} />
			)}
		</div>
	);
}
