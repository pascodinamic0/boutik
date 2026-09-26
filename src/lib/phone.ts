/** Normalises a Congolese phone number to international format without "+", e.g. 243812345678. */
export function normalizeDrcPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let d = input.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('243')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  if (!/^[89]\d{8}$/.test(d)) return null;
  return '243' + d;
}

export function formatDrcPhone(input: string | null | undefined): string {
  const n = normalizeDrcPhone(input);
  if (!n) return input ?? '';
  const l = n.slice(3);
  return `+243 ${l.slice(0, 2)} ${l.slice(2, 5)} ${l.slice(5)}`;
}

export function waLink(text: string, phone?: string | null): string {
  const n = normalizeDrcPhone(phone ?? null);
  return `https://wa.me/${n ?? ''}?text=${encodeURIComponent(text)}`;
}
