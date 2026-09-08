'use client';

import { Button } from '@upvox-dev/ui';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/dashboard/header';
import {
	mentoriaErrorMessage,
	useCreateMaturityConfig,
	useMaturityConfigs,
} from '../_components/admin-hooks';
import {
	Badge,
	Card,
	Field,
	formatDate,
	inputClass,
	PageTitle,
	Spinner,
} from '../_components/ui';

const AREAS = [
	{ key: 'estrategia', label: 'Estratégia' },
	{ key: 'processos', label: 'Processos' },
	{ key: 'pessoas', label: 'Pessoas' },
	{ key: 'indicadores', label: 'Indicadores' },
	{ key: 'financeiro', label: 'Financeiro' },
	{ key: 'comercial', label: 'Comercial' },
	{ key: 'melhoria', label: 'Melhoria contínua' },
	{ key: 'pessoal', label: 'Desenvolvimento pessoal' },
] as const;

export default function ConfiguracoesMentoriaPage() {
	const { data: configs, isLoading } = useMaturityConfigs();
	const create = useCreateMaturityConfig();
	const [weights, setWeights] = useState<Record<string, string>>({});

	const active = (configs ?? []).find((c) => c.active) ?? null;

	// Pré-carrega os pesos da metodologia ativa quando ela chega.
	useEffect(() => {
		if (!active || Object.keys(weights).length > 0) return;
		const current =
			(active.formula as { area_weights?: Record<string, number> })
				.area_weights ?? {};
		setWeights(
			Object.fromEntries(
				AREAS.map((a) => [a.key, String(current[a.key] ?? 1)]),
			),
		);
	}, [active, weights]);

	const save = () => {
		const area_weights: Record<string, number> = {};
		for (const area of AREAS) {
			const value = Number(weights[area.key] ?? 1);
			if (Number.isNaN(value) || value < 0) {
				toast.error(`Peso inválido em ${area.label}.`);
				return;
			}
			area_weights[area.key] = value;
		}
		create.mutate(
			{ formula: { area_weights }, active: true },
			{
				onSuccess: () =>
					toast.success('Nova versão da metodologia salva e ativada!'),
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
					title="Score de maturidade"
					description="Metodologia do Score Profissão Laser — pesos por área (versionada)"
					backHref="/mentoria-admin"
				/>

				{isLoading ? (
					<Spinner label="Carregando metodologia..." />
				) : (
					<div className="space-y-6">
						<Card className="p-5">
							<div className="flex items-center justify-between mb-4">
								<h3 className="font-semibold text-slate-900 dark:text-slate-100">
									Pesos por área
								</h3>
								{active && <Badge tone="green">v{active.version} ativa</Badge>}
							</div>
							<p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
								O score da jornada é a média das áreas do Mapa da Empresa
								ponderada por estes pesos. Peso 0 exclui a área do cálculo.
								Salvar cria uma NOVA versão ativa — versões antigas ficam
								registradas (relatórios usam a versão da época).
							</p>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{AREAS.map((area) => (
									<Field key={area.key} label={area.label}>
										<input
											type="number"
											min={0}
											step={0.1}
											className={inputClass}
											value={weights[area.key] ?? '1'}
											onChange={(e) =>
												setWeights((prev) => ({
													...prev,
													[area.key]: e.target.value,
												}))
											}
										/>
									</Field>
								))}
							</div>
							{/* Sem `loading=`: o botão original só ficava desabilitado durante
							    o save, sem spinner — `loading` trocaria o texto por um
							    ícone giratório, que é comportamento novo, não design. */}
							<Button
								onPress={save}
								disabled={create.isPending}
								className="mt-5"
							>
								Salvar como nova versão ativa
							</Button>
						</Card>

						{(configs ?? []).length > 0 && (
							<Card className="p-5">
								<h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
									Histórico de versões
								</h3>
								<div className="space-y-2 text-sm">
									{(configs ?? []).map((config) => (
										<div
											key={config.id}
											className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5"
										>
											<span className="text-slate-700 dark:text-slate-300">
												v{config.version} — {formatDate(config.created_at)}
											</span>
											{config.active ? (
												<Badge tone="green">ativa</Badge>
											) : (
												<span className="text-xs text-slate-400">inativa</span>
											)}
										</div>
									))}
								</div>
							</Card>
						)}
					</div>
				)}
			</main>
		</div>
	);
}
