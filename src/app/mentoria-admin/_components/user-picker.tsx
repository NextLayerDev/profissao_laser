'use client';

// Seletor de usuário por nome/email, com a lista já visível.
//
// Usado em: `cohort-modals.tsx` (CohortMentorsModal — nas duas metades, a de
// adicionar e a de remover mentor).
//
// ── Por que não é a busca do modal de aluno ──────────────────────────────────
//
// O `EnrollStudentModal` busca no endpoint de *students* (customers) e só
// mostra algo depois de 2 caracteres, porque o universo é grande e a filtragem
// é do servidor. Mentor é outro conjunto: a api exige staff ou admin
// (`mentor_must_be_staff`), e esse time cabe numa tela. Então aqui a lista vem
// inteira de uma vez e a busca só filtra o que já está em memória — sem ida e
// volta por tecla, e com a lista servindo de menu para quem não sabe o nome
// exato.
//
// Filtrar no cliente também não é preguiça: `/v1/users` aceita só `role`,
// `limit` e `offset`, e `/v1/admin/team` não recebe parâmetro nenhum. Não há
// busca textual no servidor para chamar.
//
// Sem regra de negócio: recebe a lista pronta, devolve a escolha.

import { Input } from '@upvox-dev/ui';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AppUser } from '@/modules/users';

/** Rótulo de exibição: `name` é opcional no `AppUser`, o email nunca é. */
function displayName(user: AppUser): string {
	return user.name?.trim() || user.email;
}

export function UserPicker({
	users,
	isLoading,
	selectedId,
	onSelect,
	placeholder = 'nome ou email',
	emptyLabel = 'Ninguém encontrado.',
}: {
	users: AppUser[];
	isLoading?: boolean;
	/** UUID já escolhido — destaca a linha correspondente. */
	selectedId?: string;
	onSelect: (user: AppUser) => void;
	placeholder?: string;
	emptyLabel?: string;
}) {
	const [query, setQuery] = useState('');

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return users;
		return users.filter(
			(u) =>
				u.email.toLowerCase().includes(q) ||
				(u.name ?? '').toLowerCase().includes(q),
		);
	}, [users, query]);

	return (
		<div className="space-y-2">
			{/* leadingIcon é a prop do Input pra isto — mesma forma do modal de
			    aluno, que aposentou o ícone absoluto + `pl-9`. */}
			<Input
				leadingIcon={<Search className="w-4 h-4 text-muted" />}
				value={query}
				onChangeText={setQuery}
				placeholder={placeholder}
			/>

			<div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden max-h-56 overflow-y-auto">
				{isLoading ? (
					<p className="px-4 py-3 text-sm text-slate-500 dark:text-gray-400">
						Carregando...
					</p>
				) : !filtered.length ? (
					<p className="px-4 py-3 text-sm text-slate-500 dark:text-gray-400">
						{emptyLabel}
					</p>
				) : (
					filtered.map((u) => (
						<button
							key={u.id}
							type="button"
							onClick={() => onSelect(u)}
							className={`w-full text-left px-4 py-2.5 text-sm border-b last:border-b-0 border-slate-100 dark:border-white/5 transition-colors ${
								selectedId === u.id
									? 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
									: 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200'
							}`}
						>
							<span className="flex items-center gap-2">
								<span className="font-medium truncate">{displayName(u)}</span>
								{u.name?.trim() && (
									<span className="text-slate-500 dark:text-gray-400 truncate">
										{u.email}
									</span>
								)}
								{/* O papel ajuda a escolher entre homônimos e deixa visível
								    que a lista é só de quem a api aceita como mentor. */}
								<span className="ml-auto shrink-0 text-xs px-1.5 py-0.5 rounded bg-slate-500/15 text-slate-600 dark:text-gray-300">
									{u.role}
								</span>
							</span>
						</button>
					))
				)}
			</div>
		</div>
	);
}
