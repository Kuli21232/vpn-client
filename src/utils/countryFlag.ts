export function countryFlagFromCode(code: string) {
  if (code.length !== 2) {
    return '🌐';
  }

  return Array.from(code.toUpperCase())
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join('');
}
