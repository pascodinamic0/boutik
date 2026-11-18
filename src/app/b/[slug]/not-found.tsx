import Link from 'next/link';

export default function StorefrontNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#faf6f0] px-6 text-center">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-bold text-[#3a2418]">Boutique introuvable</h1>
      <p className="max-w-md text-sm text-[#7a5a45]">
        Cette vitrine n&apos;existe pas ou n&apos;est pas encore activée. Essayez la{' '}
        <Link href="/b/demo" className="font-semibold text-[#c2531f] underline">
          boutique de démonstration
        </Link>
        .
      </p>
      <Link href="/" className="rounded-2xl bg-[#3a2418] px-5 py-3 text-sm font-bold text-white">
        Retour à Boutik
      </Link>
    </main>
  );
}
