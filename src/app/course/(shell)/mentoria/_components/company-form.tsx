'use client';

import { Building2, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
	companyFieldErrors,
	maskCnpj,
	maskPhone,
	normalizeInstagram,
	normalizeWebsite,
} from '@/modules/mentoria/company-fields';
import { useUpsertCompany } from '@/modules/mentoria/hooks';
import type { MntCompany } from '@/modules/mentoria/types';
import { BTN_PRIMARY, CARD, INPUT, LABEL, mntErrorText } from './shared';

/** Mensagem do campo, abaixo do input (só depois de sair dele ou salvar). */
function FieldError({ id, text }: { id: string; text?: string }) {
	if (!text) return null;
	return (
		<p id={id} className="mt-1 text-caption text-red-600 dark:text-red-400">
			{text}
		</p>
	);
}

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
		phone: company?.phone ? maskPhone(company.phone) : '',
		instagram: company?.instagram ?? '',
		website: company?.website ?? '',
		cnpj: company?.cnpj ? maskCnpj(company.cnpj) : '',
	});
	// Erro aparece ao sair do campo (ou ao salvar), não a cada tecla.
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	const set = (key: keyof typeof form) => (value: string) =>
		setForm((f) => ({ ...f, [key]: value }));
	const touch = (key: string) => () =>
		setTouched((t) => ({ ...t, [key]: true }));

	const errors = companyFieldErrors(form);
	const shown = (key: keyof typeof errors) =>
		touched[key] ? errors[key] : undefined;

	const save = () => {
		if (!form.name.trim()) {
			toast.error('Informe o nome da empresa.');
			return;
		}
		if (Object.keys(errors).length > 0) {
			setTouched({ cnpj: true, phone: true, website: true, instagram: true });
			toast.error('Confira os campos destacados.');
			return;
		}
		upsert.mutate(
			{
				name: form.name.trim(),
				segment: form.segment || null,
				city: form.city || null,
				state: form.state || null,
				phone: form.phone || null,
				instagram: normalizeInstagram(form.instagram) || null,
				website: normalizeWebsite(form.website) || null,
				cnpj: form.cnpj || null,
			},
			{
				onSuccess: () => toast.success('Dados da empresa salvos!'),
				// 400 cnpj_invalid/phone_invalid… vira o texto do campo.
				onError: (e) =>
					toast.error(mntErrorText(e, 'Não foi possível salvar a empresa.')),
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
						inputMode="numeric"
						value={form.cnpj}
						onChange={(e) => set('cnpj')(maskCnpj(e.target.value))}
						onBlur={touch('cnpj')}
						aria-invalid={!!shown('cnpj') || undefined}
						aria-describedby={
							shown('cnpj') ? 'mnt-company-cnpj-err' : undefined
						}
						placeholder="00.000.000/0000-00"
					/>
					<FieldError id="mnt-company-cnpj-err" text={shown('cnpj')} />
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
						type="tel"
						inputMode="tel"
						value={form.phone}
						onChange={(e) => set('phone')(maskPhone(e.target.value))}
						onBlur={touch('phone')}
						aria-invalid={!!shown('phone') || undefined}
						aria-describedby={
							shown('phone') ? 'mnt-company-phone-err' : undefined
						}
						placeholder="(00) 00000-0000"
					/>
					<FieldError id="mnt-company-phone-err" text={shown('phone')} />
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
						onBlur={() => {
							const v = normalizeInstagram(form.instagram);
							if (v) set('instagram')(v);
							touch('instagram')();
						}}
						aria-invalid={!!shown('instagram') || undefined}
						aria-describedby={
							shown('instagram') ? 'mnt-company-instagram-err' : undefined
						}
						placeholder="@minhaempresa"
					/>
					<FieldError
						id="mnt-company-instagram-err"
						text={shown('instagram')}
					/>
				</div>
				<div className="md:col-span-2">
					<label className={LABEL} htmlFor="mnt-company-website">
						Site
					</label>
					<input
						id="mnt-company-website"
						className={INPUT}
						type="url"
						inputMode="url"
						value={form.website}
						onChange={(e) => set('website')(e.target.value)}
						onBlur={() => {
							const v = normalizeWebsite(form.website);
							if (v) set('website')(v);
							touch('website')();
						}}
						aria-invalid={!!shown('website') || undefined}
						aria-describedby={
							shown('website') ? 'mnt-company-website-err' : undefined
						}
						placeholder="https://..."
					/>
					<FieldError id="mnt-company-website-err" text={shown('website')} />
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
