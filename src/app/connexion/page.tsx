import type { Metadata } from 'next';
import { AuthScreen } from './AuthScreen';

export const metadata: Metadata = { title: 'Connexion', description: 'Connectez-vous à Boutik ou essayez la démo.' };

export default function Page() {
  return <AuthScreen />;
}
