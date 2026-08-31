'use client';

import {
	Check,
	Copy,
	ExternalLink,
	KeyRound,
	Loader2,
	Plus,
	Radio,
	Square,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/dashboard/header';
import type { LiveStatus, MntLiveRoom } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	useCohortsAdmin,
	useLiveCredentials,
	useLiveMutations,
	useLivesAdmin,
} from '../_components/admin-hooks';
import {
	Badge,
	Card,
	dangerBtn,
	EmptyState,
	Field,
	formatDateTime,
	inputClass,
	Modal,
	PageTitle,
	primaryBtn,
	Spinner,
	secondaryBtn,
} from '../_components/ui';

function LiveStatusBadge({ status }: { status: LiveStatus }) {
	if (status === 'active') {
		return (
			<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30">
				<span className="relative flex w-2 h-2">
					<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
					<span className="relative inline-flex rounded-full w-2 h-2 bg-red-500" />
				</span>
				AO VIVO
			</span>
		);
	}
	const map: Record<
		Exclude<LiveStatus, 'active'>,
		{ tone: 'slate' | 'blue' | 'violet'; label: string }
	> = {
		idle: { tone: 'slate', label: 'Aguardando transmissão' },
		ended: { tone: 'blue', label: 'Encerrada' },
		vod_ready: { tone: 'violet', label: 'Gravação disponível' },
	};
	const cfg = map[status];
	return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

export default function LivesAdminPage() {
	const lives = useLivesAdmin();
	const cohorts = useCohortsAdmin();
	const { end } = useLiveMutations();
	const [creating, setCreating] = useState(false);
	const [credentialsFor, setCredentialsFor] = useState<MntLiveRoom | null>(
		null,
	);
	const [ending, setEnding] = useState<MntLiveRoom | null>(null);

	const cohortName = useMemo(() => {
		const map = new Map<string, string>();
		for (const c of cohorts.data ?? []) map.set(c.id, c.name);
		return map;
	}, [cohorts.data]);

	const doEnd = async () => {
		if (!ending) return;
		try {
			await end.mutateAsync(ending.id);
			toast.success('Live encerrada');
			setEnding(null);
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao encerrar a live'));
		}
	};

	return (
		<div className="min-h-screen text-slate-900 dark:text-white">
			<Header />
			<main className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
				<PageTitle
					title="Lives"
					description="Salas de transmissão ao vivo para as turmas. Transmita via OBS com as credenciais RTMP de cada sala."
					backHref="/mentoria-admin"
					actions={
						<button
							type="button"
							className={primaryBtn}
							onClick={() => setCreating(true)}
						>
							<Plus className="w-4 h-4" />
							Nova live
						</button>
					}
				/>

				{lives.isLoading ? (
					<Card>
						<Spinner />
					</Card>
				) : !lives.data?.length ? (
					<Card>
						<EmptyState message="Nenhuma live criada ainda." />
					</Card>
				) : (
					<div className="space-y-4">
						{lives.data.map((live) => (
							<Card key={live.id} className="p-5">
								<div className="flex items-start justify-between gap-4 flex-wrap">
									<div className="min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<p className="font-semibold text-slate-900 dark:text-white">
												{live.title}
											</p>
											<LiveStatusBadge status={live.status} />
										</div>
										{live.description && (
											<p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
												{live.description}
											</p>
										)}
										<div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-slate-500 dark:text-gray-400">
											<Badge tone={live.cohort_id ? 'violet' : 'green'}>
												{live.cohort_id
													? (cohortName.get(live.cohort_id) ?? 'Turma')
													: 'Todas as turmas'}
											</Badge>
											<span>Agendada: {formatDateTime(live.scheduled_at)}</span>
											{live.started_at && (
												<span>· Início: {formatDateTime(live.started_at)}</span>
											)}
											{live.ended_at && (
												<span>· Fim: {formatDateTime(live.ended_at)}</span>
											)}
										</div>
									</div>
									<div className="flex gap-2 flex-wrap">
										{(live.status === 'idle' || live.status === 'active') && (
											<button
												type="button"
												className={secondaryBtn}
												onClick={() => setCredentialsFor(live)}
											>
												<KeyRound className="w-3.5 h-3.5" />
												Credenciais de transmissão
											</button>
										)}
										{live.status === 'active' && (
											<button
												type="button"
												className={dangerBtn}
												onClick={() => setEnding(live)}
											>
												<Square className="w-3.5 h-3.5" />
												Encerrar live
											</button>
										)}
										<Link
											href={`/course/mentoria/lives/${live.id}`}
											className={secondaryBtn}
										>
											<ExternalLink className="w-3.5 h-3.5" />
											Ver como aluno
										</Link>
									</div>
								</div>
							</Card>
						))}
					</div>
				)}
			</main>

			{creating && <CreateLiveModal onClose={() => setCreating(false)} />}

			{credentialsFor && (
				<CredentialsModal
					live={credentialsFor}
					onClose={() => setCredentialsFor(null)}
				/>
			)}

			{ending && (
				<Modal title="Encerrar live" onClose={() => setEnding(null)}>
					<p className="text-sm text-slate-600 dark:text-gray-400">
						Encerrar <b>{ending.title}</b>? A transmissão será finalizada para
						todos os alunos e a gravação (VOD) começará a ser processada.
					</p>
					<div className="flex justify-end gap-2 pt-4">
						<button
							type="button"
							className={secondaryBtn}
							onClick={() => setEnding(null)}
						>
							Cancelar
						</button>
						<button
							type="button"
							className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60"
							onClick={doEnd}
							disabled={end.isPending}
						>
							{end.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Square className="w-4 h-4" />
							)}
							Encerrar
						</button>
					</div>
				</Modal>
			)}
		</div>
	);
}

