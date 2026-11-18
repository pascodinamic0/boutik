import { NextResponse } from 'next/server';
import { buildDeterministicAdvice, type ForecastResult } from '@/lib/forecasts';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Conseil texte en français à partir d'un ForecastResult.
 * Utilise OPENAI_API_KEY si présent (serveur uniquement) ; sinon texte déterministe.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`forecast-advice:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
  }

  let body: { forecast?: ForecastResult; currencyLabel?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }
  const forecast = body.forecast;
  if (!forecast || typeof forecast !== 'object' || !Array.isArray(forecast.products)) {
    return NextResponse.json({ error: 'Prévision manquante' }, { status: 400 });
  }
  const currencyLabel = body.currencyLabel === 'USD' || body.currencyLabel === '$' ? '$' : 'FC';
  const fallback = buildDeterministicAdvice(forecast, currencyLabel);

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ advice: fallback, source: 'deterministic' });
  }

  try {
    const prompt = [
      'Tu es un conseiller pour un petit commerçant à Kinshasa. Réponds en français, 3 à 5 phrases max, ton clair et actionnable.',
      'Ne mentionne jamais de prix d\'achat ni de données clients. Base-toi uniquement sur ces prévisions JSON :',
      JSON.stringify({
        expectedRevenue7d: forecast.expectedRevenue7d,
        expectedRevenue30d: forecast.expectedRevenue30d,
        topProducts: forecast.topProducts.slice(0, 5),
        reorder: forecast.products
          .filter((p) => p.isLow || (p.daysOfStock !== null && p.daysOfStock <= 7))
          .slice(0, 6)
          .map((p) => ({
            name: p.name,
            daysOfStock: p.daysOfStock,
            suggestedReorderQty: p.suggestedReorderQty,
            unit: p.unit,
          })),
      }),
    ].join('\n');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 280,
        messages: [
          { role: 'system', content: 'Conseiller boutique francophone, concis.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      console.error('[forecast-advice] openai', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ advice: fallback, source: 'deterministic' });
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const advice = json.choices?.[0]?.message?.content?.trim();
    if (!advice) return NextResponse.json({ advice: fallback, source: 'deterministic' });
    return NextResponse.json({ advice, source: 'openai' });
  } catch (e) {
    console.error('[forecast-advice]', e);
    return NextResponse.json({ advice: fallback, source: 'deterministic' });
  }
}
