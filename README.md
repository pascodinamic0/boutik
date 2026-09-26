# Boutik

Gestion de boutique **hors-ligne** pour les commerçants de Kinshasa : stock, caisse, Mobile Money (M-Pesa, Orange Money, Airtel Money, Afrimoney), carnet de crédit, dépenses et rapports — en français et en lingala, en francs congolais et en dollars.

Production : https://boutik.vercel.app · Démo : `demo@boutik.cd` / `demo1234` (propriétaire), `vendeur@boutik.cd` / `demo1234` (vendeur).

## Stack
- Next.js 16 (App Router, TypeScript), Tailwind CSS v4, Motion
- Supabase (Postgres + Auth + RLS basé sur l'appartenance à la boutique)
- IndexedDB (Dexie) comme base locale ; file d'attente (outbox) synchronisée automatiquement
- Service worker maison (`scripts/sw-template.js` → `public/sw.js` au build) : app shell et assets en cache

## Architecture hors-ligne
Toutes les écritures passent par `src/lib/actions.ts` : la ligne est écrite dans IndexedDB **et** une entrée d'outbox (UUID client) est ajoutée dans la même transaction. `src/lib/sync.ts` pousse l'outbox dans l'ordre (inserts idempotents `ON CONFLICT DO NOTHING`), puis tire les changements par curseur `synced_at` (horodaté par trigger côté serveur). Le stock est calculé côté serveur par trigger à partir des mouvements de stock.

## Développement
```bash
npm install
vercel env pull .env.local   # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run dev
npm test                     # Vitest (monnaie, crédit, file de synchro)
BASE_URL=https://boutik.vercel.app npx playwright test   # e2e
```

## Base de données
- `supabase/migrations/*.sql` — schéma, triggers, RLS, RPC `create_shop`
- `supabase/seed.sql` — boutique démo « Alimentation Maman Nzuzi » (Matete)
- `scripts/seed-demo.sh` — applique migrations + comptes démo + seed

Photos : voir `CREDITS.md` (Pexels, licence libre).
