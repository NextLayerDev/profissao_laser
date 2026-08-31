'use client';

import { Building2, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useUpsertCompany } from '@/modules/mentoria/hooks';
import type { MntCompany } from '@/modules/mentoria/types';
import { BTN_PRIMARY, CARD, INPUT, LABEL } from './shared';

const UFS = [
	'AC',
	'AL',
	'AP',
	'AM',
	'BA',
	'CE',
	'DF',
	'ES',
	'GO',
	'MA',
	'MT',
	'MS',
	'MG',
	'PA',
	'PB',
	'PR',
	'PE',
	'PI',
	'RJ',
	'RN',
	'RS',
	'RO',
	'RR',
	'SC',
	'SP',
	'SE',
	'TO',
];

/** Formulário de criação/edição da empresa do mentorado. */
export function CompanyForm({ company }: { company: MntCompany | null }) {
	const upsert = useUpsertCompany();
	const [form, setForm] = useState({
		name: company?.name ?? '',
		segment: company?.segment ?? '',
		city: company?.city ?? '',
		state: company?.state ?? '',
		phone: company?.phone ?? '',
		instagram: company?.instagram ?? '',
		website: company?.website ?? '',
		cnpj: company?.cnpj ?? '',
	});

	const set = (key: keyof typeof form) => (value: string) =>
		setForm((f) => ({ ...f, [key]: value }));

	const save = () => {
		if (!form.name.trim()) {
			toast.error('Informe o nome da empresa.');
			return;
		}
		upsert.mutate(
			{
				name: form.name.trim(),
				segment: form.segment || null,
				city: form.city || null,
				state: form.state || null,
				phone: form.phone || null,
				instagram: form.instagram || null,
				website: form.website || null,
				cnpj: form.cnpj || null,
			},
			{
				onSuccess: () => toast.success('Dados da empresa salvos!'),
				onError: () => toast.error('Não foi possível salvar a empresa.'),
			},
		);
	};

	return (
		<section className={`${CARD} p-5`}>
			<div className="flex items-center gap-2 mb-4">
				<Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
				<h2 className="font-semibold text-slate-900 dark:text-slate-100">
					{company ? 'Dados da minha empresa' : 'Cadastrar minha empresa'}
				</h2>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="md:col-span-2">
					<label className={LABEL} htmlFor="mnt-company-name">
						Nome da empresa *
					</label>
					<input
						id="mnt-company-name"
						className={INPUT}
						value={form.name}
						onChange={(e) => set('name')(e.target.value)}
						placeholder="Ex.: Laser Criativo Personalizados"
					/>
				</div>
				<div>
					<label className={LABEL} htmlFor="mnt-company-segment">
						Segmento
					</label>
					<input
						id="mnt-company-segment"
						className={INPUT}
						value={form.segment}
						onChange={(e) => set('segment')(e.target.value)}
						placeholder="Ex.: Personalizados a laser"
					/>
				</div>
				<div>
					<label className={LABEL} htmlFor="mnt-company-cnpj">
						CNPJ
					</label>
					<input
						id="mnt-company-cnpj"
						className={INPUT}
						value={form.cnpj}
						onChange={(e) => set('cnpj')(e.target.value)}
						placeholder="00.000.000/0000-00"
					/>
				</div>
				<div>
					<label className={LABEL} htmlFor="mnt-company-city">
						Cidade
					</label>
					<input
						id="mnt-company-city"
						className={INPUT}
						value={form.city}
						onChange={(e) => set('city')(e.target.value)}
					/>
				</div>
				<div>
					<label className={LABEL} htmlFor="mnt-company-state">
						UF
					</label>
					<select
						id="mnt-company-state"
						className={INPUT}
						value={form.state}
						onChange={(e) => set('state')(e.target.value)}
					>
						<option value="">Selecione...</option>
						{UFS.map((uf) => (
							<option key={uf} value={uf}>
								{uf}
							</option>
						))}
					</select>
				</div>
				<div>
					<label className={LABEL} htmlFor="mnt-company-phone">
						Telefone / WhatsApp
					</label>
					<input
						id="mnt-company-phone"
						className={INPUT}
						value={form.phone}
						onChange={(e) => set('phone')(e.target.value)}
						placeholder="(00) 00000-0000"
					/>
				</div>
				<div>
					<label className={LABEL} htmlFor="mnt-company-instagram">
						Instagram
					</label>
					<input
						id="mnt-company-instagram"
						className={INPUT}
						value={form.instagram}
						onChange={(e) => set('instagram')(e.target.value)}
						placeholder="@minhaempresa"
					/>
				</div>
				<div className="md:col-span-2">
					<label className={LABEL} htmlFor="mnt-company-website">
						Site
					</label>
					<input
						id="mnt-company-website"
						className={INPUT}
						value={form.website}
						onChange={(e) => set('website')(e.target.value)}
						placeholder="https://..."
					/>
				</div>
			</div>
			<div className="mt-5 flex justify-end">
				<button
					type="button"
					className={BTN_PRIMARY}
					onClick={save}
					disabled={upsert.isPending}
				>
					<Save className="w-4 h-4" />
					{upsert.isPending ? 'Salvando...' : 'Salvar empresa'}
				</button>
			</div>
		</section>
	);
}
