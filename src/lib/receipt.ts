import { convert, formatMoney, otherCurrency } from './money';
import { shortRef } from './ids';
import type { Customer, Sale, SaleItem, Shop } from './types';
import { fmtDateTime, fmtDate } from './dates';

const PAY_FR: Record<string, string> = {
  cash: 'Espèces',
  mpesa: 'M-Pesa',
  orange: 'Orange Money',
  airtel: 'Airtel Money',
  afrimoney: 'Afrimoney',
  credit: 'Crédit',
};

/** Plain-text receipt (French) for WhatsApp sharing. */
export function receiptText(shop: Shop, sale: Sale, items: SaleItem[], customer?: Customer | null): string {
  const f = (v: number) => formatMoney(v, sale.currency);
  const alt = otherCurrency(sale.currency);
  const lines = [
    `*${shop.name}*${shop.commune ? ` — ${shop.commune}` : ''}`,
    `Reçu n° ${shortRef(sale.id)} · ${fmtDateTime(sale.created_at)}`,
    customer ? `Client : ${customer.name}` : null,
    '————————————',
    ...items.map((i) => `${i.qty} × ${i.name} — ${f(i.qty * i.unit_price)}`),
    '————————————',
    sale.discount > 0 ? `Sous-total : ${f(sale.subtotal)}` : null,
    sale.discount > 0 ? `Remise : −${f(sale.discount)}` : null,
    `*TOTAL : ${f(sale.total)}* (≈ ${formatMoney(convert(sale.total, sale.currency, alt, sale.rate), alt)})`,
    sale.is_credit
      ? `Vente à crédit — payé ${f(sale.paid)}, reste ${f(sale.total - sale.paid)}${sale.due_date ? ` avant le ${fmtDate(sale.due_date, true)}` : ''}`
      : `Payé par ${PAY_FR[sale.method]}${sale.reference ? ` (réf. ${sale.reference})` : ''}`,
    '',
    'Merci pour votre achat ! 🙏',
    '_Reçu envoyé avec Boutik_',
  ];
  return lines.filter((l) => l !== null).join('\n');
}

/** Polite French credit reminder for WhatsApp. */
export function reminderText(shop: Shop, customer: Customer, balance: number, overdueDays: number): string {
  const alt = otherCurrency(shop.currency);
  const b = formatMoney(balance, shop.currency);
  const a = formatMoney(convert(balance, shop.currency, alt, shop.exchange_rate), alt);
  return [
    `Bonjour ${customer.name},`,
    '',
    `Ici ${shop.name}${shop.commune ? ` (${shop.commune})` : ''}. Petit rappel amical : le solde de votre carnet de crédit est de *${b}* (≈ ${a}).`,
    overdueDays > 0 ? `L'échéance est dépassée de ${overdueDays} jour${overdueDays > 1 ? 's' : ''}.` : null,
    '',
    'Vous pouvez passer régler à la boutique ou payer par M-Pesa, Orange Money ou Airtel Money. Merci de votre confiance ! 🙏',
  ]
    .filter((l) => l !== null)
    .join('\n');
}
