import Link from 'next/link';
import { LogoMark } from '@/components/Logo';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <LogoMark size={72} />
      <h1 className="mt-6 font-display text-4xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-muted">Cette page n’existe pas ou a été déplacée.</p>
      <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-2xl bg-brand px-6 font-semibold text-white">
        Retour à l’accueil
      </Link>
    </main>
  );
}
