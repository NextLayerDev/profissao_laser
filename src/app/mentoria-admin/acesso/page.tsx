'use client';

import { Button, Input, Switch } from '@upvox-dev/ui';
import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/dashboard/header';
import { HelpTip } from '@/modules/mentoria/components/help-tip';
import type { MentoriaAccessStudent } from '@/modules/mentoria/types';
import {
	mentoriaErrorMessage,
	studentSearchErrorMessage,
	useMentoriaAccessAdmin,
	useStudentSearch,
	useUpdateMentoriaAccess,
} from '../_components/admin-hooks';
import { Badge, Card, Field, PageTitle, Spinner } from '../_components/ui';

export default function AcessoMentoriaPage() {
	const { data, isLoading, isError, error } = useMentoriaAccessAdmin();
	const update = useUpdateMentoriaAccess();
	const [restricted, setRestricted] = useState(false);
	const [selected, setSelected] = useState<MentoriaAccessStudent[]>([]);
	const [loaded, setLoaded] = useState(false);
	const [query, setQuery] = useState('');
	const search = useStudentSearch(query);

	// Copia o estado do servidor para o formulário só na primeira carga.
	useEffect(() => {
		if (!data || loaded) return;
		setRestricted(data.restricted);
		setSelected(data.students);
		setLoaded(true);
	}, [data, loaded]);

	const selectedIds = new Set(selected.map((s) => s.id));

	const add = (student: MentoriaAccessStudent) => {
		if (selectedIds.has(student.id)) return;
		setSelected((prev) => [...prev, student]);
	};

	const remove = (id: string) =>
		setSelected((prev) => prev.filter((s) => s.id !== id));

	const save = () => {
		if (restricted && selected.length === 0) {
			toast.error(
				'Com a restrição ligada e a lista vazia, nenhum aluno verá a Mentoria. Adicione ao menos um aluno.',
			);
			return;
		}
		update.mutate(
			{ restricted, user_ids: selected.map((s) => s.id) },
			{
				onSuccess: (res) => {
					setSelected(res.students);
					toast.success(
						res.restricted
							? `Mentoria liberada para ${res.students.length} aluno(s).`
							: 'Restrição desligada — vale a regra do plano.',
					);
				},
				onError: (e) =>
					toast.error(mentoriaErrorMessage(e, 'Não foi possível salvar.')),
			},
		);
	};

	return (
		<div className="min-h-screen">
			<Header />
			<main className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
				<PageTitle
					title="Acesso"
					description="Quem vê a Mentoria na área do aluno"
					backHref="/mentoria-admin"
				/>

				{isLoading ? (
					<Spinner label="Carregando configuração..." />
				) : isError ? (
					// Sem isto a tela abria com a chave "desligada" (valor padrão) mesmo
					// sem ter lido nada — e salvar sobrescreveria a configuração real.
					<Card className="p-5">
						<p className="text-sm text-red-600 dark:text-red-400">
							{studentSearchErrorMessage(error, 'ver o acesso da Mentoria')}
						</p>
					</Card>
				) : (
					<div className="space-y-6">
						<Card className="p-5">
							<div className="flex items-center justify-between gap-4">
								<Switch
									value={restricted}
									onValueChange={setRestricted}
									accessibilityLabel="Limitar acesso à Mentoria"
								>
									Limitar acesso à Mentoria
								</Switch>
								<span className="inline-flex items-center gap-2">
									{data?.restricted ? (
										<Badge tone="amber">restrita</Badge>
									) : (
										<Badge tone="green">pelo plano</Badge>
									)}
									<HelpTip label="Como funciona o acesso">
										Desligado: vê a Mentoria quem tem plano com a Mentoria 360°
										ou está matriculado numa turma. Ligado: além disso, o aluno
										precisa estar na lista abaixo. Staff e admin sempre veem.
									</HelpTip>
								</span>
							</div>
						</Card>

						{restricted && (
							<Card className="p-5 space-y-4">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-slate-900 dark:text-slate-100">
										Alunos liberados
									</h3>
									<Badge tone="violet">{selected.length}</Badge>
								</div>

								<Field label="Adicionar aluno" hint="Mín. 2 caracteres.">
									<Input
										leadingIcon={<Search className="w-4 h-4 text-muted" />}
										value={query}
										onChangeText={setQuery}
										placeholder="nome ou email"
									/>
								</Field>

								{query.trim().length >= 2 && (
									<div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden max-h-56 overflow-y-auto">
										{search.isLoading ? (
											<p className="px-4 py-3 text-sm text-slate-500 dark:text-gray-400">
												Buscando...
											</p>
										) : search.isError ? (
											<p className="px-4 py-3 text-sm text-red-600 dark:text-red-400">
												{studentSearchErrorMessage(search.error)}
											</p>
										) : !search.data?.items.length ? (
											<p className="px-4 py-3 text-sm text-slate-500 dark:text-gray-400">
												Nenhum aluno encontrado.
											</p>
										) : (
											search.data.items.map((s) => {
												const already = selectedIds.has(s.id);
												return (
													<button
														key={s.id}
														type="button"
														disabled={already}
														onClick={() =>
															add({ id: s.id, name: s.name, email: s.email })
														}
														className={`w-full text-left px-4 py-2.5 text-sm border-b last:border-b-0 border-slate-100 dark:border-white/5 transition-colors ${
															already
																? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 cursor-default'
																: 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200'
														}`}
													>
														<span className="font-medium">
															{s.name ?? '(sem nome)'}
														</span>
														<span className="text-slate-500 dark:text-gray-400 ml-2">
															{s.email}
														</span>
														{already && (
															<span className="ml-2 text-xs">· na lista</span>
														)}
													</button>
												);
											})
										)}
									</div>
								)}

								{selected.length === 0 ? (
									<p className="text-sm text-slate-500 dark:text-gray-400">
										Lista vazia.
									</p>
								) : (
									<ul className="flex flex-wrap gap-2">
										{selected.map((s) => (
											<li
												key={s.id}
												className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 pl-3 pr-1.5 py-1 text-sm text-slate-700 dark:text-slate-200"
												title={s.email}
											>
												{s.name ?? s.email}
												<button
													type="button"
													onClick={() => remove(s.id)}
													aria-label={`Remover ${s.name ?? s.email}`}
													className="rounded-full p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10"
												>
													<X className="w-3.5 h-3.5" />
												</button>
											</li>
										))}
									</ul>
								)}
							</Card>
						)}

						<div className="flex justify-end">
							<Button onPress={save} loading={update.isPending}>
								Salvar
							</Button>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
