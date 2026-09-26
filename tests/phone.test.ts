import { describe, expect, it } from 'vitest';
import { formatDrcPhone, normalizeDrcPhone, waLink } from '@/lib/phone';

describe('DRC phone numbers', () => {
  it('normalises local and international formats', () => {
    expect(normalizeDrcPhone('081 234 5678')).toBe('243812345678');
    expect(normalizeDrcPhone('+243 99 123 4567')).toBe('243991234567');
    expect(normalizeDrcPhone('00243851234567')).toBe('243851234567');
    expect(normalizeDrcPhone('12345')).toBeNull();
    expect(formatDrcPhone('0812345678')).toBe('+243 81 234 5678');
  });
  it('builds wa.me links', () => {
    expect(waLink('Mbote !', '0812345678')).toBe('https://wa.me/243812345678?text=Mbote%20!');
    expect(waLink('Reçu')).toBe('https://wa.me/?text=Re%C3%A7u');
  });
});
