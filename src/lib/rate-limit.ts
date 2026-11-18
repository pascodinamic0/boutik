/** Rate-limit simple en mémoire (par instance). Suffisant pour v1 / preview. */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || now >= cur.resetAt) {
    const resetAt = now + opts.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: opts.limit - 1, resetAt };
  }
  if (cur.count >= opts.limit) {
    return { ok: false, remaining: 0, resetAt: cur.resetAt };
  }
  cur.count += 1;
  return { ok: true, remaining: opts.limit - cur.count, resetAt: cur.resetAt };
}

export function clientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
