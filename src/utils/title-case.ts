export function toTitleCase(str: string): string {
	if (!str) return str;
	return str
		.toLowerCase()
		.split(' ')
		.map((word) =>
			word.length > 0 ? word[0].toUpperCase() + word.slice(1) : '',
		)
		.join(' ');
}
