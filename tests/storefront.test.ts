import { describe, expect, it } from 'vitest';
import {
  DEMO_STOREFRONT,
  FORBIDDEN_PUBLIC_FIELDS,
  assertNoPrivateFields,
  availabilityFromStock,
  buildWhatsAppOrderMessage,
  isValidStorefrontSlug,
  normalizeStorefrontSlug,
  sanitizePublicStorefront,
} from '@/lib/storefront';

describe('storefront slug', () => {
  it('normalizes accents and spaces', () => {
    expect(normalizeStorefrontSlug('Alimentation Maman Nzuzi')).toBe('alimentation-maman-nzuzi');
    expect(normalizeStorefrontSlug('Café Déjà')).toBe('cafe-deja');
  });
  it('validates length and charset', () => {
    expect(isValidStorefrontSlug('ab')).toBe(false);
    expect(isValidStorefrontSlug('demo')).toBe(true);
    expect(isValidStorefrontSlug('maman-nzuzi')).toBe(true);
    expect(isValidStorefrontSlug('Bad_Slug')).toBe(false);
  });
});

describe('availability', () => {
  it('maps stock levels', () => {
    expect(availabilityFromStock(0, 5)).toBe('out');
    expect(availabilityFromStock(3, 5)).toBe('low');
    expect(availabilityFromStock(10, 5)).toBe('in');
  });
});

describe('public payload security', () => {
  it('demo storefront has no private fields', () => {
    const leaks = assertNoPrivateFields(DEMO_STOREFRONT);
    expect(leaks).toEqual([]);
    for (const key of FORBIDDEN_PUBLIC_FIELDS) {
      expect(JSON.stringify(DEMO_STOREFRONT)).not.toContain(`"${key}"`);
    }
  });

  it('sanitize strips private fields and data-URL photos', () => {
    const dirty = {
      slug: 'demo-shop',
      name: 'Test',
      commune: 'Matete',
      description: 'ok',
      whatsapp: '+243812345678',
      currency: 'CDF',
      buy_price: 999,
      exchange_rate: 2800,
      plan: 'trial',
      products: [
        {
          id: '1',
          name: 'Riz',
          category: 'Alimentation',
          sell_price: 1000,
          buy_price: 500,
          quantity: 12,
          low_stock: 3,
          photo: 'data:image/jpeg;base64,xxx',
          unit: 'sac',
          availability: 'in',
          barcode: '123',
          shop_id: 'secret',
        },
      ],
    };
    const clean = sanitizePublicStorefront(dirty);
    expect(clean).not.toBeNull();
    expect(assertNoPrivateFields(clean)).toEqual([]);
    expect(clean!.products[0].photo).toBeNull();
    expect(clean!.products[0]).not.toHaveProperty('buy_price');
    expect(clean!.products[0]).not.toHaveProperty('quantity');
    expect(clean).not.toHaveProperty('buy_price');
    expect(clean).not.toHaveProperty('exchange_rate');
  });

  it('rejects invalid payloads', () => {
    expect(sanitizePublicStorefront(null)).toBeNull();
    expect(sanitizePublicStorefront({ slug: 'x', name: 'Y' })).toBeNull();
  });

  it('builds a WhatsApp order without leaking costs', () => {
    const msg = buildWhatsAppOrderMessage(DEMO_STOREFRONT, [
      { product: DEMO_STOREFRONT.products[0], qty: 2 },
      { product: DEMO_STOREFRONT.products[1], qty: 1 },
    ]);
    expect(msg).toContain('Riz parfumé');
    expect(msg).toMatch(/Farine|Huile/);
    expect(msg.toLowerCase()).not.toContain('buy');
    expect(msg).not.toMatch(/prix d'achat/i);
  });
});
