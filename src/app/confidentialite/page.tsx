import type { Metadata } from 'next';
import { LegalPage, type LegalDoc } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Politique de confidentialité' };

const fr: LegalDoc = {
  title: 'Politique de confidentialité',
  intro:
    'Boutik aide les commerçants à tenir leurs ventes, leur stock et leur carnet de crédit. Cette page explique quelles données nous traitons, pourquoi, et comment vous gardez le contrôle.',
  sections: [
    {
      h: '1. Données que nous traitons',
      p: [
        'Compte : adresse e-mail, nom affiché et mot de passe (chiffré, jamais lisible par nous).',
        'Données de la boutique : nom, commune, produits, prix, stock, ventes, dépenses, clients du carnet de crédit (nom, téléphone facultatif) et paiements enregistrés.',
        'Boutik ne collecte ni vos identifiants M-Pesa, Orange Money, Airtel Money ou Afrimoney, ni aucune donnée bancaire : vous notez seulement le mode de paiement et, si vous le souhaitez, la référence de transaction.',
      ],
    },
    {
      h: '2. Stockage local sur votre appareil',
      p: [
        "Pour fonctionner sans internet, Boutik enregistre une copie de vos données dans le stockage local du navigateur (IndexedDB et localStorage) et met en cache l'application (service worker). Ces données restent sur l'appareil jusqu'à votre déconnexion.",
        "Nous n'utilisons aucun cookie publicitaire ni traceur tiers. Le bandeau de consentement mémorise simplement votre accord sur cet appareil.",
      ],
    },
    {
      h: '3. Hébergement et sécurité',
      p: [
        "Les données synchronisées sont hébergées par Supabase (base PostgreSQL) et l'application par Vercel. Les échanges sont chiffrés (HTTPS).",
        "Chaque boutique est isolée par des règles de sécurité au niveau de la base de données : seuls les membres d'une boutique voient ses données, et seuls les propriétaires voient les dépenses et rapports.",
      ],
    },
    {
      h: '4. Partage',
      p: [
        "Nous ne vendons ni ne louons vos données. Lorsque vous partagez un reçu ou un rappel sur WhatsApp, c'est vous qui choisissez le destinataire ; le message est envoyé par votre application WhatsApp.",
      ],
    },
    {
      h: '5. Vos droits',
      p: [
        'Vous pouvez consulter, corriger ou supprimer vos données à tout moment. Pour supprimer votre compte et toutes les données de vos boutiques, écrivez-nous depuis l’adresse e-mail de votre compte à support@boutik.cd.',
        'Vos données sont conservées tant que votre compte est actif, puis supprimées dans un délai de 90 jours après la fermeture du compte.',
      ],
    },
  ],
};

const ln: LegalDoc = {
  title: 'Kobatela makambo na yo',
  intro:
    'Boutik esalisaka bato ya mombongo kobatela biteki, stock mpe buku ya nyongo. Lokasa oyo elimboli makambo nini tozwaka, mpo na nini, mpe ndenge okoki kokamba yango.',
  sections: [
    {
      h: '1. Makambo tozwaka',
      p: [
        'Compte : e-mail, nkombo mpe liloba ya sekele (ebombami na ndenge ya sekele, tokoki kotanga yango te).',
        'Makambo ya butiki : nkombo, commune, biloko, ntalo, stock, biteki, mbongo ebimi, basombi ya nyongo (nkombo, telefone soki olingi) mpe bofuti.',
        'Boutik ezwaka te ba code ya M-Pesa, Orange Money, Airtel Money to Afrimoney, to makambo ya banki : okomaka kaka lolenge ya kofuta mpe référence soki olingi.',
      ],
    },
    {
      h: '2. Kobomba na appareil na yo',
      p: [
        'Mpo na kosala kozanga internet, Boutik ebombaka makambo na yo na navigateur (IndexedDB mpe localStorage) mpe application (service worker). Makambo yango etikalaka na appareil kino okobima.',
        'Tosalelaka cookie ya publicité te. Bandeau ya consentement ebombaka kaka ndingisa na yo na appareil oyo.',
      ],
    },
    {
      h: '3. Esika tobombaka mpe libateli',
      p: [
        'Makambo etindami ebombamaka na Supabase (PostgreSQL) mpe application na Vercel. Bosangani nyonso ezali na sekele (HTTPS).',
        'Butiki moko na moko ekabwani : kaka bato ya butiki bamonaka makambo na yango, mpe kaka nkolo amonaka mbongo ebimi mpe lapolo.',
      ],
    },
    {
      h: '4. Kokabola',
      p: ['Totekaka makambo na yo te. Soki otindi resi to likundwelo na WhatsApp, yo moko nde oponaka moto oyo akozwa yango.'],
    },
    {
      h: '5. Makoki na yo',
      p: [
        'Okoki kotala, kobongisa to kolongola makambo na yo ntango nyonso. Mpo na kolongola compte mpe makambo nyonso, tindela biso e-mail na support@boutik.cd.',
        'Makambo ebombamaka tango compte ezali, mpe elongwaka na mikolo 90 sima ya kokanga compte.',
      ],
    },
  ],
};

export default function Page() {
  return <LegalPage fr={fr} ln={ln} />;
}