function CreateLiveModal({ onClose }: { onClose: () => void }) {
	const { create } = useLiveMutations();
	const cohorts = useCohortsAdmin();
	const [form, setForm] = useState({
		title: '',
		description: '',
		scheduled_at: '',
		cohort_id: '',
	});
	const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
		setForm((f) => ({ ...f, [key]: value }));

	const save = async () => {
		if (!form.title.trim()) {
			toast.error('Informe o título da live');
			return;
		}
		try {
			await create.mutateAsync({
				title: form.title.trim(),
				description: form.description.trim() || null,
				scheduled_at: form.scheduled_at
					? new Date(form.scheduled_at).toISOString()
					: null,
				...(form.cohort_id ? { cohort_id: form.cohort_id } : {}),
			});
			toast.success('Live criada');
			onClose();
		} catch (err) {
			toast.error(mentoriaErrorMessage(err, 'Erro ao criar a live'));
		}
	};

	return (
		<Modal title="Nova live" onClose={onClose}>
			<div className="space-y-4">
				<Field label="Título" required>
					<input
						className={inputClass}
						value={form.title}
						onChange={(e) => set('title', e.target.value)}
						placeholder="Encontro ao vivo — Tira-dúvidas"
					/>
				</Field>
				<Field label="Descrição">
					<textarea
						className={`${inputClass} min-h-16`}
						value={form.description}
						onChange={(e) => set('description', e.target.value)}
					/>
				</Field>
				<Field label="Data e hora agendadas">
					<input
						type="datetime-local"
						className={inputClass}
						value={form.scheduled_at}
						onChange={(e) => set('scheduled_at', e.target.value)}
					/>
				</Field>
				<Field label="Turma" hint="Deixe em branco para todas as turmas.">
					<select
						className={inputClass}
						value={form.cohort_id}
						onChange={(e) => set('cohort_id', e.target.value)}
					>
						<option value="">Todas as turmas</option>
						{(cohorts.data ?? []).map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
				</Field>
				<div className="flex justify-end gap-2 pt-2">
					<button type="button" className={secondaryBtn} onClick={onClose}>
						Cancelar
					</button>
					<button
						type="button"
						className={primaryBtn}
						onClick={save}
						disabled={create.isPending}
					>
						{create.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Radio className="w-4 h-4" />
						)}
						Criar live
					</button>
				</div>
			</div>
		</Modal>
	);
}

function CopyButton({ value, label }: { value: string; label: string }) {
	const [copied, setCopied] = useState(false);
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			toast.success(`${label} copiado`);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error('Não foi possível copiar');
		}
	};
	return (
		<button
			type="button"
			className={secondaryBtn}
			onClick={copy}
			aria-label={`Copiar ${label}`}
		>
			{copied ? (
				<Check className="w-3.5 h-3.5 text-emerald-500" />
			) : (
				<Copy className="w-3.5 h-3.5" />
			)}
			Copiar
		</button>
	);
}

function CredentialsModal({
	live,
	onClose,
}: {
	live: MntLiveRoom;
	onClose: () => void;
}) {
	const credentials = useLiveCredentials(live.id, true);

	return (
		<Modal
			title={`Credenciais de transmissão — ${live.title}`}
			onClose={onClose}
		>
			{credentials.isLoading ? (
				<Spinner label="Buscando credenciais..." />
			) : credentials.isError || !credentials.data ? (
				<EmptyState message="Não foi possível carregar as credenciais desta live." />
			) : (
				<div className="space-y-4">
					<Field label="Servidor (RTMP URL)">
						<div className="flex items-center gap-2">
							<input
								readOnly
								className={`${inputClass} font-mono text-xs`}
								value={credentials.data.rtmp_url}
							/>
							<CopyButton
								value={credentials.data.rtmp_url}
								label="Servidor RTMP"
							/>
						</div>
					</Field>
					<Field label="Chave de stream (stream key)">
						<div className="flex items-center gap-2">
							<input
								readOnly
								type="password"
								className={`${inputClass} font-mono text-xs`}
								value={credentials.data.stream_key}
							/>
							<CopyButton
								value={credentials.data.stream_key}
								label="Chave de stream"
							/>
						</div>
					</Field>
					<div className="rounded-xl border border-blue-300/50 dark:border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
						<p className="font-medium mb-1">Como transmitir com o OBS</p>
						<ol className="list-decimal list-inside space-y-0.5">
							<li>
								Abra o OBS e vá em <b>Configurações → Transmissão</b>.
							</li>
							<li>
								Em Serviço escolha <b>Personalizado</b>.
							</li>
							<li>
								Cole a URL acima em <b>Servidor</b> e a chave em{' '}
								<b>Chave de stream</b>.
							</li>
							<li>
								Clique em <b>Iniciar transmissão</b> — a live fica ativa
								automaticamente para os alunos.
							</li>
						</ol>
						<p className="mt-2 text-xs opacity-80">
							Não compartilhe a chave de stream: quem a tiver consegue
							transmitir nesta sala.
						</p>
					</div>
				</div>
			)}
		</Modal>
	);
}
