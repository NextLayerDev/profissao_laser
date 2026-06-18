import { describe, expect, it } from 'vitest';
import { isValidCpf, maskCpf, normalizeCpf } from './cpf';

describe('maskCpf', () => {
	it('aplica a máscara progressivamente conforme digita', () => {
		expect(maskCpf('123')).toBe('123');
		expect(maskCpf('1234')).toBe('123.4');
		expect(maskCpf('1234567')).toBe('123.456.7');
		expect(maskCpf('12345678901')).toBe('123.456.789-01');
	});

	it('ignora não-dígitos e limita a 11 dígitos', () => {
		expect(maskCpf('abc123.456')).toBe('123.456');
		expect(maskCpf('123456789012345')).toBe('123.456.789-01');
	});
});

describe('normalizeCpf', () => {
	it('retorna os 11 dígitos quando completo', () => {
		expect(normalizeCpf('123.456.789-01')).toBe('12345678901');
	});

	it('retorna null quando incompleto', () => {
		expect(normalizeCpf('123.456')).toBeNull();
	});
});

describe('isValidCpf', () => {
	it('aceita um CPF válido com e sem máscara', () => {
		expect(isValidCpf('529.982.247-25')).toBe(true);
		expect(isValidCpf('52998224725')).toBe(true);
	});

	it('rejeita dígitos verificadores incorretos', () => {
		expect(isValidCpf('529.982.247-24')).toBe(false);
	});

	it('rejeita sequências repetidas e tamanhos errados', () => {
		expect(isValidCpf('111.111.111-11')).toBe(false);
		expect(isValidCpf('123')).toBe(false);
	});
});
